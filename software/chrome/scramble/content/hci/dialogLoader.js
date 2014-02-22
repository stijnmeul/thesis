/**
 * @fileOverview Contains the dialog loaders functions for the extension
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
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
var dialogLoader = {
    /**
     *	Function that loads the about window
     *  @public
     *  @returns {window} About Window
     */	
    aboutMenu: function() {
        doLog("dialogLoader: aboutDlg");
        var dlg = window.openDialog(DIALOGS+"about.xul", "", "chrome, centerscreen, toolbar");
        dlg.focus();
	},
	
	initialisationDialog: function(params) {
        doLog("dialogLoader: initialisationDlg");	    
    	// Open the Initialisation Manager dialog
    	var dlg = window.openDialog(DIALOGS+"initDlg.xul","", "chrome, dialog, modal, resizable=yes", params);
    	dlg.focus();
        return params;
    },

    /**
     *	Function that loads the key chain window
     *  @public
     *  @returns {window} Key Chain Window
     */
    keyChainDialog: function(params) {
    	doLog("dialogLoader: keychainDlg ["+params+"]");
    	if(params === undefined) {
    	    params = { control: false };
    	} 
    	var dlg = window.openDialog(DIALOGS+"keychain.xul", "", "chrome, centerscreen, toolbar, modal", params);
        dlg.focus();
        
        return params;
    },

    /**
     *	Function that loads the Settings dialog window
     *  @public
     *  @returns {window} Settings Window
     */
    settingsDialog: function(params) {
    	doLog("dialogLoader: settingsDlg");
    	var dlg = window.openDialog(DIALOGS+"new_settings.xul", "", "chrome,titlebar,toolbar,centerscreen,dialog=yes", params);
    	dlg.focus();
        return params;
    },

    /**
     *	Function that loads the Crypto Dialog window
     *  @public
     *  @returns {window} Crypto Dialog Window
     */
    textDialog: function(inputValue, obj) {
    	doLog("dialogLoader: textDlg: ");
    	var pref = {
    	    str: " ",
    	    result: true, 
			javaobj: null
    	};

		if( (obj !== undefined) || (obj !== null))
			pref.javaobj = obj;
    	if( (inputValue === null) || (inputValue === undefined) ) {
    		pref.result = false;
    		pref.str = " ";
    	} else {
            pref.result = true;
            pref.str = inputValue;
    	}

    	var dlg = window.openDialog(DIALOGS+"cryptDlg.xul", "", "chrome, centerscreen, dialog, modal, resizable=yes", pref);
    	dlg.focus();

    	return pref;
    },
    
    /**
     *	Function that loads the New Group Dialog window
     *  @public
     *  @returns {window} New group Window
     */
    newgroupDialog: function() {
    	doLog("dialogLoader: newgroupDlg");
    	var params = {result: false, value: ''};
    	var dlg = window.openDialog(DIALOGS+"newgroup.xul", "", "chrome, modal, centerscreen, toolbar", params);
    	dlg.focus();

        return params;
    },
    
    /**
     *	Function that loads the Deletion Dialog window
     *  @public
     *  @returns {window} Deletion Dialog Window
     */
    deletionDialog: function(params) {
    	doLog("dialogLoader: deletionDlg");
    	var dlg = window.openDialog(DIALOGS+"deletion.xul", "", "chrome, modal, centerscreen, toolbar", params);
    	dlg.focus();

        return params;
    },
    
    
    /**
     *	Function that loads the Password Dialog window
     *  @public
     *  @returns {window} Password Dialog Window
     */
    pwdDialog: function() {
    	doLog("dialogLoader: pwdDlg");
    	var params = {
            pwd: '',
            pwd_checkbox: false,
            result: false
        };
    	var dlg = window.openDialog(DIALOGS+"pwd.xul", "", "chrome, modal, centerscreen, toolbar", params);
    	dlg.focus();
        return params;
    },
    
    /**
     *	Function that loads the Key pair generation Dialog window
     *  @public
     *  @returns {window} the parameters for the key pair...
     */
    keyPairGenDialog: function(params) {
    	doLog("dialogLoader: keyPairGenDlg");
    	var dlg = window.openDialog(DIALOGS+"genkey.xul", "", "chrome, modal, centerscreen, toolbar", params);
    	dlg.focus();

        return params;
    },  

    /**
     *	Function that loads the Warning Dialog window
     *  @public
     *  @returns {window} Warning Dialog Window
     */
    warningDialog: function(msg, alert) {
    	doLog("dialogLoader: warningDlg");
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
    	var dlg = window.openDialog(DIALOGS+"warning.xul", "", "chrome, modal, centerscreen, toolbar", params);
    	dlg.focus();
        return params;
    },
    
};