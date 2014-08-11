const EXPORTED_SYMBOLS = ["kernel"];

Components.utils.import("resource://scramble/utils/monitor.js");
Components.utils.import("resource://scramble/utils/utils.js");
Components.utils.import("resource://scramble/core/coins.js");
// Components.utils.import("resource://scramble/lib/Icryptolib.js");
Components.utils.import("resource://scramble/utils/socket.js");
Components.utils.import("resource://scramble/lib/xmlMessages.js");

/**
 * @fileOverview Contains the data for the bridge between the application and the crypto
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @author <a href="mailto:iulia.ion@inf.ethz.ch">Iulia Ion</a>
 * @version 1.0
 */

// set constants
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;


//***************************************************************************
//**                                                                       **
//**                    -  Main Kernel App Functions -                     **
//**                                                                       **
//***************************************************************************
/** 
 *	Acts as the Main Core, Contains the data for the bridge between the application and the crypto
 *	@class Class that acts as the Main Core, contains the main application functions, acting like the main kernel
 */
let kernel = {

    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
            _name: "Kernel",
            _enable: true
        };
        var prefs = scrambleUtils.getPreferences();
        var debug = prefs.getBoolPref("debug");
        params._enable = debug;
        return params;
    },


    callSocket: function(req, callback) {
        let port = 6666;
        let host = "localhost";
        var str = xmlMessages.serialize(req);
        var onResponseDone = function(rcv) {
            // dump("###### Kernel->callback->socket reply\n");
            callback(rcv);
        };
        // dump("kernel.callsocket-> "+str+"\n");
        socket.connect(host, port, str, onResponseDone);
    },

    copyToClipboard: function(str) {
        // Copy each of the encryption to the clipboard
        const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                                   .getService(Components.interfaces.nsIClipboardHelper);
        gClipboardHelper.copyString(str);
    },


    // ***************************************************************************
    // **                                                                       **
    // **                     -  Crypto Related Functions -                     **
    // **                                                                       **
    // ***************************************************************************
    /**
     *	Function to encrypt a given string (str).
     *  @public
     *  @param str The text to encrypt.
     *  @param publicKey if not given then is asked to the user. The public Key used to encrypt the text.
     *  @param {boolean} flag true if TinyLink false otherwise
     *  @returns {String} Encrypted value or null
     */
    encrypt: function(str, publicKeys, flag, callback) {
        monitor.log(this._debug()
            ._name, "encrypt", this._debug()
            ._enable);
        var strbundle = vars.bundle;

        if ((flag === undefined) || (flag === null)) {
            flag = false;
        }

        monitor.log(this._debug()
            ._name, "publicKeys: " + publicKeys, this._debug()
            ._enable);
        monitor.log(this._debug()
            ._name, "adding the owner to the encryption list...", this._debug()
            ._enable);
        // add the owner to the encryption list
        var userKey = this.getDefaultKey();
        if ((userKey != vars._FAIL) && (userKey !== "")) {
            if (publicKeys.indexOf(userKey) != -1) {
                var user_publicKey = [userKey]; //new Array(userKey);
                publicKeys = user_publicKey.concat(publicKeys);
            }
        }
        monitor.log(this._debug()
            ._name, "publicKeys: " + publicKeys, this._debug()
            ._enable);


        // Encrypt according to the retrieve data...
        var msg = xmlMessages.encrypt(str, publicKeys);

        // Analyse the result in the callback...        
        onDoneEncrypt = function(result) {
            var strbundle = vars.bundle;
            if (result.substring(0, 4) == vars._FAIL) {
                monitor.log(kernel._debug()
                    ._name, strbundle.getString("encrypt.notsuccess") + result.substring(4, result.length), kernel._debug()
                    ._enable);
                // return null;
            } else if (result == null) {
                // then the java object vars._FAILed to load
                monitor.log(kernel._debug()._name, strbundle.getString("scramble.javaobjproblem"), kernel._debug()._enable);
                // return null;
            } else {
                // var ret = this.enablePrime(result);
                var data = xmlMessages.processReply(result);
                data = atob(data);
                if (data == "error") { dump("error!"); return; }
                dump("\n\n ----- DATA ------ \n"+data+"\n\n");                
                callback(data);
            }
        }

        kernel.callSocket(msg, onDoneEncrypt)
    },

    /**
     *	Function to decrypt a given string (str).
     *  @public
     *	@param str The text to decrypt.
     *  @param privateKey if not given then is asked to the user. The private Key used to decrypt the text.
     *  @returns {String} Decrypted value or null
     */
    decrypt: function(str, privateKey, callback) {
        // use decrypt function.
        var onDoneDecrypt = function(result) {
            dump("kernel.decrypt.result -> "+result[0]+"\n");
            callback(result[0]);
        }
        kernel.decryptAuto(str, privateKey, "NONE", onDoneDecrypt);
    },

    decryptAuto: function(str, privateKey, url, callback) {
        // use decrypt function
        monitor.log(this._debug()
            ._name, "decrypt", this._debug()
            ._enable);
        if (str === null) return null;
        // Encrypt according to the retrieve data...
        //encode base 64
        var data = btoa(str);
        var msg = xmlMessages.decrypt(data, privateKey, url);
        // Analyse the result...
        var onDoneDecryptAuto = function(result) {
            var strbundle = vars.bundle;
            monitor.log(kernel._debug()._name, "decrypt.callback called 1 ("+result+")", kernel._debug()._enable);                
            if (result.substring(0, 4) == vars._FAIL) {
                monitor.log(kernel._debug()
                    ._name, strbundle.getString("decrypt.notsuccess") + result.substring(4, result.length), kernel._debug()
                    ._enable);
                return null;
            } else if (result == null) {
                // then the java object vars._FAILed to load
                monitor.log(kernel._debug()._name, strbundle.getString("s."), kernel._debug()
                    ._enable);
                return null;
            } else {
                var data = xmlMessages.processDecReply(result);
                monitor.log(kernel._debug()._name, "decrypt.callback called 2("+data[1]+") -> ["+data[0]+"]", kernel._debug()._enable);                
                callback(data);
            }
        }
        kernel.callSocket(msg, onDoneDecryptAuto);
    },

    /**
     *	Function to encrypt a given string (str).
     *  @public
     *  @param str The text to decrypt.
     *  @param publicKey if not given then is asked to the user. The public Key used to encrypt the text.
     *  @param {boolean} flag true if TinyLink false otherwise
     *  @returns {String} Encrypted value or vars._FAIL
     */

    steganography: function(str, dummytext, publicKeys, flag) {
        monitor.log(this._debug()
            ._name, "### kernel - steganography: ", this._debug()
            ._enable);

        if ((flag === undefined) || (flag === null)) {
            flag = false;
        }

        var userKey = this.getDefaultKey();

        if ((userKey != false) && (userKey !== "")) {
            if (publicKeys.indexOf(userKey) != -1) {
                var user_publicKey = [userKey]; //new Array(userKey);
                publicKeys = user_publicKey.concat(publicKeys);
            }
        }

        // Encrypt according to the retrieve data...
        var result = Icryptolib.steganography(str, dummytext, publicKeys);
        monitor.log(this._debug()
            ._name, "result:" + result, this._debug()
            ._enable);
        return result;
    },


    steganalysis: function(aeskey, data, dataType, pw) {
        monitor.log(this._debug()
            ._name, "steganalysis", this._debug()
            ._enable);
        monitor.log(this._debug()
            ._name, "aeskey: " + aeskey, this._debug()
            ._enable);
        monitor.log(this._debug()
            ._name, "data: " + data, this._debug()
            ._enable);
        monitor.log(this._debug()
            ._name, "pw: " + pw, this._debug()
            ._enable);

        return Icryptolib.steganalysis(aeskey, data, dataType, pw);
    },


    /**
     *	Function to list all the keys from the keyring...
     *  @public
     *  @returns {Array} with all public keys
     */
    listKeys: function() {
        monitor.log(this._debug()
            ._name, "listKeys", this._debug()
            ._enable);

        var msg = xmlMessages.listKeys();
        var onDoneListkeys = function(result) {
            // dump("\n ==============  RESULT ============== \n");
            // dump(result);
            // dump("\n ===================================== \n");
        }
        // dump(" step 4\n")
        kernel.callSocket(msg, onDoneListkeys);
        // return Icryptolib.listKeys();
    },

    /**
     *	Function list all the keys from the keyring...
     *  @deprecated
     *  @public
     *  @returns {Array} with list of secret keys
     */
    listSecretKeys: function() {
        monitor.log(this._debug()
            ._name, "listSecretKeys", this._debug()
            ._enable);
    },

    /**
     *	Function to generates a new key pair
     *  @public
     *  @result {boolean} true or false | using a callback
     *  @throws {Exception} In case of xpcom component failure
     */
    generateKeyPair: function(userId, pwd, size, pubpath, secpath, callback) {
        monitor.log(this._debug()
            ._name, "generateKeyPair", this._debug()
            ._enable);
        // create the xml message
        var req = xmlMessages.genKeyPair(userId, pwd, size, pubpath, secpath);
        // use this function as a callback to process the data...
        // var onDone = function(data) {
        //     dump("result: "+data+"\n");
        //     dump("REPLY: "+xmlMessages.processReply(data)+"\n");
        // };
        // communicate with server using socket
        kernel.callSocket(req, callback);
    },


    /**
     *	Function Get master key from the keyring...
     *  @public
     *  @deprecated
     *  @returns {String} with the master key
     */
    getMasterKey: function(callback) {
        monitor.log(this._debug()
            ._name, "get Master Key", this._debug()
            ._enable);
        var msg = xmlMessages.getMasterPKey();
        kernel.callSocket(msg, callback);

    },


    /**
     *	Function to add a new key to the keyring...
     *  @public
     *	@param publickey publickey value
     *  @returns {boolean} true or false
     */
    addNewKey: function(publickey, callback) {
        monitor.log(this._debug()
            ._name, "addNewKey", this._debug()
            ._enable);
        var key = btoa(publickey);
        var msg = xmlMessages.addNewKey(key);
        kernel.callSocket(msg, callback);
    },

    /**
     *	Function to delete a key from the key ring
     *  @public
     *	@param keyId Key Id to be deleted
     *  @returns {boolean} true or false
     */
    delPublicKey: function(keyId, callback) {
        monitor.log(this._debug()
            ._name, "deletePublicKey", this._debug()
            ._enable);
        var msg = xmlMessages.delPublicKey(keyId);
        kernel.callSocket(msg, callback);
    },


    /**
     *	Function to set a key as the default one
     *  @public
     *	@param keyID
     */
    setDefaultKey: function(keyID) {
        monitor.log(this._debug()
            ._name, "setDefaultKey [" + keyID + "]", this._debug()
            ._enable);
        var prefs = scrambleUtils.getPreferences();
        prefs.setCharPref(vars._defaultkey, keyID);
    },

    /**
     *	Function to get default key
     *  @public
     *  @returns {String} keyId
     */
    getDefaultKey: function() {
        monitor.log(this._debug()
            ._name, "getDefaultKey ", this._debug()
            ._enable);
        var prefs = scrambleUtils.getPreferences();
        return prefs.getCharPref(vars._defaultkey);
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
        monitor.log(this._debug()
            ._name, "isTinyLinkSet", this._debug()
            ._enable);
        var branch = scrambleUtils.getPreferences();
        return branch.getBoolPref(vars._TinyLink);
    },

    /**
     *	Function to set the encrypted value into a tinylink
     *  @public
     *  @deprecated (moved to scramble.js)
     *	@param text text value
     *  @returns {String} TinyLink or null
     */
    setTinyLink: function(text) {
        monitor.log(this._debug()
            ._name, "setTinyLink-1", this._debug()
            ._enable);
        var url = this.getTinyServer();
        text = text.replace(/\+/g, "%2B");
        text = "text=" + text;
        var ret = myAjax.postinServer(url, text);
        if (ret != null) {
            var page = htmlactions.getPageContent();
            if (page != null) {
                page = page.URL;
                if (page.indexOf("facebook") > -1) {
                    ret = ret.substring(7, ret.length);
                }
            }
            ret = vars._PLURLstart + "\n" + ret + "\n" + vars._PLURLend;
        } else {
            monitor.log(this._debug()
                ._name, "TinyLink Server Connection Problem", this._debug()
                ._enable);
        }
        return ret;

    },

    /**
     *	Function to get the text from the tinyLink value
     *  @public
     *  @deprecated (moved to scramble.js)
     *	@param url url of the tinyLink
     *  @returns {String} value on the tinylink or null
     */
    getTinyLink: function(url) {
        monitor.log(this._debug()
            ._name, "getTinyLink [" + url + "]", this._debug()
            ._enable);
        var page = htmlactions.getPageContent()
            .URL;
        if (page.indexOf("facebook") > -1) {
            var str = String.fromCharCode(104, 116, 116, 112, 58, 47, 47);
            //http:// string in unicode (to avoid encoding)
            url = scrambleUtils.strTrim(str) + scrambleUtils.strTrim(url.charCodeAt(0) == 116 ? url : url.substring(1, url.length));
            var new_url = url;
            for (var i = 0; i < new_url.length; i++) {
                // dump(new_url.charCodeAt(i) + ",");
            }
        }
        var ret = myAjax.callServer(unescape(url));
        if (ret == null) {
            monitor.log(this._debug()
                ._enable, "TinyLink Server Connection Problem", true);
        }
        return ret;
    },

    /**
     *	Function to get the tinylink server url set on the preferences
     *  @public
     *  @returns {String} Tiny server url
     */
    getTinyServer: function() {
        //pimp
        monitor.log(this._debug()
            ._name, "getTinyServer", this._debug()
            ._enable);
        var prefs = scrambleUtils.getPreferences();
        var server = prefs.getCharPref("tinylinks_server");
        // dump("server: " + server + "\n");
        return server;
    },

    /**
     *	Function to set the tinyserver url in the preferences
     *  @public
     *	@param serverURL server url
     */
    setTinyServer: function(serverURL) {
        monitor.log(this._debug()
            ._name, "setTinyServer [" + serverURL + "]", this._debug()
            ._enable);
        var prefs = scrambleUtils.getPreferences();

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
     *  @returns {String} Text with prime label or null
     */
    enablePrime: function(text) {
        if (text.indexOf(vars._PGPstart) > -1) {
            //PrimeLife Encryption
            text = text.replace(vars._PGPstart, vars._PLstart);
            text = text.replace(vars._PGPend, vars._PLend);
            return text;
        } else {
            return null;
        }
    },

    /**
     *	Function to disable the primelife labeling
     *  @public
     *	@param text The text with the prime label
     *  @returns {String} clean text or null
     */
    disablePrime: function(text) {
        if (text.indexOf(vars._PLstart) > -1) {
            //PrimeLife Encryption
            text = text.replace(vars._PLstart, vars._PGPstart);
            text = text.replace(vars._PLend, vars._PGPend);
            return text;
        } else if (text.indexOf(vars._PLURLstart) > -1) {
            // PrimeLife URL Encryption
            text = text.replace(vars._PLstart, vars._PGPstart);
            text = text.replace(vars._PLend, vars._PGPend);
            return text;
        } else if (text.indexOf(vars._PGPstart) > -1) {
            return text;
        } else {
            return null;
        }
    },

    /**
     *	Function to enable primelife labeling link
     *  @public
     *	@param text The tiny link text
     *  @returns {String} Text with prime link label or null
     */
    enablePrimeLink: function(text) {
        if (text.indexOf(vars._PLstart) > -1) {
            //PrimeLife Encryption
            text = text.replace(vars._PLstart, vars._PGPstart);
            text = text.replace(vars._PLend, vars._PGPend);
            return text;
        } else if (text.indexOf(vars._PLURLstart) > -1) {
            // PrimeLife URL Encryption
            text = text.replace(vars._PLstart, vars._PGPstart);
            text = text.replace(vars._PLend, vars._PGPend);
            return text;
        } else if (text.indexOf(vars._PGPstart) > -1) {
            return text;
        } else {
            return null;
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
        monitor.log(this._debug()
            ._name, "saveSKey", this._debug()
            ._enable);
        var prefs = scrambleUtils.getPreferences();
        monitor.log(this._debug()
            ._name, "prefs: " + prefs, this._debug()
            ._enable);
        var hostname =  
        monitor.log(this._debug()
            ._name, "hostname: " + hostname, this._debug()
            ._enable);
        var formSubmitURL = null;
        var httprealm = null;
        var username = hostname;
        if (flag == undefined) {
            flag = false;
        }

        try {
            // Create a LoginInfo
            var myLoginManager = Cc["@mozilla.org/login-manager;1"].
            getService(Ci.nsILoginManager);
            monitor.log(this._debug()
                ._name, "myLoginManager: " + myLoginManager, this._debug()
                ._enable);

            var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
            Ci.nsILoginInfo, "init");
            monitor.log(this._debug()
                ._name, "nsLoginInfo: " + nsLoginInfo, this._debug()
                ._enable);

            var loginInfo = new nsLoginInfo(hostname, null, hostname, username, key, "", "");
            monitor.log(this._debug()
                ._name, "loginInfo: " + loginInfo, this._debug()
                ._enable);
            // add to the manager...
            myLoginManager.addLogin(loginInfo);


        } catch (ex) {
            monitor.log(this._debug()
                ._name, "error: " + ex, this._debug()
                ._enable);
            // This will only happen if there is no nsILoginManager component class
            // Key already exists... modifyLogin is basically an erase+add thus:
            if (!flag) {
                //just try one time
                this.eraseSKey();
                this.saveSKey(key, true);
            }
        }
    },

    /**
     *	Function to clean the key from the preferences
     *  @public
     */
    eraseSKey: function() {
        monitor.log(this._debug()
            ._name, "eraseSKey", this._debug()
            ._enable);
        var prefs = scrambleUtils.getPreferences();
        var hostname = prefs.getCharPref("name");
        try {
            // Get Login Manager
            var myLoginManager = Cc["@mozilla.org/login-manager;1"].
            getService(Ci.nsILoginManager);

            var logins = myLoginManager.findLogins({},
            hostname, null, hostname);

            for (var i = 0; i < logins.length; i++) {
                if (logins[i].username == hostname) {
                    myLoginManager.removeLogin(logins[i]);
                }
            }
            return true;
        } catch (ex) {
            // This will only happen if there is no nsILoginManager component class
            return false;
        }
    },

    /**
     *	Function to retrieve the key (password) from the preferences
     *  @public
     *  @returns {String} Password or null
     */
    getSKey: function() {
        monitor.log(this._debug()
            ._name, "getSKey", this._debug()
            ._enable);
        var prefs = scrambleUtils.getPreferences();
        var hostname = prefs.getCharPref("name");
        try {
            // Get Login Manager
            var myLoginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
            // Find users for the given parameters
            var logins = myLoginManager.findLogins({},
            hostname, null, hostname);

            for (var i = 0; i < logins.length; i++) {
                if (logins[i].username == hostname) {
                    return logins[i].password;
                }
            }
        } catch (ex) {
            // This will only happen if there is no nsILoginManager component class
            return null;
        }
    },


    /**
     * Function to test the java object...
     */
    testObj: function() {
        monitor.log(this._debug()
            ._name, "testJavaObject -> OK", this._debug()
            ._enable);
    },



};


