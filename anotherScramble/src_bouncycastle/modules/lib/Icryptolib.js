var EXPORTED_SYMBOLS = ["Icryptolib"];


// import the utils modules
Components.utils.import("resource://scramble/utils/monitor.js");
Components.utils.import("resource://scramble/utils/utils.js");
Components.utils.import("resource://scramble/core/coins.js");

/**
 * @fileOverview Contains the functions to make the bridge between the app and the OpenPGP methods
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

// ***************************************************************************
// **                                                                       **
// **                     -  Cryptobridge Functions -                       **
// **                                                                       **
// ***************************************************************************

const Cc = Components.classes;
const Ci = Components.interfaces;


/**
 * This is the main class to access the java XPCOM component object of the OpenPGP (JavaLoader)
 * @class This is the main class to access the java XPCOM component object of the OpenPGP (JavaLoader)
 */
var Icryptolib = {
	
	/**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "Icryptolib",
            _enable: true
        };
		var prefs = scrambleUtils.getPreferences();
        var debug = prefs.getBoolPref("debug");
		params._enable = debug;
        return params;
    },

	testObj: function() {
	    // monitor.log(this._debug()._name, "testObj", this._debug()._enable);
		if( (openpgp != null) && (openpgp !== undefined) )
			return openpgp.obj.testOpenPGP();
		return vars._FAIL;
	},

	
	/**
	 *	Function to get the GnuPG version
	 *  @public
	 *  @result {String} String containing the version value
	 *  @throws {Exception} In case of xpcom component failure
	 */
	gnuPGversion: function() {
	    monitor.log(this._debug()._name, "gnuPGversion", this._debug()._enable);
		var test = openpgp.obj.testOpenPGP();
		// dump("next ---> ["+test+"]\n");
		return test;
	},
	
	/**
	 *	Function to get the GnuPG path value
	 *  @public
	 *  @result {String} String containing the path value
	 *  @throws {Exception} In case of xpcom component failure
	 */
    gnuPGpath: function() {
        monitor.log(this._debug()._name, "gnuPGpath", this._debug()._enable);
		return this.gnuPGversion();
    },
	
	/**
	 *  Function to list all keys from the key server
	 *  @public
	 *  @returns array with all the public keys, or null
	 *  @throws {Exception} In case of xpcom component failure	
	 */
	listKeys: function() {
        monitor.log(this._debug()._name, "list Public Keys", this._debug()._enable);		
		// id, expirationdate, fingerprint, keyname, subkeys
		var result = [];
		
		try {	
		    if(openpgp.obj !== null) {
				result = openpgp.obj.listPublicKeys();
				// if( (result !== null) && (result.length > 0) ) {
				// 	dump("\n-------------------------------------------\n");
				// 	for(var h = 0 ; h < result.keylist.length; h++) {
				// 	dump(result.keylist[h].keyName+"\n"+result.keylist[h].keyMail+"\n");
				// 	dump(result.keylist[h].keyId+"\n"+result.keylist[h].fingerPrint+"\n");
				// 	dump("-- -- -- -- -- -- -- -- -- -- --\n");
				// 	}
				// 	dump("-------------------------------------------\n");
				// }
			} else {
				result = null;
			}
			return result;
		} catch (e) {
		    return null;
            monitor.exception(this._debug()._name, e, this._debug()._enable);
		}
	},
	
	/**
	 *	Function to list all secret keys from the key ring
	 *  @public
	 *  @returns array with all the secret keys, or null
	 *  @throws {Exception} In case of xpcom component failure	
	 */
	listSecretKeys: function() {
        monitor.log(this._debug()._name, "list Secret Keys", this._debug()._enable);

		// id, expirationdate, fingerprint, keyname, subkeys
		var result = [];
		try {
		    if(openpgp.obj !== null) {
				result = openpgp.obj.listSecretKeys();
				// if( (result.keylist.length > 0) && (result.keylist !== null) ) {
				//                     dump("\n-------------------------------------------\n");
				//                         for(var h = 0 ; h < result.keylist.length; h++) {
				//                             dump(result.keylist[h].keyName+"\n"+result.keylist[h].keyMail+"\n");
				//                             dump(result.keylist[h].keyId+"\n"+result.keylist[h].fingerPrint+"\n");
				//                             dump("-- -- -- -- -- -- -- -- -- -- --\n");
				//                         }
				//                     dump("-------------------------------------------\n");                    
				// } 
			} else {
				result = null;
			}
			return result;
		} catch (e) {
            return null;
            monitor.exception(this._debug()._name, e, this._debug()._enable);            
		}
	},
	
	/**
	 *	Function to encrypt a given text to recipients
	 *  @public
	 *  @param text the text to be encrypted
	 *  @param {Array} recipients with the ID's of the required recipients
	 *  @returns {cryptObject} cryptObject with the encrypted text and results
	 *  @throws {Exception} In case of xpcom component failure	
	 */
	encrypt: function(text, recipients) {
        monitor.log(this._debug()._name, "encrypt", this._debug()._enable);	    
		try {
			monitor.log(this._debug()._name, "openpgp: " + openpgp.obj, this._debug()._enable);	  
			monitor.log(this._debug()._name, "text: " + text, this._debug()._enable);	
			monitor.log(this._debug()._name, "recipients: " + recipients, this._debug()._enable);
			
		    if(openpgp.obj !== null) {
                // var ret = openpgp.obj.testcrypt();
                var ret = openpgp.obj.encrypt(text, recipients);
				// dump("result: "+ret+"\n");
				return ret;
			} else {
			    return null;
			}

		} catch(e) { 
		    monitor.exception(this._debug()._name, e, this._debug()._enable);
			return null;
		}		
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
	decrypt: function(text, pwd) {
        monitor.log(this._debug()._name, "decrypt", this._debug()._enable);	    
		try {
			var result;
			
		    if(openpgp.obj !== null) {
				return openpgp.obj.decrypt(text, pwd); 
			} else {
				return null;
			}
		} catch(e) { 
		    monitor.exception(this._debug()._name, e, this._debug()._enable);
			return null;
		}
	},
	
	steganography: function(text, dummytext, recipients) {
        monitor.log(this._debug()._name, "steganography", this._debug()._enable);	
//        log.removeAllAppenders();
//        log.addAppender("start logging");
//
//        log.info("Icryptolib.js - steganography - plaintext: " + text + ", dummytext: " + dummytext + ";\n");

		if (recipients.length === 0) {
			return null;
		}
			
		try {

		    if(openpgp.obj !== null) {
				var result = openpgp.obj.execSteg(text, dummytext, recipients);
				monitor.log(this._debug()._name, "result: " + result , this._debug()._enable);
				return result;
			} else {
			    return null;
			}
		    
		} catch(e) { 
		    monitor.exception(this._debug()._name, e, this._debug()._enable);
			
		}
		
		return null;		
	},
	
	
	steganalysis: function(aeskey, data, dataType, pw) {
        monitor.log(this._debug()._name, "steganography", this._debug()._enable);	
		try {

		    if(openpgp.obj !== null) {
				 var plaintext =  openpgp.obj.undoSteg(aeskey, data, dataType, pw);
		        monitor.log(this._debug()._name, "plaintext: " + plaintext, this._debug()._enable);
		        return plaintext;
			} else {
			    return null;
			}
		    
		} catch(e) { 
		    monitor.exception(this._debug()._name, e, this._debug()._enable);
			
		}
		
		return null;		
	},
	
	/**
	 *	Function to add a new public key to the key ring
	 *  @public
	 *  @param key the public key value
	 *  @result {cryptObject} cryptObject containing the result
	 *  @throws {Exception} In case of xpcom component failure
	 */	
	addNewKey: function(key) {
        monitor.log(this._debug()._name, "add New Key: " + key, this._debug()._enable);
		try {
				
		    if(openpgp.obj !== null) {
				var openPgpKey = openpgp.obj.addPublicKey(key);
				monitor.log(this._debug()._name, "key added: " + openPgpKey, this._debug()._enable);
				return openPgpKey;
			} else {
				monitor.log(this._debug()._name, "Problem loading the openpgp object ", this._debug()._enable);
				return null;
			}
		} catch(e) {
			monitor.log(this._debug()._name, "Exception while adding new key " + e, this._debug()._enable);
			return null;
		}
	},
	
	/**
	 *	Function to delete a public key from the key ring
	 *  @public
	 *  @param key the public key ID
	 *  @result {boolean} true or false
	 *  @throws {Exception} In case of xpcom component failure
	 */	
	delPublicKey: function(keyID) {
        monitor.log(this._debug()._name, "delete Public Key", this._debug()._enable);
		try {
		    
		    if(openpgp.obj !== null) {
				return openpgp.obj.deletePublicKey(keyID);
			} else {
				return false;
			}
		} catch(e) { 
				return false;
            monitor.exception(this._debug()._name, e, this._debug()._enable);
		}
	},

    
	/**
	 *	Function to generates a new key pair
	 *  @public
	 *  @result {boolean} true or false
	 *  @throws {Exception} In case of xpcom component failure
	 */
    genKeyPair: function(userId, pwd, size, pubpath, secpath) {
		monitor.log(this._debug()._name, "generate Key Pairs ["+this.testObj()+"]", this._debug()._enable);
        
		try {
		    if(openpgp.obj !== null) {
		        //get publicring +secring from the path
		        var ret;
		        if(size == 0) {
		            size = 1024;
		        }
		        monitor.log(this._debug()._name, "pubpath: " + pubpath, this._debug()._enable);
		        monitor.log(this._debug()._name, "secpath: " + secpath, this._debug()._enable);
				// dump("---------------------\nPUBnew:["+pubpath+"] \n---------------------\nSECnew:["+secpath+" ]\n---------------------\n");
                if(( (pubpath === null) || (pubpath === undefined) ) && 
                        ( (secpath === null) || (secpath === undefined) )){
                    ret = openpgp.obj.generateKeyRing(userId, pwd, size);
                    monitor.log(this._debug()._name, "ret: " + ret, this._debug()._enable);

                } else {
                    // dump("---------------------\nPUB:["+pubpath+"] \n---------------------\nSEC:["+secpath+" ]\n---------------------\n");
                    // dump("---------------------\nUID:["+userId+"] \n---------------------\nPwd:["+pwd+" ]\n---------------------\n");
				    ret = openpgp.obj.generateKeyRing(userId, pwd, size, pubpath, secpath);		 
				    monitor.log(this._debug()._name, "ret: " + ret, this._debug()._enable);
                    // ret = openpgp.generateKeyRing(userId, pwd, size);
					// dump(ret+" <---------------- RESULT \n");
			    }
				return (ret ? true : false);
			}
			return false;
		} catch(e) { 
            monitor.exception(this._debug()._name, "Exception."+e, this._debug()._enable);
			return false;
		}
		
	},
	
	
	/**
	 *	Function that returns the master public key
	 *  @public
	 *  @result {boolean} true or false
	 *  @throws {Exception} In case of xpcom component failure
	 */	
	getMasterPublicKey: function() {
		monitor.log(this._debug()._name, "get Master Public Key", this._debug()._enable);
		var pubkey = null;
		try {
		    if(openpgp.obj !== null) {
		    	pubkey = openpgp.obj.getMasterPublicKey();
                
			} 
		} catch(e) { 
			monitor.log(this._debug()._name, "exception: " + e, this._debug()._enable);
            monitor.exception(this._debug()._name, e, this._debug()._enable);
		}
		monitor.log(this._debug()._name, "pubkey: " + pubkey, this._debug()._enable);
		return pubkey;	
	},
	
	
	//openpgp class should be of type scramble
	publishKeyToFacebook: function() {
		monitor.log(this._debug()._name, "publishing Master Public Key on Facebook", this._debug()._enable);
		var result = false;
		try {
			if(openpgp.obj !== null) {
				openpgp.obj.publishPublicKeyToFacebook();
				result = true;
			}
		} catch(e) {
			monitor.exception(this._debug()._name, e, this._debug()._enable);
		}
		return result;
	}
};
