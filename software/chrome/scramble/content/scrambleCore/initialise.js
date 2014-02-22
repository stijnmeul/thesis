/**
 * @fileOverview Initialisation Class contains the functions that are used to initialise the extension
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

// ***************************************************************************
// **                                                                       **
// **                  -  Initialisation Dialog class -                     **
// **                                                                       **
// ***************************************************************************

/** 
  * Class that contains the functions that are used to initialise the preferences needed by the extension
  * @class Class that contains the functions that are used to initialise the preferences needed by the extension
  */
var initialise = {
    
    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "initialise",
          _enable: true
        };
        return params;
    },
    
    /**
	 *	Function that initialises the key chain file and syncs the keys
	 *  @function
	 *  @param preferences firefox preferences
	 *  @param params parameters
	 */
    KeyChain: function(preferences, params) {
        monitor.log(this._debug()._name, "KeyChain", this._debug()._enable);
	    try {
	        // initialize the keychain file preferences
			dump("--->>> init.keychain: ["+PATH+"]\n");
            var control = IOxml.importXML(PATH);
			dump("--->>> init.keychain control: ["+control+"]\n");
            if(!control) {
                return false;
            }
            //get profile Path
            var dirSer_comp = Components.classes["@mozilla.org/file/directory_service;1"];
            var dirService = dirSer_comp.getService(Components.interfaces.nsIProperties); 
            // returns an nsIFile object from the current profile directory
            var file = dirService.get("ProfD", Components.interfaces.nsIFile); 

            file.append(EXTDIR);
            if( (!file.exists()) || (!file.isDirectory()) ) {   // if it doesn't exist, create directory
                file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0777);
                control = true;
            } 
            var path_dir = file.path;
            
            file.append(EXTDATAFILE);
            if( !file.exists() ) {   // if it doesn't exist, create file
                monitor.log(this._debug()._name, "File do not exist - create new key ring file", this._debug()._enable);
                file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
                control = true;
            } 
            
            var path = file.path;
            
            if(control) {
                control = IOxml.saveDoc(path);
                if (control) {
                    preferences.setCharPref(KEYChainPath, path);
                } else {
					return false;
				}
            }
            //set pubring and secring locations
            var pubpath = preferences.getCharPref(PubRingPath);
            if( (pubpath === "") || (pubpath === FAIL)) {
                pubpath = path_dir+"/"+EXTPUBRINGFILE;
                preferences.setCharPref(PubRingPath, pubpath);
            } 
            var secpath = preferences.getCharPref(SecRingPath);
            if( (secpath === "") || (secpath === FAIL)) {
                secpath = path_dir+"/"+EXTSECRINGFILE;
                preferences.setCharPref(SecRingPath, secpath);
            }
            
            return control;
        } catch(e) {
            monitor.exception(this._debug()._name, e, this._debug()._enable);
            return false;
        }
	},
	
    /**
     *	Function that initialises the key chain file and syncs the keys
     *  @function
     *  @param preferences firefox preferences
     */
	Extension: function(preferences, obj) {
        monitor.log(this._debug()._name, "Extension", this._debug()._enable);
        
        //init keychain file
	    var flag =  this.KeyChain(preferences, params);
		dump("FLAG ["+flag+"]  <=========\n");
	    
	    //init secret defaultkey + password
	    var params = {
	        all_SecretKeys: [],
	        all_PublicKeys: [],
	        selected_SecretKey: FAIL, //default secret ID
	        selected_PublicKeys: [],  //Array with the selected public keys for sync
	        pwd_value: FAIL,          //default for password
	        control: 0,                //to control the dialog window
			result: false,
			javaobj: null
		};
		if( (obj===null) || (obj===undefined))
			params.javaobj = JavaLoader.getOpenPGPObject();
		else 
			params.javaobj = obj;
		
		var test = params.javaobj.testOpenPGP();
        dump("test INIT: " + test + "\n");
        
		// Open the Initialisation Manager dialog
		params = dialogLoader.initialisationDialog(params);

		if(!params.result) {
			//reset paths
			preferences.setCharPref(KEYChainPath, FAIL);
            preferences.setCharPref(PubRingPath, FAIL);
			preferences.setCharPref(SecRingPath, FAIL);
			return false;
		}
		
		//init public keys by importing it from the key ring
        if(params.selected_SecretKey != FAIL) {
            kernel.setDefaultKey(selected_SecretKey);
        }
        //init the password
        if(params.pwd_value != FAIL) {
            kernel.saveSKey(pwd_value);
        }
        
        return flag;
	}
};