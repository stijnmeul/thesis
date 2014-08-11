/**
 * @fileOverview Contains the functions that control the keychain dialog and the contacts
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @author <a href="mailto:iulia.ion@inf.ethz.ch">Iulia Ion</a>
 * @version 1.0
 */


dump("keychain loaded...\n");

// ***************************************************************************
// **                                                                       **
// **                 -  Key Chain Main control object -                    **
// **                                                                       **
// ***************************************************************************
// import the utils modules
Components.utils.import("resource://scramble/utils/utils.js");
Components.utils.import("resource://scramble/utils/monitor.js");
// import the lib modules
Components.utils.import("resource://scramble/lib/xmlMessages.js");
// import the core modules
Components.utils.import("resource://scramble/core/coins.js");
Components.utils.import("resource://scramble/core/kernel.js");




/** 
  *	Contains the data for the bridge between the application and the crypto
  *	@class Class that contains the main application functions, acting like the main kernel  
  */
var keychain = {
	
	_BUNDLE: "scramble_strings",
	
	/**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "keychain",
          _enable: true
        };
	    var prefs = scrambleUtils.getPreferences();
        var debug = prefs.getBoolPref("debug");
		params._enable = debug;
        return params;
    },

	_Contact: function() {
	    this.mail = null;
	    this.id = null;
	    this.name = null;
	    this.fgprt = null;
	    this.exp = null;
	    this.aes = null;
	    this.persona = []; //2 dimentional array with (type, value) pairs
	},

	_xmlDoc: null,
	/** stores the groups and the id of the contacts in each group, in the form groups["groupname"] = [memberid1, memberid2, ...];*/
	_groups: [],
	/** stores all the contacts of the user, as an array of objects Contact */
	_contacts: [],
	/** stores a mapping between a contact's persona and its aes key */
	_aeskeys: [],
	/** stores auxiliary information */
	_aux: [],

	initialize: function() {
		monitor.log(this._debug()._name, "initialize", this._debug()._enable);
    	// load contacts
    	this.loadAddressBook();
		// load AES keys...
    	this.loadAesKeys();
		dump("contacts: "+this._contacts.length+"\n");
		dump("groups: "+this._groups.length+"\n");
    },

	/**
	 *	Function that loads the default information when the window dialog is loaded
	 *  @function
	 *  @param win this window dialog object
	 */
	onLoad: function(win) {
        // monitor.log(this._debug()._name, "onLoad: ["+kernel.testObj()+"]", this._debug()._enable);
		
		if(window.arguments === undefined) {
			return;
		}
		descriptionBox.setEmpty();
		sizeToContent();
		this.initialize();
		keychain.showGroups();
		keychain.showContactsForGroup("All Contacts");

	},
	
	/**
	 *	Function to load the existent groups into the tree list
	 *  @public
	 */
	showGroups: function(group) {  
		monitor.log(this._debug()._name, "showGroups", this._debug()._enable);

        // document.getElementById("buttonCancel").disabled = true;

        this.cleanGroupList();
		var listOfGroups = document.getElementById('list_groups_tree');
		var tree = document.getElementById('list_groups');
		var index = 0;
		// if (group == undefined || group == "") index = 0;

		this.addRow("All Contacts", listOfGroups);
		var count = 0;
		for (var groupName in keychain._groups) {
			this.addRow(groupName, listOfGroups);
			count ++;
			if ( (group != undefined || group != "") && (groupName == group) ) {
				index = count;
				dump("---------> INDEX.lenght: "+index+" | "+count+"\n");
			}
		}
		// 
		if(group != undefined || group != "") {
			dump("---------> TREE.lenght: "+tree.length+"\n");
			dump("---------> TREE.selection: "+tree.view.selection+"\n");
			dump("---------> TREE.selection: "+tree.view.selection+"\n");
		}
		tree.view.selection.select(index);
	},
	
	
	addRow: function(name, toElement, dragable, hiddenData){
		monitor.log(this._debug()._name, "addRow", this._debug()._enable);
		var item  = document.createElement('treeitem');
		var row   = document.createElement('treerow');

		item.setAttribute('draggable', dragable);
		var cell = document.createElement('treecell');
		//groupName
		// childg.setAttribute('label', groups[g].Name);
		cell.setAttribute('label', name);
		row.appendChild(cell);
		if (hiddenData) {
			var hiddencell = document.createElement('treecell');
			hiddencell.setAttribute('label', hiddenData);
			//hiddencell.setAttribute("type", 'hidden');
			row.appendChild(hiddencell);
		}
		item.appendChild(row);
		toElement.appendChild(item);
	},
	

	/**
	 *	Function to loads the existent contacts into the tree list
	 *  @public
	 *  @deprecated with the synchronisation option
	 */	
	loadAddressBook: function() {  
		monitor.log(this._debug()._name, "loading Contacts", this._debug()._enable);
		
        var prefs = scrambleUtils.getPreferences();
		var _path = "file://" + prefs.getCharPref(vars._KEYChainPath);
		monitor.log(this._debug()._name, "loading Contacts: "+_path, this._debug()._enable);
		if ( (_path == vars._FAIL) || (_path == "") ) {
			_path = vars._PATH;
		} 
			
		try{
			var req = new XMLHttpRequest();
			req.open("GET", _path, false);
			req.send(null);
			// print the name of the root element or error message
			keychain._xmlDoc = req.responseXML;
			
			this.loadContacts(keychain._xmlDoc);
			this.loadGroups(keychain._xmlDoc);
			
		} catch (e) {
				monitor.log(this._debug()._name, "Error loading contacts " + e, this._debug()._enable);
		}		
		monitor.log(this._debug()._name, "done loading contacts ", this._debug()._enable);
		// this.printContacts();
		return keychain._groups;
	},
	
	getMemberAESKey: function(persona){
//		monitor.log(this._debug()._name, "getMemberAESKey for:" + persona, this._debug()._enable);
		return keychain._aeskeys[persona];
	},
	
	loadContacts: function(doc) {  
		monitor.log(this._debug()._name, "loadingContacts ", this._debug()._enable);
		var contactNodes = doc.getElementsByTagName("contact");
		for(var i=0; i < contactNodes.length; i++) {
			var contact = new keychain._Contact();
			contact.id = contactNodes[i].attributes.getNamedItem("id").value;
			contact.fgprt = contactNodes[i].attributes.getNamedItem("fingerprint").value;
			contact.exp = contactNodes[i].attributes.getNamedItem("exp").value;
			contact.aes = contactNodes[i].attributes.getNamedItem("aes").value;
//			monitor.log(this._debug()._name, "loading personas: " , this._debug()._enable);
            var personas = this.loadPersonas(contactNodes[i]);
            contact.persona = personas;
            
            contact.name = contact.persona[0][1];
            monitor.log(this._debug()._name, "contact.persona: " + contact.persona , this._debug()._enable);
            // add the contact to our contact list
			keychain._contacts[contact.id] = contact;
			monitor.log(this._debug()._name, "contact (toString): " + this.contactToString(keychain._contacts[contact.id]), this._debug()._enable);
		}	
	},
	
	loadAesKeys: function(){
		monitor.log(this._debug()._name, "loadAesKeys " , this._debug()._enable);
		keychain._aeskeys = [];
		for each (contact in keychain._contacts){
			var personas = contact.persona;
			monitor.log(this._debug()._name, "contact " + contact.id , this._debug()._enable);
			for (var j = 0; j < personas.length; j ++){
				monitor.log(this._debug()._name, "persona " + j + ":" + personas[j][1] , this._debug()._enable);
				var personaName = personas[j][1];
				keychain._aeskeys[personaName] = contact.aes;
			}
		}
	},
	
	loadGroups: function(doc) {
		var groupNodes = doc.getElementsByTagName("group");
		for(var g=0; g < groupNodes.length; g++) {
			var groupName = groupNodes[g].attributes.getNamedItem("name").value;
			monitor.log(this._debug()._name, "groupName: " + groupName, this._debug()._enable);
			var	members = groupNodes[g].getElementsByTagName("member");
			var groupMember = [];
			if(members != null) {
				for(i=0; i < members.length; i++) {
					var contactId = members[i].textContent;
					groupMember[i] = contactId;
				}
			}
			keychain._groups[groupName] = groupMember;
			monitor.log(this._debug()._name, "groups[groupName].length: " + keychain._groups[groupName], this._debug()._enable);
		}
		dump("groups in loadgroups: "+keychain._groups+"\n");
		
	},

	loadPersonas: function(memberNode){
		monitor.log(this._debug()._name, "loadPersonas " , this._debug()._enable);
		var personaNodes = memberNode.getElementsByTagName("persona");
		var persona = [];
		for (var j=0; j < personaNodes.length; j++) {
			var type = personaNodes[j].attributes.getNamedItem("type").value;
			monitor.log(this._debug()._name, "type: " + type, this._debug()._enable);
			var personaValue = personaNodes[j].textContent
			persona[j] = [type, personaValue];
		}
		return persona;
	},
	
	printContacts: function() {
//		monitor.log(this._debug()._name, "printContacts ", this._debug()._enable);
//		monitor.log(this._debug()._name, "groups: " + keychain._groups, this._debug()._enable);
		for (var groupName in keychain._groups) {
			monitor.log(this._debug()._name, "group: " + groupName, this._debug()._enable);
			var group = keychain._groups[groupName];
			for (var c = 0; c < group.length; c ++) {
				var contactId = group[c];
				var contact = keychain._contacts[contactId];
				monitor.log(this._debug()._name, this.contactToString(contact), this._debug()._enable);
			}
	    }
	},
	
	contactToString: function(member){
		if (member == null) {
			return "null";
		}
		var toString = "[" + member.id + ", " + member.fgprt + ", " + member.aes + " (";
		for (personaType in member.persona) {
			toString = toString + personaType + ": " + member.persona[personaType] + ", ";
		}
		toString = toString + ")]";
		return toString;
	},
	
	
	saveAddressBook: function() {  
		this.serializeContacts();
		this.serializeGroups();
		// write to the xml file
		var prefs = scrambleUtils.getPreferences();
		var _path = "file://" + prefs.getCharPref(vars._KEYChainPath);
        
		monitor.log(this._debug()._name, "path: " + _path, this._debug()._enable);
		// scrambleUtils.saveXMLFile(keychain._xmlDoc);
		// scrambleUtils.saveXMLFile(keychain._xmlDoc, prefs.getCharPref(vars._KEYChainPath));
		keychain.saveXMLFile(keychain._xmlDoc, prefs.getCharPref(vars._KEYChainPath));
		dump("closing saveAddressBook\n");
	},
	
	serializeContacts: function() {  
		monitor.log(this._debug()._name, "serializeContacts " , this._debug()._enable);
		monitor.log(this._debug()._name, "xmlDoc: " + keychain._xmlDoc , this._debug()._enable);
		monitor.log(this._debug()._name, "xmlDoc.getElementsByTagName(addressbook): " + keychain._xmlDoc.getElementsByTagName("addressbook") , this._debug()._enable);
		var addressbook = keychain._xmlDoc.getElementsByTagName("addressbook")[0];
		monitor.log(this._debug()._name, "addressbook: " + addressbook , this._debug()._enable);
		var newContactsNode = keychain._xmlDoc.createElement("contacts");
		var oldContactsNode = keychain._xmlDoc.getElementsByTagName("contacts")[0];
		for each (contact in keychain._contacts){
			monitor.log(this._debug()._name, "contact: " + this.contactToString(contact) , this._debug()._enable);
			var contactNode = this.serializeContact(contact);
			newContactsNode.appendChild(contactNode);
		}
		addressbook.replaceChild(newContactsNode, oldContactsNode);
	},
	
	
	/** returns an xml node */
	serializeContact: function (contact) {
		monitor.log(this._debug()._name, "serializeContact " , this._debug()._enable);
		var contactNode = keychain._xmlDoc.createElement("contact");
		contactNode.setAttribute("id", contact.id); 
		contactNode.setAttribute("fingerprint", contact.fgprt); 
		contactNode.setAttribute("aes", contact.aes); 
		if (contact.exp) {
			contactNode.setAttribute("exp", contact.exp); 
		}
		monitor.log(this._debug()._name, "serializeContact " , this._debug()._enable);
		for (var i = 0; i < contact.persona.length; i ++) {
			monitor.log(this._debug()._name, "i: " + i, this._debug()._enable);
			var personaNode = keychain._xmlDoc.createElement("persona");
			personaNode.setAttribute("type", contact.persona[i][0]); // the type
			personaNode.appendChild(keychain._xmlDoc.createTextNode(contact.persona[i][1])); // the value
			contactNode.appendChild(personaNode);
		}
		return contactNode;
	},
	
	serializeGroups: function() {  
		monitor.log(this._debug()._name, "serializeGroups " , this._debug()._enable);
		var addressbook = keychain._xmlDoc.getElementsByTagName("addressbook")[0];
		var newGroupsNode = keychain._xmlDoc.createElement("groups");
		var oldGroupsNode = keychain._xmlDoc.getElementsByTagName("groups")[0];
		for (var groupName in keychain._groups){
			var groupNode = this.serializeGroup(groupName);
			newGroupsNode.appendChild(groupNode);
		}
		addressbook.replaceChild(newGroupsNode, oldGroupsNode);
	},
	
	/** returns an xml node */
	serializeGroup: function (groupName) {
		monitor.log(this._debug()._name, "serializeGroup " , this._debug()._enable);
		var groupNode = keychain._xmlDoc.createElement("group");
		groupNode.setAttribute("name", groupName);
		var members = keychain._groups[groupName];
		for (var m = 0; m < members.length; m ++) {
			var memberNode = keychain._xmlDoc.createElement("member");
			memberNode.appendChild(keychain._xmlDoc.createTextNode(members[m]));
			groupNode.appendChild(memberNode);
		}
		return groupNode;
	},
	
	/**
	 *	Function to save a xml object into a file
	 *  @public
	 *  @param xmlDoc xml object value
	 *  @returns {boolean} true or false
	 *  @throws {Exception} Issues with the xml document or file
	 */
	saveXMLFile: function(xmlDoc, path) {
	    monitor.log(this._debug()._name, "saveXMLFile", this._debug()._enable);
		if( (path === undefined) || (path === null) ) {
		    path = scrambleUtils.getPreferences().getCharPref(KEYChainPath);
		}
		dump("path: "+path+"\n");
		try {

		    var somefile;
	        if( !( /^chrome:/.test(path) ) ) {
	            somefile = path;    
	        } else {
	                 somefile = scrambleUtils.chromeToPath(path);
	        }
			// var xmlDoc;
			// dump("doXmlStuff path: "+somefile+"\n");
			var file_local = Components.classes["@mozilla.org/file/local;1"];
			var file = file_local.createInstance(Components.interfaces.nsILocalFile);
			file.initWithPath(somefile);
			
			monitor.log(this._debug()._name, "somefile: " + somefile, this._debug()._enable);

			if (file.exists()) {
				monitor.log(this._debug()._name, "file exists", this._debug()._enable);
				var component = Components.classes["@mozilla.org/network/file-output-stream;1"];
				var fcStream = component.createInstance(Components.interfaces.nsIFileOutputStream);
				fcStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);	// write, create, truncate
			
				var ser = new XMLSerializer();
				//write the serialized XML to file
				monitor.log(this._debug()._name, "xmlDoc: " + xmlDoc, this._debug()._enable);
				ser.serializeToStream(xmlDoc, fcStream, "");
				fcStream.close();
				return true;
			} else {
				return false;
			}

		} catch (e) {
			monitor.log(this._debug()._name, "Error saving XML file" + e, this._debug()._enable);
			return false;
		}
	},
	
	
	
	/**
	 *	Function to loads the existent contacts from a group into the tree list	
	 *  @public
	 */	
	getContactsForGroup: function(groupName) {
		monitor.log(this._debug()._name, "getContactsForGroup ["+groupName+"]", this._debug()._enable);
		var contactsToDisplay = [];
		if (groupName === "All Contacts") {
			monitor.log(this._debug()._name, "displaying all contacts ", this._debug()._enable);
			contactsToDisplay = [v for each (v in keychain._contacts)];
		} else {
			var members = keychain._groups[groupName]; 
			monitor.log(this._debug()._name, "members: " + members, this._debug()._enable);
 			if (members == undefined) return;
			for (var m = 0; m < members.length; m++) {
				monitor.log(this._debug()._name, "m: " + m, this._debug()._enable);
				var contactId = members[m];
				contactsToDisplay[m] = keychain._contacts[contactId];
				monitor.log(this._debug()._name, "contactsToDisplay[m]: " + this.contactToString(contactsToDisplay[m]), this._debug()._enable);
	        }
		}
		return contactsToDisplay;
	},
	
	/**
	 *	Function to loads the existent contacts from a group into the tree list	
	 *  @public
	 */	
	showContactsForGroup: function(groupName) {
	    monitor.log(this._debug()._name, "showContactsForGroup ["+groupName+"]", this._debug()._enable);
        var contactsToDisplay = keychain.getContactsForGroup(groupName);
		keychain.displayContacts(contactsToDisplay);
    },
	
	displayContacts: function(contactsToDisplay) {
		monitor.log(this._debug()._name, "displayContacts: " + contactsToDisplay.length, this._debug()._enable);
        
		var listContacts = document.getElementById('list_contacts_tree');
		for (var i = 0; i < contactsToDisplay.length; i ++) {
			keychain.addRow(contactsToDisplay[i].name, listContacts, true, contactsToDisplay[i].id);
		}

	},
	
	/**
	 * @return an array with the names of the selected groups
	 */
	getSelectedGroups: function() {
	    monitor.log(this._debug()._name, "getSelectedGroups: ", this._debug()._enable);
		
		var groupNames = [];
		var list = document.getElementById('list_groups');
		
		if (list == null) return null;

		var rowsSelected = list.view.selection.getRangeCount();
		

		if(rowsSelected > 0) {
            this.cleanContactList();
			var aux = 0;
			//show the available on the new box - The for is for multiple group choice
			for(var i=0; i < list.view.rowCount; i++) {
				if(list.view.selection.isSelected(i)) {
					var item = list.view.getItemAtIndex(i);
					groupNames[aux] = item.firstChild.childNodes[0].getAttribute("label");
					aux++;
				} 
				if(aux >= rowsSelected) {
					break;
				}
			}
		} else { // show All contacts
            groupNames[0] = "All Contacts";
        }
		return groupNames;
	},
	
	
	/**
	 * @return an array with the contacts per group
	 */	
	getSelectedGroupContacts: function(groups) {
	    monitor.log(this._debug()._name, "getSelectedGroupContacts ["+groups+"]", this._debug()._enable);
	    var contactsSelected = [];
		for (var i = 0; i < groups.length; i ++) {
			// dump("--->>>>>> "+group+"\n")
            var contacts = keychain.getContactsForGroup(groups[i]);
            for(var j = 0; j < contacts.length; j++ ) {
                if(scrambleUtils.binarySearch(contactsSelected, contacts[j].id) == -1 ) {// does not exist ADD
                    contactsSelected.push(contacts[j].id);
                }
            }
		}
		return contactsSelected;
	},
	
	/**
	 *	Function that detects the action of group selected from the tree list
	 *  @public
	 */	
	showSelectedGroups: function(flag) {
		monitor.log(this._debug()._name, "showSelectedGroups", this._debug()._enable);
		descriptionBox.setEmpty();

		var selectedGroups = keychain.getSelectedGroups();
        dump(selectedGroups.length+"<-----------\n");
		for (var i = 0; i < selectedGroups.length; i ++) {
            dump(selectedGroups[i]+"   <-  Group -----------\n");
			keychain.showContactsForGroup(selectedGroups[i]);
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
                // 0: Name, 1: ID
                monitor.log(this._debug()._name, "[0] " + item.firstChild.childNodes[0].getAttribute("label"), this._debug()._enable);
                monitor.log(this._debug()._name, "[1] " + item.firstChild.childNodes[1].getAttribute("label"), this._debug()._enable);
                var contactId = item.firstChild.childNodes[1].getAttribute("label");
                keychain.showContactDescription(contactId);
                
                
            } else {
                descriptionBox.setEmpty();
            }
            
            if(flag) {
                for (var it = 0; it < selectedIndexes.length; it++) {
                    var item = list.view.getItemAtIndex(selectedIndexes[it]);
                    // 0: Name, 1: Email, 2: UID, 3: Fingerprint
                    // dump(item.firstChild.childNodes[2].getAttribute("label")+" <------ \n");
                    result.push(item.firstChild.childNodes[1].getAttribute("label")); //Push UID
                }
            }
        
        } else {
            return null;
        } 
		monitor.log(this._debug()._name, "contactSelected", this._debug()._enable);
		return result;
	},
	
	showContactDescription: function(contactId) {
		monitor.log(this._debug()._name, "showContactDescription: " + contactId, this._debug()._enable);
		var contact = keychain._contacts[contactId];
		descriptionBox.setDescription(contact.name, "", contact.fgprt, "", "");
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
		var groupName = window.prompt("Enter the name of the new group", "");
		keychain._groups[groupName] = [];
		this.showGroups(groupName);	
	}, 


	/**
	 *	Add new Contact function
	 *  @public
	 *  @see contactBox
	 *  @return the contactid
	 */
	addNewContact: function(openpgpkey, aeskey) {
		monitor.log(this._debug()._name, "addNewContact", this._debug()._enable);
		
		// create the contact
		var contact = new keychain._Contact();
	    contact.mail = openpgpkey.keyMail;
	    contact.id = openpgpkey.keyId;
	    contact.name = openpgpkey.keyName;
	    contact.fgprt = openpgpkey.fingerPrint;
	    contact.exp = openpgpkey.keyExpi;
	    contact.aes = aeskey;
	    contact.persona = [];
	    contact.persona[0] = ["name", openpgpkey.keyName];
	     
	    keychain._contacts[contact.id] = contact;
	    
	    //add the contact to the group   
		var selectedGroups = keychain.getSelectedGroups();
		if (selectedGroups == null) return false;

		for (var i = 0; i < selectedGroups.length; i ++) {
            if(selectedGroups[i] == "All Contacts") continue;
			keychain.addContactToGroup(contact.id, selectedGroups[i]);
		}
	    return true;
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
	moveContact: function(contactId, fromGroupName, toGroupName) {
		monitor.log(this._debug()._name, "moveContact", this._debug()._enable);
		// add last
		monitor.log(this._debug()._name, "contactId: " + contactId, this._debug()._enable);
		monitor.log(this._debug()._name, "fromGroupName: " + fromGroupName, this._debug()._enable);
		monitor.log(this._debug()._name, "toGroupName: " + toGroupName, this._debug()._enable);
		
		// add last
		this.addContactToGroup(contactId, toGroupName);
		
		// remove
		if (fromGroupName != "All Contacts") {
			this.removeContactFromGroup(contactId, fromGroupName);
		}
	},
	
	addContactToGroup: function(contactId, groupName) {
		monitor.log(this._debug()._name, "addContactToGroup ", this._debug()._enable);
		monitor.log(this._debug()._name, "contactId: " + contactId, this._debug()._enable);
		monitor.log(this._debug()._name, "groupName: " + groupName, this._debug()._enable);
		var toGroup = keychain._groups[groupName]; // does it copy it??
		monitor.log(this._debug()._name, "groups[groupName].length: " + keychain._groups[groupName].length, this._debug()._enable);
		toGroup[toGroup.length] = contactId;
		monitor.log(this._debug()._name, "groups[groupName].length: " + keychain._groups[groupName].length, this._debug()._enable);
	},
	

	removeContactFromGroup: function(contactId, groupName) {
		monitor.log(this._debug()._name, "removeContactFromGroup: " + groupName, this._debug()._enable);
		var fromGroup = keychain._groups[groupName];
		for (var i = 0; i < fromGroup.length; i++) {
			if (fromGroup[i] === contactId){
				fromGroup.splice(i, 1);
				break;
			}
		}
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
			var item = null;
			for(var i=0; i < list.view.rowCount; i++) {
				if(list.view.selection.isSelected(i)) {
					item = list.view.getItemAtIndex(i);
					var groupName = item.firstChild.childNodes[0].getAttribute("label"); //group name
					var x = window.confirm("Are you sure you want to delete group [" + groupName + "]?");
					if (x) {
						delete keychain._groups[groupName];
					}
				}
			}
		}
		this.showGroups();
		keychain.showContactsForGroup("All Contacts");
	},
		
	
	/**
	 *	Function that removes a selected contact 
	 *  @public
	 *  @see IOxml.js
	 */
	removeContact: function() { 
		monitor.log(this._debug()._name, "removeContact", this._debug()._enable);
        var strbundle = document.getElementById(this._BUNDLE);
        var list = document.getElementById('list_contacts');
        var number_sel = list.view.selection.getRangeCount();
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
        	var uid = item.firstChild.childNodes[1].getAttribute("label");

        	// TODO: refactor this
        	var group = document.getElementById('list_groups');
        	var groupname = "All Contacts";
        	for(var j=0; j < group.view.rowCount; j++) {
        		if(group.view.selection.isSelected(j)) {
        			groupname = group.view.getItemAtIndex(j).firstChild.childNodes[0].getAttribute("label");
        			break;
        		}                
        	}
        	monitor.log(this._debug()._name, "uid: " + uid, this._debug()._enable);
        	monitor.log(this._debug()._name, "groupname: " + groupname, this._debug()._enable);
        	params.result = ( (groupname == "All Contacts") ? true : false );
        	params = scrambleAppNS.dialogLoader.deletionDialog(params);
        	
        	if(params.action > 0) { //delete from group
        		monitor.log(this._debug()._name, "delete from group", this._debug()._enable);    		
        		if(groupname != "") {
        			if(params.action > 1) { //delete from the key ring too and from other groups
                		monitor.log(this._debug()._name, "delete from the key ring too and from other groups", this._debug()._enable);
                        
                        var onDone = function(data) {
                            // dump("data: "+data+"\n");
                            var groupname = keychain._aux;
                            // dump("groupname: "+groupname+"\n");
                            var contactId = xmlMessages.processReply(data);                            
                            // dump("uid: "+uid+"\n");                            
                            if(contactId == "false") {
                                scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("keyRing.ondeleteProblem"), true);
                            } else {
                                monitor.log(keychain._debug()._name, "IOxml.removeMemberFromGroup(uid, null);", keychain._debug()._enable);
                                dump("---> remove member from group("+groupname+","+keychain._contacts.length+")\n");
                                dump("--- .>"+contactId+"\n")
                                if(groupname === "All Contacts") {
                                    dump("remove from keychain -> "+contactId+" ["+keychain._contacts.length+"]\n");
                                    delete keychain._contacts[contactId];
                                }
                                else {
                                    dump("--- .>"+groupname+"\n");
                                    keychain.removeContactFromGroup(contactId, groupname);
                                    IOxml.removeMemberFromGroup(contactId, groupname);
                                }
                            }                            
                            // this.cleanContactList();
                            keychain.showContactsForGroup(groupname);
                        };

                        dump("contacts: "+this._contacts.length+"\n");
                        dump("groups: "+this._groups.length+"\n");

                        this._aux = groupname;
                        kernel.delPublicKey(uid, onDone);
                        
                        // var ret = kernel.delPublicKey(uid);
                        // if(!ret) {
                        //  scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("keyRing.ondeleteProblem"), true);
                        // } else {
                        //  monitor.log(this._debug()._name, "IOxml.removeMemberFromGroup(uid, null);", this._debug()._enable);
                        //  this.removeContactFromGroup(uid, groupname);
                        //  // IOxml.removeMemberFromGroup(uid, null);
                        // }
        			} else {
        				monitor.log(this._debug()._name, "IOxml.removeMemberFromGroup(uid, groupname);", this._debug()._enable);
        				//IOxml.removeMemberFromGroup(uid, groupname);
        				this.removeContactFromGroup(uid, groupname);
        			}

                    this.cleanContactList();
                    // this.showContactsForGroup(groupname);
        		}
				dump("I am finished? \n");
        		return;
        	} else {
        		//do nothing... cancel
        		return;
        	}
        } else {
        	var nocontact = strbundle.getString("contact.notselected");
        	scrambleAppNS.dialogLoader.warningDialog(nocontact,true);
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
	
	
	_KEYServerGET: "http://pgp.mit.edu",//":11371",
	pk_file: null,
	
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
		var strbundle = document.getElementById(keychain._BUNDLE);
		this.clearListSearch();
		
		var value = document.getElementById("contactsearch").value;
		value = value.replace(/\s/g,'+');
		value = value+"&op=index";
		document.getElementById('contactBoxLogo').style.display = "none";
		document.getElementById('resultbox').style.display = "none";
        
		var url = this._KEYServerGET+"/pks/lookup?search="+value;
        // alert(url);
		var http = new XMLHttpRequest();
		http.open("GET", url, true); //true for asynchronous
		
		document.getElementById('addcontact_desc').textContent = "1:"+strbundle.getString("contactbox.searchcontact");
        // dump("yes......\n");
		http.onreadystatechange = function() {
			var strbundle = document.getElementById(keychain._BUNDLE);
			if(http.readyState == 4 && http.status == 200) {
				var result = http.responseText;
				// dump(result);
				var parser = result.split("<pre>");
				var flag = true;
				
				for (var i in parser) {			
					if(parser[i].indexOf("pub") > -1) {
						flag = true;
				
						var index1 = scrambleUtils.strTrim(parser[i], '').lastIndexOf("<a");
						var index2 = scrambleUtils.strTrim(parser[i], '').lastIndexOf("</a>");
						var pub = scrambleUtils.strTrim(parser[i], '').substring(index1,index2);
				
						// Parse the name + pk url
						index1 = scrambleUtils.strTrim(parser[i], '').indexOf("href=\"");
						index2 = scrambleUtils.strTrim(parser[i], '').indexOf("\">");			
						var url = scrambleUtils.strTrim(parser[i], '').substring(index1+6,index2);
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
	 *  @returns {String} key or null
	 */
	onKeySelect: function() {
		monitor.log(this._debug()._name, "onKeySelect", this._debug()._enable);
		var listResult = document.getElementById('list_result');

		if (listResult.selectedItems.length === 0) {
			return null;
		} 
		for(var k =0; k < listResult.selectedItems.length; k++) {
			var item = listResult.selectedItems[k];
			var url = item.firstChild.getAttribute("label");
			
			var http = new XMLHttpRequest();
            dump("KEYServer: "+this._KEYServerGET+"\n");
            dump("URL: "+url+"\n");
            url = url.replace("amp;","");
            dump("URL: "+url+"\n");
            dump("REQUEST: "+this._KEYServerGET+url+"\n");
            
			http.open("GET", this._KEYServerGET+url, true); //true for asynchronous

			http.onreadystatechange = function (oEvent) {  
			  if (http.readyState === 4) {
                  dump("result: "+http.responseText+"\n");
			    if (http.status === 200) {  				
					var pkresult_server = http.responseText;
					
					var pkresult = scrambleUtils.stripHTML(pkresult_server,null);
					var index1 = pkresult.indexOf(vars._PGPKey_start);
					if(index1 == -1) return;
					var pk = scrambleUtils.strTrim(pkresult.substring(index1,pkresult.length), '');
					var strbundle = document.getElementById(keychain._BUNDLE);					
					var resultLabel = strbundle.getString("result")+ " ";                    
					if(pk != null) {
                        var onDone = function(data) {
                                //process the result from the callback
                                // var strbundle = document.getElementById(keychain._BUNDLE);
                                // var resultLabel = strbundle.getString("result")+ " ";                                
                                dump("\n\n ----------> callback was called <-----------\n");
                                var openpgpkey = xmlMessages.processPublicKeyReply(data);
                                if (openpgpkey === null) {
                                    //  scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("publicKey.problem"), true);
                                    alert("Problem with a Key!");
                                } else {
        							keychain.addNewContact(openpgpkey);
                                    // document.getElementById("pkresult_label").value = resultLabel+" DONE!";
        						}
                                keychain.showSelectedGroups();
                        };
                        kernel.addNewKey(pk, onDone);
					} else {
						document.getElementById("pkresult_label").value = resultLabel + strbundle.getString("publicKey.notselected");
					}
					keychain.showSelectedGroups();
					
			    } else {  
                    dump("connection error\n");
					scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("connectionError"), true);
			    }  
			  }  
			};
			http.send(null);
	
		}
	},
	
	/**
	 *	Function that adds the new public key to the key ring
	 *  @public
	 */
	onPKFileSearch: function() {
		monitor.log(this._debug()._name, "onPKFileSearch", this._debug()._enable);
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, "Select the file" , nsIFilePicker.modeOpen);
		fp.appendFilters(nsIFilePicker.filterAll);
	
		if ( fp.show() == nsIFilePicker.returnOK ) {
	        var file = fp.file;
			if(file != null) {
				document.getElementById('addPKfiledesc').value = file.path;
				this.pk_file = file;
			}
	    }		
	},
	

	/**
	 *	Function that adds the new public key to the key ring
	 *  @public
	 */		 
	onAdd: function() {
		monitor.log(this._debug()._name, "onAddcontact", this._debug()._enable);
		var value = document.getElementById("mainpanel").selectedPanel;
        var strbundle = document.getElementById(keychain._BUNDLE);
		var openpgpkey;
		
		var onDone = function(data) {
                //process the result from the callback
                var openpgpkey = xmlMessages.processPublicKeyReply(data);
				if (!openpgpkey) {
					scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("publicKey.problem"), true);
				} else {
					keychain.addNewContact(openpgpkey);//, aeskey);
					scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("contact.addsuccess"), true);
				}
			keychain.showSelectedGroups();
        };
        
		if(value.id === "serverpanel") {
			this.onKeySelect();
		} else if (value.id === "filepanel") {
			 monitor.log(this._debug()._name, "filepanel " , this._debug()._enable);
		  	// add public key from file
			if(this.pk_file != null) {
				Components.utils.import("resource://gre/modules/NetUtil.jsm");  
				NetUtil.asyncFetch(this.pk_file, function(inputStream, status) {  
					if (!Components.isSuccessCode(status)) {  
						scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("publicKey.invalid"), true);
					  	return;  
					}  
					// The file data is contained within inputStream.  
					// You can read it into a string with  
					var pkkey = NetUtil.readInputStreamToString(inputStream, inputStream.available()); 
					dump("data: " + pkkey);
					var aeskey = document.getElementById("aeskey").value;
					
					dump("aeskey: " + aeskey);
                    // openpgpkey = kernel.addNewKey(pkkey);

                    kernel.addNewKey(pkkey, onDone);
					 
				});
			}
		} else { // contactpanel add
			var pktext = document.getElementById('addmemberpk').value;
			var error = strbundle.getString("publicKey.invalid");
			dump("----> "+vars._PGPKey_start+"\n");
            dump((pktext.indexOf(vars._PGPKey_start) >= 0) +"|"+ (pktext.length > 1) +"|"+ (pktext != error));
			dump("\n "+pktext+"\n");
			
			if( (pktext.indexOf(vars._PGPKey_start) >= 0) && (pktext.length > 1) && (pktext != error) ) {
				
				kernel.addNewKey(pktext, onDone);
                
                // 
                // if (!openpgpkey) {
                //  scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("publicKey.problem"), true);
                // } else {
                //  keychain.addNewContact(openpgpkey);
                //  document.getElementById('addmemberpk').value = strbundle.getString("contact.addsuccess");
                // }
			} else {
				scrambleAppNS.dialogLoader.warningDialog(error, true);
			}
		}
		
        // keychain.showSelectedGroups();
	},
	
	/**
	 *	Cancels the actions and closes the Add New contact Box
	 *  @public
	 */	
	onCancel: function() {
		descriptionBox.setEmpty();
		return;
	},
	
	refresh: function() {
		// display all groups
		// select the selected group
		// display contacts for the selected group
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
		
		/*if(email.indexOf(",") > 0) {
			var allmails = email.split(",");
			email = allmails[0] + " ...";
		}*/
				
		document.getElementById('descriptionMail').value = email;
		document.getElementById('descriptionFingerprint').value = finger;
		
		if(note=="") {
		    var strbundle = document.getElementById(keychain._BUNDLE);
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

var maindlg = {
	/**
	  * Function to execute the drang and drop event, on copy element to group
	  * @public
	  * @param event 
	  */
	onDragAndDrop: function(event) {
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
		
		var toGroupName = scrambleUtils.strTrim(target.object.view.getItemAtIndex(row).firstChild.childNodes[0].getAttribute("label"));
		monitor.messageDump("toGroupName: " + toGroupName, true);
		var grouplist = document.getElementById('list_groups');
		var rowsSelected = grouplist.view.selection.getRangeCount();
		var fromGroupName ;
		if(rowsSelected > 0) {
			var aux = 0;
			//show the available on the new box - The for is for multiple group choice
			for(var i=0; i < grouplist.view.rowCount; i++) {
				if(grouplist.view.selection.isSelected(i)) {
					aux++;
					var item = grouplist.view.getItemAtIndex(i);
					fromGroupName = item.firstChild.childNodes[0].getAttribute("label");
				} 
				if(aux >= rowsSelected) {
					break;
				}
			}
		}
			
		monitor.messageDump("fromGroupName: " + fromGroupName, true);
	
	
		/*
		 * var f = 0;
		for (var gr in groups){
			if (f === fromGroupNumber){
				fromGroupName = gr;
			}
			f++;
		}
		*/
		for (var i=0; i<treeitems.length; i++) {
			//add to group
			var contactId = treeitems[i].firstChild.childNodes[1].getAttribute("label");
			
	        keychain.moveContact(contactId, fromGroupName, toGroupName);
			
		}
	},
	
	
	/**
	  * Function to execute acceptance on doubleclick and on onDone button. 
	  * It will save the content if there is any change or/and return the array list as a window arguments
	  * @param event 
	  */
	onAccept: function() {
	
		monitor.messageDump("KeyChainDlg: onAccept: ["+window.arguments+"]", true);
		
		// if(window.arguments !== undefined) {
			if(window.arguments[0].control) {
				var listContacts = document.getElementById("list_contacts");
				var rowsContacts = listContacts.view.selection.getRangeCount();
				
				var listGroups = document.getElementById("list_groups");
				var rowsGroups = listGroups.view.selection.getRangeCount();
				// dump("rowG: "+rowsGroups+" | rowC: "+rowsContacts+"\n");
				
				if( (rowsGroups === 0) && (rowsContacts === 0) ) {
					window.arguments[0].control = false;
				} else if( (rowsGroups > 0) && (rowsContacts === 0) ) {
				    //get contacts from group(s)
				    // pimp	    
        		    var groups = keychain.getSelectedGroups();
				    var recipients = keychain.getSelectedGroupContacts(groups);                    
                    keychain.showSelectedGroups(true);
					
					window.arguments[0].selected_items = recipients;
					// window.arguments[0].groups = groups;
					if (recipients.length < 2)
						window.arguments[0].groups = [keychain._contacts[recipients].name];
					else if(window.arguments[0].editable == true)
						window.arguments[0].groups = ["Custom"];
					// dump("closing....\n");

				} else {
					var selectedvals = keychain.contactSelected(true);
					window.arguments[0].selected_items = selectedvals;
					
					if (selectedvals.length < 2)
						window.arguments[0].groups = [keychain._contacts[selectedvals].name];
					else if(window.arguments[0].editable == true)
						window.arguments[0].groups = ["Custom"];
				}
			} 
		// } 
		monitor.messageDump("about to save address book", true);
		keychain.saveAddressBook();
		// dump("closing2....\n");
		window.close();
	},
	
	/**
	  * @public
	  */
	onCancel: function() {
	    monitor.messageDump("KeyChainDlg: onCancel", true);
		window.close();
	}

};