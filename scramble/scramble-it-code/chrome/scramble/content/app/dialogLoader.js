/**
 * @fileOverview Contains the dialog loaders functions for the extension
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @author <a href="mailto:iulia.ion@inf.ethz.ch">Iulia Ion</a>
 * @version 1.0
 */

// ***************************************************************************
// **                                                                       **
// **                          -  Dialog loaders -                          **
// **                                                                       **
// ***************************************************************************


/**
  * @class This is the class that contains the dialog loaders functions for the extension
  */
scrambleAppNS.dialogLoader = {
	
	_DIALOGS: "chrome://scramble/content/hci/xul/",
	
	/**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "dialogLoader",
          _enable: true
        };
		var prefs = scrambleUtils.getPreferences();
        var debug = prefs.getBoolPref("debug");
		params._enable = debug;
        return params;
    },

    /**
     *	Function that loads the about window
     *  @public
     *  @returns {window} About Window
     */	
    aboutMenu: function() {
	    monitor.log(this._debug()._name, "aboutDialog", this._debug()._enable);
		var params = { version: ''};
		var pref_service = Components.classes["@mozilla.org/preferences-service;1"];
	    var preferences = pref_service.getService(Components.interfaces.nsIPrefService);
	    var branch = preferences.getBranch('extensions.scramble.');
	    params.version =  branch.getCharPref('version');
        var dlg = window.openDialog(this._DIALOGS+"about.xul", "", "chrome, centerscreen, toolbar", params);
        dlg.focus();
	},
	
	initialisationDialog: function(params) {
	    monitor.log(this._debug()._name, "initialisationDialog", this._debug()._enable);
    	// Open the Initialisation Manager dialog
    	var dlg = window.openDialog(this._DIALOGS+"initDlg.xul","", "chrome, dialog, modal, resizable=yes", params);
    	dlg.focus();
        return params;
    },

    /**
     *	Function that loads the key chain window
     *  @public
     *  @returns {window} Key Chain Window
     */
    keyChainDialog: function(params) {
	    monitor.log(this._debug()._name, "keyChainDialog", this._debug()._enable);
    	if(params === undefined) {
    	    params = { control: false };
    	} 
    	var dlg = window.openDialog(this._DIALOGS+"keychain.xul", "", "chrome, centerscreen, toolbar, modal", params);
        dlg.focus();
        
        return params;
    },

    /**
     *	Function that loads the Settings dialog window
     *  @public
     *  @returns {window} Settings Window
     */
    settingsDialog: function(params) {
	    monitor.log(this._debug()._name, "settingsDialog", this._debug()._enable);
    	var dlg = window.openDialog(this._DIALOGS+"settings.xul", "", "chrome,titlebar,toolbar,centerscreen,dialog=yes", params);
    	dlg.focus();
        return params;
    },

    /**
     *	Function that loads the Crypto Dialog window
     *  @public
     *  @returns {window} Crypto Dialog Window
     */
    textDialog: function(inputValue) {
	    monitor.log(this._debug()._name, "textDialog", this._debug()._enable);
    	var pref = {
    	    str: " ",
    	    result: true, 
    	};

    	if( (inputValue === null) || (inputValue === undefined) ) {
    		pref.result = false;
    		pref.str = " ";
    	} else {
            pref.result = true;
            pref.str = inputValue;
    	}

    	var dlg = window.openDialog(this._DIALOGS+"cryptDlg.xul", "", "chrome, centerscreen, dialog, modal, resizable=yes", pref);
    	dlg.focus();

    	return pref;
    },
    
    /**
     *	Function that loads the Crypto Dialog window
     *  @public
     *  @returns {window} Crypto Dialog Window
     */
    stegDialog: function(params) {
	    monitor.log(this._debug()._name, "stegDialog", this._debug()._enable);
    	var dlg = window.openDialog(this._DIALOGS+"stegDlg.xul", "", "chrome, centerscreen, dialog, modal, resizable=yes", params);
    	dlg.focus();

    	return params;
    },  
    
    /**
     *	Function that loads the New Group Dialog window
     *  @public
     *  @returns {window} New group Window
     */
    newgroupDialog: function() {
	    monitor.log(this._debug()._name, "newgroupDialog", this._debug()._enable);
    	var params = {result: false, value: ''};
    	var dlg = window.openDialog(this._DIALOGS+"newgroup.xul", "", "chrome, modal, centerscreen, toolbar", params);
    	dlg.focus();

        return params;
    },
    
    /**
     *	Function that loads the Deletion Dialog window
     *  @public
     *  @returns {window} Deletion Dialog Window
     */
    deletionDialog: function(params) {
	    monitor.log(this._debug()._name, "deletionDialog", this._debug()._enable);
    	var dlg = window.openDialog(this._DIALOGS+"deletion.xul", "", "chrome, modal, centerscreen, toolbar", params);
    	dlg.focus();

        return params;
    },
    
    
    /**
     *	Function that loads the Password Dialog window
     *  @public
     *  @returns {window} Password Dialog Window
     */
    pwdDialog: function() {
	    monitor.log(this._debug()._name, "pwdDialog", this._debug()._enable);
    	var params = {
            pwd: '',
            pwd_checkbox: false,
            result: false
        };
    	var dlg = window.openDialog(this._DIALOGS+"pwd.xul", "", "chrome, modal, centerscreen, toolbar", params);
    	dlg.focus();
        return params;
    },

    /**
     *	Function that loads the Key pair generation Dialog window
     *  @public params = {userid (string),pwd (string),bitsize (int),result (bool)} 
     *  @returns {window} the parameters for the key pair...
     */
    keyPairGenDialog: function(params) {
	    monitor.log(this._debug()._name, "keyPairGenDialog", this._debug()._enable);
    	var dlg = window.openDialog(this._DIALOGS+"genkey.xul", "", "chrome, modal, centerscreen, toolbar", params);
    	dlg.focus();

        return params;
    },  

    /**
     *	Function that loads the Key pair generation Dialog window
     *  @public params = {userid (string),pwd (string),bitsize (int),result (bool), javaobj (obj)} 
     *  @returns {window} the parameters for the key pair...
     */
	keyGenDialog: function(params) {
		monitor.log(this._debug()._name, "keyGenDialog", this._debug()._enable);
        var dlg = window.openDialog(this._DIALOGS+"genkeyprogress.xul", "", "chrome, centerscreen, toolbar", params);
        dlg.focus();	
		return params;
	},

    /**
     *	Function that loads the Key pair generation Dialog window
     *  @public params = {userid (string),pwd (string),bitsize (int),result (bool), javaobj (obj)} 
     *  @returns {window} the parameters for the key pair...
     */
	enctxtDialog: function(params) {
        dump("i am here\n");
		monitor.log(this._debug()._name, "enctxtDialog", this._debug()._enable);
        // var dlg = window.openDialog(this._DIALOGS+"encdlg.xul", "", "chrome, centerscreen, toolbar", params);
    	var dlg = window.openDialog(this._DIALOGS+"encdlg.xul", "", "chrome, modal, centerscreen, toolbar", params);
        
        dlg.focus();    
		return params;
	},

    /**
     *	Function that loads the Warning Dialog window
     *  @public
     *  @returns {window} Warning Dialog Window
     */
    warningDialog: function(msg, alert) {
		monitor.log(this._debug()._name, "warningDialog", this._debug()._enable);
		if(alert == undefined) {
			alert = false;
		}
    	var params = {
			msg: '',
            result: false,
			isAlert: false
        };
		params.msg = msg;
		params.isAlert = alert;
    	var dlg = window.openDialog(this._DIALOGS+"warning.xul", "", "chrome, modal, centerscreen, toolbar", params);
        return params;
    },

    /**
     *	Function that loads the Warning Dialog window
     *  @public
     *  @returns {window} Warning Dialog Window
     */
    imageDialog: function(url, sender) {
		monitor.log(this._debug()._name, "imageDialog", this._debug()._enable);
    	var params = {
			url: '',
			sender: '',
            result: false
        };
		params.url = url;
		params.sender = sender;
    	var dlg = window.openDialog(this._DIALOGS+"images.xul", "", "chrome, modal, centerscreen, toolbar", params);
        return params;
    }
    
};