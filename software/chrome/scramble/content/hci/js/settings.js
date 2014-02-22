/**
 * @fileOverview Settings Dialog - Contains a misc of functions related to the settings dialog 
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

/**
 * @class Class that contains a misc of functions related to the settings dialog 
 */
var settingsdlg = {
	
    _changes: false,
    _gnuPath: "",
    _myPwd: "",
    
    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "Settings",
          _enable: true
        };
        return params;
    },
    
	/**
	 *	Function that loads the default information when the window dialog is loaded
	 *  @function
	 *  @param win this window dialog object
	 */
	onLoad: function(win) {
        monitor.log(this._debug()._name, "onLoad", this._debug()._enable);
        sizeToContent();
		
		if( window.arguments === undefined ) {
	   	    return;
	    }
	    

		document.getElementById('pwd-showbox').checked = false;
		
		var tinyLink = window.arguments[0].isTinyLinkSet;
		document.getElementById('tiny-enablebox').checked = tinyLink;
		document.getElementById("keys_box").style.display = "none";
		document.getElementById("tiny_box").style.display = "none";
        document.getElementById("pwd-textbox").value = "";
		
		this.onLoadKeys();
		this._changes = false;
	},
	
	/**
	 *	Function to load the existent secret keys into the tree list
	 *  @public
	 */
	onLoadKeys: function() {
        monitor.log(this._debug()._name, "loadKeys", this._debug()._enable);
        
		var listContacts = document.getElementById('list_keys_tree');
		var result = window.arguments[0].listSKeys;
	    
		for(var i=0; i < result.keylist.length; i++) {
			var  mainitem  = document.createElement('treeitem');
			var  c_item   = document.createElement('treerow');
	
			var  child = document.createElement('treecell');
			child.setAttribute('draggable','true');			
			var name = result.keylist[i].keyName.split("(");
	
			var tag = (name.length < 2 ? "..." :name[1].substring(0, name[1].length-1) );
            
			child.setAttribute('label', name[0].trim());
			child.setAttribute('tagName', tag);
			c_item.appendChild(child);
			
			var child0 = document.createElement('treecell');
			child0.setAttribute('label', result.keylist[i].keyMail); //mail
			c_item.appendChild(child0);
		
			var child1 = document.createElement('treecell');
			child1.setAttribute('label', result.keylist[i].keyId); //UID
			child1.setAttribute('hidden', 'true');
			c_item.appendChild(child1);
		
			mainitem.appendChild(c_item);
			listContacts.appendChild(mainitem);
		}
	},
	

	/**
	 *	Sets the change variable to true, meaning, some settings were changed
	 *  @public
	 */
	setChange: function() {
		this._changes = true;
	},
	
	
	/**
	 *	Sets the browser preference that the tinyURL is ON/OFF 
	 *  @public
	 */	
	onSetLink: function() {
		var enableLink = document.getElementById("tiny-enablebox").checked;
        monitor.log(this._debug()._name, "onSetLink ["+enableLink+"]", this._debug()._enable);
		var prefs = getPreferences();
		prefs.setBoolPref(TinyLink, enableLink);
	},
	
	/**
	 *	Sets the password into the preferences
	 *  @public
	 */	
	onSetPwd: function(pwd) {
      	
		if(pwd.length > 1) {
			// var prefs = getPreferences();
			// prefs.setCharPref(KeyPref,pwd);
			kernel.saveSKey(pwd);
		} 
	},
	
	/**
	 *	Erase the password into the preferences
	 *  @public
	 */	
	onErasePwd: function() {
      	kernel.eraseSKey();	
	},
	
	/**
	 *	Function called when the password textbox status changes 
	 *  @public
	 */
	onSetPwdBox: function() {
	  monitor.log(this._debug()._name, "onSetPwdBox", this._debug()._enable);
      this._myPwd = document.getElementById("pwd-textbox").value;
      this._changes = true;  
	},
	
	/**
	 *	Function called when the checkbox is (un)checked to show the password in clear
	 *  @public
	 */
	onShowPwd: function() {
		var checked = document.getElementById("pwd-showbox").checked;
		if(checked) {
			document.getElementById("pwd-textbox").type = "";
		} else {
			document.getElementById("pwd-textbox").type = "password";
		}
	},
	
	/**
	 *	Function to set the GnuPGP path
	 *  @public
	 */	
	onSetGPGPath: function(path) {
        monitor.log(this._debug()._name, "onSetGPGPath", this._debug()._enable);
		//document.getElementById("gpg_path_box").value;

        var strbundle = document.getElementById(BUNDLE);
		var invalid = strbundle.getString("gnupgPath.invalid");

		if( (path.length > 1) || (path == invalid) ) {
			path = path + ( (detectOS != WIN) ? "/gpg" : "/gpg.exe" );
			var prefs = getPreferences();
			prefs.setCharPref(GnuPath, path);
			monitor.messageAlert(strbundle.getString("scramble.restart"), true);
		}  
	},
	
	
	/**
	 *	Function to show the path selector result into the textbox dialog
	 *  @public
	 */	
	onSetGPGPathBox: function() {

        var strbundle = document.getElementById(BUNDLE);

		var path = onSelectDir(strbundle.getString("gnupgPath.select"));
	
		if(path != FAIL) {
			this._changes = true;
			document.getElementById("gpg_path_box").value = path;
			this._gnuPath = path;
			this._changes = true;
		} else {
			document.getElementById("gpg_path_box").value = strbundle.getString("gnupgPath.invalid");
		}
	},
	
	/**
	 *	Function to enable the tree list of secret keys view
	 *  @public
	 */
	showKeys: function() {
		var value = document.getElementById("keys_box").style.display;
		var strbundle = document.getElementById(BUNDLE);
        
		if( value == "block") {
			document.getElementById("keys_box").style.display = "none";
			document.getElementById("keys_but").label = strbundle.getString("settings.changeKey");//"Change Key";
		} else {
			document.getElementById("keys_box").style.display = "block";
			document.getElementById("keys_but").label = strbundle.getString("settings.defaultKey");//"Use Default Key";
		}
	},
	
	/**
	 *	Function to save the selected secret key as the default key
	 *  @public
	 */
	onSetKey: function() {
        monitor.log(this._debug()._name, "onSetKey", this._debug()._enable);
		var listKeys = document.getElementById("list_keys");
		var rowsSelected = listKeys.view.selection.getRangeCount();

		if(rowsSelected > 0) {
			//show the available on the new box - The for is for multiple group choice
			for(var i=0; i < listKeys.view.rowCount; i++) {
				if(listKeys.view.selection.isSelected(i)) {
					var item = listKeys.view.getItemAtIndex(i);
					var keyId = item.firstChild.childNodes[2].getAttribute("label");
                    return keyId;
				} 
			}
		} else {
		    return FAIL;
		}
	},
	
	/**
	 *	Function to set the server URL
	 *  @public
	 */
	onSetServer: function() {
        monitor.log(this._debug()._name, "onSetServer", this._debug()._enable);
		//update server preferences
		var tinyURL = document.getElementById("tiny-urlserver").value;
		kernel.setTinyServer(tinyURL);
	},
	
	/**
	 *	Function to enable view of server path options
	 *  @public
	 */
	showServerOption: function() {
		var value = document.getElementById("tiny_box").style.display;
		if( value == "block") {
			document.getElementById("tiny_box").style.display = "none";
			document.getElementById("tiny_but").label = "Change Server";
		} else {
			document.getElementById("tiny_box").style.display = "block";
			document.getElementById("tiny_but").label = "Use Default";
		}
	},
	
	/**
	 *	Function activated on Ok button, saves the settings _changes 
	 *  @public
	 */	
	onOK: function() {
        monitor.log(this._debug()._name, "onOK", this._debug()._enable);
		if(this._changes) {
			//do something...
			this.onSetPwd(this._myPwd);
            // this.onSetLink();
			this.onSetGPGPath(this._gnuPath);
			
			var showKey = document.getElementById("keys_box").style.display;
			if(showKey == "block") {
			     window.arguments[0].defaultSKey = this.onSetKey();
		    }
			var showServer = document.getElementById("tiny_box").style.display;
			if(showServer == "block") {
			    this.onSetServer();
		    }
		} 
		window.close();
	},
	
	/**
	 *	Function activated on Ok button, saves the settings _changes 
	 *  @public
	 */	
	onCancel: function() {
        monitor.log(this._debug()._name, "onCancel", this._debug()._enable);
        var tinylink = window.arguments[0].isTinyLinkSet;
        var set_tiny = document.getElementById("tiny-enablebox").checked;
        if(tinylink != set_tiny) {
            var prefs = getPreferences();
            prefs.setBoolPref(TinyLink, tinylink);
        }
        window.close();
    }
    
};