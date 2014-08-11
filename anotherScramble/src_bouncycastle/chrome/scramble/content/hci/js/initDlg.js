/**
 * @fileOverview Initialisation Dialog contains the functions that control the initialisation dialog
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

// ***************************************************************************
// **                                                                       **
// **                  -  Initialisation Dialog class -                     **
// **                                                                       **
// ***************************************************************************


// import the utils modules
Components.utils.import("resource://scramble/utils/utils.js");
Components.utils.import("resource://scramble/utils/monitor.js");
Components.utils.import("resource://scramble/utils/IOxml.js");

// import the core modules
Components.utils.import("resource://scramble/core/coins.js");
Components.utils.import("resource://scramble/core/kernel.js");

const Cc = Components.classes;
const Ci = Components.interfaces;

/** 
  *	Class that contains the functions that control the initialisation dialog
  *	@class Class that contains the functions that control the initialisation dialog
  */
var initdlg = {
	
	// to control flow on the tabs... in fact just the 2nd one is important.
	tabs_result : [true, false, true, true],
	_BUNDLE: "scramble_strings",
	
	/**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "initialisationDlg",
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
        // sizeToContent();
        monitor.log(this._debug()._name, "onLoad ["+kernel.testObj()+"]", this._debug()._enable);
		// scrambleAppNS.dialogLoader.testBla();
		if(window.arguments == undefined) {
			return;
		}
        var params = window.arguments[0];
	},
	
	/**
	 *  Function that allows moving the tabs... if some required event is not finished/done the tab gets red
     *  @function
	 *  @param
     */
	onTabChange: function() {
		monitor.log(this._debug()._name, "onTabChange", false);		
		// monitor.log(this._debug()._name, "onTabChange", this._debug()._enable);
		var tab = document.getElementById("initialiseTabs");
		var next = tab.selectedIndex;
		var setup = this.tabs_result[next];
		tab.selectedTab.style.color = ( setup  ? 'black' : 'red');
		
		next += 1;
		switch(next) {
			case 1: // disclamer -> setup
				tab.selectedIndex = next;
				tab.selectedTab.style.color = 'black';
		  		break;			
            // -----------------------------    
            // commented for CMU tests...
            // case 2: // setup -> contacts
            //     tab.selectedIndex = next;
            //     tab.selectedTab.style.color = 'black';
            //               break;
            // 
            // case 3: //contacts -> finish!
            // -----------------------------
            case 2:
				tab.selectedIndex = next;
				// The only obligatory stage to complete is the 2nd one (index 1) -> keys then if this one is false then...
				// finish is also false, otherwise if contacts loaded is false that does not change final result 
				if(this.tabs_result[1] == false) { 
					this.tabs_result[this.tabs_result.length-1] = false; 
					tab.selectedTab.style.color = 'red' ;
				}
				else {
					tab.selectedTab.style.color = 'black' ;
				}
				this.produceReport();
		  	break;
		
			default: //finish (exit)
		  		tab.selectedIndex = next-1;
                // if(next == 4) { commented for CMU tests...
				if(next == 3) {                    
					if(!this.tabs_result[this.tabs_result.length-1]) {
						var strbundle = document.getElementById(this._BUNDLE);
						var msg = strbundle.getString("scramble.initfinish");
						var params = scrambleAppNS.dialogLoader.warningDialog(msg);
						if(params.result) {
							window.arguments[0].result = false;
							window.close();
						}
					} else {
						window.arguments[0].result = true;
						window.close();
					}
				}
		}

	},
	
	/**
	 *  Function that closes the dialog...
     *  @function
	 *  @param
     */		
	onCancel: function() {
		var strbundle = document.getElementById(this._BUNDLE);
		var msg = strbundle.getString("scramble.initfinish");
		var params = scrambleAppNS.dialogLoader.warningDialog(msg);
		if(params.result) {
			window.arguments[0].result = false;
			window.arguments[0].pwd_value = "";
			window.close();
		}
	},
	
	/**
	 *  Function that double checks the state when the tab element is clicked
     *  @function
	 *  @param
     */	
	onTabSelect: function() {
		monitor.log(this._debug()._name, "onTabSelect", false);
		// monitor.log(this._debug()._name, "onTabSelect", this._debug()._enable);
		var tab = document.getElementById("initialiseTabs");
		// The only obligated stage to complete is the 2nd one (index 1) -> keys then if this one is false then...
		// finish is also false, otherwise if contacts loaded is false that does not change final result 		
		if(this.tabs_result[1] == false) { this.tabs_result[this.tabs_result.length-1] = false; }
		
		for(var i=1; i < this.tabs_result.length; i++) {
			if(tab.tabs.getItemAtIndex(i).style.color != '') {
				tab.tabs.getItemAtIndex(i).style.color = ( this.tabs_result[i] ? 'black' : 'red' );
			}
		}		
		this.produceReport();
	},
	
	/**
	 *  Function that produces the final report of all stages in the tabs
     *  @function
	 *  @param
     */
	produceReport: function() {

        monitor.log(this._debug()._name, "produceReport", this._debug()._enable);
        
        var strbundle = document.getElementById(this._BUNDLE);
        
        var defined = strbundle.getString("scramble.defined");
        var not_defined = strbundle.getString("scramble.notdefined");
		var allstages = this.tabs_result[this.tabs_result.length-1];
        var keys = ( this.tabs_result[1] ? defined : not_defined );
		var fb = ( this.tabs_result[2] ? defined : not_defined );
		if(!allstages) {
			document.getElementById("finish").value= "Initialisation Process Incomplete!";
			document.getElementById("notfinish").style.display = "block";
    	}
        document.getElementById('result_sk').value = "Secret Key: "+keys;
        document.getElementById('result_pwd').value = "Password: "+keys;
        document.getElementById('result_pk').value = "Public Keys: "+keys;
        document.getElementById('result_fb').value = "Facebook Imported (Optional): "+fb;
	},
	
	
	/**
	 *  Function to generate a new key pair
	 *  @public
	 */
    onGenKeyPair: function() {
		monitor.log(this._debug()._name, "onGenKeyPair", this._debug()._enable);

        var tab = document.getElementById("initialiseTabs").selectedIndex;		        
        var params = {
            userid: '',
            pwd: '',
            bitsize: 0, 
			javaobj: null,
            result: false
        };
        params = scrambleAppNS.dialogLoader.keyPairGenDialog(params);
		dump("Starting generating the key ["+params+"]\n")
        if(params.result) {
			params.javaobj = window.arguments[0].javaobj;
			window.arguments[0].pwd_value = params.pwd;			
			params = scrambleAppNS.dialogLoader.keyGenDialog(params);	
			this.tabs_result[tab] = params.result;
        } else {
			this.tabs_result[tab] = false;
		}
    },
	
	/**
	 *  Function to import old key pair
	 *  @public
	 */
	onImportKeyPair: function() {
		var strbundle = document.getElementById(this._BUNDLE);
		
		var msg = strbundle.getString("scramble.importWarn")+" "+strbundle.getString("scramble.keys.importWarn");
		var params = scrambleAppNS.dialogLoader.warningDialog(msg);
		
		var tab = document.getElementById("initialiseTabs").selectedIndex;
		var flag = false;

		if(params.result) {
			// First select the Public Key ... only after the associated secret key
			var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
			fp.init(window, strbundle.getString("scramble.keys.publickey") , Ci.nsIFilePicker.modeOpen);
			fp.appendFilters(Ci.nsIFilePicker.filterAll);
			var file = null;
			if ( fp.show() == Ci.nsIFilePicker.returnOK ) {
		        file = fp.file; //.path;
		    }
			var flag = false;
			var msg;
			if(file != null) {
				var pkpath = file.path;
				//we have a new path to save...  
				var dirSer_comp = Components.classes["@mozilla.org/file/directory_service;1"];
				var dirService = dirSer_comp.getService(Components.interfaces.nsIProperties); 
				// returns an nsIFile object from the current profile directory
				var file = dirService.get("ProfD", Components.interfaces.nsIFile); 	            
				var extension_optdir = file.path+"/"+vars._EXTDIR;
				
				//get the secret key ring path...	
				var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
				fp.init(window, strbundle.getString("scramble.keys.secretkey") , Ci.nsIFilePicker.modeOpen);
				fp.appendFilters(Ci.nsIFilePicker.filterAll);
				if ( fp.show() == Ci.nsIFilePicker.returnOK ) {
			        file = fp.file; //.path;
			    }
				
				if(file != null) {
					var skpath = file.path;
					var result = scrambleUtils.copyFile(pkpath, extension_optdir, vars._EXTPUBRINGFILE);
					if(!result) {
						msg = strbundle.getString("scramble.group.restoreFail")
							+" "+strbundle.getString("scramble.keys.skProblem");
					} else {
						result = scrambleUtils.copyFile(skpath, extension_optdir, vars._EXTSECRINGFILE);
						if(!result) {
							msg = strbundle.getString("scramble.group.restoreFail")
								+" "+strbundle.getString("scramble.keys.skProblem");
						} else {
							flag = true;
							msg = strbundle.getString("scramble.group.restoreSucc");
						}
					}
				} else {
					msg =  strbundle.getString("scramble.group.restoreFail");
				}
			} else {
				msg = strbundle.getString("scramble.group.restoreFail");
			}
			
			this.tabs_result[tab] = flag;
			alert(msg);
		} else {
			this.tabs_result[tab] = false;
			alert("Import Key pair Aborted!");
		}

		facebook.init();
		
	},
	
	/**
	 *	Function that loads the Facebook contacts keys for those using Scramble!
	 *	Will be called from the login procedure
	 *  @function
	 *  @param the access token
	 */
	connectToFacebook: function(token) {
		monitor.log(this._debug()._name, "connectToFacebook", this._debug()._enable);
		// var openpgp = JavaLoader.getOpenPGPObject();
		var openpgp = openpgp.obj;
		//initialize the facebook stuff
		openpgp.setAccessToken(token);
		
		//post the key on facebook
		if( !openpgp.publishPublicKeytoFacebook() ) {
			monitor.exception("connectToFacebook Exception", e, true);
			return false;
		}
		//get list of fb friends currently using facebook
		// var users = (Array) openpgp.retrieveScrambleUsersFromFacebook();
		var users = openpgp.retrieveScrambleUsersFromFacebook();
		
		//add a new group called "Facebook" to the xml-file

		var groups = IOxml.getGroups(IOxml._AG);
		var exists = false;
		
		if(groups.length != 0) {
			for(var i = 0; i < groups.length; i++) {
				if(groups[i].Name == "Facebook") {
					exists = true;
					break;
				}
			}
		}
		
		if(!exists)	{
			IOxml.addNewGroup("Facebook", "automatically added contacts from facebook");
		}
		//add all the contacts from facebook to the xml-file, don't now how it knows the name though...
		for(var i = 0; i < users.length; i++) {
			kernel.addNewKey(users.getKey());
			//IOXML.addNewMember(users.getName(), users.getKey(), users.getId(), "Facebook", "30.2.2020");		
		}
	}
};
