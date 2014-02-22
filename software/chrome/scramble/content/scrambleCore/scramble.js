/**
 * @fileOverview Contains a misc of functions used for/by the browser overlay as well as main function executers
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

// ***************************************************************************
// **                                                                       **
// **                 -  Dialog and Executers loaders -                     **
// **                                                                       **
// ***************************************************************************


/**
  * @class This is the class that communicates with the firefox extension menus as well as main function executers
  */
var scramble = {

	/**
	 *	Function to execute the actions of the toolbar menu
	 *  @public
	 *	@param action 
	 */
	onMenuClick: function(action) {
		doLog("ScrambleJS: scramble.onMenuClick -> "+action);
		
		var debug = true;
		// var myObj = javawrapper.theClass.newInstance();
	    var openpgp = JavaLoader.getOpenPGPObject();
		
		// this.onSetLink();
		if (action == CRYPT) { // Encrypt command
			this.executeEncryption(debug);
		} else if (action == DECRYPT) { // Decrypt command (deprecated)
			this.executeDecryption(debug);
		} else if(action == KEY_MGR) { // Key management -> groups management
			var params = {
	            selected_items: [],
	            control: true,
				javaobj: openpgp
	        };
			dialogLoader.keyChainDialog(params);
		} else if(action == ABT) { // About 						
			var test = openpgp.testOpenPGP();
			dump("test: "+test+"\n");

			dialogLoader.aboutMenu();
		} else if(action == SETT) { // Settings
		    var params = {
        	    listSKeys: [],
        	    isTinyLinkSet: false,
        	    defaultSKey: "",
				javaobj: null
        	};

        	params.listSKeys = kernel.listSecretKeys();
        	params.isTinyLinkSet = kernel.isTinyLinkSet();
			params.javaobj = JavaLoader.getOpenPGPObject();
			params = dialogLoader.settingsDialog(params);
	    	kernel.setDefaultKey(params.defaultSKey);
	    	
		} else if(action == EDITOR) { // Text Dialog
            dialogLoader.textDialog(null, openpgp);
            //             var params = {
            //              all_SecretKeys: [],
            //              all_PublicKeys: [],
            //              selected_SecretKey: FAIL, //default secret ID
            //              selected_PublicKeys: [],  //Array with the selected public keys for sync
            //              pwd_value: FAIL,          //default for password
            //              control: 0                //to control the dialog window
            // };
            // // Open the Initialisation Manager dialog
            // params = dialogLoader.initialisationDialog(params);
    	    
		} 
	},
	

	/**
	 *	Function to detect the normal click or the right mouse click
	 *  @public
	 */	
	onClick: function(event) {
		doLog("ScrambleJS: scramble.onClick");
	    if (event.button != 0) {
	        return;
		} else {
			this.onMenuClick(CRYPT);
		}
	},

    // ***************************************************************************
    // **                                                                       **
    // **                         -  Execution Functions -                      **
    // **                                                                       **
    // ***************************************************************************

    /**
    *	Function to execute decryption on Request.... Either by just decrypting the selected text or 
    *  by searching for encrypted text on the HTML page content (TBD)
    *  @deprecated from UI updates
    *  @param debug log flag    
    */
    executeDecryption: function(debug) {
        // doLog("ScrambleJS: ExecuteDecryption:\n");
        monitor.log("Scramble", "execute Decrytpion", debug);

    	var htmltext = htmlactions.getPageContent().body.innerHTML;
    
    	var ret_value = htmlactions.isEncryptionPresent(htmltext);
    	if(ret_value.result) {
    	    var startPoint = ret_value.startPoint; //= PGPstart;
    		var endPoint = ret_value.endPoint; //=PGPend;
            
    		var uri = htmlactions.getPageContent().location.href;
    		var old = htmlactions.getBlobByPos(htmltext, startPoint, endPoint);
    		// dump("->"+old+"\n");
    		var clean_old = stripHTML(old, uri);
	    	var openpgp = JavaLoader.getOpenPGPObject();
    		var dec = kernel.decrypt(clean_old, null, false, openpgp);
    		if(dec != FAIL) {
    			var strInput = htmltext.replace(old, dec);
    			htmlactions.refreshPage(strInput);
    		} else {
    			kernel.eraseSKey();
                var strbundle = document.getElementById(BUNDLE);
                var msg = strbundle.getString("decrypt.notsuccess");
    			monitor.messageAlert(msg, true);
    		}
    	}
    },
    
    /**
     *  Function to execute encryption on Request.... 
     *  Either by just encrypting the selected text or by providing a textbox for encryption
     *  @public
     *  @param debug log flag     
     */
    executeEncryption: function(debug) {
        // doLog("ScrambleJS: executeEncryption:\n");
        monitor.log("Scramble", "execute Encrytpion", debug);
       
        //disables javascript
        var pref_service = Components.classes["@mozilla.org/preferences-service;1"];
    	var preferences = pref_service.getService(Components.interfaces.nsIPrefService);
        preferences.setBoolPref("javascript.enabled",false);

    	var params = htmlactions.getSelectedTxt();
    	var value = params.nodeVal;
        var strbundle = document.getElementById(BUNDLE);    
    	if(value != "") {
    		var htmltext = htmlactions.getPageContent();
    		var uri = htmlactions.getPageContent().location.href;
    		var new_value = stripHTML(value, uri);
            // var strInputCode = htmltext.body.innerHTML;
            // var ret = this.encryptbySelection(new_value, htmltext, debug);
            var ret = this.encryptbySelection(new_value, params.node, debug);
    		if(ret == FAIL) {
                var msg = strbundle.getString("encrypt.notsuccess");
                monitor.messageAlert(msg, true);
    		}
    	}
    	else { //open window to insert text
            var msg2 = strbundle.getString("scramble.notTextSelect");
			monitor.messageAlert(msg2, true);
			var openpgp = JavaLoader.getOpenPGPObject();
    		dialogLoader.textDialog(null, openpgp);
    	}
        preferences.setBoolPref("javascript.enabled",true);
    },
    
    
    /**
     *	Function to Encrypt the selected text
     *  @public
     *	@param value text value to be encrypted
     *  @param htmlpage html content to be changed
     *  @param debug log flag
     *  @returns {String} Success or FAIL     
     */
    encryptbySelection: function(value, htmlpage, debug) {
        // doLog("ScrambleJS: encryptbySelection:");
        monitor.log("Scramble", "encrypt Selection", debug);
    	//get a function to encrypt the str

	    var openpgp = JavaLoader.getOpenPGPObject();
    	var result = kernel.encrypt(value, null, false, openpgp);
        
        if (result == CNL) {
            return SUCC;
        }
        
        if(result.substr(0, 4) != FAIL) {
            var ret = htmlactions.refreshFocus(result);
            if(ret == FAIL) {
                var isUpdated = false;
                isUpdated = htmlactions.refreshSingle(value, result, htmlpage);

                if(!isUpdated) {
                    dialogLoader.textDialog(result);
                    return SUCC;
                }                
            }
            return SUCC;
        }
        else {
            return FAIL;
        }
    }
};