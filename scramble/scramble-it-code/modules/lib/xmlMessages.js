// const {components} = require("chrome");
// const {NetUtil} = components.utils.import("resource://gre/modules/NetUtil.jsm");
const EXPORTED_SYMBOLS = ["xmlMessages"];

// set constants
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Components.utils.import("resource://scramble/utils/monitor.js");
Components.utils.import("resource://scramble/utils/utils.js");
Components.utils.import("resource://scramble/core/coins.js");

// request types of messages
const ENC = "encryption";
const DEC = "decryption";
const LIST = "list";
const PK = "publickey";
const LSK = "listskeys";
const ADD = "addpk";
const RM = "removepk";
const GEN = "genkeypair";
const EPK = "expPK"; // export public key
const BYE = "bye";

// Elements available
const TYPE = "type";
const REST = "result";
const TXT = "text";
const RECS = "recipients";
const REC = "recipient";
const PWD = "pwd";
const PPATH = "publicpath";
const SPATH = "secretpath";

let xmlMessages = {

    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
            _name: "xmlMessages",
            _enable: true
        };
        var prefs = scrambleUtils.getPreferences();
        var debug = prefs.getBoolPref("debug");
        params._enable = debug;
        return params;
    },

    /**
     *  Function to serialize the XMLDocument to String
     *  @public
     *  @param oDOM <DOM Document>
     *  @returns {String} <string>
     */    
    serialize: function(oDOM) {
        var oSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
            .createInstance(Components.interfaces.nsIDOMSerializer);
        var str = oSerializer.serializeToString(oDOM);
        dump("\n\n------------------------------------------------\n");
        dump("------------------------------------------------\n"); 
        dump(str);
        dump("\n------------------------------------------------\n");
        dump("------------------------------------------------\n\n");
        return str;
    },


    // --------------------------------------------------------
    // ---          Process the return xml messages         ---
    // --------------------------------------------------------
    processReply: function(xmlDoc) {
        var oParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
                     .createInstance(Components.interfaces.nsIDOMParser);
        var oDOM = oParser.parseFromString(xmlDoc, "text/xml");
        var result = oDOM.getElementsByTagName("result");
        return result[0].textContent;
    },

    processDecReply: function(xmlDoc) {
        var oParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
                     .createInstance(Components.interfaces.nsIDOMParser);
        var oDOM = oParser.parseFromString(xmlDoc, "text/xml");
        var result = oDOM.getElementsByTagName("result");
        var url = oDOM.getElementsByTagName("url");
        return [result[0].textContent,url[0].textContent];
    },

    processListReply: function(xmlDoc) {
        var oParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
                     .createInstance(Components.interfaces.nsIDOMParser);
        var oDOM = oParser.parseFromString(xmlDoc, "text/xml");
        var result = oDOM.getElementsByTagName("result");        
    },

	_pk: function() {
	    this.keyMail = null;
	    this.keyId = null;
	    this.keyName = null;
	    this.fingerPrint = null;
	    this.keyExpi = "Scramble";
	},

    processPublicKeyReply: function(xmlDoc) {
        var oParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
                     .createInstance(Components.interfaces.nsIDOMParser);
        var oDOM = oParser.parseFromString(xmlDoc, "text/xml");
        // define key type
        var key = new xmlMessages._pk();
        var keyItem = oDOM.getElementsByTagName("key")[0].attributes;
        var keyId = keyItem.getNamedItem("id");
        key.keyId = keyId.nodeValue;
        var keyName = oDOM.getElementsByTagName("name");
        key.keyName = keyName[0].textContent;
        var keyMail = oDOM.getElementsByTagName("email");
        key.keyMail = keyMail[0].textContent;        
        var keyFinger = oDOM.getElementsByTagName("fingerprint");
        key.fingerPrint = keyFinger[0].textContent;
        return key;
    },

    // --------------------------------------------------------
    // ---       Construct the XML request messages         ---
    // --------------------------------------------------------

    /**
     *  Function to contruct the base of the XMLRequestMessage
     *  @public
     *  @param type <Type of Message>
     *  @returns {DOM Document} <base xml request document>
     */
    general: function(type) {
        var oParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
            .createInstance(Components.interfaces.nsIDOMParser);
        var msg = "<scramble></scramble>"
        var oDOM = oParser.parseFromString(msg, "text/xml");
        var root = oDOM.documentElement;

        // creting type 
        var typeElem = oDOM.createElement(TYPE);
        typeElem.appendChild(oDOM.createTextNode(type));

        // create elements for public and secret path
        var preferences = scrambleUtils.getPreferences();
        var ppath = preferences.getCharPref(vars._PubRingPath);
        var spath = preferences.getCharPref(vars._SecRingPath);
                
        var ppElem = oDOM.createElement(PPATH);
        ppElem.appendChild(oDOM.createTextNode(ppath));
        var spElem = oDOM.createElement(SPATH);
        spElem.appendChild(oDOM.createTextNode(spath));

        // add elements to root
        root.appendChild(typeElem);
        root.appendChild(ppElem);
        root.appendChild(spElem);
        return oDOM;
    },

    /**
     *  Function the simple XMLRequestMessage
     *  @public
     *  @param type <Type of Message>
     *  @returns {DOM Document} <simple xml request document>
     */
    simple: function(type, text) {
        var oDOM = this.general(type);

        // create the text to encrypt
        var textElem = oDOM.createElement(TXT);
        textElem.appendChild(oDOM.createTextNode(text));
        // add new elements
        oDOM.documentElement.appendChild(textElem);
        // dump("\nDOM:\n"+this.serialize(oDOM)+"\n\n");
        return oDOM;
    },

    /**
     *  Function to contruct the encryption XMLRequestMessage
     *  @public
     *  @param type <Type of Message>
     *  @returns {DOM Document} <xml request document>
     */
    encrypt: function(text, recipients) {
        dump("encrypt\n");
        var oDOM = this.general(ENC);

        // create the text to encrypt
        var textElem = oDOM.createElement(TXT);
        textElem.appendChild(oDOM.createTextNode(text));

        // create the recipients list
        var recipientsElem = oDOM.createElement(RECS);
        for (var i = 0; i < recipients.length; i++) {
            var recipientElem = oDOM.createElement(REC);
            recipientElem.appendChild(oDOM.createTextNode(recipients[i]))
            recipientsElem.appendChild(recipientElem);
        }
        // add new elements
        oDOM.documentElement.appendChild(textElem);
        oDOM.documentElement.appendChild(recipientsElem);
        return oDOM;
    },

    /**
     *  Function to contruct the decryption XMLRequestMessage
     *  @public
     *  @param text <Message to Decrypt>
     *  @param pwd <Password>
     *  @returns {DOM Document} <xml request document>
     */
    decrypt: function(text, pwd, url) {
        dump("decrypt\n");
        var oDOM = this.general(DEC);

        // create the text to encrypt
        var textElem = oDOM.createElement(TXT);
        textElem.appendChild(oDOM.createTextNode(text));

        var urlElem = oDOM.createElement("url");
        if(url === undefined || url == null) url = "NONE";
        urlElem.appendChild(oDOM.createTextNode(url));

        // create the recipients list
        var pwdElem = oDOM.createElement(PWD);
        pwdElem.appendChild(oDOM.createTextNode(pwd));

        // add new elements
        oDOM.documentElement.appendChild(textElem);
        oDOM.documentElement.appendChild(urlElem);        
        oDOM.documentElement.appendChild(pwdElem);

        return oDOM;
    },

    /**
     *  Function to contruct the list of public keys XMLRequestMessage
     *  @public
     *  @param type <Type of Message>
     *  @returns {DOM Document} <xml request document>
     */
    listKeys: function() {
        dump("listKeys\n");
        var oDOM = this.simple(LIST, "");
        return oDOM;
    },


    /**
     *  Function to contruct the list of secret keys XMLRequestMessage
     *  @public
     *  @param type <Type of Message>
     *  @returns {DOM Document} <xml request document>
     */
    listSecretKeys: function() {
        dump("listSecretKeys\n");
        var oDOM = this.simple(LSK, "");
        return oDOM;
    },
    
    
    getMasterPKey: function() {
        dump("getMasterPublicKey\n");
        var oDOM = this.simple(EPK);
        return oDOM;
    },

    /**
     *  Function to contruct the addNewKey XMLRequestMessage
     *  @public
     *  @param key <key>
     *  @returns {DOM Document} <xml request document>
     */
    addNewKey: function(key) {
        dump("addNewKey\n");
        var oDOM = this.simple(ADD, key);
        return oDOM;
    },

    /**
     *  Function to contruct the remove Public Key XMLRequestMessage
     *  @public
     *  @param keyID <KeyID>
     *  @returns {DOM Document} <xml request document>
     */
    delPublicKey: function(keyID) {
        dump("delPublicKey\n");
        var oDOM = this.simple(RM, keyID);
        return oDOM;
    },

    /**
     *  Function to contruct the generate key pair XMLRequestMessage
     *  @public
     *  @param userID <userID>
     *  @param pwd <Password>
     *  @param size <size of the keys>
     *  @param pubpath <Path of the public key ring>
     *  @param secpath <Path of the secret key ring>
     *  @returns {DOM Document} <xml request document>
     */
    genKeyPair: function(userId, pwd, size, pubpath, secpath) {
        dump("genKeyPair\n");
        var oDOM = this.general(GEN);

        // create the text to encrypt
        var textElem = oDOM.createElement(TXT);
        textElem.appendChild(oDOM.createTextNode(userId));

        // create the pwd - DO IT AS AN ATTRIBUTE + SIZE
        textElem.setAttribute(PWD, pwd);
        textElem.setAttribute("size", size);

        // add new elements
        oDOM.documentElement.appendChild(textElem);
        // oDOM.documentElement.appendChild(pwdElem);
        return oDOM;
    },

    /**
     *  Function to contruct the publish Public Key to Facebook XMLRequestMessage
     *  @public
     *  @param type <Type of Message>
     *  @returns {DOM Document} <xml request document>
     */
    publishKeyToFacebook: function() {
        dump("publishKeyToFacebook\n");
    },


};
