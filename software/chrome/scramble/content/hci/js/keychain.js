/**
 * @fileOverview Contains the functions that control the keychain dialog
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


/**
 *	Function that loads the default information when the window dialog is loaded
 *  @function
 *  @param win this window dialog object
 */
function onLoad(win) {
	sizeToContent();
	descriptionBox.setEmpty();
	//load xml file with the groups
	var ret = IOxml.importXML();

	if(ret) {
		keychain.loadGroups();
		keychain.loadContacts();
	} else {
		var strbundle = document.getElementById(BUNDLE);
		monitor.messageAlert( strbundle.getString("scramble.group.invalidFile"), true);
		return;
	}

	if(window.arguments === undefined) {
		return;
	}
}


// ***************************************************************************
// **                                                                       **
// **                 -  Key Chain Main control object -                    **
// **                                                                       **
// ***************************************************************************

/** 
  *	Contains the data for the bridge between the application and the crypto
  *	@class Class that contains the main application functions, acting like the main kernel  
  */
var keychain = {
	
	/**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "keychain",
          _enable: true
        };
        return params;
    },
    
	/**
	 *	Function to load the existent groups into the tree list
	 *  @public
	 */
	loadGroups: function() {  
		monitor.log(this._debug()._name, "loadGroups", this._debug()._enable);

        // document.getElementById("buttonCancel").disabled = true;

        this.cleanGroupList();
		var listGroups = document.getElementById('list_groups_tree');

		//add the ALL group = ALL contacts...
        var mainitem  = document.createElement('treeitem');
        var g_item = document.createElement('treerow');

        var  childg = document.createElement('treecell');
        childg.setAttribute('label', ALL);
        g_item.appendChild(childg);
        
        var  childg1 = document.createElement('treecell');
        childg1.setAttribute('label', "TBD");
        childg1.setAttribute('hidden', true);
        g_item.appendChild(childg1);

        mainitem.appendChild(g_item);

        listGroups.appendChild(mainitem);
		//load all the groups
		var groups = IOxml.getGroups("ALL_GROUPS");
		if(groups.length > 0) {
			for(var g in groups) {
				mainitem  = document.createElement('treeitem');
				g_item   = document.createElement('treerow');
				childg = document.createElement('treecell');
				childg.setAttribute('label', groups[g].Name);
				g_item.appendChild(childg);
				
				childg1 = document.createElement('treecell');
				childg1.setAttribute('label', groups[g].Description);
				childg1.setAttribute('hidden', true);
				g_item.appendChild(childg1);
			
				mainitem.appendChild(g_item);
				listGroups.appendChild(mainitem);
			}
		}
		document.getElementById('list_groups').view.selection.select(0);
	},

	/**
	 *	Function to loads the existent contacts into the tree list
	 *  @public
	 *  @deprecated with the synchronisation option
	 */	
	loadContacts: function() {  
		monitor.log(this._debug()._name, "loadContacts", this._debug()._enable);
		var listContacts = document.getElementById('list_contacts_tree');
        var strbundle = document.getElementById(BUNDLE);

        var result = kernel.listKeys(window.arguments[0].javaobj);            
		for(var i=0; i < result.keylist.length; i++) {
		    
			var  mainitem  = document.createElement("treeitem");
			var  c_item   = document.createElement("treerow");
			c_item.setAttribute('draggable','true');

            var name = result.keylist[i].keyName.split("(");
            var tag = ( (name.length < 2) ? "..." : name[1].substring(0, name[1].length-1) );
            var c_name = strTrim(name[0]);

            
			var  child = document.createElement('treecell');
			child.setAttribute('label', c_name);
			child.setAttribute('tagName', tag);
			c_item.appendChild(child);

			var child0 = document.createElement('treecell');
			child0.setAttribute('label', result.keylist[i].keyMail); //mail
			child0.setAttribute('hidden', true);
			c_item.appendChild(child0);

            dump(name[0]+"|"+tag+"| "+result.keylist[i].keyId+"\n");
		
			var child1 = document.createElement('treecell');
			child1.setAttribute('label', result.keylist[i].keyId); //UID
			child1.setAttribute('hidden', true);
			c_item.appendChild(child1);
			
			var child2 = document.createElement('treecell');
			child2.setAttribute('label', result.keylist[i].fingerPrint); //fingerprint
			child2.setAttribute('hidden', true);
			c_item.appendChild(child2);

            var notes = "";
            if(result.keylist[i].keyExpi != strbundle.getString("contact.None")) {
                if(result.keylist[i].keyExpi == "BouncyCastle") {
                    notes = result.keylist[i].keyExpi;
                }else if(!checkDate(result.keylist[i].keyExpi)) {
                    notes = strbundle.getString("contact.KeyExpired");
                    c_item.setAttribute("properties", "statusred");
                }
            }

            var child3 = document.createElement('treecell');
            child3.setAttribute('label', result.keylist[i].keyExpi);
            child3.setAttribute('tagName', notes); //notes
            child3.setAttribute('hidden', true);
            c_item.appendChild(child3);

			mainitem.appendChild(c_item);
			listContacts.appendChild(mainitem);
		}
	},
	
	/**
	 *	Function to loads the existent contacts from a group into the tree list	
	 *  @public
	 */	
	loadContFromGroup: function(group) {
		
		monitor.log(this._debug()._name, "loadContactFromGroup ["+group+"]", this._debug()._enable);
		
		var members = IOxml.getMemberInGroup(group, null); 
        dump(members.length+" <= members\n");
		if (members == FAIL) {
			return false;
		}
        monitor.log(this._debug()._name, "loadCont: ["+members.length+"]", this._debug()._enable);

		var listContacts = document.getElementById('list_contacts_tree');
		if(members.length > 0) {
            for(var m in members) {
                var  mainitem  = document.createElement('treeitem');
                var  m_item   = document.createElement('treerow');
                m_item.setAttribute('draggable','true');
                
                var keyname = members[m].Name.split("<");
                var name = strTrim(keyname[0]).split("(");
                var desc = strLocate(members[m].Name, /\((.*?)\)/);
                var keymail = strLocate(members[m].Name, /\<(.*?)\>/);
                var c_name = strTrim(name[0]);

                var  child1 = document.createElement('treecell');
                child1.setAttribute('label', c_name);
                child1.setAttribute('tagName', desc);
                m_item.appendChild(child1);

                var  child2 = document.createElement('treecell');
                child2.setAttribute('label', keymail);
                child2.setAttribute('hidden', true);
                child2.setAttribute('crop', 'end');
                m_item.appendChild(child2);

                var  child3 = document.createElement('treecell');
                child3.setAttribute('label', members[m].Id);
                child3.setAttribute('hidden', true);
                m_item.appendChild(child3);

                var  child4 = document.createElement('treecell');
                child4.setAttribute('label', members[m].Fgprt);
                child4.setAttribute('hidden', true);
                m_item.appendChild(child4);

                var notes = "";
                var strbundle = document.getElementById(BUNDLE);
                if(members[m].Expir != strbundle.getString("contact.None")) {
                    if(members[m].Expir == "BouncyCastle") {
                        notes = members[m].Expir;
                    } else if(!checkDate(members[m].Expir)) {
                        notes = strbundle.getString("contact.KeyExpired");
                        m_item.setAttribute('properties', 'statusred');
                    } 
                }                

                var child5 = document.createElement('treecell');
                child5.setAttribute('label', members[m].Expir);
                child5.setAttribute('tagName', notes); //notes
                child5.setAttribute('hidden', true);
                m_item.appendChild(child5);

                mainitem.appendChild(m_item);
                listContacts.appendChild(mainitem);
            }
        }
		return true;
	},
	
	/**
	 *	Function that detects the action of group selected from the tree list
	 *  @public
	 */	
	groupSelected: function(flag) {
		monitor.log(this._debug()._name, "groupSelected", this._debug()._enable);
		descriptionBox.setEmpty();

		// for the case of OK to push directly the selected values...
		if( (flag === null) || (flag === undefined) ) {
			flag = false;
		}
				
		var list = document.getElementById('list_groups');
		var rowsSelected = list.view.selection.getRangeCount();
		
		if(rowsSelected > 0) {
			this.cleanContactList();
			var aux = 0;
			//show the available on the new box - The for is for multiple group choice
			for(var i=0; i < list.view.rowCount; i++) {
				if(list.view.selection.isSelected(i)) {
					aux++;
					var item = list.view.getItemAtIndex(i);
					var group = item.firstChild.childNodes[0].getAttribute("label");
					if(group === ALL) {
						this.loadContacts();
					} else {
						this.loadContFromGroup(group);
					}
				} 
				if(aux >= rowsSelected) {
					break;
				}
			}
			
			if(flag) {
				var result = [];
				var list2 = document.getElementById('list_contacts');
				for(var k=0; k < list2.view.rowCount; k++) {
						var item2 = list2.view.getItemAtIndex(k);
						// 0: Name, 1: Email, 2: UID, 3: Fingerprint
						// dump(item2.firstChild.childNodes[2].getAttribute("label")+" <------ \n");
						result.push(item2.firstChild.childNodes[2].getAttribute("label")); //Push UID
				}
				return result;
			} else {
				return null;
			}
		}	
	},
	
	/**
	 *	Function that detects the action of contacted selected from the tree list
	 *  @public
	 */		
	contactSelected: function(flag) {
        monitor.log(this._debug()._name, "contactSelected", this._debug()._enable);
        
        // for the case of OK to push directly the selected values...
        if( (flag === null) || (flag === undefined) ) {
            flag = false;
        }

        var list = document.getElementById('list_contacts');
        var number_sel = list.view.selection.getRangeCount();
        var result = [];
        	
        var start = {}, end = {}, selectedIndexes = [];

        if(number_sel > 0) {
            for (var t = 0; t < number_sel; t++){
                list.view.selection.getRangeAt(t, start, end);
                for (var v = start.value; v <= end.value; v++) {
                    selectedIndexes.push(v);
                }
            }
            
            if(selectedIndexes.length == 1) {
                var item = list.view.getItemAtIndex(selectedIndexes);
                // 0: Name, 1: Email, 2: UID, 3: Fingerprint, 4: Note
                var name = item.firstChild.childNodes[0].getAttribute("label");
                var tag = item.firstChild.childNodes[0].getAttribute("tagName");
                var email = item.firstChild.childNodes[1].getAttribute("label");
                var uid = item.firstChild.childNodes[2].getAttribute("label");
                var finger = item.firstChild.childNodes[3].getAttribute("label");
                var note = item.firstChild.childNodes[4].getAttribute("tagName");
                descriptionBox.setDescription(name, email, finger, note, tag);
            } else {
                descriptionBox.setEmpty();
            }
            
            if(flag) {
                for (var it = 0; it < selectedIndexes.length; it++) {
                    var item = list.view.getItemAtIndex(selectedIndexes[it]);
                    // 0: Name, 1: Email, 2: UID, 3: Fingerprint
                    // dump(item.firstChild.childNodes[2].getAttribute("label")+" <------ \n");
                    result.push(item.firstChild.childNodes[2].getAttribute("label")); //Push UID
                }
            }
        
        } else {
            return null;
        } 
		monitor.log(this._debug()._name, "contactSelected", this._debug()._enable);
		return result;
	},
	
	/**
	 *	Function that cleans the group list. Used when group is removed
	 *  @public
	 */	
	cleanGroupList: function() {
		var listGroups = document.getElementById('list_groups_tree');
		//remove previous redundant content
		for(var j = listGroups.childNodes.length; j > 0; j--) {
			listGroups.removeChild(listGroups.firstChild);
		}
	},
	
	/**
	 *	Function that cleans the contacts list. Used when contact is removed
	 *  @public
	 */
	cleanContactList: function() {
		var listContacts = document.getElementById('list_contacts_tree');	
		//remove previous redundant content
		for(var j = listContacts.childNodes.length; j > 0; j--) {
			listContacts.removeChild(listContacts.firstChild);
		}
	},
 
	/**
	 *	Add new Group function, it will open newgroup window dialog and retrieve the data from there
	 *  @see newgroup.js
	 *  @public
	 */
	addNewGroup: function() {
		monitor.log(this._debug()._name, "addNewGroup", this._debug()._enable);
		var params = dialogLoader.newgroupDialog();
		if(params.result) {
			//add new group + update list...
			var result = IOxml.addNewGroup(params.value, "TBD");
			if(result) {
                this.loadGroups();
                // var listGroups = document.getElementById('list_groups_tree');
                // var  mainitem   = document.createElement('treeitem');
                //  
                // //add the New group => Update the list...
                // var  g_item   = document.createElement('treerow');
                // var  childg = document.createElement('treecell');
                // childg.setAttribute('label', params.value);
                // g_item.appendChild(childg);
                //  
                // var  childg1 = document.createElement('treecell');
                // childg1.setAttribute('label', "TBD");
                // childg1.setAttribute('hidden', true);
                // g_item.appendChild(childg1);
                // 
                // mainitem.appendChild(g_item);
                // listGroups.appendChild(mainitem);
			}
		}
	}, 

	/**
	 *	Add new Contact function, it will show the contact box dialog and retrieve the data from there
	 *  @public
	 *  @see contactBox
	 */
	addNewContact: function() {
		monitor.log(this._debug()._name, "addNewContact", this._debug()._enable);
		//update lists...
		this.cleanContactList();
		this.groupSelected(); // loadContacts();
	},
	
	/**
	 *	Function that adds a new contact to the group key list
	 *  @public
	 *  @see IOxml.js
	 *  @param contactName contact Name
	 *  @param contactID contact key ID
	 *  @param finger contact key fingerprint
	 *  @param groupName group name where the contact will be inserted
	 *  @return {boolean} true or false
	 */
	addContactToGroup: function(contactName, contactID, finger, groupName, expiration) {
		monitor.log(this._debug()._name, "addContactToGroup", this._debug()._enable);
		return IOxml.addNewMember(contactName, contactID, finger, groupName, expiration);
	},
	 
	/**
	 *	Function that removes a selected group (UPDATE FOR MULTIPLE GROUPS)
	 *  @public
	 *  @see IOxml.js
	 */
	removeGroup: function() {
		monitor.log(this._debug()._name, "removeGroup", this._debug()._enable);
		var list = document.getElementById('list_groups');
		var number_sel = list.view.selection.getRangeCount();
		
		if(number_sel > 0) {
		    
			var params = {
			    result: true, 
			    ref: 'group', 
			    value: '', 
			    action: 0   //action: 0 cancel, 1 delete from group, 2 remove permanitly
			};
			
			var item = null;
			
			for(var i=0; i < list.view.rowCount; i++) {
				if(list.view.selection.isSelected(i)) {
					item = list.view.getItemAtIndex(i);
					break;
				}
			}
			
			if(item !== null) {
				params.value = item.firstChild.childNodes[0].getAttribute("label"); //group name
				
				params = dialogLoader.deletionDialog(params);
				
				if(params.action > 0) { //delete group
                    IOxml.removeGroup(params.value);
                    this.cleanContactList();
                    this.loadGroups();
                    this.loadContacts("none");
				} else {
                    //do nothing... cancel
                    monitor.messageDump("cancel", true);
                }
			}
			return;
		}
	},
	
	/**
	 *	Function that removes a selected contact 
	 *  @public
	 *  @see IOxml.js
	 */
	removeContact: function() { 
		monitor.log(this._debug()._name, "removeContact", this._debug()._enable);
        var strbundle = document.getElementById(BUNDLE);
		
		var list = document.getElementById('list_contacts');
		var number_sel = list.view.selection.getRangeCount();
		
		var group = document.getElementById('list_groups');
		
		if(number_sel > 0) {
			var item = null;
			
			for(var i=0; i < list.view.rowCount; i++) {
				if(list.view.selection.isSelected(i)) {
					item = list.view.getItemAtIndex(i);
					break;
				}
			}
			
			if(item === null) {
				return;
			}
			
			//action: 0 cancel, 1 delete from group, 2 remove permanitly
			var params = {result: false, ref: 'contact', value: '', action: 0};
			//contact name
			params.value = item.firstChild.childNodes[0].getAttribute("label");
			//contact uid
			var uid = item.firstChild.childNodes[2].getAttribute("label");
			
			var groupname = "";
			for(var j=0; j < group.view.rowCount; j++) {
				if(group.view.selection.isSelected(j)) {
					groupname = group.view.getItemAtIndex(j).firstChild.childNodes[0].getAttribute("label");
					break;
				}
			}
			params.result = ( (groupname == ALL) ? true : false );
			params = dialogLoader.deletionDialog(params);
			if(params.action > 0) { //delete from group
				if(groupname != "") {
					if(params.action > 1) { //delete from the key ring too and from other groups
						var ret = kernel.delPublicKey(uid, window.arguments[0].javaobj);
						if(ret.output != SUCC) {
							monitor.messageAlert(strbundle.getString("keyRing.ondeleteProblem"), true);
						} else {
							IOxml.removeMemberFromGroup(uid, null);
						}
					} else {
						IOxml.removeMemberFromGroup(uid, groupname);
					}

					this.cleanContactList();
                    if(groupname == ALL) {
                        this.loadContacts();
                    } else {
					    this.loadContFromGroup(groupname);
				    }
                }
				return;
				
			} else {
				//do nothing... cancel
				return;
			}
		} else {
            var nocontact = strbundle.getString("contact.notselected");
            monitor.messageAlert(nocontact,true);
		}
		return;
	}

};


// ***************************************************************************
// **                                                                       **
// **                 -  Add Contact Box control object -                   **
// **                                                                       **
// ***************************************************************************

/** 
  *	Contains the functions for controling action of the contact Box 
  *	@class Class that contains the functions for controling action of the contact Box 
  */
var contactBox = {
	/**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "contactBOX",
          _enable: true
        };
        return params;
    },
    
	/**
	 *	Function that searches the server for a new contact
	 *  @public
	 */	
	onServerSearch: function() {
		monitor.log(this._debug()._name, "onServerSearch", this._debug()._enable);
		var strbundle = document.getElementById(BUNDLE);
		this.clearListSearch();
		var value = document.getElementById("contactsearch").value;
		value = value.replace(/\s/g,'+');
		value = value+"&op=index";
		
		document.getElementById('contactBoxLogo').style.display = "none";
		document.getElementById('resultbox').style.display = "none";

		var url = KEYServerGET+"/pks/lookup?search="+value;
		var http = new XMLHttpRequest();
		http.open("GET", url, true); //true for asynchronous
		document.getElementById('addcontact_desc').textContent = strbundle.getString("contactbox.searchcontact");

		http.onreadystatechange = function() {

			if(http.readyState == 4 && http.status == 200) {
				var result = http.responseText;
				// dump(result);
				var parser = result.split("<pre>");
				var flag = true;
				
				for (var i in parser) {			
					if(parser[i].indexOf("pub") > -1) {
						flag = true;
				
						var index1 = strTrim(parser[i], '').lastIndexOf("<a");
						var index2 = strTrim(parser[i], '').lastIndexOf("</a>");
						var pub = strTrim(parser[i], '').substring(index1,index2);
				
						// Parse the name + pk url
						index1 = strTrim(parser[i], '').indexOf("href=\"");
						index2 = strTrim(parser[i], '').indexOf("\">");			
						var url = strTrim(parser[i], '').substring(index1+6,index2);
						index1 = pub.indexOf(">")+1;
						var name = pub.substring(index1, pub.length);
						name = name.replace("&lt;", "<");
						name = name.replace("&gt;", ">");
				
						// Place in the list ...
						var listResult = document.getElementById('list_result');
						var  list_item = document.createElement('listitem');
						// list_item.display.style.width = "20em";
				
						var  child2 = document.createElement('listcell');
						child2.setAttribute('label', url);
						child2.setAttribute('hidden', true);
						list_item.appendChild(child2);
				
						var  child1 = document.createElement('listcell');
						child1.setAttribute('label', name);
						list_item.appendChild(child1);
				
						listResult.appendChild(list_item);
					} 
					else {
						flag = false;
					}
				}
				
				var result_str = strbundle.getString("contactbox.searchOK");
				if(!flag) {
					result_str = strbundle.getString("contactbox.searchFail");
					document.getElementById('addcontact_desc').textContent = result_str;
					// document.getElementById("pkresult_label").value = result_str;
				} else {
					// document.getElementById("pkresult_label").value = result_str;
					document.getElementById('addcontact_desc').textContent = result_str;
					document.getElementById('resultbox').style.display = "inherit";
				}
			} else if (http.status == 404 || http.status == 500) {
				document.getElementById('addcontact_desc').textContent = strbundle.getString("contactbox.searchFail");
			}
		};
		http.send(null);
		
	},
	
	/**
	 *	Function that cleans the contact search list
	 *  @public
	 */
	clearListSearch: function() {
		var listResult = document.getElementById('list_result');	
		//remove previous redundancy
		for(var j = listResult.childNodes.length; j > 0; j--){
			var mb = listResult.childNodes[j];
			listResult.removeItemAt(listResult.getIndexOfItem(mb));
		}
	},
	
	/**
	 *	Function that detects the action of a key selected from the tree list of results
	 *  @public
	 *  @returns {String} Success or Fail
	 */
	onKeySelect: function() {
		monitor.log(this._debug()._name, "onKeySelect", this._debug()._enable);
		var listResult = document.getElementById('list_result');

		if (listResult.selectedItems.length === 0) {
			return FAIL;
		} 
		for(var k =0; k < listResult.selectedItems.length; k++) {
			var item = listResult.selectedItems[k];
			var url = item.firstChild.getAttribute("label");
			var pkresult_server = myAjax.callServer(KEYServerGET+url, "");

			var pkresult = stripHTML(pkresult_server,null);
			var index1 = pkresult.indexOf(PGPKey_start);
			if(index1 > -1) {
				var pk = strTrim(pkresult.substring(index1,pkresult.length), '');
				return pk;
			} 
			return FAIL;	
		}
	},
	
	/**
	 *	Function that adds the new public key to the key ring
	 *  @public
	 */	
	onAdd: function() {
		monitor.log(this._debug()._name, "onAddcontact", this._debug()._enable);
		var value = document.getElementById("mainpanel").selectedPanel;
        var strbundle = document.getElementById(BUNDLE);
		
		var pktext = FAIL;
		var result;
		if(value.id != "contactpanel") {
			pktext = this.onKeySelect();
            var resultLabel = strbundle.getString("result")+ " ";
			if(pktext != FAIL) {
				result = kernel.addNewKey(pktext, window.arguments[0].javaobj);
				if (result.result != SUCC) {
                    monitor.messageAlert(strbundle.getString("publicKey.problem"), true);
                    // document.getElementById("pkresult_label").value = resultLabel+ strbundle.getString("publicKey.problem");
				} else {
					document.getElementById("pkresult_label").value = resultLabel+SUCC;
				}
			} else {
				document.getElementById("pkresult_label").value = resultLabel + strbundle.getString("publicKey.notselected");
			}
		} else {
			pktext = document.getElementById('addmemberpk').value;
			
			var error = strbundle.getString("publicKey.invalid");
			if( (pktext.indexOf(PGPKey_start) < 0) || (pktext.length < 1) || (pktext == error) ) {
				pktext = FAIL;
			}
			
			if(pktext != FAIL) {
				result = kernel.addNewKey(pktext, window.arguments[0].javaobj);
				if (result.result != SUCC) {
					monitor.messageAlert(strbundle.getString("publicKey.problem"), true);
				} else {
					document.getElementById('addmemberpk').value = strbundle.getString("contact.addsuccess");
				}
			} else {
				monitor.messageAlert(error, true);
			}
		}
		
		keychain.addNewContact();
	},
	
	/**
	 *	Cancels the actions and closes the Add New contact Box
	 *  @public
	 */	
	onCancel: function() {
		descriptionBox.setEmpty();
		return;
	}
	
};


// ***************************************************************************
// **                                                                       **
// **             -  Description Box Element control object -               **
// **                                                                       **
// ***************************************************************************

/** 
  *	Contains the functions for controling action of the contact Box 
  *	@class Class that contains the functions for controling action of the contact Box 
  */
var descriptionBox = {
	
	/**
	 * Sets the description box in empty mode = no descriptions
	 *  @public	
	 */
	setEmpty: function() {
		document.getElementById('noDescription').style.display = "block";
		
		document.getElementById('miscBox').style.display = "none";
		document.getElementById('descriptionBox').style.display = "none";
		document.getElementById('addcontactBox').style.display = "none";
		document.getElementById('miscBoxPic').style.display = "none";
	},
	
	/**
	  * Sets the Add New Contact Box visible on the description box
	 *  @public	
	  */
	setAddContact: function() {
		document.getElementById('miscBox').style.display = "block";				
		document.getElementById('addcontactBox').style.display = "block";	

		document.getElementById('noDescription').style.display = "none";
		document.getElementById('descriptionBox').style.display = "none";
		document.getElementById('miscBoxPic').style.display = "none";	
	},
	
	/**
	  * Sets a contact description visible, when contact is selected
      *  @public	
	  */
	setDescription: function(name, email, finger, note, tag) {
		document.getElementById('miscBox').style.display = "block";
		document.getElementById('descriptionBox').style.display = "block";
		document.getElementById('miscBoxPic').style.display = "block";
		
		document.getElementById('addcontactBox').style.display = "none";
		document.getElementById('noDescription').style.display = "none";
		
		//set labels...
		document.getElementById('descriptionName').value = name;
		
		document.getElementById('descriptionLabel').value = tag;
		
		if(email.indexOf(",") > 0) {
			var allmails = email.split(",");
			email = allmails[0] + " ...";
		}
				
		document.getElementById('descriptionMail').value = email;
		document.getElementById('descriptionFingerprint').value = finger;
		
		if(note=="") {
		    var strbundle = document.getElementById(BUNDLE);
			note = strbundle.getString("contact.noNotes");
		}
		document.getElementById('descriptionNoteVal').value = note;
	}
	
};

// ***************************************************************************
// **                                                                       **
// **                          -  Misc Functions -                          **
// **                                                                       **
// ***************************************************************************


/**
  * Function to execute the drang and drop event, on copy element to group
  * @public
  * @param event 
  */
function onDragAndDrop(event) {
	monitor.messageDump("onDragAndDrop", true);
	var originalTarget = event.relatedNode; 
	var target = event.target;
	var sel = []; // un array pour stoker toutes les index des lignes selectionnées
	var current = null;
	var start = {};
	var end = {};
	var numRanges = originalTarget.object.view.selection.getRangeCount();
	var value;
	var treeitems = [];
	
	for (var t=0; t < numRanges; t++){
		originalTarget.object.view.selection.getRangeAt(t,start,end);
		for (var v=start.value; v <=end.value; v++) {
			treeitems.push(originalTarget.object.view.getItemAtIndex(v));
		}
	}
	
	var before = null;
	var row = target.object.treeBoxObject.getRowAt(event.clientX, event.clientY);
	
	if(row != -1) {
		before = target.object.view.getItemAtIndex(row);
	}
	
	var groupname = strTrim(target.object.view.getItemAtIndex(row).firstChild.childNodes[0].getAttribute("label"));
	
	for (var i=0; i<treeitems.length; i++) {
		//add to group
		var key_name = strTrim(treeitems[i].firstChild.childNodes[0].getAttribute("label"));
		var key_description =  " ("+ strTrim(treeitems[i].firstChild.childNodes[0].getAttribute("tagName"))+") ";
		var key_email = " <"+ strTrim(treeitems[i].firstChild.childNodes[1].getAttribute("label"))+">";
		var name = key_name+key_description+key_email;
		var uid = treeitems[i].firstChild.childNodes[2].getAttribute("label");
		var finger = treeitems[i].firstChild.childNodes[3].getAttribute("label");
		var expiration = treeitems[i].firstChild.childNodes[4].getAttribute("label");
		dump("---------------------------\n");
		dump(name+"\n"+uid+"\n"+finger+"\n"+groupname+"\n"+expiration+"\n");
        dump("---------------------------\n");
        var re =keychain.addContactToGroup(name, uid, finger, groupname, expiration);
		dump( "re: "+re+"\n");
		
	}
}


/**
  * Function to execute acceptance on doubleclick and on onDone button. 
  * It will save the content if there is any change or/and return the array list as a window arguments
  * @param event 
  */
function onAccept() {

	monitor.messageDump("KeyChainDlg: onAccept: ["+window.arguments+"]", true);
	
	if(window.arguments !== undefined) {
		if(window.arguments[0].control) {
			var listContacts = document.getElementById("list_contacts");
			var rowsContacts = listContacts.view.selection.getRangeCount();
			
			var listGroups = document.getElementById("list_groups");
			var rowsGroups = listGroups.view.selection.getRangeCount();
			// dump("rowG: "+rowsGroups+" | rowC: "+rowsContacts+"\n");
			
			if( (rowsGroups === 0) && (rowsContacts === 0) ) {
				window.arguments[0].control = false;
			} else if( (rowsGroups > 0) && (rowsContacts === 0) ) {
				window.arguments[0].selected_items = keychain.groupSelected(true);
			} else {
				var selectedvals = keychain.contactSelected(true);
				dump("Keychain: "+selectedvals+"\n");
				window.arguments[0].selected_items = selectedvals;
			}
		} 
	} 
	IOxml.saveDoc();
	window.close();
}

/**
  * @public
  */
function onCancel() {
    monitor.messageDump("KeyChainDlg: onCancel", true);
    // if(window.arguments !== undefined) {
    //     if(window.arguments[0].control) {
    //         window.arguments[0].control = true;
    //     } else {
    //         window.arguments[0].control = false;
    //     }
    // }
	window.close();
}