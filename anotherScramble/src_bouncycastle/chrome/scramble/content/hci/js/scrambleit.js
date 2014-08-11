/**
 * @fileOverview Contains the functions that control the newgroup dialog
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


// ***************************************************************************
// **                                                                       **
// **                 -  Encryption Dialog object -                    **
// **                                                                       **
// ***************************************************************************
Components.utils.import("resource://scramble/utils/utils.js");

/**
 * Class that contains the functions that control the encryption dialog
 * @class Class that contains the functions that control the encryption dialog
 */
var scrambleitdlg = {


    /** stores the groups and the id of the contacts in each group, in the form groups["groupname"] = [memberid1, memberid2, ...];*/
    _groups: "",
    /** stores all the contacts of the user, as an array of objects Contact */
    _contacts: [],

    /**
     *  Function that loads the default information when the window dialog is loaded
     *  @function
     *  @param win this window dialog object
     */
    onLoad: function(win) {
        
        if(window.arguments === undefined) {
            return;
        }
        sizeToContent();
        var groups = this.loadGroups();
        this.updateGroupLists(groups);
    },


    /**
     *  Function called when the _Ok_ button is pressed.
     *  @function
     */ 
    onAccept: function() {
        if(window.arguments != undefined) {
            /* the password */
            var txt = document.getElementById('scrambletxt').value;
            
            if(txt.trim().length > 0) {
                window.arguments[0].scrambletext = txt.trim();
                window.arguments[0].result = true;
                
                var list = document.getElementById('AudienceMenuList');
                var groupname = list.getItemAtIndex(list.selectedIndex).label;
                this.setLastUsed(groupname);

                if ( (scrambleitdlg._groups != undefined) && (scrambleitdlg._groups == groupname) )
                    window.arguments[0].selected_items = scrambleitdlg._contacts;
                // else if (scrambleitdlg._groups == "Custom") {
                    // window.arguments[0].selected_items = scrambleitdlg._contacts;
                else    
                    window.arguments[0].selected_items = scrambleitdlg.loadContactsPerGroup(groupname);
                
            }

            dump(window.arguments[0].result + "["+window.arguments[0].scrambletext+"]\n");
        }
        window.close();
    },

    selectDefault: function() {
        // get the default (last selected option) from preferences
        var list = document.getElementById('AudienceMenuList');
        var prefs = scrambleUtils.getPreferences();
        return prefs.getCharPref("defaultaudience");
    },


    setLastUsed: function(value) {
        var prefs = scrambleUtils.getPreferences();
        prefs.setCharPref("defaultaudience", value);      
    },

    updateGroupLists: function(groups) {
        var list = document.getElementById('AudienceMenuList');
        var all = document.getElementById('menuall');
        var deft = this.selectDefault();
        var index = list.getIndexOfItem(all);        
        if (groups.length > 0) {
            var i = 1;
            for (var i=0; i < groups.length; i++) {
                if(groups[i] == all.label) continue;
                else 
                    list.insertItemAt(index+i+1, groups[i]);
            }
            dump(all.label +"|"+deft+"\n");
            if(all.label != deft) {
                var bb =list.getIndexOfItem(list.getElementsByAttribute("label",deft)[0]);
                dump(" BB ---> "+bb+"\n")
                if (bb == -1)
                    list.selectedIndex = 0;
                else
                    list.selectedIndex = bb;
            }
            else
                list.selectedIndex = 0;

        }         
    },

    //  [0,2,3,4] [0,3,4,5] 
    regroupMenu: function(options) {
        var list = document.getElementById('AudienceMenuList');
        var add = document.getElementById('menuadd');
        var index = list.getIndexOfItem(add);
        if (options.length > 0) {
            var i = 1;
            for (var i=0; i < options.length; i++) {
                if(options[i] == add.label) continue;
                else {
                    list.insertItemAt(index+i-1, options[i]);
                }
            }
            list.selectedIndex = index-1;
        } 
    },

    loadGroups: function() {
        // Get the available user-defined groups from xml file (keychain.xml)
        var groups = keychain.loadAddressBook();
        var options = [];
        for (var groupName in keychain._groups) {
            options.push(groupName);
        }        
        return options;

    },

    loadContactsPerGroup: function(groups) {
        // get all the selected contacts...\
        // if it is customized (subset of users, no groups, warn as a custom selection... maybe create a custom group)
        var contactsSelected = [];
        var contacts = keychain.getContactsForGroup(groups);    
        if (contacts == undefined) contactsSelected = scrambleitdlg._contacts;
        for(var j = 0; j < contacts.length; j++ ) {
            if(scrambleUtils.binarySearch(contactsSelected, contacts[j].id) == -1 ) {// does not exist ADD
                contactsSelected.push(contacts[j].id);
            }
        }
        return contactsSelected;
    },

    loadKeyManager: function() {
        // Load the key manager dialog for configuration options
        // Key management -> groups management
            var params = {
                    selected_items: [],
                    groups: [],
                    editable: true,
                    control: true
            };
            dump("Loading the dialog\n");
            var dlg = window.openDialog("chrome://scramble/content/hci/xul/keychain.xul", "", "chrome, modal, centerscreen", params);
            dlg.focus();
            scrambleitdlg._contacts = params.selected_items;
            scrambleitdlg._groups = params.groups;
            scrambleitdlg.regroupMenu(params.groups);
    },



};