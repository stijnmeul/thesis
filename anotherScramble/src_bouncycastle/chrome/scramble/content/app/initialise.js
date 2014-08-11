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
scrambleAppNS.initialise = {

    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
            _name: "initialise",
            _enable: true
        };
        var prefs = scrambleUtils.getPreferences();
        var debug = prefs.getBoolPref("debug");
        params._enable = debug;
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
        dump("Cc: " + Cc + " \nCi: " + Ci + "\n");
        try {
            // initialize the keychain file preferences
            // dump("--->>> init.keychain: ["+vars._PATH+"]\n");
            // var control = IOxml.importXML(vars._PATH);
            // dump("--->>> init.keychain control: ["+control+"]\n");
            // if(!control) {
            //     return false;
            // }
            //get profile Path

            var dirSer_comp = Cc["@mozilla.org/file/directory_service;1"];
            var dirService = dirSer_comp.getService(Ci.nsIProperties);
            // returns an nsIFile object from the current profile directory
            var file = dirService.get("ProfD", Ci.nsIFile);
            file.append(vars._EXTDIR);

            if ((!file.exists()) || (!file.isDirectory())) { // if it doesn't exist, create directory
                monitor.log(this._debug()._name, "Creating Directory: " + file.path, this._debug()._enable);
                file.create(Ci.nsIFile.DIRECTORY_TYPE, 0777);
            }
            var path_dir = file.path;

            // save the settings directory
            preferences.setCharPref(vars._SettingsDir, path_dir);
            file.append(vars._EXTDATAFILE);
            if (!file.exists()) { // if it doesn't exist, create file
                monitor.log(this._debug()._name, "File do not exist - create new key ring file", this._debug()._enable);
                var old_path = scrambleUtils.chromeToPath(vars._PATH);
                var control = scrambleUtils.copyFile(old_path, path_dir, vars._EXTDATAFILE);
                if (!control) return false;
            } 
            
            preferences.setCharPref(vars._KEYChainPath, file.path);

            //set pubring and secring locations
            var os = scrambleUtils.detectOS();
            var pubpath = preferences.getCharPref(vars._PubRingPath);
            if ((pubpath === "") || (pubpath === vars._FAIL)) {
                
                pubpath = path_dir + "/" + vars._EXTPUBRINGFILE;
                if (os == "Windows") pubpath = path_dir + "\\" + vars._EXTPUBRINGFILE;
                
                preferences.setCharPref(vars._PubRingPath, pubpath);
            }
            var secpath = preferences.getCharPref(vars._SecRingPath);
            if ((secpath === "") || (secpath === vars._FAIL)) {
                secpath = path_dir + "/" + vars._EXTSECRINGFILE;
                if (os == "Windows") secpath = path_dir + "\\" + vars._EXTSECRINGFILE;
                preferences.setCharPref(vars._SecRingPath, secpath);
            }
            return true;
        } catch (e) {
            monitor.exception(this._debug()._name, "Exception." + e, this._debug()._enable);
            return false;
        }
    },

    /**
     *	Function that initialises the key chain file and syncs the keys
     *  @function
     *  @param preferences firefox preferences
     */
    Extension: function(preferences) { //, obj) {
        // monitor.log(this._debug()._name, "Extension [" + kernel.testObj() + "]", this._debug()._enable);
        monitor.log(this._debug()._name, "Extension Initialization...", this._debug()._enable);        
        //init keychain file
        var flag = this.KeyChain(preferences, params);
        //init secret defaultkey + password
        var params = {
            pwd_value: vars._FAIL,
            //default for password
            result: false
        };
        // Open the Initialisation Manager dialog
        params = scrambleAppNS.dialogLoader.initialisationDialog(params);

        if (!params.result) {
            //reset paths
            preferences.setCharPref(vars._KEYChainPath, vars._FAIL);
            preferences.setCharPref(vars._PubRingPath, vars._FAIL);
            preferences.setCharPref(vars._SecRingPath, vars._FAIL);
            return false;
        }
        //init the password
        if ((params.pwd_value != vars._FAIL) && (params.pwd_value != "")) {
            kernel.saveSKey(params.pwd_value);
        }
        return flag;
    },



    /**
     *	Function that initialises the Scramble Socket server
     *  @function
     *  @param preferences firefox preferences
     */
    runServer: function() {
        monitor.log(this._debug()._name, "ScrambleServer Initialization...", this._debug()._enable);            
        Cu.import("resource://gre/modules/AddonManager.jsm");
        AddonManager.getAddonByID(vars._EXTID, function(addon) {
            var path = addon.getResourceURI("").QueryInterface(Components.interfaces.nsIFileURL).file.path;
            
            var prefs = scrambleUtils.getPreferences();
    		var cmd = prefs.getCharPref("javapath");
    		var setpref = false;
            var os = scrambleUtils.detectOS();
            if (cmd == vars._FAIL) {
                setpref = true;
                // pref("extensions.scramble.javapath", "FAIL");
                // pref("extensions.scramble.serverpath", "FAIL");
                // //get the java 
                 //default locations -- if not in default location, then let the user find it :)             
                if (os == "MacOS") cmd = "/usr/bin/java"; 
                else if (os == "Unix") cmd = "/usr/bin/java"; 
                else if (os == "Windows") cmd = "c:\\WINDOWS\\System32\\java.exe";
            }
            
             // Run the external encryption process
            var fileExe = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
            try {
                 fileExe.initWithPath(cmd);
            } catch (e) {                
                 dump("command not found: " + cmd + "\n");
                 dump("ERROR File: " + e + "\n");
                 
                 return 1;
            }
            
            
            
            var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
            try {
                 process.init(fileExe);
             } catch (e) {
                dump("process not found: " + fileExe + "\n");
                dump("ERROR Process: " + e + "\n");
                var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
                var msg = "Please Select the path to your java"
                fp.init(window, msg , Ci.nsIFilePicker.modeOpen);
                fp.appendFilters(Ci.nsIFilePicker.filterAll);
                if ( fp.show() == Ci.nsIFilePicker.returnOK ) {
                    cmd = fp.file.path;
                }
                
                try{
                    fileExe.initWithPath(cmd);
                    process.init(fileExe);
                } catch (e) {
                     dump("Error Loading the Server, Java Path not valid");
                }
                return 1;
             }
                                       
            // add java and server path in preferences... 
            // Run the process.
            // If first param is true, calling thread will be blocked until
            // called process terminates.
            // Second and third params are used to pass command-line arguments
            // to the process.
            var blocking = false;
            // path: get path dynamically...
            // var path = "/Users/filipe_mrb/Documents/KULeuven/FirefoxPlugins/test/plugin/server.jar";
                    
            var serverpath = path+"/ScrambleServer.jar";            
            if (os == "Windows") serverpath = path+"\\ScrambleServer.jar";
            
            monitor.log(scrambleAppNS.initialise._debug()._name, "ScrambleServer: "+serverpath, scrambleAppNS.initialise._debug()._enable);                        
            monitor.log(scrambleAppNS.initialise._debug()._name, "JavaHome: "+cmd, scrambleAppNS.initialise._debug()._enable);            
            if (setpref) {
                prefs.setCharPref("javapath", cmd);
                prefs.setCharPref("serverpath", serverpath);
            }
            var args = ["-jar", serverpath];
           // process.runw(blocking, args, args.length);
            monitor.log(scrambleAppNS.initialise._debug()._name, "ScrambleServer Initialised!", scrambleAppNS.initialise._debug()._enable);                        
            return process.exitValue;
        });
    },


};
