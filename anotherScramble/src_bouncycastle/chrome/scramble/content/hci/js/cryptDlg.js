 /**
 * @fileOverview Crypto Box Dialog, contains a misc of functions used for/by the cryptDlg overlay
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


// ***************************************************************************
// **                                                                       **
// **                          -  Dialog loaders -                          **
// **                                                                       **
// ***************************************************************************

// import the utils modules
Components.utils.import("resource://scramble/utils/utils.js");
Components.utils.import("resource://scramble/utils/monitor.js");
// import the core modules
Components.utils.import("resource://scramble/core/coins.js");
Components.utils.import("resource://scramble/core/kernel.js");
Components.utils.import("resource://scramble/lib/xmlMessages.js");

/** 
  *	Class that contains a misc of functions used for/by the cryptDlg overlay
  *	@class Class that contains a misc of functions used for/by the cryptDlg overlay
  */
var cryptdlg = {
    
	_BUNDLE: "scramble_strings",
	
	/**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "CryptoDialog",
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
		//get some prefs initiated
		monitor.log(this._debug()._name, "onLoad: ["+kernel.testObj()+"]", this._debug()._enable);
		sizeToContent();
		if(window.arguments === undefined) {
			return;
		}

		var params = window.arguments[0];
		
        var strbundle = document.getElementById(this._BUNDLE);
		if(params.result) {  //just to show encrypted text
		    monitor.messageDump(strbundle.getString("scramble.textload"));
			document.getElementById('but_enc').style.display = "none";
			document.getElementById('but_dec').style.display = "none";
			document.getElementById('but_enabletiny').style.display = "none";
			document.getElementById('crypttxtbox').value = params.str;
			document.getElementById('but_cancel').label = strbundle.getString("scramble.done");
			document.getElementById('caption_txt').label = strbundle.getString("scramble.encrypted");
		}
		else {  //normal options
			document.getElementById('but_enc').style.display = "block";
			document.getElementById('but_dec').style.display = "block";
			document.getElementById('but_enabletiny').style.display = "block";
			document.getElementById('crypttxtbox').value = params.str;
			document.getElementById('but_cancel').label = strbundle.getString("scramble.cancel");
			document.getElementById('caption_txt').label = strbundle.getString("scramble.insertText");
		}
	},
	
	/**
	 *	Function executed by the button to encrypt the value on the textbox to a link
	 *  @function
	 *  @see onEncrypt(flag)
	 */
	onEncryptTinyLink: function() {
        monitor.log(this._debug()._name, "onEncryptToLink", this._debug()._enable);
		this.onEncrypt(true);
	},

	/**
	 *	Function to encrypt the string value on the textbox
	 *  @function
	 *  @param {boolean} flag true if TinyLink false otherwise
	 */
	onEncrypt: function(flag) {
		monitor.log(this._debug()._name, "onEncrypt", this._debug()._enable);
		var doc = document.getElementById('crypttxtbox');
		var value = doc.value;

		if ( (flag == '') || (flag === undefined) ) {
			flag = false;
		}

        var strbundle = document.getElementById(this._BUNDLE);

		if (value.search(vars._PGPstart) > -1) {
            scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("encrypt.present"), debug);
		} else if(value != "") {
			value = scrambleUtils.stripHTML(value, null);
			//get a function to encrypt the str
			
		    var params = {
		        selected_items: [],
                editable: false,
                groups: [],
		        control: true
		    };
		    // Open the Key manager dialog
	 		//pimp
	 		params = scrambleAppNS.dialogLoader.keyChainDialog(params);
            dump(params.selected_items.length+"\n");//+" | "+params.selected_items.length+"\n");
            
		    if (!params.control) {
		        return ;
		    } else if ((params.control) && (params.selected_items.length < 1)) {
				return ;
			}
		    
		    
		    var onDone = function(data) {
		        var doc = document.getElementById('crypttxtbox');
                dump("------> "+cryptdlg._BUNDLE+"\n");
                var strbundle = document.getElementById(cryptdlg._BUNDLE);
                var result = data;
    			if(result != null) {
    				if(flag) {
    					result = scrambleAppNS.scramble.setTinyLink(result); 
    					doc.value = result;               
                        // this.encryptionURL(result);
    				} else {
    					doc.value = result;
                    }
                    // document.getElementById('but_cancel').label = strbundle.getString("scramble.done");
                    document.getElementById('caption_txt').label = strbundle.getString("scramble.encrypted");
    			} 
    			else {
    				monitor.dump(strbundle.getString("encrypt.notsuccess"), true);
    			}		        
		    };
		    
            // var result = 
			kernel.encrypt(value, params.selected_items, true, onDone);
            document.getElementById('caption_txt').label = strbundle.getString("scramble.running");
            
            // if(result != null) {
            //         document.getElementById('crypttxtbox').value = strbundle.getString("scramble.running");
            //  if(flag) {
            //      result = scrambleAppNS.scramble.setTinyLink(result); 
            //      doc.value = result;               
            //                     // this.encryptionURL(result);
            //  } else {
            //      doc.value = result;
            //                 }
            //  document.getElementById('but_cancel').label = strbundle.getString("scramble.done");
            //  document.getElementById('caption_txt').label = strbundle.getString("scramble.encrypted");
            // } 
            // else {
            //  monitor.dump(strbundle.getString("encrypt.notsuccess"), true);
            // }
		} else {
		    scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("scramble.notTextInserted"), true);
		}
	},
	
	/**
	 *	Function to post the encryption string (str) into a url 
	 *  @function
	 *  @param str The text to decrypt.
	 *  @see onEncrypt(flag)
	 */
	encryptionURL: function(str) {
		monitor.log(this._debug()._name, "encryptURL", this._debug()._enable);
		var http = new XMLHttpRequest();
		
		var url = kernel.getTinyServer();
		str = str.replace(/\+/g, "%2B");
		var params = "text="+str;
		http.open("POST", url, true);

		//Send the proper header information along with the request
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.setRequestHeader("Content-length", params.length);
		http.setRequestHeader("Connection", "close");

		/** @ignore */
		http.onreadystatechange = function() {
			if(http.readyState == 4 && http.status == 200) {
				document.getElementById('crypttxtbox').value = PLURLstart+"\n"+http.responseText+"\n"+PLURLend;
			} else if(http.status == 404 || http.status == 500 || http.status == 0) {
				document.getElementById('crypttxtbox').value = "fail> "+http.status+" | "+http.readyState;
			} 
		};
		http.send(params);
	},

	/**
	 *	Function to execute decryption of the string value on the textbox
	 *  @function
	 */
	onDecrypt: function(pwd) {
		monitor.log(this._debug()._name, "onDecrypt", this._debug()._enable);
		var doc = document.getElementById('crypttxtbox');
		var value = scrambleUtils.strTrim(doc.value, '');
		
		var strbundle = document.getElementById(this._BUNDLE);

		if( (pwd === undefined) || (pwd === null) ){
			pwd = this.getPwd();
		}      

		if(value != "") {
			if(value.indexOf(vars._PLURLstart) != -1) {
			    value = value.replace(vars._PLURLstart, " ");
				value = value.replace(vars._PLURLend, " ");
				value = value.replace(new RegExp("[\\s]*", "g"), "");
				value = scrambleUtils.strTrim(value, '');
				this.decryptURL(value);
			} else {
				var temp = value.indexOf("http://");
                var onDone = function(result) {
                    var strbundle = document.getElementById(cryptdlg._BUNDLE);                
                    var doc = document.getElementById('crypttxtbox');
                                                            
                    if(result != null) {
                        doc.value = result;
                        document.getElementById('but_cancel').label = strbundle.getString("scramble.done");
                        document.getElementById('caption_txt').label = strbundle.getString("scramble.decrypted");
                    }
                    else {
                    // try once again ???
                        if(scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("decrypt.tryagain")).result) {
                            var params = scrambleAppNS.dialogLoader.pwdDialog();                    
                            if (params.result) {
                                if (params.pwd != "") {
                                    var pwd = params.pwd;
                                    if (params.pwd_checkbox) {
                                        scrambleAppNS.kernel.saveSKey(pwd);
                                    }
                                    cryptdlg.onDecrypt(pwd);
                                } else {
                                    pwd = null;
                                }
                            } else {
                                monitor.dump(strbundle.getString("decrypt.notsuccessBC"), true);
                            }
                        }
                    }
				};	
                
				if(temp === 0) {
					this.decryptURL(value, pwd);
					return;
				}
				value = scrambleUtils.stripHTML(value, null);
				//get a function to decrypt the str
				
			
                // var result = 
				kernel.decrypt(value, pwd, onDone);
                document.getElementById('caption_txt').label = strbundle.getString("scramble.running");
			}
		} else {
			scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("scramble.notTextInserted"), true);
		}
	},
	
	/**
	 *	Function to extract the encrypted text from a link and decrypt it
	 *  @function
	 *  @param url The url path 
	 *  @see decrypt_it()
	 */
	decryptURL: function(url, pwd) {
		monitor.log(this._debug()._name, "decryptURL", this._debug()._enable);
		var http = new XMLHttpRequest();
		url = scrambleUtils.strTrim(url);
		http.open("GET", url, true);
		http.send(null);

		if(pwd == undefined) {
			pwd = null;
		}
		/** @ignore */	
		http.onreadystatechange = function() {
			if(http.readyState == 4 && http.status == 200) {
				cryptdlg.decrypt_it(http.responseText, pwd);
			} else if (http.status == 404 || http.status == 500 || http.status == 0) {
                var strbundle = document.getElementById(this._BUNDLE);
                scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("connectionError"), true);
			} 
		};
	},

	/**
	 *  Function to decrypt a value string and post the result into the textbox
	 *  @function
	 *  @param value The text to decrypt.
	 */
	decrypt_it: function(value, pwd) {
		monitor.log(this._debug()._name, "decrypt_It", this._debug()._enable);
		var doc = document.getElementById('crypttxtbox');

		if( (pwd === undefined) || (pwd === null) ){
			pwd = this.getPwd();
		}

		value = value.replace(/\%2B/g,'+');
		value = scrambleUtils.stripHTML(value, null);
		//get a function to decrypt the str
        var strbundle = document.getElementById(cryptdlg._BUNDLE); 		
		var onDone = function(result) {
            // var result = data;
            // dump("decryptURL -> "+data+"\n");
            // dump("-----------> resultado: "+data+"\n");
            var strbundle = document.getElementById(cryptdlg._BUNDLE);                
            var doc = document.getElementById('crypttxtbox');
            if(result != null) {
                doc.value = result;
                document.getElementById('but_cancel').label = strbundle.getString("scramble.done");
                document.getElementById('caption_txt').label = strbundle.getString("scramble.decrypted");
            }
    		else {
    		    scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("decrypt.notsuccess"), true);
    		}            
		};
        // var result = 
		kernel.decrypt(value, pwd, onDone);
        document.getElementById('caption_txt').label = strbundle.getString("scramble.running");
        
        //         var strbundle = document.getElementById(this._BUNDLE);
        // 
        // if(result != null) {
        //  doc.value = result;
        //  document.getElementById('but_cancel').label = strbundle.getString("scramble.done");
        //  document.getElementById('caption_txt').label = strbundle.getString("scramble.decrypted");
        // }
        // else {
        //     scrambleAppNS.dialogLoader.warningDialog(strbundle.getString("decrypt.notsuccess"), true);
        // }
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
	 *	Closes the current window dialog
	 *  @function
	 */
	onCancel: function() {
		monitor.log(this._debug()._name, "onClose...", this._debug()._enable);
		window.close();
	}	
	
};