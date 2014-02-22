/**
 * @fileOverview Contains the functions to make the bridge between the app and the OpenPGP methods
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

/**
 *  @class cryptObject Cyptographic Object, that is return when there is encryption/decryption + extra information
 *  @property {String} result the result of the action
 *  @property {String} output the outputed text
 *  @property {String} encrypted encrypted data (deprecated)
 *  @property {String} decrypted decrypted data (deprecated)
 *  @property {Array} keylist list of all keys
 */
function cryptObject() {
    this.result = null;
    this.ouput = null;
    this.encrypted = null;
    this.decrypted = null;
    this.keylist = null;
}


// ***************************************************************************
// **                                                                       **
// **                     -  Cryptobridge Functions -                       **
// **                                                                       **
// ***************************************************************************


/**
 * This is the main class to access the java XPCOM component object of the OpenPGP (JavaLoader)
 * @class This is the main class to access the java XPCOM component object of the OpenPGP (JavaLoader)
 */
var cryptobridge = {
	
	/**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "CryptoBridge",
          _enable: true
        };
        return params;
    },
    
	/**
	 *	Function to initialise the extension core preferences
	 *  @public
	 */
	init: function() {
        // doLog("CryptoBridge: init()");
        monitor.log(this._debug()._name, "init", this._debug()._enable);

		if ( !JavaLoader.initialise(true) ) {

			return false;
		} else {	
			
			var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);  
			const TYPE_REPEATING_PRECISE = Components.interfaces.nsITimer.TYPE_REPEATING_PRECISE;
			
            timer.init(function() {
				var myObj = JavaLoader.getOpenPGPObject();
				var test = myObj.testOpenPGP();
	      	}, 1500, TYPE_REPEATING_PRECISE);	
			return true;
		}

	},
	
	//listKeys: list all keys from the Key server
	/**
	 *  Function to list all keys from the key server
	 *  @public
	 *  @returns {cryptObject} cryptObject with the public keys list and results
	 *  @throws {Exception} In case of xpcom component failure	
	 */
	listKeys: function(obj) {
        // doLog("CryptoBridge: listkeys");
        monitor.log(this._debug()._name, "list Public Keys", this._debug()._enable);		
		// id, expirationdate, fingerprint, keyname, subkeys
		var result = new cryptObject();
		result.keylist = [];
		
		try {	
			var openpgp;		
			if((obj===undefined) || (obj===null))
		    	 openpgp = JavaLoader.getOpenPGPObject();
			else 
				openpgp = obj;
				
		    if(openpgp !== null) {
				result.keylist = openpgp.listPublicKeys();
				if( (result.keylist !== null) && (result.keylist.length > 0) ) {
					dump("\n-------------------------------------------\n");
					for(var h = 0 ; h < result.keylist.length; h++) {
					dump(result.keylist[h].keyName+"\n"+result.keylist[h].keyMail+"\n");
					dump(result.keylist[h].keyId+"\n"+result.keylist[h].fingerPrint+"\n");
					dump("-- -- -- -- -- -- -- -- -- -- --\n");
					}
					dump("-------------------------------------------\n");

					result.result = 0;
				} else {
					result.result = 1;
				}
			} else {
				result.result = 1;
			}
		} catch (e) {
		    result.result = 1;
            monitor.exception(this._debug()._name, e, this._debug()._enable);
		}

		return result;
	},
	
	/**
	 *	Function to list all secret keys from the key ring
	 *  @public
	 *  @returns {cryptObject} cryptObject with the list of secret keys and results
	 *  @throws {Exception} In case of xpcom component failure	
	 */
	listSecretKeys: function(obj) {
        // doLog("CryptoBridge: listSecretKeys");
        monitor.log(this._debug()._name, "list Secret Keys", this._debug()._enable);

		// id, expirationdate, fingerprint, keyname, subkeys
		var result = new cryptObject();
        result.keylist = [];

		try {
			var openpgp;		
			if((obj===undefined) || (obj===null))
		    	 openpgp = JavaLoader.getOpenPGPObject();
			else 
				openpgp = obj;

		    if(openpgp !== null) {
				result.keylist = openpgp.listSecretKeys();
				if( (result.keylist.length > 0) && (result.keylist !== null) ) {
                    // dump("\n-------------------------------------------\n");
                    //     for(var h = 0 ; h < result.keylist.length; h++) {
                    //         dump(result.keylist[h].keyName+"\n"+result.keylist[h].keyMail+"\n");
                    //         dump(result.keylist[h].keyId+"\n"+result.keylist[h].fingerPrint+"\n");
                    //         dump("-- -- -- -- -- -- -- -- -- -- --\n");
                    //     }
                    // dump("-------------------------------------------\n");
                    
					result.result = 0;
				} else {
					result.result = 1;
				}
			} else {
				result.result = 1;
			}
		} catch (e) {
            result.result = 1;
            monitor.exception(this._debug()._name, e, this._debug()._enable);            
		}

		return result;
	},
	
	/**
	 *	Function to encrypt a given text to recipients
	 *  @public
	 *  @param text the text to be encrypted
	 *  @param {Array} recipients with the ID's of the required recipients
	 *  @returns {cryptObject} cryptObject with the encrypted text and results
	 *  @throws {Exception} In case of xpcom component failure	
	 */
	encrypt: function(text, recipients, obj) {
        monitor.log(this._debug()._name, "encrypt", this._debug()._enable);	    
        // doLog("CryptoBridge: encrypt");
		var result = new cryptObject();

		if (recipients.length === 0) {
			result.result = 3;
			return result;
		}
			
		try {
			var openpgp;		
			if((obj===undefined) || (obj===null))
		    	 openpgp = JavaLoader.getOpenPGPObject();
			else 
				openpgp = obj;

		    if(openpgp !== null) {
				result.output = openpgp.encrypt(text, recipients);
			} else {
			    result.output = FAIL;
			}
		    
		} catch(e) { 
		    monitor.exception(this._debug()._name, e, this._debug()._enable);
			result.output = FAIL;
		}
		
		if(result.output != FAIL ) {
			result.result = 0;
		} else {
			result.result = 2;
		}
		result.encrypted = (result.result === 0) ? true : false;
		return result;		
	},
	

	/**
	 *	Function to encrypt a given text to recipients
	 *  @public
	 *  @param text the text to be encrypted
	 *  @param {Array} recipients with the ID's of the required recipients
	 *  @param defaultkey value for decryption
	 *  @returns {cryptObject} cryptObject containing the decrypted text and results
	 *  @throws {Exception} In case of xpcom component failure	
	 */	
	decrypt: function(text, pwd, defaultkey, obj) {
        monitor.log(this._debug()._name, "decrypt", this._debug()._enable);	    
        // doLog("CryptoBridge: decrypt");  
        // dump("\n"+text+"\n")
		var result = new cryptObject();

        if( (defaultkey == null) || (defaultkey == undefined) ) {
            defaultkey = "";
        }

		try {
			var openpgp;		
			if((obj===undefined) || (obj===null))
		    	 openpgp = JavaLoader.getOpenPGPObject();
			else 
				openpgp = obj;

		    if(openpgp !== null) {
				result.output = openpgp.decrypt(text, pwd); //, defaultkey);
                if(result.output == null) {
					// dump("java... deu null!\n");
                    result.output = FAIL;
                }
			} else {
				// dump("java loader... berrou!\n");
				result.output = FAIL;
			}
		} catch(e) { 
		    monitor.exception(this._debug()._name, e, this._debug()._enable);
			result.output = FAIL;
		}
		dump("Decryption: "+result.output+"\n");
		if ( (result.output != FAIL) || (result.output.substr(0, 4) != FAIL) ) {
			result.result = 0;
		} else {
			result.result = 2;	
		}
		
		result.decrypted = (result.result === 0) ? true : false;

		return result;
	},
	
	/**
	 *	Function to add a new public key to the key ring
	 *  @public
	 *  @param key the public key value
	 *  @result {cryptObject} cryptObject containing the result
	 *  @throws {Exception} In case of xpcom component failure
	 */	
	addNewKey: function(key, obj) {
        doLog("CryptoBridge: addNewKey");
        monitor.log(this._debug()._name, "add New Key", this._debug()._enable);
		var result = new cryptObject();
		try {
			var openpgp;		
			if((obj===undefined) || (obj===null))
		    	 openpgp = JavaLoader.getOpenPGPObject();
			else 
				openpgp = obj;
			
			dump("---------->>>> addkey obj: "+openpgp+"\n");
				
		    if(openpgp !== null) {
				dump("---------->>>> "+key+"\n");
				var ret = openpgp.addPublicKey(key);
				result.output = (ret ? SUCC : FAIL);
			} else {
				result.output = FAIL;
			}
			dump("---------->>>> addkey result: "+result.output+"\n");		
		} catch(e) {
		    result.output = FAIL;
            monitor.log(this._debug()._name, "list Secret Keys", this._debug()._enable);
		}

		result.result = result.output;
		
		return result;
	},
	
	/**
	 *	Function to delete a public key from the key ring
	 *  @public
	 *  @param key the public key ID
	 *  @result {cryptObject} cryptObject containing the decrypted text and results
	 *  @throws {Exception} In case of xpcom component failure
	 */	
	delPublicKey: function(keyID, obj) {
        // doLog("CryptoBridge: addNewKey");
        monitor.log(this._debug()._name, "delete Public Key", this._debug()._enable);
		var result = new cryptObject();
		try {
			var openpgp;		
			if((obj===undefined) || (obj===null))
		    	 openpgp = JavaLoader.getOpenPGPObject();
			else 
				openpgp = obj;

		    if(openpgp !== null) {
				var ret = openpgp.deletePublicKey(keyID);
				result.output = (ret ? SUCC : FAIL);
			} else {
				result.output = FAIL;
			}
		} catch(e) { 
		    result.output = FAIL;
            monitor.exception(this._debug()._name, e, this._debug()._enable);
		}
		result.result = result.output;
		
		return result;
	},


	/**
	 *	Function to set the default key from the key ring
	 *  @public
	 *  @deprecated
	 *  @param key the key ID
	 *  @result {cryptObject} cryptObject containing the decrypted text and results
	 *  @throws {Exception} In case of xpcom component failure
	 */	
	setDefaultKey: function(keyID, obj) {
        // doLog("CryptoBridge: addNewKey");
        monitor.log(this._debug()._name, "set Default Key", this._debug()._enable);
		var result = new cryptObject();
		try {
			var openpgp;		
			if((obj===undefined) || (obj===null))
		    	 openpgp = JavaLoader.getOpenPGPObject();
			else 
				openpgp = obj;

		    if(openpgp !== null) {
				var ret = openpgp.setDefaultKey(keyID);
				result.output = (ret ? SUCC : FAIL);
			} else {
				result.output = FAIL;
			}
		} catch(e) { 
		    result.output = FAIL;
            monitor.exception(this._debug()._name, e, this._debug()._enable);
		}
		result.result = result.output;
		return result;
	},


	
	/**
	 *	Function to get the GnuPG version
	 *  @public
	 *  @result {String} String containing the version value
	 *  @throws {Exception} In case of xpcom component failure
	 */
	gnuPGversion: function() {
	    monitor.log(this._debug()._name, "gnuPGversion", this._debug()._enable);
		// var result;
		// try {
			return "BouncyCastle";
		//     var openpgp = JavaLoader.getOpenPGPObject();
		// 	else
		// 		openpgp = obj;
		// 		
		//     if(openpgp !== null) {
		// 		var ret = openpgp.getVersion();
		// 		result = ret;
		// 	} else {
		// 		result = FAIL;
		// 	}
		// } catch(e) { 
		//             monitor.exception(this._debug()._name, e, this._debug()._enable);
		//             result = FAIL;
		// }		
		// return result;
	},
	
	/**
	 *	Function to get the GnuPG path value
	 *  @public
	 *  @result {String} String containing the path value
	 *  @throws {Exception} In case of xpcom component failure
	 */
    gnuPGpath: function() {
        monitor.log(this._debug()._name, "gnuPGpath", this._debug()._enable);
		var result = this.gnuPGversion();
		// try {
		//     var openpgp = JavaLoader.getOpenPGPObject();
		//     if(openpgp !== null) {
		// 		var ret = openpgp.getGnuPGPath();
		// 		result = ret;
		// 	} else {
		// 		result = FAIL;
		// 	}
		// } catch(e) { 
		//     result = FAIL;
		//             monitor.exception(this._debug()._name, e, this._debug()._enable);
		// }		
		return result;
    },
    
    genKeyPair: function(userId, pwd, size, pubpath, secpath, obj) {
        monitor.log(this._debug()._name, "generate Key Pairs", this._debug()._enable);
        
		var result = false;
		try {
			// var myObj = javawrapper.theClass.newInstance();
			// 						
			// 									var test = myObj.testOpenPGP();
			// 									dump("list test: "+test+"\n");
			// 			
			var openpgp;						
			if(obj == undefined)
		    	openpgp = JavaLoader.getOpenPGPObject();
			else
			 	openpgp = obj;
			
			dump("openpgp OBJ: "+openpgp+"\n");
			
		    if(openpgp !== null) {
		        //get publicring +secring from the path
		        var ret;
		        if(size == 0) {
		            size = 1024;
		        }
				dump("---------------------\nPUBnew:["+pubpath+"] \n---------------------\nSECnew:["+secpath+" ]\n---------------------\n");
                if(( (pubpath === null) || (pubpath === undefined) ) && 
                        ( (secpath === null) || (secpath === undefined) )){
					dump("Iam here...\n");
                    ret = openpgp.generateKeyRing(userId, pwd, size);

                } else {
                    dump("---------------------\nPUB:["+pubpath+"] \n---------------------\nSEC:["+secpath+" ]\n---------------------\n");
                    dump("---------------------\nUID:["+userId+"] \n---------------------\nPwd:["+pwd+" ]\n---------------------\n");
				    ret = openpgp.generateKeyRing(userId, pwd, size, pubpath, secpath);		            
                    // ret = openpgp.generateKeyRing(userId, pwd, size);
					dump(ret+" <---------------- RESULT \n");
			    }
				result = (ret ? true : false);
			} else {
				result = false;
			}
		} catch(e) { 
		    result = false;
            monitor.exception(this._debug()._name, e, this._debug()._enable);
		}
		
		return result;
	},
	
	getMasterPublicKey: function(obj) {
		monitor.log(this._debug()._name, "get Master Public Key", this._debug()._enable);
		var result = null;
		try {
			var openpgp;		
			if((obj===undefined) || (obj===null))
		    	 openpgp = JavaLoader.getOpenPGPObject();
			else 
				openpgp = obj;

		    if(openpgp !== null) {
				result = openpgp.getMasterPublicKey();		    
			} else {
				result = null;
			}
		} catch(e) { 
		    result = null;
            monitor.exception(this._debug()._name, e, this._debug()._enable);
		}
		return result;
	}
};