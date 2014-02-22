/**
 * @fileOverview Initialisation Dialog contains the functions that control the initialisation dialog
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

// ***************************************************************************
// **                                                                       **
// **                  -  Initialisation Dialog class -                     **
// **                                                                       **
// ***************************************************************************




/** 
  *	Class that contains the functions that control the initialisation dialog
  *	@class Class that contains the functions that control the initialisation dialog
  */
var initdlg = {

    
    _secretKey: [],
    _publicKeys: [],
    _gnupgPath: "Undefined",
    
    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "initialisationDlg",
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
        // sizeToContent();
        monitor.log(this._debug()._name, "onLoad", this._debug()._enable);

		if(window.arguments == undefined) {
			return;
		}

        var params = window.arguments[0];
        this.onSetScreenBox(params.control);
		document.getElementById('syncAll').checked = params.result;
        // load existent keys...
        var element_1 = document.getElementById('list_secretkeys_tree');
        this.onLoadKeys(params.all_SecretKeys , element_1);
        var element_2 = document.getElementById('list_publickeys_tree');
        this.onLoadKeys(params.all_PublicKeys, element_2);
	},
	
	/**
	 *	Controls the next button, going to the next box
	 *  @public
	 */	
	onNext: function() {
        monitor.log(this._debug()._name, "onNext", this._debug()._enable);
		var box_number = window.arguments[0].control;
        	if( box_number > 1) {
	        //finish...
			window.arguments[0].result = document.getElementById('syncAll').checked;
	        window.close();
	    } else {
            box_number += 1;
            window.arguments[0].control = box_number;            
            var version = cryptobridge.gnuPGversion();
			dump("---------> version: "+version+"\n");

            var element;
            if (box_number == 1) {
                this._gnupgPath = cryptobridge.gnuPGpath();
                if( (version == FAIL) || (this._gnupgPath == FAIL) ) {
                    document.getElementById('no_gpg').style.display = "block";
                } else {
                    if(version == "BouncyCastle") {
                        document.getElementById('bouncycastle').style.display = "block";
                    }
                    document.getElementById('no_gpg').style.display = "none";
                }
                document.getElementById('status_gpg').value = "Version: "+version +"\nPath: "+this._gnupgPath;

            } else if( (box_number == 3) || ( (box_number==2)&&(version== "BouncyCastle") ) ){
                if(version == "BouncyCastle") {
                    box_number++;
                } else {
                    element = document.getElementById('list_secretkeys');
                    this._secretKey = this.onKeysSelected(element);
                }
				document.getElementById('buttonNext').label = "Finish";
				this.produceReport();
            }
            this.onSetScreenBox(box_number);
        }
	},
	
	/**
	 *	Controls the back button, returning to previous box...
	 *  @public
	 */	
	onBack: function() {
        monitor.log(this._debug()._name, "onBack", this._debug()._enable);

		var box_number = window.arguments[0].control;
		box_number -= 1;
        window.arguments[0].control = box_number;
		if(document.getElementById('buttonBack').label !="Back") {
			document.getElementById('buttonBack').label = "Back";
			document.getElementById('buttonNext').label = "Next";
			document.getElementById("genkey_label").value = "";
		}
        this.onSetScreenBox(box_number);
	},
	
	
	/**
	 *	Function to display the correct box on the dialog
	 *  @public
	 */	
	onSetScreenBox: function(boxNumber) {
        monitor.log(this._debug()._name, "onSetScreenBox ["+boxNumber+"]", this._debug()._enable);

		var displayYes = "block";
		var displayNo = "none";
		var boxLicense;
		var boxSecret;
		var boxPublic;
		var boxEnd;
		var buttonBack = displayYes;
		
        if (boxNumber == 2) {//box 2 - secret key + password box
            boxLicense = displayNo;
            boxSecret = displayYes;
            boxPublic = displayNo;
            boxEnd = displayNo;
        } else if (boxNumber == 1) { //box 1 - public keys sync (deprecate) - now GPG info
            boxLicense = displayNo;
            boxSecret = displayNo;
            boxPublic = displayYes;
            boxEnd = displayNo;
        } else if (boxNumber == 3) { // box 3 - report + end box
            boxLicense = displayNo;
            boxSecret = displayNo;
            boxPublic = displayNo;
            boxEnd = displayYes;
			// if(window.arguments[0].result) {
       		//             	buttonBack = displayNo;     
       		// } else {
				buttonBack = displayYes;
				document.getElementById('buttonBack').label = "Try Again?";
			// }
        } else {  // box 0 - starting box
            boxLicense = displayYes;
            boxSecret = displayNo;
            boxPublic = displayNo;
            boxEnd = displayNo;
            buttonBack = displayNo;
        }
        document.getElementById('licenseBox').style.display = boxLicense;
        document.getElementById('secretKeysBox').style.display = boxSecret;
        document.getElementById('publicKeysBox').style.display = displayNo;//boxPublic;
        document.getElementById('GnuPGbox').style.display = boxPublic;
        document.getElementById('endBox').style.display = boxEnd;        
        document.getElementById('buttonBack').style.display = buttonBack;
	},
	
	
	// --------------------------------------------------------
	// --              Settings for dialog                   --
	// --------------------------------------------------------
	
	/**
	 *	Function called when the checkbox is (un)checked to show the password in clear
	 *  @public
	 */
	onShowPwd: function() {
		var checked = document.getElementById("pwd-showbox").checked;
		if(checked) {
			document.getElementById("pwd-textbox").type = "";
		} else
			document.getElementById("pwd-textbox").type = "password";
	},
	
	/**
	 *	Controls the back button, returning to previous box...
	 *  @public
	 */	
	onSwitchCheckBox: function(element) {
        var checkboxAll = document.getElementById('syncAll');
        var checkboxSelect = document.getElementById('syncSelection');
        
        if (checkboxAll.id == element.id ) {
            checkboxSelect.checked = false;
            checkboxAll.checked = true;
        } else {
            checkboxSelect.checked = true;
            checkboxAll.checked = false;
        }
	},
	
	/**
	 *	Function to show the path selector result into the textbox dialog
	 *  @public
	 */	
	onSetGPGPathBox: function() {
        monitor.log(this._debug()._name, "onSetGPGPathBox", this._debug()._enable);

        var strbundle = document.getElementById(BUNDLE);
		var path = onSelectDir(strbundle.getString("gnupgPath.select"));
	    document.getElementById("gpg_path_box").value = path;
		if(path != FAIL) {
			this.changes = true;
			document.getElementById("gpg_path_box").value = path;
            var invalid = strbundle.getString("gnupgPath.invalid");
    		if( (path.length > 1) || (path == invalid) ) {
    			path = path + ( (detectOS != WIN) ? "/gpg" : "/gpg.exe" );
    			var prefs = getPreferences();
    			prefs.setCharPref(GnuPath, path);
    			this._gnupgPath = path;
    			alert(strbundle.getString("scramble.restart"));
    		}
		} else {
			document.getElementById("gpg_path_box").value = strbundle.getString("gnupgPath.invalid");
		}
	},
	
	
	produceReport: function() {
        monitor.log(this._debug()._name, "produceReport", this._debug()._enable);
        
        var strbundle = document.getElementById(BUNDLE);
        
        var defined = strbundle.getString("scramble.defined");
        var not_defined = strbundle.getString("scramble.notdefined");
        var allkeys = document.getElementById('syncAll').checked;

        var sk_result = defined;
		var pk_result = defined;
		var pwd_result = defined;
		
		if(!allkeys) {
			sk_result = not_defined;
			pk_result = not_defined;
            pwd_result = not_defined;
			document.getElementById("finish").value= "Initialisation Process Incomplete!";
    	}
		var res_sk = document.getElementById('result_sk').value.substr(0, 11)+" ";
		var res_pwd = document.getElementById('result_pwd').value.substring(0, 9)+" ";
		var res_pk = document.getElementById('result_pk').value.substring(0, 12)+" ";
		var res_gpg = document.getElementById('result_path').value.substring(0, 11)+" ";
        document.getElementById('result_sk').value = res_sk+sk_result;
        document.getElementById('result_pwd').value = res_pwd+pwd_result;
        document.getElementById('result_pk').value = res_pk+pk_result;
        document.getElementById('result_path').value = res_gpg+this._gnupgPath;
	},
	
	/**
	 *  Function to load the keys into a treecell
	 *  @public
	 *  @param {Array} keylist
	  * @param {DOM Element} element
	 */
	onLoadKeys: function(keylist, element) {

		for(var i=0; i < keylist.length; i++) {
			var  mainitem  = document.createElement('treeitem');
			var  c_item   = document.createElement('treerow');
	
			var  child = document.createElement('treecell');
			var name = keylist[i].keyName.split("(");
	
			var tag = (name.length < 2 ? "..." :name[1].substring(0, name[1].length-1) );

			child.setAttribute('label', name[0].trim());
			child.setAttribute('tagName', tag);
			c_item.appendChild(child);

			var child0 = document.createElement('treecell');
			child0.setAttribute('label', keylist[i].keyId); //id
			child0.setAttribute('hidden', 'true'); 
			c_item.appendChild(child0);
		
			var child1 = document.createElement('treecell');
			child1.setAttribute('label', keylist[i].keyMail); //mail
			c_item.appendChild(child1);
		
			var child2 = document.createElement('treecell');
			child2.setAttribute('label', keylist[i].fingerPrint); //fingerprint
			child2.setAttribute('hidden', 'true'); 
			c_item.appendChild(child2);
		
			mainitem.appendChild(c_item);
			element.appendChild(mainitem);
		}			
	},
	
	/**
	 *  Function to load the keys into a treecell
	 *  @public
	 *  @param {DOM Element} element
	 *  @return {Array} key 
	 */
	onKeysSelected: function(element) {
	    var rowsSelected = element.view.selection.getRangeCount();
        var keys = [];
        
        if(rowsSelected > 0) {
         //show the available on the new box - The for is for multiple group choice
            for(var i=0; i < element.view.rowCount; i++) {
                if(element.view.selection.isSelected(i)) {
                    var item = element.view.getItemAtIndex(i);
                   var key = {
                       Id: "",
                       Name: "",
                       Mail: "",
                       Finger: ""
                   };
                       
                   key.Id = item.firstChild.childNodes[1].getAttribute("label");
                   key.Name = item.firstChild.childNodes[0].getAttribute("label");
                   key.Name += " ("+item.firstChild.childNodes[0].getAttribute("tagName")+")";
                   key.Mail = item.firstChild.childNodes[2].getAttribute("label");
                   key.Finger = item.firstChild.childNodes[3].getAttribute("label");
                   
                   keys.push(key);
                }
            }
        }
        return keys;
	},

    
	/**
	 *  Function to generate a new key pair
	 *  @public
	 */
    onGenKeyPair: function() {
        
        var params = {
            userid: '',
            pwd: '',
            bitsize: 0, 
            result: false
        };
        
        params = dialogLoader.keyPairGenDialog(params);

        if(params.result) {
            document.getElementById("genkey_progressbar").style.display = "block";
            document.getElementById("genkey_separator").style.display = "none";
            document.getElementById("genkey_separator2").style.display = "none";
            document.getElementById("genkeypair").style.display = "none";
            document.getElementById("importkeypair").style.display = "none";
            document.getElementById("genkey_label").value = "Generating Key ring, please wait...";


			var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);  
			const TYPE_REPEATING_PRECISE = Components.interfaces.nsITimer.TYPE_REPEATING_PRECISE;
			
            timer.init(function() {
                var prefs = getPreferences();
                var pubpath = prefs.getCharPref(PubRingPath);
                var secpath = prefs.getCharPref(SecRingPath);
                var ret = cryptobridge.genKeyPair(params.userid, params.pwd, params.bitsize, pubpath, secpath, window.arguments[0].javaobj);

                if(!ret) {
                    document.getElementById("genkey_progressbar").style.display = "none";
                    document.getElementById("genkey_separator").style.display = "block";
		            document.getElementById("genkey_separator2").style.display = "block";
                    document.getElementById("genkeypair").style.display = "block";
                    document.getElementById("importkeypair").style.display = "block";
                } else {
                    document.getElementById("genkey_progressbar").style.display = "none";
                    document.getElementById("genkey_label").value = "Key ring generation Complete!";
					document.getElementById('syncAll').checked = true;
                }
            }, 500, TYPE_REPEATING_PRECISE);	
        } else {
	        document.getElementById("genkey_label").value = "Generating Key ring Aborted!";
		}
    },

	/**
	 *  Function to import old key pair
	 *  @public
	 */
	onImportKeyPair: function() {
		var strbundle = document.getElementById(BUNDLE);
		
		var msg = strbundle.getString("scramble.importWarn")+" "+strbundle.getString("scramble.keys.importWarn");
		var params = dialogLoader.warningDialog(msg);
		
		var flag = false;

		if(params.result) {
            document.getElementById("genkeypair").style.display = "none";
            document.getElementById("importkeypair").style.display = "none";	
			document.getElementById("genkey_label").value = "Importing Keys!";
			// First select the Public Key ... only after the associated secret key
			var pkpath = onSelectFile(strbundle.getString("scramble.keys.publickey"));
			var flag = false;
			var msg;
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
						msg = strbundle.getString("scramble.group.restoreFail")
							+" "+strbundle.getString("scramble.keys.skProblem");
					} else {
						result = copyFile(skpath, extension_optdir, EXTSECRINGFILE);
						if(!result) {
							msg = strbundle.getString("scramble.group.restoreFail")
								+" "+strbundle.getString("scramble.keys.skProblem");
						} else {
							flag = true;
							msg = strbundle.getString("scramble.group.restoreSucc");
						}
					}
				} else {
					msg =  strbundle.getString("scramble.group.restoreFail");
				}
			} else {
				msg = strbundle.getString("scramble.group.restoreFail");
			}
			
			if(!flag) {
                document.getElementById("genkey_separator").style.display = "block";
	            document.getElementById("genkey_separator").style.display = "block";
                document.getElementById("genkeypair").style.display = "block";
                document.getElementById("importkeypair").style.display = "block";
            } else {
				document.getElementById('syncAll').checked = true;
            }
            document.getElementById("genkey_label").value = msg;
		} else {
			document.getElementById("genkey_label").value = "Import Key pair Aborted!";
		}
		
	}
};