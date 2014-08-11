/**
 * @fileOverview Contains a misc of functions used for/by the browser overlay as well as main function executers
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @author <a href="mailto:iulia.ion@inf.ethz.ch">Iulia Ion</a>	
 * @version 1.0
 */
//initialisation
window.addEventListener("load",
		function() {
	scrambleAppNS.scramble.init();
},
false);

// close socket when firefox is closed...
window.addEventListener('unload', function(event) {
    if (event.target.location.href !== 'chrome://browser/content/browser.xul') {
        return;
    }
    var oDOM = xmlMessages.simple("bye", "");
    dump("call socket "+kernel+"\n" )    
    kernel.callSocket(oDOM, function(data) { dump("######## Server: "+data+"\n")})
}, false);


/**
 * @class 
 * This is the class that communicates with the firefox extension menus as well as main function executers
 */
scrambleAppNS.scramble = {

	_theClass: null,
	
	/**
	 *  @private
	 *  Private Object for debugging purposes
	 */
	_debug: function() {
		var params = {
			_name: "Scramble!",
			_enable: true
		};
		var prefs = scrambleUtils.getPreferences();
		var debug = prefs.getBoolPref("debug");
		params._enable = debug;
		return params;
	},

	/**
	 *	Function to execute Scramble initilialisation actions - to be executed when restart
	 *  @public
	 */
	init: function() {
		monitor.log(this._debug()._name, "initialisation", this._debug()._enable);
	
		
		//@deprecated code, due to Firefox java removal, 
		try {
			// Get a OpenPGP component
			
			// @deprecated - replaced by loack socket
            // scrambleAppNS.scramble.loadJava();
            // scrambleAppNS.scramble.loadScrambleSocket();
            scrambleAppNS.initialise.runServer();
			
			var tm = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
			const TYPE_ONE_SHOT = Components.interfaces.nsITimer.TYPE_ONE_SHOT;
			tm.init(function() {
                //set the openpgp java object @deprecated
                // scrambleAppNS.scramble.setOpenPGPObject();
                //set the bundle with all the messages
                vars.bundle = document.getElementById("scramble_strings");
                //init all the Scramble preferences and settings....
                var prefs = scrambleUtils.getPreferences();
                var keychain_path = prefs.getCharPref(vars._KEYChainPath);
                // monitor.log(scrambleAppNS.scramble._debug()._name, kernel.testObj(), scrambleAppNS.scramble._debug()._enable);
                
                if ((keychain_path == vars._FAIL) || (keychain_path == "")) {
                    // scrambleAppNS.scramble.runJCEUpdateScript();
                    // initialise the key ring and generate a password				
                    var control = scrambleAppNS.initialise.Extension(prefs); //, openpgp.obj);
                    // if control is false then the key chain was not updated correctly...
                    if (!control) {
                        scrambleAppNS.dialogLoader.warningDialog(vars.bundle.getString("scramble.keychainproblem"), true);
                        prefs.setCharPref(vars._KEYChainPath, vars._FAIL);
                    }
                }
                scrambleAppNS.myListeners.init(true);
            },
            750, TYPE_ONE_SHOT);
		} catch(e) {
			// scrambleAppNS.dialogLoader.warningDialog(vars.bundle.getString("`"), true);
		}
	
	},
	
	/**
	 *	Function to re-executes Scramble initilialisation actions - to be executed when restart
	 *  @public
	 */
	reinit: function() {
		monitor.log(this._debug()._name, "re-initialise", this._debug()._enable);
        // if (openpgp.obj === null) {
        //     scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("scramble.javaproblem"), true);
        //     return false;
        // }
        var prefs = scrambleUtils.getPreferences();
        // var control = scrambleAppNS.initialise.Extension(prefs, openpgp.obj);
        var control = scrambleAppNS.initialise.Extension(prefs);        
        if (!control) {
            scrambleAppNS.dialogLoader.warningDialog(vars.bundle.getString("scramble.keychainproblem"), true);
            prefs.setCharPref(vars._KEYChainPath, FAIL);
        }
        return control;
	},
	
	
	//***************************************************************************
	//**                                                                       **
	//**                 -  Dialog and Executers loaders -                     **
	//**                                                                       **
	//***************************************************************************
	/**
	 *	Function to execute the actions of the toolbar menu
	 *  @public
	 *	@param action: 0: Encrypt, 1: Decrypt, 2: steganography, 3: key chain, 4: about, 5: settings, 6: text dialog
	 *
	 */
	onMenuClick: function(action) {
		var values = ["Encrypt", "Decrypt", "Steganography", "Key Management", "About", "Settings", "Text Dialog"];
		monitor.log(this._debug()._name, "onMenuClick -> " + values[action], this._debug()._enable);
		var debug = this._debug()._enable;
		if (action == 0) {
		    //pimp
			// Encrypt command
            scrambleAppNS.scramble.executeEncryption(debug);
		} else if (action == 1) {
			// Decrypt command (deprecated)
			scrambleAppNS.scramble.executeDecryption(debug);
		} else if (action == 2) {
			scrambleAppNS.scramble.executeSteganography(debug);
		} else if (action == 3) {
			// Key management -> groups management
			var params = {
					selected_items: [],
					control: true
			};
			scrambleAppNS.dialogLoader.keyChainDialog(params);
		} else if (action == 4) {
			// About
            scrambleAppNS.dialogLoader.aboutMenu();
		} else if (action == 5) {
			// Settings
			var params = {
                isTinyLinkSet: false
			};
			params.isTinyLinkSet = kernel.isTinyLinkSet();
			scrambleAppNS.dialogLoader.settingsDialog(params);
		} else if (action == 6) {
			scrambleAppNS.dialogLoader.textDialog(null);
		} else if (action == 7) {
            this.getFacebookToken();
            var getListofFriends = function() {
                var friendslist = JSON.parse(this.responseText);
                var friends = friendslist.data;
                var key = null;
                keychain.loadAddressBook();
                for (var i=0; i<friends.length; i++) {
                    dump(friends[i].name+": "+friends[i].id+"\n");
                    key = new xmlMessages._pk();
                    key.keyId = friends[i].id;
                    key.keyName = friends[i].name;
                    key.keyMail = key.keyId+"@facebook.com";
                    key.fingerPrint = "";
                    keychain.addNewContact(key);
                }
                keychain.saveAddressBook();
                    
            };
            this.getFacebookFriends("me",getListofFriends); 
        }
	},
	
	
	/**
	 *	Function to detect the normal click or the right mouse click
	 *  @public
	 */
	onClick: function(event) {
		if (event.button != 0) {
			return;
		} else {
			this.onMenuClick(0);
		}
	},
	
	
	//***************************************************************************
	//**                                                                       **
	//**                         -  Execution Functions -                      **
	//**                                                                       **
	//***************************************************************************
	/**
	 *	Function to execute decryption on Request.... Either by just decrypting the selected text or
	 *  by searching for encrypted text on the HTML page content (TBD)
	 *  @deprecated from UI updates
	 *  @param debug log flag
	 */
	executeDecryption: function(debug) {
		monitor.log(this._debug()._name, "execute Decryption", this._debug()._enable);
	
		var htmltext = scrambleAppNS.htmlactions.getPageContent().body.innerHTML;
	
		var ret_value = scrambleAppNS.htmlactions.isEncryptionPresent(htmltext);
		if (ret_value.result) {
			var startPoint = ret_value.startPoint;
			//= PGPstart;
			var endPoint = ret_value.endPoint;
			//=PGPend;
			var uri = scrambleAppNS.htmlactions.getPageContent().location.href;
			var old = scrambleAppNS.htmlactions.getBlobByPos(htmltext, startPoint, endPoint);
			if (old != null) {
				var clean_old = scrambleUtils.stripHTML(old, uri);
	
				var pw = scrambleAppNS.scramble.getPwd();
				if(pw !== null) {
	
					// In case of the URI and if its not requested from crypto text editor console...
					if (clean_old.indexOf(vars._PLURLstart) > -1) {
						clean_old = clean_old.replace(vars._PLURLstart, " ");
						clean_old = clean_old.replace(vars._PLURLend, " ");
						clean_old = scrambleUtils.strTrim(clean_old.replace(new RegExp("[\\s]*", "g"), ""), '');
						clean_old = scrambleUtils.strTrim(clean_old);
						clean_old = this.getTinyLink(clean_old);
						if ((clean_old.indexOf("\r\n\r\n") > 0) && (scrambleUtils.detectOS() != vars._WIN)) {
							clean_old = clean_old.replace(/\n/g, "");
						}
					}
	
					var dec = kernel.decrypt(clean_old, pw, false);
					if (dec != null) {
						var strInput = htmltext.replace(old, dec);
						scrambleAppNS.htmlactions.refreshPage(strInput);
						return;
					}
				}
			}
			kernel.eraseSKey();
			var strbundle = document.getElementById(BUNDLE);
			var msg = strbundle.getString("decrypt.notsuccess");
			scrambleAppNS.dialogLoader.warningDialog(msg, true);
		}
	},
	
	/**
	 *  Function to execute encryption on Request....
	 *  Either by just encrypting the selected text or by providing a textbox for encryption
	 *  @public
	 *  @param debug log flag
	 */
	executeEncryption: function(debug) {
		monitor.log(this._debug()._name, "execute Encryption", this._debug()._enable);
		// --------------------------------
		// dump("\nBEFORE:\n");
		//   		var focused = document.commandDispatcher.focusedElement;
		//
		// var test = document.commandDispatcher.advanceFocus();
		// dump(test+"\n");
		// if(focused != null) {
		// 	var val = focused.value;
		// 	if(val === "") val = focused.textContent;
		// 	dump("\n\nBla:------>"+val+"<------\n\n");
		// }
		// dump("AFTER:\n");
		// --------------------------------
		//disables javascript
        // var pref_service = Components.classes["@mozilla.org/preferences-service;1"];
        // var preferences = pref_service.getService(Components.interfaces.nsIPrefService);
        // preferences.setBoolPref("javascript.enabled", false);
	    // dump("here i go....\n")
		var params = scrambleAppNS.htmlactions.getSelectedTxt();
		if(params == null) {dump("Error.....\n"); return;}
		// else {dump("continua....\n")}
		var value = params.nodeVal;
		url = scrambleAppNS.htmlactions.getPageContent().URL;
		if( ((value == "What's on your mind?") || (value == "Write something...")) && (url.indexOf("facebook") > -1) ) { // Facebook case
		    value = '';
		} else if (url.indexOf("twitter") > -1) {
		    dump("TWITTER: ["+value+"]\n");
		    value = '';
	    }
		// var strbundle = document.getElementById(vars._BUNDLE);
		if (value.trim() != "")  {
			var htmltext = scrambleAppNS.htmlactions.getPageContent();
			var uri = scrambleAppNS.htmlactions.getPageContent().location.href;
			var new_value = scrambleUtils.stripHTML(value, uri);
			// var strInputCode = htmltext.body.innerHTML;
			// var ret = this.encryptbySelection(new_value, htmltext, debug);
			var ret = this.encryptbySelection(new_value, params.node, debug);
		}
		else {
			//open window to insert text
			scrambleAppNS.scramble.notextenc(debug);
			// var msg2 = strbundle.getString("scramble.notTextSelect");
			// scrambleAppNS.dialogLoader.warningDialog(msg2, true);
			// var openpgp = JavaLoader.getOpenPGPObject();
            // scrambleAppNS.dialogLoader.textDialog(null, openpgp.obj);
		}
        // preferences.setBoolPref("javascript.enabled", true);
	},
	
	queue: null,
	
	notextenc: function(debug) {
	  //load textbox and copy encryption to element on focus
	  	dump("----######## document.popupNode: " + document.popupNode + "\n");
		dump("----######## document.popupNode.nodeType: " + document.popupNode.nodeType + "\n");
		dump("----######## document.popupNode.nodeName: " + document.popupNode.nodeName + "\n");
		dump("----######## document.popupNode.textContent: " + document.popupNode.textContent + "\n");
		dump("----######## document.popupNode.value: " + document.popupNode.value + "\n");
		dump("----######## document.popupNode.type: " + document.popupNode.type + "\n");
		dump("----######## document.popupNode.innerHTML: " + document.popupNode.innerHTML + "\n");
		dump("----######## document.popupNode.outerHTML: " + document.popupNode.outerHTML + "\n");
		var node = document.popupNode;
		var plaintext;
		if (node.nodeName === "BODY") {
			//GMAIL CASE
			plaintext = node.innerHTML;
		} else {
			plaintext = node.value;
		}
		//if("TEXT"!=node.type.toUpperCase() && "TEXTAREA"!=node.type.toUpperCase()){
		//return;
		//}
		
		// if (!plaintext) {
  //           monitor.log("Scramble", "no plaintext found", debug);
  //           var scrambleparam = {
  //               result: false,
  //               scrambletext: ""
  //           };
            
  //           scrambleparam = scrambleAppNS.dialogLoader.enctxtDialog(scrambleparam);
  //           var dummytext = scrambleparam.scrambletext;
  //           // dump("sim tou aqui 3\n");            
  //           // var dummytext = window.prompt("Write the text to Scramble!", "");
            
            
  //   		if ( (dummytext == null || dummytext == "") && (!scrambleparam.result) ) {
  //   			return;
  //   		}
  //   		monitor.log("Scramble", "dummytext: " + dummytext, debug);
  //   		monitor.log("Scramble", "plaintext: " + plaintext, debug);	
		// }
  //       // get recipients
  //       var params = {
		// 		selected_items: [],
		// 		control: true
		// };
		// // Open the Key manager dialog
		// params = scrambleAppNS.dialogLoader.keyChainDialog(params);
		// if ( (!params.control) || ( (params.control) && (params.selected_items.length < 1)) ) {
		// 	return ;
		// } 

        var onDone = function(data) {
              var result = data;
              // var node = document.popupNode;  
              var node = scrambleAppNS.scramble.queue();           
              
              if (result != null) 
                if(kernel.isTinyLinkSet()) {
                   result = scrambleAppNS.scramble.setTinyLink(result);
              } else return;
              
              kernel.copyToClipboard(result);
              
              // var plaintext = node.value;
              // if (!node.type) plaintext = node.textContent;
              dump("result: "+result+"\n")
              if (node.nodeName === "BODY" || node.nodeName === "HTML" || node.nodeName === "DIV") {
                   //GMAIL CASE and twitter
                   node.innerHTML = result+"\n";
              } else if (!node.type){
                  dump("node.type \n");                  
                  node.textContent = result+"\n";
              } else {
                  dump("node.value \n");
                    // node.textContent = result+"\n";
                  node.value = result+"\n";
              }
              
              
              var event = document.createEvent("KeyboardEvent");
              event.initEvent("keydown", true, true);
              node.dispatchEvent(event);
              event = document.createEvent("KeyboardEvent");
              event.initEvent("keypress", true, true);
              node.dispatchEvent(event);
              event = document.createEvent("KeyboardEvent");
              event.initEvent("keyup", true, true);
              node.dispatchEvent(event);
              monitor.log("Scramble", "done refreshing page \n", debug);              
        };

        if(!plaintext) {
            var scrambleparam = {
                result: false,
                scrambletext: "",
                selected_items: []
            };
            dump("  ---  >>>  step 0 \n");
            scrambleparam = scrambleAppNS.dialogLoader.scrambleDialog(scrambleparam);

            dump("  ---  >>>  step 1 \n");
            if(!scrambleparam.result) return;
            dump("  ---  >>>  step 2 \n");
            var dummytext = scrambleparam.scrambletext;
            if (dummytext == null || dummytext == "") {
                return;
            }
            dump("  ---  >>>  step 3 \n");
            if ( scrambleparam.selected_items.length < 1 ) return ;
            dump("  ---  >>>  step 4 \n");
            this.queue = scrambleAppNS.htmlactions._fifo();
            dump("  ---  >>>  step 5 \n");
            this.queue(node);
            dump("\n----------> ENCRYPT ("+dummytext+") \n"+scrambleparam.selected_items+ "\n");
            kernel.encrypt(dummytext, scrambleparam.selected_items, false, onDone);

        }
        // encrypt
        
        
        // dump("queuee....")
        // this.queue = scrambleAppNS.htmlactions._fifo();
        // this.queue(node);
        // kernel.encrypt(dummytext, params.selected_items, false, onDone);
        //         if (result != null) {
        //          if (kernel.isTinyLinkSet()) 
        //              result = scrambleAppNS.scramble.setTinyLink(result);
        //         }
        //         // var result = "test";
        // 
        // if(result == null) return;
        // //var plaintext = node.value;
        // //if (!node.type) plaintext = node.textContent;
        // if (node.nodeName === "BODY" || node.nodeName === "HTML") {
        //  //GMAIL CASE
        //  node.innerHTML = result;
        // } else {
        //  node.value = result;
        // }
        // 
        // var event = document.createEvent("KeyboardEvent");
        // event.initEvent("keydown", true, true);
        // node.dispatchEvent(event);
        // event = document.createEvent("KeyboardEvent");
        // event.initEvent("keypress", true, true);
        // node.dispatchEvent(event);
        // event = document.createEvent("KeyboardEvent");
        // event.initEvent("keyup", true, true);
        // node.dispatchEvent(event);
        // monitor.log("Scramble", "done refreshing page \n", debug);
	  
	    
	},
	
	/**
	 *  Asks the user for a dummytext and performs steganography on the selected text
	 *  @public
	 *  @param debug log flag
	 */
	executeSteganography: function(debug) {
		monitor.log(this._debug()._name, "execute Steganography", this._debug()._enable);
	
		dump("----######## document.popupNode: " + document.popupNode + "\n");
		dump("----######## document.popupNode.nodeType: " + document.popupNode.nodeType + "\n");
		dump("----######## document.popupNode.nodeName: " + document.popupNode.nodeName + "\n");
		dump("----######## document.popupNode.textContent: " + document.popupNode.textContent + "\n");
		dump("----######## document.popupNode.value: " + document.popupNode.value + "\n");
		dump("----######## document.popupNode.type: " + document.popupNode.type + "\n");
		dump("----######## document.popupNode.innerHTML: " + document.popupNode.innerHTML + "\n");
		dump("----######## document.popupNode.outerHTML: " + document.popupNode.outerHTML + "\n");
	
	
		/*     //disables javascript
		    	        var pref_service = Components.classes["@mozilla.org/preferences-service;1"];
		    	    	var preferences = pref_service.getService(Components.interfaces.nsIPrefService);
		    	        preferences.setBoolPref("javascript.enabled",false);
	
	
		    	    	var selected_node = htmlactions.getSelectedTxt();
	
		    var htmltext = htmlactions.getPageContent();
		    var value = node.nodeVal;
		    	    	var uri = htmlactions.getPageContent().location.href;
		    	    	var plaintext = scrambleUtils.stripHTML(value, uri);
		 */
		var node = document.popupNode;
		var plaintext;
		if (node.nodeName === "BODY") {
			//GMAIL CASE
			plaintext = node.innerHTML;
		} else {
			plaintext = node.value;
		}
		//if("TEXT"!=node.type.toUpperCase() && "TEXTAREA"!=node.type.toUpperCase()){
		//return;
		//}
		if (!plaintext) {
			monitor.log("Scramble", "no plaintext found", debug);
			return;
		}
		//var plaintext = node.value;
		//if (!node.type) plaintext = node.textContent;
		var dummytext = window.prompt("Choose a dummy text", "Today was aweeeesome!");
		if (dummytext == null || dummytext == "") {
			return;
		}
		monitor.log("Scramble", "dummytext: " + dummytext, debug);
		monitor.log("Scramble", "plaintext: " + plaintext, debug);
	
	
		var params = {
				selected_items: [],
                editable: false,
				control: true
		};
		// Open the Key manager dialog
		params = scrambleAppNS.dialogLoader.keyChainDialog(params);
		if ( (!params.control) || ( (params.control) && (params.selected_items.length < 1)) ) {
			return ;
		} 
		//dump(htmlactions.refreshSingle(value, params.dummytext, selected_node.node));
		var result = kernel.steganography(plaintext, dummytext, params.selected_items, true);
		if (result) {
			monitor.log("Scramble", "steganpgraphy result: " + result + "\n", debug);
	
			/*
		    	var ret = htmlactions.refreshFocus(dummytext);
		    	        if(!ret) {
		    	           	var isUpdated = false;
		    	           	isUpdated = htmlactions.refreshSingle(plaintext, dummytext, node);
		    		dump(isUpdated);
		    	        }
			 */
			if (node.nodeName === "BODY" || node.nodeName === "HTML") {
				//GMAIL CASE
				node.innerHTML = dummytext;
			} else {
				node.value = dummytext;
			}
	
			var event = document.createEvent("KeyboardEvent");
			event.initEvent("keydown", true, true);
			node.dispatchEvent(event);
			event = document.createEvent("KeyboardEvent");
			event.initEvent("keypress", true, true);
			node.dispatchEvent(event);
			event = document.createEvent("KeyboardEvent");
			event.initEvent("keyup", true, true);
			node.dispatchEvent(event);
			monitor.log("Scramble", "done refreshing page \n", debug);
		}
	
		//   preferences.setBoolPref("javascript.enabled",true);
	},
	
	execImageSteg: function(file) {
		monitor.log("Scramble", "execImageSteg \n", true);
		// select the image to hide...
		// save embedded image as... (or save in the same file)
	
		if(file != null) { 
			monitor.log("Scramble", "file: " + file + " \n", true);
	
			// Get the recipients. Should refactor this!!
			var params = {
					selected_items: [],
                    editable: false,
					control: true,
					javaobj: openpgp.obj
			};
			// Open the Key manager dialog
			params = scrambleAppNS.dialogLoader.keyChainDialog(params);
	
			if (!params.control) {
				return vars._FAIL;
			} else if ((params.control) && (params.selected_items.length < 1)) {
				return false;
			}
	
			var publicKeys = params.selected_items;
	
			var userKey = kernel.getDefaultKey();
	
			if ((userKey != vars._FAIL) && (userKey !== "")) {
				if (publicKeys.indexOf(userKey) != -1) {
					var user_publicKey = new Array(userKey);
					publicKeys = user_publicKey.concat(publicKeys);
				}
			}
	
			monitor.log("Scramble", "openpgp: " + openpgp.obj + " \n", true);
			// where does this save the file?
			var watermarkedImg = openpgp.obj.execImageSteg(file, publicKeys);
			monitor.log("Scramble", "watermarkedImg: " + watermarkedImg + " \n", true);
			//alert("Find your watermarked image in: " + watermarkedImg);
	
			return watermarkedImg;
	
		}
	},
	
	
	
	
	val_enc: "",
	
	/**
	 *	Function to Encrypt the selected text
	 *  @public
	 *	@param value text value to be encrypted
	 *  @param htmlpage html content to be changed
	 *  @param debug log flag
	 *  @returns {boolean} true or false
	 */
	encryptbySelection: function(value, htmlpage, debug) {
		monitor.log(this._debug()._name, "encrypt Selection", this._debug()._enable);
		//get a function to encrypt the str
		var strbundle = document.getElementById("scramble_strings");
		var val = value;
		// Preliminary Tests... - check if encryption tag is present
		if (value.search(vars._PGPstart) > -1) {
			scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("encrypt.present"), debug);
			return false;
		} else if (value == "") {
			scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("scramble.noTextSelected"), debug);
			return false;
		} 
		var params = {
				selected_items: [],
				control: true
		};
		// Open the Key manager dialog
		// params = scrambleAppNS.dialogLoader.keyChainDialog(params);
        params = scrambleAppNS.dialogLoader.keyChainDialog(params);
		if (!params.control) {
			return false;
		} else if ((params.control) && (params.selected_items.length < 1)) {
			return false;
		}
		// process encryption...
		var onDone = function(data) {
		    var result = data;
		    var params = scrambleAppNS.htmlactions.getSelectedTxt();
		    var htmlpage = params.node;
            if (result != null) {
    			dump("")
    			if (kernel.isTinyLinkSet()) 
    				result = scrambleAppNS.scramble.setTinyLink(result);

    			var ret = scrambleAppNS.htmlactions.refreshFocus(result);
    			if (!ret) {
    				var isUpdated = false;
    				isUpdated = scrambleAppNS.htmlactions.refreshSingle(this.val_enc, result, htmlpage);

    				if (!isUpdated) {
    					scrambleAppNS.dialogLoader.textDialog(result);
    					return true;
    				}
    			}
    			return true;
    		}
    		else {
    			scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("encrypt.notsuccess") + result, debug);
    			return false;
    		}
    		
		};
		
        // var result = 
        this.val_enc = value;
		kernel.encrypt(value, params.selected_items, false, onDone);
        // if (result != null) {
        //  dump("")
        //  if (kernel.isTinyLinkSet()) 
        //      result = scrambleAppNS.scramble.setTinyLink(result);
        //  
        //  var ret = scrambleAppNS.htmlactions.refreshFocus(result);
        //  if (!ret) {
        //      var isUpdated = false;
        //      isUpdated = scrambleAppNS.htmlactions.refreshSingle(value, result, htmlpage);
        //  
        //      if (!isUpdated) {
        //          scrambleAppNS.dialogLoader.textDialog(result);
        //          return true;
        //      }
        //  }
        //  return true;
        // }
        // else {
        //  scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("encrypt.notsuccess") + result, debug);
        //  return false;
        // }
	},
	
	//***************************************************************************
	//**                                                                       **
	//**                       -  Auxiliar Functions -                         **
	//**                                                                       **
	//***************************************************************************
	runJCEUpdateScript: function() {
		monitor.log(this._debug()._name, "runJCEUpdateScript", this._debug()._enable);
		// ask the system password if its a unix based system
		var sudo = null;
		if (scrambleUtils.detectOS() != "Windows") {
			var params = scrambleAppNS.dialogLoader.pwdDialog();
			if (params.result) {
				sudo = params.pwd;
			}
		}
		scrambleUtils.runJCEScript(sudo);
	},
	
	getPwd: function(privateKey) {
		// if password is not given as input, get it from preferences
		if ((privateKey === undefined) || (privateKey === null) || (privateKey === '')) {
			var savedPassword = kernel.getSKey();
			if ((savedPassword !== null) || (savedPassword != '')) {
				return savedPassword;
			} else {
				var params = dialogLoader.pwdDialog();
				if (params.result) {
					if (params.pwd != "") {
						privateKey = params.pwd;
						if (params.pwd_checkbox) {
							kernel.saveSKey(privateKey);
							return privateKey;
						}
					} else {
						monitor.log(this._debug()._name, strbundle.getString("pwd.empty"), this._debug()._enable);
						return null;
					}
				} else {
					monitor.log(this._debug()._name, strbundle.getString("scramble.cancelop"), this._debug()._enable);
					return null;
				}
			}
		} else {
			return privateKey;
		}
	},
	
	/**
	 *	Function to get the text from the tinyLink value
	 *  @public
	 *	@param url url of the tinyLink
	 *  @returns {String} value on the tinylink or null
	 */
	getTinyLink: function(url) {
		monitor.log(this._debug()._name, "getTinyLink [" + url + "]", this._debug()._enable);
		var page = scrambleAppNS.htmlactions.getPageContent().URL;
		if (page.indexOf("facebook") > -1) {
			var str = String.fromCharCode(104, 116, 116, 112, 58, 47, 47);
			//http:// string in unicode (to avoid encoding)
			url = scrambleUtils.strTrim(str) + scrambleUtils.strTrim(url.charCodeAt(0) == 116 ? url: url.substring(1, url.length));
			var new_url = url;
			for (var i = 0; i < new_url.length; i++) {
				dump(new_url.charCodeAt(i) + ",");
			}
		}
		var ret = myAjax.callServer(unescape(url));
		if (ret == null) {
            // alert(unescape(url));
            // url = url.split("END");
            // url = url[0];
            // ret = myAjax.callServer(unescape(url));
            // if(ret == null)
                // scrambleAppNS.dialogLoader.warningDialog("TinyLink Server Connection Problem ", true);
                monitor.log(this._debug()._enable, "TinyLink Server Connection Problem", true);            
		}
		return ret;
	},
    

	/**
	 *	Function to set the encrypted value into a tinylink
	 *  @public
	 *	@param text text value 
	 *  @returns {String} TinyLink or null
	 */
	setTinyLink: function(text) {
		monitor.log(this._debug()._name, "setTinyLink", this._debug()._enable);
        // pimp2
		var url = kernel.getTinyServer();
		text = text.replace(/\+/g, "%2B");
		Cc = Components.classes;
		Ci = Components.interfaces;        
		text = "text=" + text;
		
		var http = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]  
		              .createInstance(Ci.nsIXMLHttpRequest);
		if (!http) {
			dump('Cannot create XMLHTTP instance\n');
			return null;
		}		
		http.open("POST", url, false);
		//Send the proper header information along with the request
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.setRequestHeader("Content-length", text.length);
		http.setRequestHeader("Connection", "close");
		http.send(text);

        
		if(http.readyState == 4 && http.status == 200) {
			var ret = http.responseText;
            var page = scrambleAppNS.htmlactions.getPageContent();
            if(page != null) {
                page = page.URL;
                if (page.indexOf("facebook") > -1) {
                    ret = ret.substring(7, ret.length);
                }
            }
			ret = vars._PLURLstart + "\n" + ret + "\n" + vars._PLURLend;      
			return ret;
		} else if (http.status == 404 || http.status == 500) {
            // scrambleAppNS.dialogLoader.warningDialog("TinyLink Server Connection Problem", true);
            monitor.log(this._debug()
                ._enable, "TinyLink Server Connection Problem", true);
            
			return null;
		}
	},
	


    getFacebookToken: function() {
        var onDone = function(callback) {
            var text = this.responseText.toString();
            var pos = text.indexOf("GraphExplorer\",\"init\"");//,[\"m_0_1\",\"m_0_0\"],")+41;
            text = text.substring(pos, text.length);                    
            newtextarray = text.split("[");
            newlast = newtextarray[2].split(",");
            var token = newlast[2].substring(1,newlast[2].length-1);
            var prefs = scrambleUtils.getPreferences();
            if (token.length > 0) {                
                prefs.setCharPref("facebooktoken", token);
            }else {
                prefs.setCharPref("facebooktoken", vars._FAIL);
            }
        };
        var xmlHttp = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        xmlHttp.onload = onDone;
        xmlHttp.open("GET", "https://developers.facebook.com/tools/explorer/?method=GET&path=me", true);            
        xmlHttp.send(null);
    },
    
    getFacebookFriends: function(user, callback) {  
        var prefs = scrambleUtils.getPreferences();
        var token = prefs.getCharPref("facebooktoken");  
        if(token== vars._FAIL) return;
        
        var fburl =  "/"+user+"/friends?access_token="+token;
        var link = "https://graph.facebook.com"+(fburl.toString()).replace("\n","");
        var http = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]  
                      .createInstance(Ci.nsIXMLHttpRequest);
        http.onload = callback;
        http.open("GET", link, true);
        http.send();        
    },
	
	
	/**
	 * @deprecated methods....
	 */
	
	//***************************************************************************
	//**                                                                       **
	//**                -  Java Object Executers loaders -                     **
	//**                                                                       **
	//***************************************************************************
	//this function initialises the wrapper and calls back whenever intialisation
	//is complete; if initialisation is already complete, it calls back immediately.
	loadJava: function(callback) {
		monitor.log(this._debug()._name, "load Java", this._debug()._enable);
		if (scrambleAppNS.scramble._theClass == null) {
			try {
				if (java) {;}
			} catch(err) {
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
                // prompts.alert(null, "Scramble", "You must install the Java plugin first.");
				callback(false);
				return;
			}
			
			var tm = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
			const TYPE_ONE_SHOT = Components.interfaces.nsITimer.TYPE_ONE_SHOT;
			tm.init(function() {
			
			scrambleAppNS.scramble.resolveMyClass(function(classDefinition) {
				scrambleAppNS.scramble._theClass = classDefinition;
				callback(true);
			});
			
			},
            150, TYPE_ONE_SHOT);
					
		} else {
			callback(true);
		}
	},
	
	//this function initialises the wrapper and calls back whenever intialisation
	//is complete; if initialisation is already complete, it calls back immediately.
	//this function resolves the class com.Main
	resolveMyClass: function(callback) {
		Components.utils.import("resource://gre/modules/AddonManager.jsm");
		AddonManager.getAddonByID("scramble@primelife.eu",
				function(addon) {
			var extensionPath = addon.getResourceURI("").QueryInterface(Components.interfaces.nsIFileURL).file.path;
			// Get path to the JAR files (the following assumes your JARs are within a
			// directory called "java" at the root of your extension's folder hierarchy)
			// You must add this utilities (classloader) JAR to give your extension full privileges
			var extensionUrl = "file:///" + extensionPath.replace(/\\/g, "/");
			var classLoaderJarpath = extensionUrl + "/java/javaFirefoxExtensionUtils.jar";
			// Add the paths for all the other JAR files that you will be using
			var myJarpath = extensionUrl + "/java/openpgp/OpenPGP.jar";
			// var myJavapath = extensionUrl + "/java/openpgp/OpenPGP.java";
			var myJarpathBCprov = extensionUrl + "/java/openpgp/jars/bcprov-ext-jdk16-145.jar";
			var myJarpathBClib = extensionUrl + "/java/openpgp/jars/bcpg-jdk16-145.jar";
			// seems you don't actually have to replace the backslashes as they work as well
			var urlArray = [];
			// Build a regular JavaScript array (LiveConnect will auto-convert to a Java array)
			urlArray[0] = new java.net.URL(classLoaderJarpath);
			urlArray[1] = new java.net.URL(myJarpathBCprov);
			urlArray[2] = new java.net.URL(myJarpathBClib);
			urlArray[3] = new java.net.URL(myJarpath);
			var cl = java.net.URLClassLoader.newInstance(urlArray);
			//Set security policies using the above policyAdd() function
			scrambleAppNS.scramble.policyAdd(cl, urlArray);
			var aClass = cl.loadClass("be.cosic.scramble.Scramble");
			var aStaticMethod = aClass.getMethod("testOpenPGP", []);
			var greeting = aStaticMethod.invoke(null, []);
            dump(greeting + " <---------------- \n");
			callback(aClass);
		});
	},
	
	//This function will be called to give the necessary privileges to your JAR files
	//However, the policy never comes into play, because
	//(1) adding permissions doesn't add to the policy itself, and
	//(2) addURL alone does not set the grant codeBase
	policyAdd: function(loader, urls) {
		try {
			var policyClass = java.lang.Class.forName("edu.mit.simile.javaFirefoxExtensionUtils.URLSetPolicy", true, loader);
			var policy = policyClass.newInstance();
			policy.setOuterPolicy(java.security.Policy.getPolicy());
			java.security.Policy.setPolicy(policy);
			policy.addPermission(new java.security.AllPermission());
			for (var j = 0; j < urls.length; j++) {
				policy.addURL(urls[j]);
			}
		} catch(e) {
			Components.utils.reportError(e + '::' + e.lineNumber);
		}
	},
	
	/**
	 *	Function to get java XPCOM OpenPGP component
	 *  @public
	 *  @returns {Object} OpenPGP Component Object
	 *  @throws {Exception} In case of component loading issues
	 */
	setOpenPGPObject: function() {
		monitor.log(this._debug()._name, "set Java Object", this._debug()._enable);
		if (openpgp.obj != null) {
			return;
		}
		try {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"]
			    .getService(Components.interfaces.nsIPrefService);
			const EXTPrefs = "extensions.scramble.";
			const PubRingPath = "pubring_path";
			const SecRingPath = "secring_path";
			const SettingsDir = "settings_dir";
	
			var branch = prefs.getBranch(EXTPrefs);
			var pubpath = branch.getCharPref(PubRingPath);
			var secpath = branch.getCharPref(SecRingPath);
			var settingsDir = branch.getCharPref(SettingsDir);
	
			var reflect = java.lang.reflect;
			var envclass = scrambleAppNS.scramble._theClass;
			var dummy = new java.lang.String();
			var paramtypes = reflect.Array.newInstance(dummy.getClass(), 3);
			paramtypes[0] = java.lang.String;
			paramtypes[1] = java.lang.String;
			paramtypes[2] = java.lang.String;
			var constructor;
			try {
				var ctr = envclass.getDeclaredConstructors();
				dump("step 1 {"+ctr+"}\n");
				for (i = 0; i < ctr.length; i++) {
					var params = ctr[i].getParameterTypes();
					if (params.length > 2) {
						constructor = ctr[i];
					}
				}
				var arglist = reflect.Array.newInstance(dummy.getClass(), 3);
				arglist[0] = pubpath;
				arglist[1] = secpath;
                // arglist[2] = settingsDir;
                openpgp.obj = constructor.newInstance(arglist);
			} catch(e) {
				monitor.exception(this._debug()._name + ": exception", e, true);
			}
		} catch(ex) {
			monitor.exception(this._debug()._name + ": exception", ex, true);
		}
	},

};