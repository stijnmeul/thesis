var view = {
    deleteDummy: function () {
        var friendListBox = document.getElementById("friendListBox");
        if (document.getElementById("dummy"))
            friendListBox.removeItemAt(0);
        this.viewListOfFriends();
    },

    uploadUsersJSON: function () 
    {
        const nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        fp.init(window, "Load FIle JSON", nsIFilePicker.modeOpen);
        fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
        var rv = fp.show();
        if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
            var file = fp.file;
            // Get the path as string. Note that you usually won't 
            // need to work with the string paths.
            var path = fp.file.path;
            // work with returned nsILocalFile...
            var data = "";
            //FILE IS THE FILE
            var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
            var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);
            fstream.init(file, -1, 0, 0);
            cstream.init(fstream, "UTF-8", 0, 0);         
            var str = {};
            var read = 0;
            do 
            {
                read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
                data += str.value;
            } while (read != 0);
            cstream.close(); // this closes fstream
            preference.saveUsersJSONFile(data);
            this.viewListOfFriends();
        }
    },

    resetUserPreference: function () {
        preference.deleteUserPreference(); //delete
        var friendListBox = document.getElementById("friendListBox");
        var count = friendListBox.itemCount;
        for (var i = count; i > 0 ; i--)
            friendListBox.removeItemAt(0);
        if(friendListBox.itemCount == 0)
        {
            //create a new list item
            var friendItem = document.createElement("listitem");
            friendItem.setAttribute("id","dummy");
            //create cell for username in list
            var usernameCell = document.createElement("listcell");
            usernameCell.align = "start";
            usernameCell.orient = "vertical";
            var usernameLabel = document.createElement("label");
            usernameLabel.setAttribute("value", "");
            usernameCell.appendChild(usernameLabel);
            friendItem.appendChild(usernameCell);
            //
            //create cell for id in list
            var idCell = document.createElement("listcell");
            idCell.align = "start";
            idCell.orient = "vertical";
            var idLabel = document.createElement("label");
            idLabel.setAttribute("value", "");
            idCell.appendChild(idLabel);
            friendItem.appendChild(idCell);

            friendListBox.appendChild(friendItem);
        }
    },

    //view the list of Fa friends
    viewListOfFriends: function () 
    {
        var listaUser = preference.loadUsers();
        if(listaUser != null)
        {
            var list = JSON.parse(listaUser.toString());
            //var n = parseInt(list.friendlist.count);
            var n = parseInt(list.friendlist.friend.length);
            names = new Array();
            ids = new Array();
            pk = new Array();
            for (var j = 0; j < n; j++) 
            {
                ids[j] = list.friendlist.friend[j].username;
                names[j] = list.friendlist.friend[j].name;
                pk[j] = list.friendlist.friend[j].publicKey;
            }
            var friendListBox = document.getElementById("friendListBox");
            var count = friendListBox.itemCount;          
            for (var i = count; i > 0 ; i--)
                friendListBox.removeItemAt(0);

            for (var j = 0; j < n; j++) 
            {
                var listitems = friendListBox.getElementsByTagName("listitem");
                //create a new list item
                var friendItem = document.createElement("listitem");
                //create cell for username in list
                var usernameCell = document.createElement("listcell");
                usernameCell.align = "start";
                usernameCell.orient = "vertical";
                var usernameLabel = document.createElement("label");
                usernameLabel.setAttribute("value", names[j]);
                usernameCell.appendChild(usernameLabel);
                friendItem.appendChild(usernameCell);               
                //create cell for id in list
                var idCell = document.createElement("listcell");
                idCell.align = "start";
                idCell.orient = "vertical";
                var idLabel = document.createElement("label");
                idLabel.setAttribute("value", pk[j]);
                idCell.appendChild(idLabel);
                friendItem.appendChild(idCell);
                //append new friend item to the list box       
                friendListBox.appendChild(friendItem);
            }//for (var j = 0; j < n; j++) 
        }//if(listaUser != null)     
        else
        {
            //dummy
            var friendListBox = document.getElementById("friendListBox");
            //alert("riga 146 viewListOfFriends: " + friendListBox.itemCount);
            var count = friendListBox.itemCount;
            for (var i = count; i > 0 ; i--)
                friendListBox.removeItemAt(0);
            //create a new list item
            var friendItem = document.createElement("listitem");
            friendItem.setAttribute("id","dummy");
            //create cell for username in list
            var usernameCell = document.createElement("listcell");
            usernameCell.align = "start";
            usernameCell.orient = "vertical";
            var usernameLabel = document.createElement("label");
            usernameLabel.setAttribute("value", "");
            usernameCell.appendChild(usernameLabel);
            friendItem.appendChild(usernameCell);
            //create cell for id in list
            var idCell = document.createElement("listcell");
            idCell.align = "start";
            idCell.orient = "vertical";
            var idLabel = document.createElement("label");
            idLabel.setAttribute("value", "");
            idCell.appendChild(idLabel);
            friendItem.appendChild(idCell);
            friendListBox.appendChild(friendItem);
        }
    },

    uploadLocalUsersJSON: function()
    {
        const nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        fp.init(window, "Load Local User Info", nsIFilePicker.modeOpen);
        fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
        var rv = fp.show();
        if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
            var file = fp.file;
            // Get the path as string. Note that you usually won't 
            // need to work with the string paths.
            var path = fp.file.path;
            // work with returned nsILocalFile...
            var data = "";
            //FILE IS THE FILE
            var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
            var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);
            fstream.init(file, -1, 0, 0);
            cstream.init(fstream, "UTF-8", 0, 0);         
            var str = {};
            var read = 0;
            do 
            {
                read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
                data += str.value;
            } while (read != 0);
            cstream.close(); // this closes fstream
            preference.saveLocalInfoUser(data);
            this.viewLocalUser();
        }
    },
    //view the list of Fa friends
    viewLocalUser: function () 
    {
        var info = preference.loadInfoLocalUser();
        var local = JSON.parse(info.toString());

        if(local != null)
        {
            var myKey = local.localuser.publicKey;
            var me=local.localuser.username;
            var name=local.localuser.name;
            var n = 1;

            var friendListBox = document.getElementById("friendListBox");
            var count = friendListBox.itemCount;          
            for (var i = count; i > 0 ; i--)
                friendListBox.removeItemAt(0);

            for (var j = 0; j < n; j++) 
            {
                var listitems = friendListBox.getElementsByTagName("listitem");
                //create a new list item
                var friendItem = document.createElement("listitem");
                //create cell for username in list
                var usernameCell = document.createElement("listcell");
                usernameCell.align = "start";
                usernameCell.orient = "vertical";
                var usernameLabel = document.createElement("label");
                usernameLabel.setAttribute("value", name);
                usernameCell.appendChild(usernameLabel);
                friendItem.appendChild(usernameCell);               
                //create cell for id in list
                var idCell = document.createElement("listcell");
                idCell.align = "start";
                idCell.orient = "vertical";
                var idLabel = document.createElement("label");
                idLabel.setAttribute("value", myKey);
                idCell.appendChild(idLabel);
                friendItem.appendChild(idCell);
                //append new friend item to the list box       
                friendListBox.appendChild(friendItem);
            }//for (var j = 0; j < n; j++) 
        }//if(listaUser != null)     
        else
        {
            //dummy
            var friendListBox = document.getElementById("friendListBox");
            //alert("riga 146 viewListOfFriends: " + friendListBox.itemCount);
            var count = friendListBox.itemCount;
            for (var i = count; i > 0 ; i--)
                friendListBox.removeItemAt(0);
            //create a new list item
            var friendItem = document.createElement("listitem");
            friendItem.setAttribute("id","dummy");
            //create cell for username in list
            var usernameCell = document.createElement("listcell");
            usernameCell.align = "start";
            usernameCell.orient = "vertical";
            var usernameLabel = document.createElement("label");
            usernameLabel.setAttribute("value", "");
            usernameCell.appendChild(usernameLabel);
            friendItem.appendChild(usernameCell);
            //create cell for id in list
            var idCell = document.createElement("listcell");
            idCell.align = "start";
            idCell.orient = "vertical";
            var idLabel = document.createElement("label");
            idLabel.setAttribute("value", "");
            idCell.appendChild(idLabel);
            friendItem.appendChild(idCell);
            friendListBox.appendChild(friendItem);
        }
    },
};

Components.utils.import("resource://fitm/preference.js");
Components.utils.import("resource://fitm/prompts.js");
