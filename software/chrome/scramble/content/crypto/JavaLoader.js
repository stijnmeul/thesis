/**
 * @fileOverview Contains the functions to load the java class object 
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 * @description Based on {@link http://simile.mit.edu/} extension from David François Huynh <dfhuynh at csail.mit.edu>
 */


/** @constant */
const jarFileUtils = "java/javaFirefoxExtensionUtils.jar";
/** @constant */
const jarPackage = "edu.mit.simile.javaFirefoxExtensionUtils";


/**
 *  Wraps a class loader and allows easy access to the classes that it loads.
 *  @class Wraps a class loader and allows easy access to the classes that it loads.
 */
function WrappedPackages(classLoader) {
    var packages = classLoader.loadClass(jarPackage + ".Packages").newInstance();

    /**
	 *	Function to convert the arguments into a java array
	 *  @private
	 *  @param args arguments 
	 *  @returns {java.lang.reflect.Array} array
	 */
    var argumentsToArray = function(args) {
        var a = java.lang.reflect.Array.newInstance(java.lang.Class.forName("java.lang.Object"), args.length);
        for (var i = 0; i < args.length; i++) {
            java.lang.reflect.Array.set(a, i, args[i]);
        }
        return a;
    };

    /**
	 *	Function to retrieve the class by name from the java xpcom component object
	 *  @public
	 *  @param className Name of the required class to be loaded
	 *  @property {classWrapper} n call constructor 
	 *  @property {classWrapper} f call field 
	 *  @property {classWrapper} m call method		
	 *  @returns {Object} Object depends on the loading class method
	 */
    this.getClass = function(className) {
        var classWrapper = packages.getClass(className);
        if (classWrapper) {
            return {
                n: function() {
                    return classWrapper.callConstructor(argumentsToArray(arguments));
                },
                f: function(fieldName) {
                    return classWrapper.getField(fieldName);
                },
                m: function(methodName) {
                    return function() {
                        return classWrapper.callMethod(methodName, argumentsToArray(arguments));
                    };
                }
            };
        } else {
            return null;
        }
    };

    /**
	  * Function to set trace messages on/off
	  * @private
	  * @param {boolean} enable true to set on, false otherwise
	  */
    this.setTracing = function(enable) {
        classLoader.setTracing((enable) ? true: false);
    };
}

// ***************************************************************************
// **                                                                       **
// **                       -  Java Object Loader -                         **
// **                                                                       **
// ***************************************************************************
/** 
  *	Contains the methods to retrieve the java xpcom component  
  *	@class Contains the methods to retrieve the java xpcom component
  */
// var JavaLoader = new Object();
var JavaLoader = {

    /**
	 *	Function to initialise the java xpcom component
	 *  @public
	 *  @throws {Exception} If the java component package loader fails
	 */
    initialise: function(trace) {
        try {
            // Get a OpenPGP component
            dump("JAVA Loader INITIALISE----------------------------\n");
			javawrapper.init();				
            return true;
        } catch(e) {
            monitor.exception("JavaLoader", e, true);
            return false;
        }
    },

    /*
	 * Java package loader... 
	 * @param {Array} urlStrings with the classes name to be loaded
	 * @param {boolean} trace true if trackable logging, false otherwise
	 * @description It is done in 2 Stages: 
	 * 		Stage 1: Prepare to give required permissions for the java code to be loaded (security bootstrapping hack)
	 *			Step 1: Load the bootstraping javaFirefoxExtensionUtils.jar, which contains URLSetPolicy.
	 *			Step 2: Instantiate a URLSetPolicy object from javaFirefoxExtensionUtils.jar from edu.mit.simile
	 *			Step 3: Wrap URLSetPolicy around the current security policy of the JVM security manager. 
	 *				This allows us to give our own Java code required permissions, even if Firefox complains.
	 * 
	 *		Stage 2: Create and use edu.mit.simile Class Loader
	 *		
	 *		Stage 3: Load the required Java Code 
	 *  
	 */
    _packageLoader: function(urlStrings, trace) {
        this._trace("packageLoader {");

        var toUrlArray = function(a) {
            var urlArray = java.lang.reflect.Array.newInstance(java.lang.Class.forName("java.net.URL"), a.length);
            for (var i = 0; i < a.length; i++) {
                var url = a[i];
                java.lang.reflect.Array.set(urlArray, i, (typeof url == "string") ? new java.net.URL(url) : url);
            }
            return urlArray;
        };
        var firefoxClassLoaderURL = new java.net.URL(JavaLoader._getExtensionPath("scramble") + jarFileUtils);
        if (trace) {
            this._trace("classLoaderURL " + firefoxClassLoaderURL);
        }
        // Stage 1 ...... (Start)
        // Step 1
        var bootstrapClassLoader = java.net.URLClassLoader.newInstance(toUrlArray([firefoxClassLoaderURL]));
        if (trace) {
            this._trace("created loader");
        }

        // Step 2
        var policyClass = java.lang.Class.forName(jarPackage + ".URLSetPolicy", true, bootstrapClassLoader);
        var policy = policyClass.newInstance();
        if (trace) {
            this._trace("policy");
        }

        // Step 3
        policy.setOuterPolicy(java.security.Policy.getPolicy());
        java.security.Policy.setPolicy(policy);
        if (trace) {
            this._trace("set policy");
        }

        policy.addPermission(new java.security.AllPermission());
        if (trace) {
            this._trace("got all permissions");
        }

        // Stage 2 ...... (Start)
        policy.addURL(firefoxClassLoaderURL);
        if (trace) {
            this._trace("added url: " + toUrlArray([firefoxClassLoaderURL]));
        }

        var firefoxClassLoaderPackages = new WrappedPackages(
        java.net.URLClassLoader.newInstance(toUrlArray([firefoxClassLoaderURL]))
        );
        if (trace) {
            this._trace("wrapped loader");
        }

        var tracingClassLoaderClass = firefoxClassLoaderPackages.getClass(jarPackage + ".TracingClassLoader");
        if (trace) {
            this._trace("got class: " + jarPackage);
        }

        // dump (tracingClassLoaderClass.m("pad")(1,2)+" sadsgfdsfsa\n");
        var classLoader = tracingClassLoaderClass.m("newInstance")(trace);
        this._trace("got new loader");

        // Stage 3 ...... (Start)
        var urls = toUrlArray(urlStrings);
        // Load the JARs and give them required permissions	
        classLoader.add(firefoxClassLoaderURL);

        for (var i = 0; i < urls.length; i++) {
            var url = java.lang.reflect.Array.get(urls, i);
            classLoader.add(url);
            policy.addURL(url);
        }
        java.lang.Thread.currentThread().setContextClassLoader(classLoader);

        //Wrap up the class loader and return
        var packages = new WrappedPackages(classLoader);

        JavaLoader._trace("} packageLoader");
        return packages;
    },


    /**
	 *	Function to get the extension path
	 *  @public
	 *  @param extensionName extension name
	 *  @returns {String} Path value of the extension
	 */
    _getExtensionPath: function(extensionName) {
        monitor.log("JavaLoader", "_getExtensionPath", false);
        var std_url = Components.classes["@mozilla.org/network/standard-url;1"];
        var uri = std_url.createInstance(Components.interfaces.nsIURI);
        uri.spec = "chrome://" + extensionName + "/content/";

        var component = Components.classes["@mozilla.org/chrome/chrome-registry;1"];
        var chromeRegistry = component.getService(Components.interfaces.nsIChromeRegistry);

        var path = chromeRegistry.convertChromeURL(uri);
        if (typeof(path) == "object") {
            path = path.spec;
        }
        path = path.substring(0, path.indexOf("/chrome/") + 1);
        return path;
    },

    // ---------------------------------------
    //  	 Debug function...
    // ---------------------------------------
    /**
	  * Function to tracing messages 
	  * @private
	  * @param {msg} msg Message string to printed to the console
	  */
    _trace: function(msg) {
        dump("TRACE JavaLoader: " + msg + "\n");
    },

    // ---------------------------------------
    // Get the OpenPGP interface methods
    // ---------------------------------------
    /**
	 *	Function to get java XPCOM OpenPGP component
	 *  @public
	 *  @returns {Object} OpenPGP Component
	 */
    getOpenPGPComponent: function() {
        dump("------> getOpenPGPComponent\n");
        // try {
        var component = Components.classes["@scramble.primelife.net/openpgp;1"];
        dump("component: " + component + "\n");
        return component.getService(Components.interfaces.nsIMyComponent);
        // return component.createInstance().QueryInterface(Components.interfaces.nsIMyComponent);
        // } catch(e) {
        //     dump("Exception: " + e + "\n");
        // }
    },

    /**
	 *	Function to get java XPCOM OpenPGP component
	 *  @public
	 *  @returns {Object} OpenPGP Component Object
	 *  @throws {Exception} In case of component loading issues
	 */
    getOpenPGPObject: function() {
        monitor.log("JavaLoader", "getOpenPGPObject", true);
        try {

            var prefs = Components.classes["@mozilla.org/preferences-service;1"].
					getService(Components.interfaces.nsIPrefService);
			var branch = prefs.getBranch(EXTPrefs);
			var pubpath = branch.getCharPref(PubRingPath);
			var secpath = branch.getCharPref(SecRingPath);
			// var arglist = [pubpath, secpath];// reflect.Array.newInstance(java.lang.Object, 2);

			// arglist[0] = pubpath;  
			// arglist[1] = secpath;  
			// Call our constructor with our arguments  
			// try{
			
			var reflect = java.lang.reflect; 
			dump("reflect: "+reflect+"\n"); 
            // var envclass = java.lang.Class.forName("OpenPGP", true, javawrapper.theClass);
			var envclass = javawrapper.theClass;//.loadClass('OpenPGP');
			dump("envclass: "+envclass+"\n");
			
			var dummy = new java.lang.String();
			var paramtypes = reflect.Array.newInstance(dummy.getClass(), 2);
			dump("envclass: 0\n");
			paramtypes[0] = java.lang.String;
			paramtypes[1] = java.lang.String;		

			dump("envclass: params "+paramtypes+" ("+paramtypes.length+")\n");
			var constructor;
			try{
				// var constructor = envclass.getConstructor(paramtypes);
				var ctr = envclass.getDeclaredConstructors();
				for (i = 0; i < ctr.length; i++) {
					dump("Constructor= " + ctr[i]+"\n");
					var params = ctr[i].getParameterTypes();					
					if(params.length > 1) {
						constructor = ctr[i];
						dump("Constructor params= " + params.length+"\n");
						dump("Constructor name= " + ctr[i].getName()+"\n");
					}
				}
				// var constructor = ctr[2];//envclass.getConstructor(paramtypes);
				
			
				dump("envclass: const: "+constructor+"\n");
				var arglist = reflect.Array.newInstance(dummy.getClass(), 2);
				// dump("envclass: 2\n");
				arglist[0] = pubpath;  
				arglist[1] = secpath;              
				var env = constructor.newInstance(arglist);
				// }catch(e){
				// 	dump("This exception: "+e+"\n");
				// }
				
				return env;
	        } catch(e) {
	            monitor.exception("JavaLoader exception", e, true);
	            return null;
	        }
		} catch(e) {
            monitor.exception("JavaLoader exception", e, true);
            return null;
        }
    }
};


// ---------------------------------------------------------
// ---------------------------------------------------------
// ---------------------------------------------------------
var javawrapper =
{
    theClass: null,


    // this function initialises the wrapper and calls back whenever intialisation
    // is complete; if initialisation is already complete, it calls back immediately.
     init: function(callback)   {
		dump("javawrapper INIT\n");
        if (javawrapper.theClass == null)  {             
            try  {                  
                if (java) {;}
            } catch(err) {                   
                var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService); 
                   prompts.alert(null, "Scramble", "You must install the Java plugin first."); 
                //alert('Error while uploading the image to '+postURL+'\n'+error);
				callback(false);
                return; 
            }
            //   Components.utils.reportError("entered javawrapper.init with class=null");  
            javawrapper.resolveMyClass(function(classDefinition) {
				javawrapper.theClass = classDefinition;
				//    Components.utils.reportError("added class to javainit: "+javawrapper.theClass);
				callback(true);
            });
        } else {
            //   Components.utils.reportError("entered javawrapper.init with class= NON null");  
			callback(true); 
        }
		dump("javawrapper INIT - END\n");
    },

    // this function initialises the wrapper and calls back whenever intialisation
    // is complete; if initialisation is already complete, it calls back immediately.
    // this function resolves the class com.Main
    resolveMyClass: function(callback) {
        //		Components.utils.reportError("entered javawrapper.resolveMyClass");			
        Components.utils.import("resource://gre/modules/AddonManager.jsm");
        AddonManager.getAddonByID("scramble@primelife.eu",
        function(addon) {
            var extensionPath = addon.getResourceURI("").QueryInterface(Components.interfaces.nsIFileURL).file.path;
            //			Components.utils.reportError("addon location = "+extensionPath);
            // Get path to the JAR files (the following assumes your JARs are within a
            // directory called "java" at the root of your extension's folder hierarchy)
            // You must add this utilities (classloader) JAR to give your extension full privileges
            var extensionUrl = "file:///" + extensionPath.replace(/\\/g, "/");
            var classLoaderJarpath = extensionUrl + "/java/javaFirefoxExtensionUtils.jar";
            // Add the paths for all the other JAR files that you will be using
            var myJarpath = extensionUrl + "/java/openpgp/OpenPGP.jar";
            // var myJavapath = extensionUrl + "/java/openpgp/OpenPGP.java";
            var myJarpathBCprov = extensionUrl + "/java/openpgp/jars/bcprov-ext-jdk16-145.jar";
            var myJarpathBClib = extensionUrl + "/java/openpgp/jars/bcpg-jdk16-145.jar";
            // seems you don't actually have to replace the backslashes as they work as well
            var urlArray = [];
            // Build a regular JavaScript array (LiveConnect will auto-convert to a Java array)
            urlArray[0] = new java.net.URL(classLoaderJarpath);
            urlArray[1] = new java.net.URL(myJarpathBCprov);
            urlArray[2] = new java.net.URL(myJarpathBClib);
            urlArray[3] = new java.net.URL(myJarpath);
            // urlArray[4] = new java.net.URL(myJavapath);
            var cl = java.net.URLClassLoader.newInstance(urlArray);
            //Components.utils.reportError("class loader = "+cl);
            //Set security policies using the above policyAdd() function
            javawrapper.policyAdd(cl, urlArray);
            var aClass = cl.loadClass('be.cosic.scramble.OpenPGP');

            // var aClass = java.lang.Class.forName("OpenPGP", true, cl);
            var aStaticMethod = aClass.getMethod("testOpenPGP", []);
            var greeting = aStaticMethod.invoke(null, []);
            dump(greeting + " <---------------- \n");
            // var myClass = cl.loadClass('OpenPGP'); // use the same loader from above
            // var myObj = aClass.newInstance();
            // var test = myObj.listPublicKeys();
            // var myObj = javawrapper.theClass.newInstance();
            // var test = myObj.testOpenPGP();
            callback(aClass);
        });
    },


    // This function will be called to give the necessary privileges to your JAR files
    // However, the policy never comes into play, because
    //     (1) adding permissions doesn't add to the policy itself, and
    //     (2) addURL alone does not set the grant codeBase
    policyAdd: function(loader, urls) {
        try {
			var policyClass = java.lang.Class.forName("edu.mit.simile.javaFirefoxExtensionUtils.URLSetPolicy", true, loader);
            var policy = policyClass.newInstance();
            policy.setOuterPolicy(java.security.Policy.getPolicy());
            java.security.Policy.setPolicy(policy);
            policy.addPermission(new java.security.AllPermission());
            for (var j = 0; j < urls.length; j++) {
				dump("adding permissions to: "+urls[j]+"\n");
                policy.addURL(urls[j]);
            }
        } catch(e) {
            Components.utils.reportError(e + '::' + e.lineNumber);
        }
    },
}


