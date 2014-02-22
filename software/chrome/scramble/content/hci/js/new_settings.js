/**
 * @fileOverview Settings Dialog - Contains a misc of functions related to the settings dialog 
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

/**
 * @class Class that contains a misc of functions related to the settings dialog 
 */
var sett = {
	
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
		document.getElementById("tiny_box").style.display = "none";
        document.getElementById("pwd-textbox").value = "";
		document.getElementById('scrambleSettings').showPane(document.getElementById('generalPanel'));
		
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
	onSetPwd: function() {
      	var pwd = document.getElementById("pwd-textbox").value;
		if(pwd.length > 1) {
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
	 *	Function to set the server URL
	 *  @public
	 */
	onSetServer: function() {
        monitor.log(this._debug()._name, "onSetServer", this._debug()._enable);
		//update server preferences
		var tinyURL = document.getElementById("tiny-urlserver").value;
		if(tinyURL.length > 5) {
			kernel.setTinyServer(tinyURL);
		}
	},
	
	/**
	 *	Function to enable view of server path options
	 *  @public
	 */
	showServerOption: function() {
		var dis = document.getElementById("tiny_box").style.display;
		// get current server url 
		var value = kernel.getTinyServer();
		document.getElementById("tiny-urlserver").value = value;
		if( dis == "block") {
			document.getElementById("tiny_box").style.display = "none";
			document.getElementById("tiny_but").label = "Change Server";
		} else {
			document.getElementById("tiny_box").style.display = "block";
			document.getElementById("tiny_but").label = "Use Default";
		}
	},
	
	/**
	 *	Function to upload master public key to the server
	 *  @public
	 */
	onUploadToServer: function() {
		monitor.log(this._debug()._name, "onUploadToServer", this._debug()._enable);
		var args = kernel.getMasterKey(window.arguments[0].javaobj); // get the public key
		if(args != null) {
			args = args.replace(/\+/g, "%2B");
			args = args.replace(/ /g, "+");
			if(detectOS() == WIN) {
				args = args.replace(/\r\n/g, "%0D%0A");
			} else {
				args = args.replace(/\n/g, "%0D%0A");
			}
			var result = myAjax.postinServer(KEYServerPost, "keytext="+args.trim());

			var strbundle = document.getElementById(BUNDLE);
			if(result != FAIL) {
				monitor.messageAlert(strbundle.getString("scramble.keyupload.succ"), true);
			} else {
				monitor.messageAlert(strbundle.getString("scramble.keyupload.fail"), true);
			}
		}
	},
	
	/**
	 *	Function to export master key pair to a backup location
	 *  @public
	 */
	onExportKeys: function() { 
        monitor.log(this._debug()._name, "onExportKeys", this._debug()._enable);
		var strbundle = document.getElementById(BUNDLE);
		
		var msg = strbundle.getString("scramble.importWarn")+" "+strbundle.getString("scramble.keys.exportWarn");
		var result = dialogLoader.warningDialog(msg);
		if(result) {
			dump("oh yeah... lets import old keys...\n");
			//Get the backip location
			var path = onSelectDir(strbundle.getString("scramble.group.backup"));
			
			if(path != FAIL) {
				//we have a new path to save... 
				var prefs = getPreferences();
				//add a timestamp to the backup name
				var date = new Date();
				var timestamp = date.getTime();
				//Get+Copy Public Key Ring
				var pk_srcpath = prefs.getCharPref(PubRingPath);
				var new_pkname = EXTPUBRINGFILE+"_"+timestamp + ".bak";				
				var result = copyFile(pk_srcpath, path, new_pkname);
				
				if(!result) {
					monitor.messageAlert(strbundle.getString("scramble.group.backupFail")
						+" "+strbundle.getString("scramble.keys.pkProblem"), true);
				} else {
					//Get+Copy Secret Key Ring (if pubkey ring fails don't even try the secret ring...)
					var sk_srcpath = prefs.getCharPref(SecRingPath);
					var new_skname = EXTSECRINGFILE+"_"+timestamp + ".bak";
					result = copyFile(sk_srcpath, path, new_skname);
					if(!result) {
						monitor.messageAlert(strbundle.getString("scramble.group.backupFail")
							+" "+strbundle.getString("scramble.keys.skProblem"), true);
					}
					monitor.messageAlert( strbundle.getString("scramble.group.backupSucc"), true);
				}
			} else {
				monitor.messageAlert( strbundle.getString("scramble.group.backupFail"), true);
			}
		}
	},
	/**
	 *	Function to import master key pair from a backup location
	 *  @public
	 */
	onImportKeys: function() {
		monitor.log(this._debug()._name, "onImportKeys", this._debug()._enable);
		var strbundle = document.getElementById(BUNDLE);
		
		var msg = strbundle.getString("scramble.importWarn")+" "+strbundle.getString("scramble.keys.importWarn");
		var result = dialogLoader.warningDialog(msg);
		if(result) {
			
			// First select the Public Key ... only after the associated secret key
			var pkpath = onSelectFile(strbundle.getString("scramble.keys.publickey"));
			
			if(pkpath != FAIL) {
				//we have a new path to save...  
				var dirSer_comp = Components.classes["@mozilla.org/file/directory_service;1"];
	            var dirService = dirSer_comp.getService(Components.interfaces.nsIProperties); 
	            // returns an nsIFile object from the current profile directory
	            var file = dirService.get("ProfD", Components.interfaces.nsIFile); 	            
				var extension_optdir = file.path+"/"+EXTDIR;
				
				//get the secret key ring path...
				var skpath = onSelectFile(strbundle.getString("scramble.keys.secretkey"));
				if(skpath != FAIL) {
					var result = copyFile(pkpath, extension_optdir, EXTPUBRINGFILE);
					if(!result) {
						monitor.messageAlert(strbundle.getString("scramble.group.backupFail")
							+" "+strbundle.getString("scramble.keys.skProblem"), true);
					} else {
						result = copyFile(skpath, extension_optdir, EXTSECRINGFILE);
						if(!result) {
							monitor.messageAlert(strbundle.getString("scramble.group.backupFail")
								+" "+strbundle.getString("scramble.keys.skProblem"), true);
						} else {
							monitor.messageAlert( strbundle.getString("scramble.group.backupSucc"), true);	
						}
					}
				} else {
					monitor.messageAlert( strbundle.getString("scramble.group.backupFail"), true);
				}
			} else {
				monitor.messageAlert( strbundle.getString("scramble.group.backupFail"), true);
			}
		}
	},

	/**
	 *	Function to generate a new master key pair
	 *  @public
	 */
	onGenerateNewKey: function() {
		monitor.log(this._debug()._name, "onGenerateNewKey", this._debug()._enable);
		//display warning dialog before generation: Warn-> Previous keys will be erased!
		var strbundle = document.getElementById(BUNDLE);
		var msg = strbundle.getString("scramble.createWarn");
		var result = dialogLoader.warningDialog(msg);
		if(result) {
	        var params = {
	            userid: '',
	            pwd: '',
	            bitsize: 0, 
	            result: false
	        };
	        dialogLoader.keyPairGenDialog(params);
	        if(params.result) {
				monitor.messageAlert("Generating Key ring, press OK and wait...", true);
	            var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);  
				const TYPE_REPEATING_PRECISE = Components.interfaces.nsITimer.TYPE_REPEATING_PRECISE;

	            timer.init(function() {
					var prefs = getPreferences();
					var pubpath = prefs.getCharPref(PubRingPath);
					dump("pubpath: "+pubpath+"\n");
					var secpath = prefs.getCharPref(SecRingPath);
					dump("secpath: "+pubpath+"\n");
					var ret = cryptobridge.genKeyPair(params.userid, params.pwd, params.bitsize, pubpath, secpath, 
						window.arguments[0].javaobj);
					
					var msg = (!ret ? "Key Pair generation FAILED!" : "Key ring generation COMPLETE!");
				 	monitor.messageAlert(msg, true);
					
	          	}, 500, TYPE_REPEATING_PRECISE);	
	        }
		}
	},

	/**
	 *	Function to export group definition to a backup location
	 *  @public
	 */
	onExportGroups: function() {
		monitor.log(this._debug()._name, "onExportGroups", this._debug()._enable);
		//Retrieve XML File from one location
		//onSe -> Save XML file on that DIR...
		
		var strbundle = document.getElementById(BUNDLE);
		var path = onSelectDir(strbundle.getString("scramble.group.backup"));
	
		if(path != FAIL) {
			//we have a new path to save... 
			var prefs = getPreferences();
			var keyring_srcpath = prefs.getCharPref(KEYChainPath);
			//add a timestamp to the backup name
			var date = new Date();
			var timestamp = date.getTime();
			var new_name = EXTDATAFILE+"_"+timestamp + ".bak";
			var result = copyFile(keyring_srcpath, path, new_name);
			if(result) {
				monitor.messageAlert( strbundle.getString("scramble.group.backupSucc"), true);
			} else {
				monitor.messageAlert( strbundle.getString("scramble.group.backupFail"), true);
			}
		} else {
			monitor.messageAlert( strbundle.getString("scramble.group.backupFail"), true);
		}
	},

	/**
	 *	Function to import group definition from a backup location
	 *  @public
	 */
	onImportGroups: function() {
		monitor.log(this._debug()._name, "onImportGroups", this._debug()._enable);
		var strbundle = document.getElementById(BUNDLE);
		
		var msg = strbundle.getString("scramble.importWarn")+" "+strbundle.getString("scramble.group.importWarn");
		var result = dialogLoader.warningDialog(msg);
		if(result) {
			var path = onSelectFile(strbundle.getString("scramble.group.backup"));
			
			if(path != FAIL) {
				//we have a new path to save...  
				var dirSer_comp = Components.classes["@mozilla.org/file/directory_service;1"];
	            var dirService = dirSer_comp.getService(Components.interfaces.nsIProperties); 
	            // returns an nsIFile object from the current profile directory
	            var file = dirService.get("ProfD", Components.interfaces.nsIFile); 	            
				var extension_optdir = file.path+"/"+EXTDIR;
				// check if the file is a valid Scramble File
				if(!IOxml.importXML(path)) {
					monitor.messageAlert( strbundle.getString("scramble.group.invalidFile"), true);
					return;
				}
				var result = copyFile(path, extension_optdir, EXTDATAFILE);
				if(result) {
					monitor.messageAlert( strbundle.getString("scramble.group.backupSucc"), true);
				} else {
					monitor.messageAlert( strbundle.getString("scramble.group.backupFail"), true);
				}
			} else {
				monitor.messageAlert( strbundle.getString("scramble.group.backupFail"), true);
			}
		}
	},

	/**
	 *	Function to update the Java VM urestricted policies
	 *  @public
	 */	
	updateJCE: function() {
		monitor.log(this._debug()._name, "onOK", this._debug()._enable);
		var strbundle = document.getElementById(BUNDLE);
		var msg = strbundle.getString("scramble.java.jce");
		var result = dialogLoader.warningDialog(msg);
		if(result) {
			kernel.runJCEUpdateScript();
		}
	},
	
	
	initPlugin: function() {
		monitor.log(this._debug()._name, "initPlugin", this._debug()._enable);
		var strbundle = document.getElementById(BUNDLE);
		var msg = strbundle.getString("scramble.plugin.re-init");
		var result = dialogLoader.warningDialog(msg);
		if(result) {
			kernel.reinit(window.arguments[0].javaobj);
		}
	},
	
	/**
	 *	Function activated on Ok button, saves the settings _changes 
	 *  @public
	 */	
	onOK: function() {
        monitor.log(this._debug()._name, "onOK", this._debug()._enable);
		var tiny = document.getElementById("tiny_box").style.display;
		if(tiny == "block") {
			// change server url...
			this.onSetServer();
		}
		this.onSetLink();
		window.close();
	}   
};