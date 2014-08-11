/**
 * @fileOverview Settings Dialog - Contains a misc of functions related to the settings dialog 
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @author <a href="mailto:iulia.ion@inf.ethz.ch">Iulia Ion</a>
 * @version 1.0
 */

dump("loading settings dialog...\n");
// import the utils modules
Components.utils.import("resource://scramble/utils/utils.js");
Components.utils.import("resource://scramble/utils/monitor.js");
// import the core modules
Components.utils.import("resource://scramble/core/coins.js");
Components.utils.import("resource://scramble/core/kernel.js");
Components.utils.import("resource://scramble/lib/xmlMessages.js");

const Cc = Components.classes;
const Ci = Components.interfaces;
/**
 * @class Class that contains a misc of functions related to the settings dialog 
 */
var sett = {
	
	_BUNDLE: "scramble_strings",

    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "Settings",
            _enable: true
        };
		var prefs = scrambleUtils.getPreferences();
		var debug = prefs.getBoolPref("debug");
		params._enable = debug;
        return params;
    },
    
	/**
	 *	Function that loads the default information when the window dialog is loaded
	 *  @function
	 *  @param win this window dialog object
	 */
	onLoad: function(win) {
		monitor.log(this._debug()._name, "onLoad: ["+kernel.testObj()+"]", this._debug()._enable);
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
		var prefs = scrambleUtils.getPreferences();
		prefs.setBoolPref(vars._TinyLink, enableLink);
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
		
		var onDone = function (data) {
		    //decode data
		    if(data != null) {
                // args = args.replace(/\+/g, "%2B");
                // args = args.replace(/ /g, "+");
                // if(navigator.appVersion.indexOf("Win")!=-1) {
                //  args = args.replace(/\r\n/g, "%0D%0A");
                // } else {
                //  args = args.replace(/\n/g, "%0D%0A");
                // }
		        data = xmlMessages.processReply(data);                
                data = atob(data); // decode base64
                dump("\n"+data+"\n");
            
    			var KEYServerPost = "http://pgp.mit.edu:11371/pks/add";
    			// var result = myAjax.postinServer(KEYServerPost, );
    			var http = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]  
    			                    .createInstance(Ci.nsIXMLHttpRequest);
                if (!http) {
    			    dump('Cannot create XMLHTTP instance\n');
    				return null;
    			}

                http.onreadystatechange = function() {
                    var strbundle = document.getElementById(sett._BUNDLE);			
                    if(http.readyState == 4 && http.status == 200) {
                    	scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("scramble.keyupload.succ"), true);
                    } else if (http.status == 404 || http.status == 500) {
                        dump("----> "+http.status+"\n");
                    	scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("scramble.keyupload.fail"), true);
                    }
                }
                
    		    var params = "keytext="+encodeURIComponent(data.trim());
                http.open("POST", KEYServerPost, true);  
                dump("\nPARAMS: "+params+"\n");
                dump("\nPARAMS.lenght: "+params.length+"\n");                
                
                //Send the proper header information along with the request
                http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                http.setRequestHeader("Content-length", params.length);
                http.setRequestHeader("Connection", "close");
           		http.send(params);

                
    		}		
		    
		};		
		kernel.getMasterKey(onDone); // get the public key
		
	},
	
	/**
	 *	Function to export Public Key to a File
	 *  @public
	 */
	onExportToFile: function() {
		monitor.log(this._debug()._name, "onExportToFile", this._debug()._enable);

		var onDone = function(data) {
		    data = xmlMessages.processReply(data);
            data = atob(data); // decode base64
    		monitor.log(sett._debug()._name, "master key: " + data, sett._debug()._enable);    		
    		var result = sett.copyToFile(data);
    		dump("Result: "+result+"\n\n");
    		var strbundle = document.getElementById(sett._BUNDLE);
    		if(!result) {
    			scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("scramble.keys.publickeyExportFail"), true);
    		} else {
    			window.alert(strbundle.getString("scramble.keys.publickeyExportSucc"));
    			//scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.keys.publickeyEscxportSucc"), true);
    		}		    
		};

		kernel.getMasterKey(onDone); // get the public key
	},
	
/*	onExportAesToFile: function() {
		monitor.log(this._debug()._name, "onExportAesToFile", this._debug()._enable);
		var strbundle = document.getElementById(this._BUNDLE);
		var args = kernel.getMasterKey(); // get the public key
		monitor.log(this._debug()._name, "master key: " + args, this._debug()._enable);
		settingsDir + File.separatorChar + AES_KEY_FILE
		var result = scrambleUtils.copyFile((sourcefile, destdir, newname));
		dump("Result: "+result+"\n\n");
		var strbundle = document.getElementById(this._BUNDLE);
		if(!result) {
			scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("scramble.keys.publickeyExportFail"), true);
		}
		scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.keys.publickeyExportSucc"), true);
	}, */

	/**
	 *	Function to export master key pair to a backup location
	 *  @public
	 */
	onExportKeys: function() { 
        monitor.log(this._debug()._name, "onExportKeys", this._debug()._enable);
		var strbundle = document.getElementById(this._BUNDLE);
		
		var msg = strbundle.getString("scramble.exportWarn")+" "+strbundle.getString("scramble.keys.exportWarn");
		var result = scrambleAppNS.dialogLoader.warningDialog(msg);
		if(result) {
			//Get the backip location
			var path = null;
			var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
			fp.init(window, strbundle.getString("scramble.group.backup") , Ci.nsIFilePicker.modeGetFolder);
			fp.appendFilters(Ci.nsIFilePicker.filterAll);
			if ( fp.show() == Ci.nsIFilePicker.returnOK ) {
		        path = fp.file.path;
		    }
			
			
			if(path != null) {
				//we have a new path to save... 
				var prefs = scrambleUtils.getPreferences();
				//add a timestamp to the backup name
				var date = new Date();
				var timestamp = date.getTime();
				//Get+Copy Public Key Ring
				var pk_srcpath = prefs.getCharPref(vars._PubRingPath);
				var new_pkname = vars._EXTPUBRINGFILE+"_"+timestamp + ".bak";				
				var result = scrambleUtils.copyFile(pk_srcpath, path, new_pkname);
				
				if(!result) {
					scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("scramble.group.backupFail")
						+" "+strbundle.getString("scramble.keys.pkProblem"), true);
				} else {
					//Get+Copy Secret Key Ring (if pubkey ring fails don't even try the secret ring...)
					var sk_srcpath = prefs.getCharPref(vars._SecRingPath);
					var new_skname = vars._EXTSECRINGFILE+"_"+timestamp + ".bak";
					result = scrambleUtils.copyFile(sk_srcpath, path, new_skname);
					if(!result) {
						scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("scramble.group.backupFail")
							+" "+strbundle.getString("scramble.keys.skProblem"), true);
					}
					scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.group.backupSucc"), true);
				}
			} else {
				scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.group.backupFail"), true);
			}
		}
	},
	
	/**
	 *	Function to import master key pair from a backup location
	 *  @public
	 */
	onImportKeys: function() {
		monitor.log(this._debug()._name, "onImportKeys", this._debug()._enable);
		var strbundle = document.getElementById(this._BUNDLE);
		
		var msg = strbundle.getString("scramble.importWarn")+" "+strbundle.getString("scramble.keys.importWarn");
		var result = scrambleAppNS.dialogLoader.warningDialog(msg);
		if(result) {
			// First select the Public Key ... only after the associated secret key
			var file = this.onSelectFile(strbundle.getString("scramble.keys.publickey"));
			if(file != null) { 
				var pkpath = file.path;
				//we have a new path to save...  
				var dirSer_comp = Cc["@mozilla.org/file/directory_service;1"];
				            var dirService = dirSer_comp.getService(Ci.nsIProperties); 
				            // returns an nsIFile object from the current profile directory
				            var file = dirService.get("ProfD", Ci.nsIFile); 	            
				var extension_optdir = file.path+"/"+vars._EXTDIR;
				
				//get the secret key ring path...
				file = this.onSelectFile(strbundle.getString("scramble.keys.secretkey"));
				if(file != null) {
					var skpath = file.path;
					var result = scrambleUtils.copyFile(pkpath, extension_optdir, vars._EXTPUBRINGFILE);
					if(!result) {
						scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("scramble.group.backupFail")
							+" "+strbundle.getString("scramble.keys.skProblem"), true);
					} else {
						result = scrambleUtils.copyFile(skpath, extension_optdir, vars._EXTSECRINGFILE);
						if(!result) {
							scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("scramble.group.backupFail")
								+" "+strbundle.getString("scramble.keys.skProblem"), true);
						} else {
							scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.group.backupSucc"), true);	
						}
					}
				} else {
					scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.group.backupFail"), true);
				}
			} else {
				scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.group.backupFail"), true);
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
		var strbundle = document.getElementById(this._BUNDLE);
		var msg = strbundle.getString("scramble.createWarn");
		var result = scrambleAppNS.dialogLoader.warningDialog(msg);
		if(result) {
	        var params = {
	            userid: '',
	            pwd: '',
	            bitsize: 0, 
	            result: false
	        };
	        params = scrambleAppNS.dialogLoader.keyPairGenDialog(params);
	        if(params.result) {
				// scrambleAppNS.dialogLoader.warningDialog("Generating Key ring, press OK and wait...", true);
				params = scrambleAppNS.dialogLoader.keyGenDialog(params);						
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
		
		var strbundle = document.getElementById(this._BUNDLE);
		var path = null;
		var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
		fp.init(window, strbundle.getString("scramble.group.backup") , Ci.nsIFilePicker.modeGetFolder);
		fp.appendFilters(Ci.nsIFilePicker.filterAll);
		if ( fp.show() == Ci.nsIFilePicker.returnOK ) {
	        path = fp.file.path;
	    }
	
		if(path != null) {
			//we have a new path to save... 
			var prefs = scrambleUtils.getPreferences();
			var keyring_srcpath = prefs.getCharPref(vars._KEYChainPath);
			//add a timestamp to the backup name
			var date = new Date();
			var timestamp = date.getTime();
			var new_name = vars._EXTDATAFILE+"_"+timestamp + ".bak";
			var result = scrambleUtils.copyFile(keyring_srcpath, path, new_name);
			if(result) {
				scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.group.backupSucc"), true);
			} else {
				scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.group.backupFail"), true);
			}
		} else {
			scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.group.backupFail"), true);
		}
	},

	/**
	 *	Function to import group definition from a backup location
	 *  @public
	 */
	onImportGroups: function() {
		monitor.log(this._debug()._name, "onImportGroups", this._debug()._enable);
		var strbundle = document.getElementById(this._BUNDLE);
		
		var msg = strbundle.getString("scramble.importWarn")+" "+strbundle.getString("scramble.group.importWarn");
		var result = scrambleAppNS.dialogLoader.warningDialog(msg);
		if(result) {
			var file = this.onSelectFile(strbundle.getString("scramble.group.backup"));
			
			if(file != null) {
				path = file.path;
				//we have a new path to save...  
				var dirSer_comp = Cc["@mozilla.org/file/directory_service;1"];
	            var dirService = dirSer_comp.getService(Ci.nsIProperties); 
	            // returns an nsIFile object from the current profile directory
	            var file = dirService.get("ProfD", Ci.nsIFile); 	            
				var extension_optdir = file.path+"/"+EXTDIR;
				// check if the file is a valid Scramble File
				if(!IOxml.importXML(path)) {
					scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.group.invalidFile"), true);
					return;
				}
				var result = scrambleUtils.copyFile(path, extension_optdir, EXTDATAFILE);
				if(result) {
					scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.group.backupSucc"), true);
				} else {
					scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.group.backupFail"), true);
				}
			} else {
				scrambleAppNS.dialogLoader.warningDialog( strbundle.getString("scramble.group.backupFail"), true);
			}
		}
	},

	/**
	 *	Function to update the Java VM urestricted policies
	 *  @public
	 */	
	updateJCE: function() {
		monitor.log(this._debug()._name, "onOK", this._debug()._enable);
		var strbundle = document.getElementById(this._BUNDLE);
		var msg = strbundle.getString("scramble.java.jce");
		var result = scrambleAppNS.dialogLoader.warningDialog(msg);
		if(result) {
			kernel.runJCEUpdateScript();
		}
	},
	
	
	initPlugin: function() {
		monitor.log(this._debug()._name, "initPlugin", this._debug()._enable);
		var strbundle = document.getElementById(this._BUNDLE);
		var msg = strbundle.getString("scramble.plugin.re-init");
		var result = scrambleAppNS.dialogLoader.warningDialog(msg);
		if(result) {
		    //pimp
		    dump("reinit plugin -> launch init dialog\n");
            var result = scrambleAppNS.scramble.reinit();
            dump("reinit plugin -> launch init dialog ["+result+"]\n");
            // scrambleAppNS.scramble.
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
	},

	onSelectFile: function(msg) {
        monitor.log(this._debug()._name, "onSelectFile", this._debug()._enable);
		var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
		fp.init(window, msg , Ci.nsIFilePicker.modeOpen);
		fp.appendFilters(Ci.nsIFilePicker.filterAll);
		if ( fp.show() == Ci.nsIFilePicker.returnOK ) {
	        return fp.file; //.path;
	    }
		return null;
	},


	/**
	 *	Function to copy data to a specific file
	 *  @public
	 *  @param data The data to be copied
	 *  @returns {boolean} 
	 */
	copyToFile: function(data) {
        monitor.log(this._debug()._name, "copyToFile", this._debug()._enable);
		var nsIFilePicker = Ci.nsIFilePicker;
		var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, "Select where to save your File" , nsIFilePicker.modeSave);
		fp.appendFilters(nsIFilePicker.filterAll);
		if( ( fp.show() == nsIFilePicker.returnOK ) || (fp.show() == nsIFilePicker.returnReplace ) ) {
	        var path = fp.file.path+".key";
		    var file = Cc["@mozilla.org/file/local;1"].  
		               createInstance(Ci.nsILocalFile);  
		    file.initWithPath(path);
		    Components.utils.import("resource://gre/modules/NetUtil.jsm");  
		    Components.utils.import("resource://gre/modules/FileUtils.jsm");  
			var ostream = FileUtils.openSafeFileOutputStream(file)  
			var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].  
			                createInstance(Ci.nsIScriptableUnicodeConverter);  
			converter.charset = "UTF-8"; 
			var istream = converter.convertToInputStream(data);  
			// The last argument (the callback) is optional.  
			NetUtil.asyncCopy(istream, ostream, function(status) {  
			  	if (!Components.isSuccessCode(status)) {  
			    	return false;
			  	}  
				return true;
			});
			return true;
	    } else {		
			return false;
		}
	},

	
	/**
	 * @return the user's own AES key 
	 */
	/*getAESKey: function() {
        var prefs = Cc["@mozilla.org/preferences-service;1"].
		getService(Ci.nsIPrefService);
		var settingsDir = branch.getCharPref(SettingsDir);
		var aesFile = settingsDir + "/" + "aes.key";
		
		Components.utils.import("resource://gre/modules/NetUtil.jsm");  
		NetUtil.asyncFetch(aesFile, function(inputStream, status) {  
			if (!Components.isSuccessCode(status)) {  
				scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("publicKey.invalid"), true);
			  	return;  
			}  
			// The file data is contained within inputStream.  
			// You can read it into a string with  
			var pkkey = NetUtil.readInputStreamToString(inputStream, inputStream.available()); 

	}*/
};