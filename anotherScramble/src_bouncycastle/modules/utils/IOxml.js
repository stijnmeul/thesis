/**
 * @fileOverview Contains functions used to do the Input/Output operations in a XML File (Mainly used to store and retrieve the key ring)
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @author <a href="mailto:iulia.ion@inf.ethz.ch">Iulia Ion</a>
 * @version 1.0
 */


var EXPORTED_SYMBOLS = ["IOxml"];

//import utils.js
Components.utils.import("resource://scramble/utils/utils.js");
//import monitor.js
Components.utils.import("resource://scramble/utils/monitor.js");

/**
  * xml document object
  * @field
  * @private
  */
var xmlDoc = null;

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
	  * @private
	  * private variables...
	  */
	_AM : 'ALL_MEMBERS',
	_AG : 'ALL_GROUPS',
	_ALL : 'All',
	_MEMBER : "member",
	_GROUP : "group",
	_MEMBERS : "members",
	_DESC : "description",
	_GROUPS : "groups",
	_NAME : "name",
	_ID : "id",
	_FINGER : "fingerprint",
	_EXPIR : "exp",
	_AES: "AES",   //@Iulia
	_SALT: "salt", //@Iulia
	
	
	
	/**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "IOxml",
            _enable: true
        };
		var prefs = scrambleUtils.getPreferences();
        var debug = prefs.getBoolPref("debug");
		params._enable = debug;
        return params;
    },
	
	/**
	 *  Function to initialise the xml document file
	 *  @public
	 */
	importXML: function(path) {
        // monitor.log(this._debug()._name, "importXML: ["+path+"]", this._debug()._enable);
	// 	dump("importXML\n");
	// },
		if( (path === undefined) || (path === null) ) {
            // path = PATH;
            var prefs = scrambleUtils.getPreferences();
            path = "file://"+prefs.getCharPref(vars._KEYChainPath);
            if ( (path == FAIL) || (path == "") ) {
                path = vars._PATH;
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
			var groups = xmlDoc.getElementsByTagName(IOxml._GROUPS);
			if(!groups) {
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
		var xmlFile = xmlDoc.getElementsByTagName(IOxml._GROUPS);
		var nrgrouptags = xmlDoc.getElementsByTagName(IOxml._MEMBER);
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
	addNewMember: function(mbrname, mbrID, finger, grpname, aeskey, hashsalt, personas, expiration) {
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
		    grpname = IOxml._ALL;    // add the member to the Ungrouped group
		}
		
		try {
			var control = false;
			var group = xmlDoc.getElementsByTagName(IOxml._GROUP);
			
			for (var i=0; i<group.length; i++) {
				var name = group[i].attributes;
				var element = group[i].getElementsByTagName(IOxml._MEMBERS);
				
				if(name.getNamedItem(IOxml._NAME).nodeValue == grpname) {
					
					if(!this.checkMembers(mbrID, group[i])) {
						control = true;
						var newmbr = xmlDoc.createElement(IOxml._MEMBER);
						newmbr.setAttribute(IOxml._ID, mbrID); 
						newmbr.setAttribute(IOxml._FINGER, finger);
                        newmbr.setAttribute(IOxml._EXPIR,expiration);
                        newmbr.setAttribute("AESKEY",aeskey);
                        newmbr.setAttribute("salt",hashsalt);
						
						member_name = xmlDoc.createTextNode(mbrname);
						newmbr.appendChild(member_name);
						for (var p=0; p < personas.length; p++) {
							var persona = xmlDoc.createElement("persona");
							var persona_name = xmlDoc.createTextNode(persona[p]);
							persona.setAttribute("type", "");
							persona.appendChild(persona_name);
							newmbr.appendChild(persona);
							newmbr.appendChild(xmlDoc.createTextNode("\n"));
						}
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
			var groups = xmlDoc.getElementsByTagName(IOxml._GROUPS);
			var group = groups[0].getElementsByTagName(IOxml._GROUP);
			
			var control = true;
			var name;
	
			//check if the group already exists
			for (i=0; i<group.length; i++) {
				name = group[i].attributes;
				if(name.getNamedItem(IOxml._NAME).nodeValue == grpname) {
					control = false;
				}
			}
	
			if ( (description == "") || (description === undefined) || (description === null) ) {
				description = grpname;
			}
			
			if(control) {
				var newgrp = xmlDoc.createElement(IOxml._GROUP);		
				newgrp.setAttribute(IOxml._NAME, grpname); 
				
				var desc_elem = xmlDoc.createElement(IOxml._DESC);
	
				var desc_text = xmlDoc.createTextNode(description);
				desc_elem.appendChild(desc_text);
				
				var members = xmlDoc.createElement(IOxml._MEMBERS);
				
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
			var group = xmlDoc.getElementsByTagName(IOxml._GROUP);
			var members;
			
			if( (groupName === null) || (groupName == IOxml._AG) ) { //remove from all groups
				for(var i = 0; i < group.length; i++) {
					//get correct member
					members = group[i].getElementsByTagName(IOxml._MEMBER);
					for(var j = 0; j < members.length; j++) {
						if(memberID == members[j].attributes.getNamedItem(IOxml._ID).nodeValue) {
							members[j].parentNode.removeChild(members[j]);
							control = true;
						}
					}
				}
			} else {
				for(var i2 = 0; i2 < group.length; i2++) {
					//get correct group
					grpname = group[i2].attributes;
					if(grpname.getNamedItem(IOxml._NAME).nodeValue == groupName) {
						members = group[i2].getElementsByTagName(IOxml._MEMBER);
						for(var j2 = 0; j2 < members.length; j2++) {
							if(memberID == members[j2].attributes.getNamedItem(IOxml._ID).nodeValue) {
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
			var group = xmlDoc.getElementsByTagName(IOxml._GROUP);
			var control = false;
			for(var i = 0; i < group.length; i++) {
				//get correct group
				grpname = group[i].attributes;
				if(grpname.getNamedItem(IOxml._NAME).nodeValue == groupName) {
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
			var group = xmlDoc.getElementsByTagName(IOxml._GROUP);
			
			for(var i = 0; i < group.length; i++) {
				//get correct group
				grpname = group[i].attributes;
				if(grpname.getNamedItem(IOxml._NAME).nodeValue == groupName) {
					var members = group[i].getElementsByTagName(IOxml._MEMBER);
					for(var j = 0; j < members.length; j++) {
						if(memberID == members[j].attributes.getNamedItem(IOxml._ID).nodeValue) {
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
				member = groupelement.getElementsByTagName(IOxml._MEMBER);	
			} else {
				member = xmlDoc.getElementsByTagName(IOxml._MEMBER);
			}
			
			for (var i=0; i < member.length; i++) {
				if(memberID == member[i].attributes.getNamedItem(IOxml._ID).nodeValue) {
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

			var member = xmlDoc.getElementsByTagName(IOxml._MEMBER);

			if (member.length === 0) {
				//alert("No members defined");
				return null;
			}
			// var attr;
			if(memberId == IOxml._AM) {
				for (var i=0; i<member.length; i++) {
					var l_keys = new Keys();
					// attr = member[i].attributes;
					l_keys.Id = member[i].attributes.getNamedItem(IOxml._ID).nodeValue;
					l_keys.Fgprt = member[i].attributes.getNamedItem(IOxml._FINGER).nodeValue;
                    l_keys.Expir = member[i].attributes.getNamedItem(IOxml._EXPIR).nodeValue;
                    l_keys.aes = member[i].attributes.getNamedItem("aes").nodeValue;
                    // I should get to the text instead
                    l_keys.personas =  member[i].getElementsByTagName("persona");
					l_keys.Name = member[i].firstChild.nodeValue;
					list[i] = l_keys;
				}
			} else {
				var mid;
				var control = false;
				for (var i2=0; i2<member.length; i2++) {
					mid = member[i2].attributes.getNamedItem(IOxml._ID).nodeValue;
					if(memberId == mid) {
						var l_keys1 = new Keys();
						l_keys1.Id = mid;
						l_keys1.Fgprt = member[i2].attributes.getNamedItem(IOxml._FINGER).nodeValue;
                        l_keys.Expir = member[i].attributes.getNamedItem(IOxml._EXPIR).nodeValue;
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
			
			var group = xmlDoc.getElementsByTagName(IOxml._GROUP);
			if(grpname == IOxml._AG) {
				return this.getMembers(IOxml._AM);
			} else if(mbrId !== null) {
				return this.getMembers(mbrId);
			} else {
				
				var member;
				var name;
				// var attr;
				for(var g=0; g<group.length; g++) {
					name = group[g].attributes.getNamedItem(IOxml._NAME).nodeValue;
					if(name == grpname) {
						member = group[g].getElementsByTagName(IOxml._MEMBER);
						
						if(member === null) {
                            // alert("Group not Defined");
							return null;
						} 
						if (member.length === 0) {
							//alert("No members within the selected group");
							return null;
						}
						
						for(i=0; i<member.length; i++) {
							var l_keys = new Keys();
							l_keys.Id = member[i].attributes.getNamedItem(IOxml._ID).nodeValue;
							l_keys.Fgprt = member[i].attributes.getNamedItem(IOxml._FINGER).nodeValue;
                            l_keys.Expir = member[i].attributes.getNamedItem(IOxml._EXPIR).nodeValue;
                            l_keys.aes = member[i].attributes.getNamedItem("aes").nodeValue;
                            var persona = this.getPersonas(members[i]);
                            l_keys.persona = persona;
                            // load personas
							l_keys.Name = persona["name"]; //pk
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
			
			var group = xmlDoc.getElementsByTagName(IOxml._GROUP);
			var strbundle = document.getElementById(BUNDLE);
            
			if (group.length === 0) {
                monitor.messageAlert(strbundle.getString("ioxml.nogroups"), true);
				return;
			}
			
			if(grpname == IOxml._AG) {
				for (i=0; i<group.length; i++) {
					// attr = group[i].attributes;
					var l_grp = new Groups();
					l_grp.Name = group[i].attributes.getNamedItem(IOxml._NAME).nodeValue;
					l_grp.Description = group[i].getElementsByTagName(IOxml._DESC)[0].firstChild.nodeValue;
					list[i] = l_grp;
				}		
			} else {
				var name;
				var control = false;
				for (i=0; i<group.length; i++) {
					name = group[i].attributes.getNamedItem(IOxml._NAME).nodeValue;
					if(grpname == name) {
						var l_grp1 = new Groups();
						l_grp1.Name = name;
						l_grp1.Description = group[i].getElementsByTagName(IOxml._DESC)[0].firstChild.nodeValue;
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
	 * returns {aeskey: AESkey, salt: hashsalt}
	 */
	getMemberAESKey: function(persona){
		monitor.log(this._debug()._name, "getMemberAESKey: " + persona, this._debug()._enable);
//		monitor.log(this._debug()._name, "aeskeys: " + aeskeys, this._debug()._enable);
		var size = 0;
		for (key in aeskeys) {
		        size++;
		    }
//		monitor.log(this._debug()._name, "size " + size, this._debug()._enable);
//		aeskeys["hello"] = {aeskey:"2", salt:"3"};

		if (size == 0) {
			this.loadaeskeys();
		}
		/*size = 0;
		for (key in aeskeys) {
	        size++;
	    }
		monitor.log(this._debug()._name, "size " + size, this._debug()._enable);*/
		if(aeskeys[persona]){
			monitor.log(this._debug()._name, "aeskey: " + aeskeys[persona], this._debug()._enable);
		} else {
			monitor.log(this._debug()._name, "no key found for: " + persona, this._debug()._enable);
		}
		return aeskeys[persona];
	},
	
	loadaeskeys: function(){
		monitor.log(this._debug()._name, "loadaeskeys ", this._debug()._enable);
//		monitor.log(this._debug()._name, "xmlDoc: " + xmlDoc, this._debug()._enable);
		if (!xmlDoc) {
			this.importXML();
		}
		var members = xmlDoc.getElementsByTagName(IOxml._MEMBER);
//		monitor.log(this._debug()._name, "members: " + members.length , this._debug()._enable);
		for (var i=0; i < members.length; i++) {
//			monitor.log(this._debug()._name, "i: " + i , this._debug()._enable);
//			monitor.log(this._debug()._name, "members[i].innerhetml: " + members[i].innerHTML , this._debug()._enable);
//			monitor.log(this._debug()._name, "members[i].tagname: " + members[i].tagName , this._debug()._enable);
//			monitor.log(this._debug()._name, "members[i].children: " + members[i].children , this._debug()._enable);
//			monitor.log(this._debug()._name, "members[i].children.length: " + members[i].children.length , this._debug()._enable);
			var personas = members[i].getElementsByTagName("persona");
//			monitor.log(this._debug()._name, "personas: " + personas , this._debug()._enable);
//			monitor.log(this._debug()._name, "personas: " + personas.length , this._debug()._enable);
			var attributes = members[i].attributes;
//			monitor.log(this._debug()._name, "attributes: " + attributes , this._debug()._enable);
//			monitor.log(this._debug()._name, "attributes.getNamedItem(AESKEY): " + attributes.getNamedItem("AESKEY") , this._debug()._enable);
			var AESkey = attributes.getNamedItem("aes").nodeValue;
//			monitor.log(this._debug()._name, "AESkey: " + AESkey, this._debug()._enable);
	//		var hashsalt = members[i].attributes.getNamedItem("salt").nodeValue;
//			monitor.log(this._debug()._name, "hashsalt: " + hashsalt, this._debug()._enable);
			for (var j=0; j < personas.length; j++) {
				var persona = personas[j].textContent;
				aeskeys[persona] = AESkey;
				//monitor.log(this._debug()._name, "persona: " + persona, this._debug()._enable);
				//monitor.log(this._debug()._name, "aeskey: " + aeskeys[persona].aeskey, this._debug()._enable);
				//monitor.log(this._debug()._name, "salt: " + aeskeys[persona].salt, this._debug()._enable);
			}
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
		monitor.log(this._debug()._name, "printList", this._debug()._enable);
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
		
		var ret = scrambleUtils.saveXMLFile(xmlDoc, path);
        monitor.log(this._debug()._name, "saveDoc -> ["+ret+"]", this._debug()._enable);
		return ret;
	}
};
