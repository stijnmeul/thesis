/**
 * @fileOverview Contains the data for the bridge between the application and the crypto
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


//***************************************************************************
//**                                                                       **
//**                    -  Main Kernel App Functions -                     **
//**                                                                       **
//***************************************************************************
/** 
  *	Acts as the Main Core, Contains the data for the bridge between the application and the crypto
  *	@class Class that acts as the Main Core, contains the main application functions, acting like the main kernel  
  */
var kernel = {

    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
            _name: "Kernel",
            _enable: true
        };
        return params;
    },

    /**
	 *	Function to initialise the extension core preferences
	 *  @public
	 */
    init: function() {
        monitor.log(this._debug()._name, "init", this._debug()._enable);
		var strbundle = document.getElementById(BUNDLE);		
        	

		dump("this is here 2----------------------------\n");
		if( !cryptobridge.init() ) {
			monitor.messageAlert(strbundle.getString("scramble.javaproblem"), true)
			return;
		}
		var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);  
		const TYPE_REPEATING_PRECISE = Components.interfaces.nsITimer.TYPE_REPEATING_PRECISE;
		
        timer.init(function() {

        //check if it is the first time the extension is loaded, if so, copy the keychain to the profile directory
        var prefs = getPreferences();
        var keychain_path = prefs.getCharPref(KEYChainPath);
        if ((keychain_path == FAIL) || (keychain_path == "")) {
			//update the java unrestricted policies
			kernel.runJCEUpdateScript();
			// initialise the key ring and generate a password
			
			var myObj = JavaLoader.getOpenPGPObject();
			var test = myObj.testOpenPGP();    
            var control = initialise.Extension(prefs, myObj);
            //if control is false then the key chain was not updated correctly...
            if (!control) {
                monitor.messageAlert(strbundle.getString("scramble.keychainproblem"), true);
                prefs.setCharPref(KEYChainPath, FAIL);
            }
        }
        /** @event init listeners....*/
        var init_enable = this._debug()._enable;
        window.addEventListener("load", function() {
            myListeners.init(init_enable, myObj);
        	},
        false);
      	}, 1500, TYPE_REPEATING_PRECISE);			

    },

	reinit: function(obj) {
		if( (obj === null) || (obj === undefined) ) {
			obj = JavaLoader.getOpenPGPObject();
    	}
		var test = obj.testOpenPGP();
    	dump("-----------> testing: " + test + "\n");
        var prefs = getPreferences();
        var control = initialise.Extension(prefs, obj);
        if (!control) {
            monitor.messageAlert(strbundle.getString("scramble.keychainproblem"), true);
            prefs.setCharPref(KEYChainPath, FAIL);
        }
		return control;
	},

    // ***************************************************************************
    // **                                                                       **
    // **                     -  Crypto Related Functions -                     **
    // **                                                                       **
    // ***************************************************************************
    /**
	 *	Function to encrypt a given string (str).
	 *  @public
	 *  @param str The text to decrypt.
	 *  @param publicKey if not given then is asked to the user. The public Key used to encrypt the text.
	 *  @param {boolean} flag true if TinyLink false otherwise
	 *  @returns {String} Encrypted value or FAIL
	 */
    encrypt: function(str, publicKeys, flag, obj) {
        // doLog("Kernel: encrypt");
        monitor.log(this._debug()._name, "encrypt", this._debug()._enable);

        if ((flag === undefined) || (flag === null)) {
            flag = false;
        }

        var strbundle = document.getElementById(BUNDLE);

        // Preliminary Tests...
        if (str.search(PGPstart) > -1) {
            monitor.log(this._debug()._name, strbundle.getString("encrypt.present"), this._debug()._enable);
            return FAIL;
        } else if (str == "") {
            monitor.log(this._debug()._name, strbundle.getString("scramble.noTextSelected"), this._debug()._enable);
            return FAIL;
        }

		var openpgp;						
		if( (obj != undefined) || (obj != undefined))
		 	openpgp = obj;


		var params = {
            selected_items: [],
            control: true,
			javaobj: openpgp
        };


        // Open the Key manager dialog
        params = dialogLoader.keyChainDialog(params);

        if (!params.control) {
            return FAIL;
        } else if ((params.control) && (params.selected_items.length < 1)) {
            return CNL;
        }

        publicKeys = params.selected_items;

        var userKey = this.getDefaultKey();

        if ((userKey != FAIL) && (userKey !== "")) {
            if (publicKeys.indexOf(userKey) != -1) {
                var user_publicKey = new Array(userKey);
                publicKeys = user_publicKey.concat(publicKeys);
            }
        }

        // Encrypt according to the retrieve data...
        var result = cryptobridge.encrypt(str, publicKeys, openpgp);

        if (result.result !== 0) {
            if (result.result == 1) {
                dump("Encryption canceled...\n");
                monitor.log(this._debug()._name, strbundle.getString("encrypt.canceled"), this._debug()._enable);
            } else {
                monitor.log(this._debug()._name, strbundle.getString("scramble.gnupgerror"), this._debug()._enable);
                dump("GPG Error...\n");
            }

            return FAIL;
        } else if ((result.output == FAIL) || (result.output.substring(0, 4) == FAIL)) {
            monitor.log(this._debug()._name, strbundle.getString("encrypt.notsuccess"), this._debug()._enable);
            return FAIL;
        }

        var ret = this.enablePrime(result.output);

        // If tinyLink is enabled with exception from the crypto text editor console...
        if (!flag) {
            if (this.isTinyLinkSet()) {
                ret = this.setTinyLink(ret);
            }
        }

        return ret;
    },

    /**
	 *	Function to decrypt a given string (str).
	 *  @public
	 *	@param str The text to decrypt.
	 *  @param privateKey if not given then is asked to the user. The private Key used to decrypt the text.
	 *  @returns {String} Decrypted value or FAIL
	 */
    decrypt: function(str, privateKey, flag, obj) {
        // use decrypt function
        // doLog("Kernel: decrypt");
        monitor.log(this._debug()._name, "decrypt", this._debug()._enable);

        if ((flag === undefined) || (flag === null)) {
            flag = false;
        }
        var strbundle = document.getElementById(BUNDLE);

        var savedPassword = FAIL;
        if ((privateKey === undefined) || (privateKey === null)) {
            savedPassword = this.getSKey();
        } else {
            savedPassword = privateKey;
        }

        if ((savedPassword !== null) && (savedPassword != '') && (savedPassword != FAIL)) {
            privateKey = savedPassword;
        } else if ((savedPassword == FAIL) || (savedPassword === null) || (savedPassword == '')) {

            var params = dialogLoader.pwdDialog();

            if (params.result) {
                if (params.pwd != "") {
                    privateKey = params.pwd;
                    if (params.pwd_checkbox) {
                        this.saveSKey(privateKey);
                        savedPassword = privateKey;
                    }
                } else {
                    monitor.log(this._debug()._name, strbundle.getString("pwd.empty"), this._debug()._enable);
                }
            } else {
                monitor.log(this._debug()._name, strbundle.getString("scramble.cancelop"), this._debug()._enable);
                return FAIL;
            }
        } else {
            return FAIL;
        }

        // In case of the URI and if its not requested from crypto text editor console...
        if ((!flag) && (str.indexOf(PLURLstart) > -1)) {
            str = str.replace(PLURLstart, " ");
            str = str.replace(PLURLend, " ");
            // str = strTrim(str, "");
            // srt = str.replace(/\\n/g, "");
            str = strTrim(str.replace(new RegExp("[\\s]*", "g"), ""), '');
			str = strTrim(str);
			// dump(str+" <<<<   ------- enc.url\n");
            str = this.getTinyLink(str);

            // dump("\n----------------BEFORE----------------\n");
            // dump(str+"\n");
            // dump("-----------------------------------------\n");
            if ((str.indexOf("\r\n\r\n") > 0) && (detectOS() != WIN)) {
                str = str.replace(/\n/g, "");
            }
        }

        str = this.disablePrime(str);

        // dump("\n----------------AFTER----------------\n");
        // dump(str+"\n");
        // dump("-----------------------------------------\n");
		var openpgp;						
		if( (obj != undefined) || (obj != undefined))
		 	openpgp = obj;
		
        var defaultkey = this.getDefaultKey();
        var result = cryptobridge.decrypt(str, privateKey, defaultkey, openpgp);
        // dump("\n----------------DEC----------------\n");
        // dump(result.result+"\n");
        // dump("-----------------------------------------\n");
        if (result.result !== 0) {
            if (result.result == 3) {
                // dump("Invalid password...\n");
                monitor.log(this._debug()._name, strbundle.getString("pwd.invalid"), this._debug()._enable);
            } else {
                // var restes = strbundle.getString("scramble.gnupgerror");
                // dump("GPG Error... ---> " + restes + "\n");
                monitor.log(this._debug()._name, strbundle.getString("scramble.gnupgerror"), this._debug()._enable);
                // dump("GPG Error... ---> " + result.result + "\n");
            }

            return FAIL;
        } else if (result.output == FAIL) {
            monitor.log(this._debug()._name, strbundle.getString("decrypt.notsuccess"), this._debug()._enable);
            return FAIL;
        }
        return result.output;
    },


    /**
	 *	Function to list all the keys from the keyring...
	 *  @public 
	 *  @returns {Array} with all public keys
	 */
    listKeys: function(obj) {
        // doLog("Kernel: listKeys");
        monitor.log(this._debug()._name, "listKeys", this._debug()._enable);
        return cryptobridge.listKeys(obj);
    },

    /**
	 *	Function list all the keys from the keyring...
	 *  @public
	 *  @returns {Array} with list of secret keys
	 */
    listSecretKeys: function(obj) {
        // doLog("Kernel: listSecretKeys");
        monitor.log(this._debug()._name, "listSecretKeys", this._debug()._enable);
        return cryptobridge.listSecretKeys();
    },

    /**
	 *	Function Get master key from the keyring...
	 *  @public
	 *  @returns {String} with the master key
	 */
    getMasterKey: function(obj) {
        // doLog("Kernel: listSecretKeys");
        monitor.log(this._debug()._name, "get Master Key", this._debug()._enable);
        return cryptobridge.getMasterPublicKey(obj);
    },


    /**
	 *	Function to add a new key to the keyring...
	 *  @public
	 *	@param publickey publickey value
	 *  @returns {String} Success or FAIL
	 */
    addNewKey: function(publickey, obj) {
        doLog("Kernel: addNewKey");
        monitor.log(this._debug()._name, "addNewKey", this._debug()._enable);
        return cryptobridge.addNewKey(publickey, obj);
    },

    /**
	 *	Function to delete a key from the key ring
	 *  @public
	 *	@param keyId Key Id to be deleted
	 *  @returns Decrypted String or FAIL
	 */
    delPublicKey: function(keyId, obj) {
        // doLog("Kernel: delPublicKey");
        monitor.log(this._debug()._name, "deletePublicKey", this._debug()._enable);
        return cryptobridge.delPublicKey(keyId, obj);
    },


    /**
	 *	Function to set a key as the default one
	 *  @public
	 *	@param keyID 
	 */
    setDefaultKey: function(keyID) {
        // doLog("Kernel: defaultKey");
        monitor.log(this._debug()._name, "setDefaultKey [" + keyID + "]", this._debug()._enable);

        // var ret = cryptobridge.setDefaultKey(keyID);
        // if(!ret) {
        //     var strbundle = document.getElementById(BUNDLE);
        //     monitor.messageAlert(strbundle.getString("keyRing.defaultKey"), true);
        // } else {
        var prefs = getPreferences();
        prefs.setCharPref(defaultkey, keyID);
        // }
    },

    /**
	 *	Function to get default key
	 *  @public
	 *  @returns {String} keyId
	 */
    getDefaultKey: function() {
        // doLog("Kernel: defaultSKey");
        monitor.log(this._debug()._name, "getDefaultKey ", this._debug()._enable);
        var prefs = getPreferences();
        return prefs.getCharPref(defaultkey);
    },



    // ***************************************************************************
    // **                                                                       **
    // **                   -  TinyLinks Related Functions -                    **
    // **                                                                       **
    // ***************************************************************************
    /**
	 *	Function to evaluate if the tinylink option is set
	 *  @public
	 *  @returns {boolean} true or false
	 */
    isTinyLinkSet: function() {
        monitor.log(this._debug()._name, "isTinyLinkSet", this._debug()._enable);
        // doLog("Kernel: isTinyLinkSet");
        var branch = getPreferences();
        return branch.getBoolPref(TinyLink);
    },

    /**
	 *	Function to set the encrypted value into a tinylink
	 *  @public
	 *	@param text text value 
	 *  @returns {String} TinyLink or FAIL
	 */
    setTinyLink: function(text) {
        // doLog("Kernel: setTinyLink");
        monitor.log(this._debug()._name, "setTinyLink", this._debug()._enable);
        var url = this.getTinyServer();
		text = text.replace(/\+/g, "%2B");
		text = "text="+text;
        var ret = myAjax.postinServer(url, text);
        if (ret != FAIL) {
			var page = htmlactions.getPageContent().URL;
			if(page.indexOf("facebook") > -1) {
				ret = ret.substring(7, ret.length);
			}
			
            ret = PLURLstart + "\n" + ret + "\n" + PLURLend;
        } else {
			messageAlert("TinyLink Server Connection Problem", true);
		}
        return ret;

    },

    /**
	 *	Function to get the text from the tinyLink value
	 *  @public
	 *	@param url url of the tinyLink
	 *  @returns {String} value on the tinylink or FAIL
	 */
    getTinyLink: function(url) {
        doLog("Kernel: getTinyLink: ");
        monitor.log(this._debug()._name, "getTinyLink [" + url + "]", this._debug()._enable);
		var page = htmlactions.getPageContent().URL;
		// dump(url+ "<<<<<--old url\n");
		if(page.indexOf("facebook") > -1) { 
			var str = String.fromCharCode(104,116,116,112,58,47,47); //http:// string in unicode (to avoid encoding)
			url = strTrim(str)+strTrim( url.charCodeAt(0) == 116 ? url : url.substring(1,url.length) );
			// dump("\nstring: ")
			var new_url = url;
			for(var i=0; i < new_url.length; i++) {
				dump(new_url.charCodeAt(i)+",");
			}
			// dump("\n\n");
			
			// dump(String.fromCharCode(104,116,116,112,58,47,47,8206,116,105,110,121,117,114,108,46,99,111,109,47,50,102,117,116,118,56,97)+"\n");
			// dump("normal: "+new_url+"\n");
			// dump("New unescaped: "+url+"\n");
		} 
		// dump(url+ "<<<<<--new url <-\n");
        var ret = myAjax.callServer(unescape(url));
		if (ret == FAIL) {
			messageAlert("TinyLink Server Connection Problem", true);
		}
        return ret;
    },

    /**
	 *	Function to get the tinylink server url set on the preferences
	 *  @public
	 *  @returns {String} Tiny server url
	 */
    getTinyServer: function() {
        // doLog("Kernel: getTinyServer");
        monitor.log(this._debug()._name, "getTinyServer", this._debug()._enable);
        var prefs = getPreferences();
        var server = prefs.getCharPref("tinylinks_server");
        return server;
    },

    /**
	 *	Function to set the tinyserver url in the preferences
	 *  @public
	 *	@param serverURL server url
	 */
    setTinyServer: function(serverURL) {
        // doLog("Kernel: setTinyServer");
        monitor.log(this._debug()._name, "setTinyServer [" + serverURL + "]", this._debug()._enable);
        var prefs = getPreferences();

        if ((serverURL === null) || (serverURL === undefined)) {
            serverURL = prefs.getCharPref("tinylinks_default");
        }

        prefs.setCharPref("tinylinks_server", serverURL);
    },

    // ***************************************************************************
    // **                                                                       **
    // **             -   PrimeLife labeling Related Functions -                **
    // **                                                                       **
    // ***************************************************************************
    /**
	 *	Function to enable primelife labeling
	 *  @public
	 *	@param text The encrypted text
	 *  @returns {String} Text with prime label or FAIL
	 */
    enablePrime: function(text) {
        // doLog("Kernel: enablePrime");
        if (text.indexOf(PGPstart) > -1) {
            //PrimeLife Encryption
            text = text.replace(PGPstart, PLstart);
            text = text.replace(PGPend, PLend);
            return text;
        } else {
            return FAIL;
        }
    },

    /**
	 *	Function to disable the primelife labeling
	 *  @public
	 *	@param text The text with the prime label
	 *  @returns {String} clean text or FAIL
	 */
    disablePrime: function(text) {
        // doLog("Kernel: disablePrime");
        if (text.indexOf(PLstart) > -1) {
            //PrimeLife Encryption
            text = text.replace(PLstart, PGPstart);
            text = text.replace(PLend, PGPend);
            return text;
        } else if (text.indexOf(PLURLstart) > -1) {
            // PrimeLife URL Encryption
            text = text.replace(PLstart, PGPstart);
            text = text.replace(PLend, PGPend);
            return text;
        } else if (text.indexOf(PGPstart) > -1) {
            return text;
        } else {
            return FAIL;
        }
    },

    /**
	 *	Function to enable primelife labeling link
	 *  @public
	 *	@param text The tiny link text
	 *  @returns {String} Text with prime link label or FAIL
	 */
    enablePrimeLink: function(text) {
        // doLog("Kernel: enablePrimeLink");
        if (text.indexOf(PLstart) > -1) {
            //PrimeLife Encryption
            text = text.replace(PLstart, PGPstart);
            text = text.replace(PLend, PGPend);
            return text;
        } else if (text.indexOf(PLURLstart) > -1) {
            // PrimeLife URL Encryption
            text = text.replace(PLstart, PGPstart);
            text = text.replace(PLend, PGPend);
            return text;
        } else if (text.indexOf(PGPstart) > -1) {
            return text;
        } else {
            return FAIL;
        }
    },

    // ***************************************************************************
    // **                                                                       **
    // **                   -  Password Related Functions -                     **
    // **                                                                       **
    // ***************************************************************************
    /**
	 *	Function to save the secret key into the preferences
	 *  @public
	 *	@param key the key value (password style)
	 */
    saveSKey: function(key, flag) {
        monitor.log(this._debug()._name, "saveSKey", this._debug()._enable);
        // doLog("Kernel: saveSKey");
        var prefs = getPreferences();
        // prefs.setCharPref(KeyPref, key);
		var hostname = prefs.getCharPref("name");
		var formSubmitURL = null;
		var httprealm = null;
		var username = hostname;
		if(flag == undefined) {flag = false;}
		
        try {
		   	// Create a LoginInfo
			var myLoginManager = Components.classes["@mozilla.org/login-manager;1"].
				getService(Components.interfaces.nsILoginManager);
			
			var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",  
					Components.interfaces.nsILoginInfo,  "init");
				
			var loginInfo = new nsLoginInfo(hostname, null, hostname, username, key, "", "");
			// add to the manager...
			myLoginManager.addLogin(loginInfo);  				

			
        } catch(ex) {  
			// This will only happen if there is no nsILoginManager component class
			// Key already exists... modifyLogin is basically an erase+add thus:
			if(!flag) { //just try one time
				this.eraseSKey();
				this.saveSKey(key, true);
			}
		}

        // var loginInfo = new nsLoginInfo(hostname, formSubmitURL, httprealm, username, password,
        // usernameField, passwordField);
    },

    /**
	 *	Function to clean the key from the preferences
	 *  @public
	 */
    eraseSKey: function() {
        // doLog("Kernel: eraseSKey");
        monitor.log(this._debug()._name, "eraseSKey", this._debug()._enable);
        // this.saveSKey(FAIL);
        var prefs = getPreferences();
		var hostname = prefs.getCharPref("name");
		// var password;
		try {  
		   // Get Login Manager   
		   	var myLoginManager = Components.classes["@mozilla.org/login-manager;1"].  
		                          getService(Components.interfaces.nsILoginManager);  

			var logins = myLoginManager.findLogins({}, hostname, null, hostname);  
			
			for (var i = 0; i < logins.length; i++) {  
			   	if (logins[i].username == hostname) {
					// dump("remove\n");
					myLoginManager.removeLogin(logins[i]);
			   	}  
			}
		}  
		catch(ex) {  
		   // This will only happen if there is no nsILoginManager component class  
		}
    },

    /**
	 *	Function to retrieve the key (password) from the preferences
	 *  @public
	 *  @returns {String} Password or FAIL
	 */
    getSKey: function() {
        // doLog("Kernel: checkKey");
        monitor.log(this._debug()._name, "getSKey", this._debug()._enable);
        var prefs = getPreferences();
		var hostname = prefs.getCharPref("name");		
        try {
			// Get Login Manager
            var myLoginManager = Components.classes["@mozilla.org/login-manager;1"].
						getService(Components.interfaces.nsILoginManager);
		   	// Find users for the given parameters
			var logins = myLoginManager.findLogins({}, hostname, null, hostname);  
			
			for (var i = 0; i < logins.length; i++) {  
			   	if (logins[i].username == hostname) {
					return logins[i].password;
			   	}  
			}
        } catch(ex) {  
			// This will only happen if there is no nsILoginManager component class
			return FAIL;	
		}
    },

    // ***************************************************************************
    // **                                                                       **
    // **                       -  Auxiliar Functions -                         **
    // **                                                                       **
    // ***************************************************************************
	
	
	runJCEUpdateScript: function() {
		dump("here............. 0\n");
        monitor.log(this._debug()._name, "runJCEUpdateScript", this._debug()._enable);
		// ask the system password if its a unix based system
		var sudo = null;
		if(detectOS() != WIN) {
			// load password dialog...
	    	var params = {
	            pwd: '',
	            pwd_checkbox: false,
	            result: true
	        };
	    	var dlg = window.openDialog(DIALOGS+"pwd.xul", "", "chrome, modal, centerscreen, toolbar", params);
	    	dlg.focus();
			if(params.result) {
				sudo = params.pwd;
			}
		} 
		runJCEScript(sudo);
	},

};