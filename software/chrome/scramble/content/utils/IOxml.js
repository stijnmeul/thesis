/**
 * @fileOverview Contains functions used to do the Input/Output operations in a XML File (Mainly used to store and retrieve the key ring)
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

/**
  * xml document object
  * @field
  * @private
  */
var xmlDoc;

/**
 *  @class Keys Object related to the xml file
 *  @property {String} pk The public key value
 *  @property {String} ID The key ID value
 *  @property {String} Name The key owner name value
 *  @property {String} Fgprt The key fingerprint value
  *  @property {String} Expir The key expiration date value
 */
function Keys() {
    this.mail = null;
    this.ID = null;
    this.Name = null;
    this.Fgprt = null;
    this.Expir = null;
}

/**
 *  @class Groups Object related to the xml file
 *  @property {String} Name The group name value
 *  @property {String} Description The group description value (deprecated)
 */
function Groups() {
	this.Name = null;
	this.Description = null;
}

// ***************************************************************************
// **                                                                       **
// **             -  Input/Output xml file class functions -                **
// **                                                                       **
// ***************************************************************************

/**
 * Class that contains the Input/Output functions to access the group strutured xml file
 * @class Class that contains the Input/Output functions to access the group strutured xml file
 */
var IOxml = {
	
	/**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "IOxml",
          _enable: true
        };
        return params;
    },
	
	/**
	 *  Function to initialise the xml document file
	 *  @public
	 */
	importXML: function(path) {
        monitor.log(this._debug()._name, "importXML: ["+path+"]", this._debug()._enable);

		if( (path === undefined) || (path === null) ) {
            // path = PATH;
            var prefs = getPreferences();
            path = "file://"+prefs.getCharPref(KEYChainPath);
            if ( (path == FAIL) || (path == "") ) {
                path = PATH;
            } 
            monitor.log(this._debug()._name, "importXML: ["+path+"]", this._debug()._enable);
		}
		
		try{
			var req = new XMLHttpRequest();
			req.open("GET", path, false);
			req.send(null);
			// print the name of the root element or error message
			xmlDoc = req.responseXML;
			
			//test if it is a valid Scramble File
			var groups = xmlDoc.getElementsByTagName(GROUPS);
			var attrib = groups[0].attributes;
			dump("attrib: "+attrib+"\n");
			if(attrib.getNamedItem(DESC).nodeValue != GROUPFILE) {
				return false;
			}
			return true;
			
		} catch(e) {
            monitor.exception(this._debug()._name, e, this._debug()._enable);
			return false;
		}
	},

	/**
	 *  Function to read the xml document object
	 *  @deprecated User for testing reasons
	 */
	readXML: function() {
        monitor.log(this._debug()._name, "readXML", this._debug()._enable);
		var xmlFile = xmlDoc.getElementsByTagName(GROUPS);
		var nrgrouptags = xmlDoc.getElementsByTagName(MEMBER);
	},
	
	/**
	 *  Function to add a new member contact to the xml file
	 *  @public
	 *  @param mbrname Member Name
	 *  @param mbrID Member key ID 
	 *  @param finger Member key fingerprint 
	 *  @param expiration Member key expiration date 
	 *  @param grpname Group name 
	 *  @returns {boolean} true or false
	 *  @throws {Exception} If invalid xml elemet data
	 */
	addNewMember: function(mbrname, mbrID, finger, grpname, expiration) {
        monitor.log(this._debug()._name, "addNewMember ["+mbrID+"]", this._debug()._enable);
		// dump("finger: "+finger+"\n");
		
		if( (mbrname === undefined) && (grpname === undefined) ){
            // dump("Define member and group name\n");
			return false;
		}
		else if(mbrname === undefined) {
			dump("Define member name\n");
			return false;
		}
		else if( (grpname === undefined) || (grpname === null) ) {
		    grpname = ALL;    // add the member to the Ungrouped group
		}
		
		try {
			var control = false;
			var group = xmlDoc.getElementsByTagName(GROUP);
			
			for (var i=0; i<group.length; i++) {
				var name = group[i].attributes;
				var element = group[i].getElementsByTagName(MEMBERS);
				
				if(name.getNamedItem(NAME).nodeValue == grpname) {
					
					if(!this.checkMembers(mbrID, group[i])) {
						control = true;
						var newmbr = xmlDoc.createElement(MEMBER);
						newmbr.setAttribute(ID, mbrID); 
						newmbr.setAttribute(FINGER, finger);
                        newmbr.setAttribute(EXPIR,expiration);
						
						member_name = xmlDoc.createTextNode(mbrname);
						newmbr.appendChild(member_name);
						element[0].appendChild(newmbr);
                    } else {
					    dump("User "+mbrname+" is already in the group\n");
					    return false;
					}
					break;
				} 
			}	
			
			if(!control) {
                // dump("Group does not exist\n");
				return false;
			}
	
			return control;
		} catch(e) {
            monitor.exception(this._debug()._name, e, this._debug()._enable);
			return false;
		}
		
	},
	

	/**
	 *	Function to add a new group to the xml file
	 *  @public
	 *  @param grpname Group name 
	 *  @param description Group description (Optional)
	 *  @returns {boolean} true or false
	 *  @throws {Exception} If invalid xml elemet data
	 */
	addNewGroup: function(grpname, description) {
        monitor.log(this._debug()._name, "addNewGroup ["+grpname+"]", this._debug()._enable);
		try{
			var groups = xmlDoc.getElementsByTagName(GROUPS);
			var group = groups[0].getElementsByTagName(GROUP);
			
			var control = true;
			var name;
	
			//check if the group already exists
			for (i=0; i<group.length; i++) {
				name = group[i].attributes;
				if(name.getNamedItem(NAME).nodeValue == grpname) {
					control = false;
				}
			}
	
			if ( (description == "") || (description === undefined) || (description === null) ) {
				description = grpname;
			}
			
			if(control) {
				var newgrp = xmlDoc.createElement(GROUP);		
				newgrp.setAttribute(NAME, grpname); 
				
				var desc_elem = xmlDoc.createElement(DESC);
	
				var desc_text = xmlDoc.createTextNode(description);
				desc_elem.appendChild(desc_text);
				
				var members = xmlDoc.createElement(MEMBERS);
				
				newgrp.appendChild(members);
				newgrp.appendChild(desc_elem);
				groups[0].appendChild(newgrp);
			} else {
			    var strbundle = document.getElementById(BUNDLE);
			    monitor.messageAlert(strbundle.getString("ioxml.groupexists"), true);
			}
	
			return control;
			
		} catch(e) {
            monitor.exception(this._debug()._name, e, this._debug()._enable);
			return false;
		}			
	},
	
	/**
	 *	Function to remove member (element) from a specific group in the xml file
	 *  @public
	 *  @param memberID Member key ID
	 *  @param groupName Group Name 
	 *  @returns {boolean} true or false
	 *  @throws {Exception} If invalid xml elemet data
	 */
	removeMemberFromGroup: function(memberID, groupName) {
        monitor.log(this._debug()._name, "removeMemberFromGroup ["+memberID+"]", this._debug()._enable);
		try {
			var control = false;
			var group = xmlDoc.getElementsByTagName(GROUP);
			var members;
			
			if( (groupName === null) || (groupName == AG) ) { //remove from all groups
				for(var i = 0; i < group.length; i++) {
					//get correct member
					members = group[i].getElementsByTagName(MEMBER);
					for(var j = 0; j < members.length; j++) {
						if(memberID == members[j].attributes.getNamedItem(ID).nodeValue) {
							members[j].parentNode.removeChild(members[j]);
							control = true;
						}
					}
				}
			} else {
				for(var i2 = 0; i2 < group.length; i2++) {
					//get correct group
					grpname = group[i2].attributes;
					if(grpname.getNamedItem(NAME).nodeValue == groupName) {
						members = group[i2].getElementsByTagName(MEMBER);
						for(var j2 = 0; j2 < members.length; j2++) {
							if(memberID == members[j2].attributes.getNamedItem(ID).nodeValue) {
								members[j2].parentNode.removeChild(members[j2]);
								control = true;
							}
						}
						break;
					}
				}
			}
			return control;
			
		} catch(e) {
            monitor.exception(this._debug()._name, e, this._debug()._enable);
			return false;
		}
	},
	
	/**
	 *	Function to remove a group from the xml file
	 *  @public
	 *  @param grpname Group name 
	 *  @returns {boolean} true or false
	 *  @throws {Exception} If invalid xml elemet data
	 */
	removeGroup: function(groupName) {
        monitor.log(this._debug()._name, "removeGroup ["+groupName+"]", this._debug()._enable);
		try {
			var group = xmlDoc.getElementsByTagName(GROUP);
			var control = false;
			for(var i = 0; i < group.length; i++) {
				//get correct group
				grpname = group[i].attributes;
				if(grpname.getNamedItem(NAME).nodeValue == groupName) {
					group[i].parentNode.removeChild(group[i]);
					control = true;
                    break;
				}
			}
			return control;
			
		} catch(e) {
		    monitor.exception(this._debug()._name, e, this._debug()._enable);
			return false;
		}
		
	},
	
	//giveNickName: Gives a contact member a nickname, works as a NOTE
	/**
	 *	Function to give members a nickname
	 *  @public
	 *  @deprecated Not interesting to use at the moment... 
	 *  @returns {boolean} true or false
	 *  @throws {Exception} If invalid xml elemet data
	 */
	giveNickName: function(groupName, memberID, newNick) {
        monitor.log(this._debug()._name, "giveNickname", this._debug()._enable);
		try {
			
			var control = false;
			var group = xmlDoc.getElementsByTagName(GROUP);
			
			for(var i = 0; i < group.length; i++) {
				//get correct group
				grpname = group[i].attributes;
				if(grpname.getNamedItem(NAME).nodeValue == groupName) {
					var members = group[i].getElementsByTagName(MEMBER);
					for(var j = 0; j < members.length; j++) {
						if(memberID == members[j].attributes.getNamedItem(ID).nodeValue) {
							members[j].firstChild.nodeValue = newNick;
							control = true;
						}
					}
					break;
				}
			}
			return control;
			
		} catch(e) {
            monitor.exception(this._debug()._name, e, this._debug()._enable);
			return false;
		}
	},
	
	//checkMembers:
	/**
	 *	Function to check if the member is already present in the xml file
	 *  @public
	 *  @param memberID Member Key ID
	 *  @param groupelement Group element (optional)
	 *  @returns {boolean} true or false
	 *  @throws {Exception} If invalid xml elemet data
	 */	
	checkMembers: function(memberID, groupelement) {
        monitor.log(this._debug()._name, "checkMembers ["+memberID+"]", this._debug()._enable);
		try {
			var member;
			var control = false;
		
			if(groupelement !== null) {
				member = groupelement.getElementsByTagName(MEMBER);	
			} else {
				member = xmlDoc.getElementsByTagName(MEMBER);
			}
			
			for (var i=0; i < member.length; i++) {
				if(memberID == member[i].attributes.getNamedItem(ID).nodeValue) {
					control = true;
					break;
				}
			}
			return control;
		} catch(e) {
            monitor.exception(this._debug()._name, e, this._debug()._enable);
			return false;
		}
	},
	
	//getMembers: Gets all/single contact member(s) from the xml file
	/**
	 *	Function to get all/single contact member(s) from the xml file
	 *  @public
	 *  @param mbsname Contact Member Name 
	 *  @returns {Array} Array with all the members ID or with the specific member
	 *  @throws {Exception} If invalid xml elemet data
	 */	
	getMembers: function(memberId) {
		doLog("IOxml: getMembers: "+memberId);
        monitor.log(this._debug()._name, "getMember ["+memberID+"]", this._debug()._enable);
		try {
			var list = [];

			var member = xmlDoc.getElementsByTagName(MEMBER);

			if (member.length === 0) {
				//alert("No members defined");
				return null;
			}
			// var attr;

			if(memberId == AM) {
				for (var i=0; i<member.length; i++) {
					var l_keys = new Keys();
					// attr = member[i].attributes;
					l_keys.Id = member[i].attributes.getNamedItem(ID).nodeValue;
					l_keys.Fgprt = member[i].attributes.getNamedItem(FINGER).nodeValue;
                    l_keys.Expir = member[i].attributes.getNamedItem(EXPIR).nodeValue;
					l_keys.Name = member[i].firstChild.nodeValue;
					list[i] = l_keys;
				}
			} else {
				var mid;
				var control = false;
				for (var i2=0; i2<member.length; i2++) {
					mid = member[i2].attributes.getNamedItem(ID).nodeValue;
					if(memberId == mid) {
						var l_keys1 = new Keys();
						l_keys1.Id = mid;
						l_keys1.Fgprt = member[i2].attributes.getNamedItem(FINGER).nodeValue;
                        l_keys.Expir = member[i].attributes.getNamedItem(EXPIR).nodeValue;
						l_keys1.Name = member[i2].firstChild.nodeValue;
						list[0] = l_keys1;
						control = true;
						break;
					}
				}
				if(!control) {
                    var strbundle = document.getElementById(BUNDLE);
                    monitor.messageAlert(strbundle.getString("ioxml.novalidmember"), true);
					return null;
				}
			}
			return list;
			
		} catch(e) {
            monitor.exception(this._debug()._name, e, this._debug()._enable);
			return null;
		}
	
	},
	
	/**
	 *	Function to get a contact member from a specific group in the xml file
	 *  @public
	 *  @param grpname Group name 
	 *  @param mbrname Member Name
	 *  @returns {Array} Array with all the members ID or with the specific member
	 *  @throws {Exception} If invalid xml elemet data
	 */		
	getMemberInGroup: function(grpname, mbrId) {
        monitor.log(this._debug()._name, "getMember ["+mbrId+"] in Group ["+grpname+"]", this._debug()._enable);
	    
		try {
			var list = [];
			
			var group = xmlDoc.getElementsByTagName(GROUP);
			if(grpname == AG) {
				return this.getMembers(AM);
			} else if(mbrId !== null) {
				return this.getMembers(mbrId);
			} else {
				
				var member;
				var name;
				// var attr;
				for(var g=0; g<group.length; g++) {
					name = group[g].attributes.getNamedItem(NAME).nodeValue;
					if(name == grpname) {
						member = group[g].getElementsByTagName(MEMBER);
						
						if(member === null) {
                            // alert("Group not Defined");
							return FAIL;
						} 
						if (member.length === 0) {
							//alert("No members within the selected group");
							return FAIL;
						}
						
						for(i=0; i<member.length; i++) {
							var l_keys = new Keys();
							l_keys.Id = member[i].attributes.getNamedItem(ID).nodeValue;
							l_keys.Fgprt = member[i].attributes.getNamedItem(FINGER).nodeValue;
                            l_keys.Expir = member[i].attributes.getNamedItem(EXPIR).nodeValue;
							l_keys.Name = member[i].firstChild.nodeValue; //pk
							list[i] = l_keys;
						}
					}
				}
				return list;
			}
		} catch(e) {
            monitor.exception(this._debug()._name, e, this._debug()._enable);
            return null;
		}
	},
	
	//getGroups: Gets all/single group(s) from the xml file
	/**
	 *	Function to get all/single group(s) from the xml file
	 *  @public
	 *  @param grpname Group name 
	 *  @returns {Array} Array with all the groups name
	 *  @throws {Exception} If invalid xml elemet data
	 */	
	getGroups: function(grpname) {
        monitor.log(this._debug()._name, "getGroup ["+grpname+"]", this._debug()._enable);

		try {
			var list = [];
			
			var group = xmlDoc.getElementsByTagName(GROUP);
			var strbundle = document.getElementById(BUNDLE);
            
			if (group.length === 0) {
                monitor.messageAlert(strbundle.getString("ioxml.nogroups"), true);
				return;
			}
			
			if(grpname == AG) {
				for (i=0; i<group.length; i++) {
					// attr = group[i].attributes;
					var l_grp = new Groups();
					l_grp.Name = group[i].attributes.getNamedItem(NAME).nodeValue;
					l_grp.Description = group[i].getElementsByTagName(DESC)[0].firstChild.nodeValue;
					list[i] = l_grp;
				}		
			} else {
				var name;
				var control = false;
				for (i=0; i<group.length; i++) {
					name = group[i].attributes.getNamedItem(NAME).nodeValue;
					if(grpname == name) {
						var l_grp1 = new Groups();
						l_grp1.Name = name;
						l_grp1.Description = group[i].getElementsByTagName(DESC)[0].firstChild.nodeValue;
						list[0] = l_grp1;
						break;
					}
				}
				
				if(!control) {
				    monitor.messageAlert(strbundle.getString("ioxml.novalidgroup"), true);
                    return;
				}
				
			}
			return list;
		} catch(e) {
		    monitor.exception(this._debug()._name, e, this._debug()._enable);
		}
	},
	
	/**
	 *	Function to prints a table with a specific list to the command line (debug function)
	 *  @public
	 *  @param list Group name 
	 *  @param flag Member Name
	 *  @returns {HTML Table} Table with all the data on the xml document file
	 */	
	printList: function(list, flag) {
		// PRINTING TO A TABLE IN THE SCREEN
        // document.write('<table border="1">');
        // document.write('<tr><th>id</th><th>Name</th><th>PK</th></tr>');
        // 
        // if(flag) {//print members
        //  for(j=0; j < list.length; j++) {
        //      document.write('<tr>');
        //      document.write('<td>' + list[j].Id + '</td>');
        //      document.write('<td>' + list[j].Name + '</td>');
        //      document.write('<td>' + list[j].pk + '</td>');
        //      document.write('</tr>');
        //  }
        // } else { //print groups
        //  for(j=0; j < list.length; j++) {
        //      document.write('<tr>');
        //      document.write('<td>' + list[j] + '</td>');
        //      document.write('</tr>');
        //  }
        // }
        // document.write('<table>');
	},
	
	/**
	 *	Function to save the changes into the xml file
	 *  @public
	 *  @returns {boolean} true or false
	 */	
	saveDoc: function(path) {
        monitor.log(this._debug()._name, "saveDoc ["+path+"]", this._debug()._enable);
		if( path === undefined ) {
		    path = null;
		}
		
		var ret = saveXMLFile(xmlDoc, path);
        monitor.log(this._debug()._name, "saveDoc -> ["+ret+"]", this._debug()._enable);
		return ret;
	}
};
