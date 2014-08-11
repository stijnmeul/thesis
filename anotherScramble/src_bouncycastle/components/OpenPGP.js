// OpenPGP File
// 	--> Contains the functions to load the XPCOM component builing a bright with OpenPGP.java
//
// Author: Filipe Beato <filipe.beato@esat.kuleuven.be>
// Based on: http://simile.mit.edu/ extension 
// 			 from David François Huynh <dfhuynh at csail.mit.edu>
// License: 



/***************************************************************************
 **                                                                       **
 **                     -  The Module (OpenPGP module) -                  **
 **                                                                       **
 ***************************************************************************/
var OpenPGPModule = {

    _myName : 			"OpenPGP Javascript XPCOM Component",
    _myComponentID : 	Components.ID("{017FD347-4B99-4714-916B-0019F7707F63}"),
    _myContractID :  	"@scramble.primelife.net/openpgp;1",

    /*
     *  This flag specifies whether this factory will create only a
     *  single instance of the component.
     */
    _singleton :     true,
    _myFactory : {
        createInstance : function(outer, iid) {
            if (outer != null) {
                throw Components.results.NS_ERROR_NO_AGGREGATION;
            }

            var instance = null;

            if (this._singleton) {
                instance = this.theInstance;
            }

            if (!(instance)) {
                instance = new OpenPGPComponent(); // OpenPGPComponent is declared below
            }

            if (this._singleton) {
                this.theInstance = instance;
            }

            return instance.QueryInterface(iid);
        }
    },

    registerSelf : function(compMgr, fileSpec, location, type) {
		consoleService.debug("registering 1\n");
        compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		dump("registering 2\n");
        compMgr.registerFactoryLocation(
            this._myComponentID,
            this._myName,
            this._myContractID,
            fileSpec,
            location,
            type
        );
		dump("registering 3\n");
    },

    unregisterSelf : function(compMgr, fileSpec, location) {
        compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        compMgr.unregisterFactoryLocation(this._myComponentID, fileSpec);
    },

    getClassObject : function(compMgr, cid, iid) {
        if (cid.equals(this._myComponentID)) {
            return this._myFactory;
        } else if (!iid.equals(Components.interfaces.nsIFactory)) {
            throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
        }

        throw Components.results.NS_ERROR_NO_INTERFACE;
    },

    canUnload : function(compMgr) {
        /*
         *  Do any unloading task you want here
         */
        return true;
    }
}

/*
 *  This function NSGetModule will be called by Firefox to retrieve the
 *  module object. This function has to have that name and it has to be
 *  specified for every single .JS file in the components directory of
 *  your extension.
 */
function NSGetModule(compMgr, fileSpec) {
    return OpenPGPModule;
}

function NSGetFactory(compMgr, fileSpec) {
    return OpenPGPModule;
}

/** 
* XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4, SeaMonkey 2.1). 
* XPCOMUtils.generateNSGetModule was introduced in Mozilla 1.9 (Firefox 3.0). 
*/  
// if (XPCOMUtils.generateNSGetFactory)  
//     var NSGetFactory = XPCOMUtils.generateNSGetFactory([OpenPGPModule]);  
// else  
//     var NSGetModule = XPCOMUtils.generateNSGetModule([OpenPGPModule]);
// }


/***************************************************************************
 **                                                                       **
 **      -  OpenPGP Component implemented as Javascript Function -        **
 **                                                                       **
 ***************************************************************************/
function OpenPGPComponent() {
    /*
     *  This is a XPCOM-in-Javascript trick: Clients using an XPCOM
     *  implemented in Javascript can access its wrappedJSObject field
     *  and then from there, access its Javascript methods that are
     *  not declared in any of the IDL interfaces that it implements.
     *
     *  Being able to call directly the methods of a Javascript-based
     *  XPCOM allows clients to pass to it and receive from it
     *  objects of types not supported by IDL.
     */
    this.wrappedJSObject = this;

    this._initialized = false;
    this._packages = null;
}

//  nsISupports.QueryInterface
OpenPGPComponent.prototype.QueryInterface = function(iid) {
    /*
     *  This code specifies that the component supports 2 interfaces:
     *  nsIHelloWorld and nsISupports.
     */
    if (!iid.equals(Components.interfaces.nsIMyComponent) &&
        !iid.equals(Components.interfaces.nsISupports)) {
        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
};

// Initializes this component, including loading JARs.
OpenPGPComponent.prototype.initialize = function (packageLoader, trace) {
    if (this._initialized) {
        this._trace("OpenPGPComponent.initialize already called before");
        return true;
    }

	this._traceFlag = (trace);
    this._trace("OpenPGPComponent.initialize {");
    try {
        this._packageLoader = packageLoader;
        var extensionPath = this._getExtensionPath("scramble");

        /*
         *  Enumerate URLs to our JARs and class directories
         */
        var javaPath = extensionPath + "java/openpgp/";
        
        var jarFilepaths = [ javaPath+"jars/bcprov-ext-jdk16-145.jar", 
            javaPath+"jars/bcpg-jdk16-145.jar", 
            javaPath ];
        this._packages = this._packageLoader(jarFilepaths, this._traceFlag);
        // Test OpenPGP class
        dump("### OpenPGP class Test: " +this._packages.getClass("OpenPGP").m("testOpenPGP")()+"\n");
        // Create a Java sample object
        // this._openPGP = this._packages.getClass("OpenPGP").n();
        this._initialized = true;
    } catch (e) {
        this._fail(e);
        this._trace("[Error] "+this.error);
    }
    this._trace("} OpenPGPComponent.initialize");

    return this._initialized;
};

/***************************************************************************
 **                                                                       **
 **                        -  Get Path functions -                        **
 **                                                                       **
 ***************************************************************************/

//  Get the file path to the installation directory of this extension.
OpenPGPComponent.prototype._getExtensionPath = function(extensionName) {
    this._trace("OpenPGPComponent.getExtensionPath: "+extensionName+" ...");
    var uri = Components.classes["@mozilla.org/network/standard-url;1"]
              .createInstance(Components.interfaces.nsIURI);
      uri.spec = "chrome://" + extensionName + "/content/";
      
      var chromeRegistry =
          Components.classes["@mozilla.org/chrome/chrome-registry;1"]
              .getService(Components.interfaces.nsIChromeRegistry);
      var path = chromeRegistry.convertChromeURL(uri);
      	
      if (typeof(path) == "object") {
          path = path.spec;
      }
      path = path.substring(0, path.indexOf("/chrome/") + 1);

    return path;
};

/*
 *  Retrieve the file path to the user's profile directory.
 *  We don't really use it here but it might come in handy
 *  for you.
 */
OpenPGPComponent.prototype._getProfilePath = function() {
    var fileLocator =
        Components.classes["@mozilla.org/file/directory_service;1"]
            .getService(Components.interfaces.nsIProperties);

    var path = escape(fileLocator.get("ProfD", Components.interfaces.nsIFile).path.replace(/\\/g, "/")) + "/";
    if (path.indexOf("/") == 0) {
        path = 'file://' + path;
    } else {
        path = 'file:///' + path;
    }

    return path;
};


/***************************************************************************
 **                                                                       **
 **                        -  Debuging functions -                        **
 **                                                                       **
 ***************************************************************************/
OpenPGPComponent.prototype._fail = function(e) {
    if (e.getMessage) {
        this.error = e + ": " + e.getMessage() + "\n";
        while (e.getCause() != null) {
            e = e.getCause();
            this.error += "caused by " + e + ": " + e.getMessage() + "\n";
        }
    } else {
        this.error = e;
    }
};

OpenPGPComponent.prototype._trace = function (str) {
    if (this._traceFlag) {
		doLog(str);
    }
}

//doLog: Logging Function
function doLog(str) {
	dump("### OpenPGP Component: "+str+"\n");
}


/***************************************************************************
 **                                                                       **
 **            -  Package and Methods retrieval functions -               **
 **                                                                       **
 ***************************************************************************/

// Returns the packages of all the JARs that this component has loaded.
OpenPGPComponent.prototype.getPackages = function() {
    this._trace("OpenPGPComponent.getPackages");
    return this._packages;
};


//  Returns the Test object instantiated by default.
OpenPGPComponent.prototype.getObject = function(className, args) {
    this._trace("OpenPGPComponent.getObject");
	if( (args != undefined) || (args != null) ) {

	    if(args.length == 2)
		    return this._packages.getClass(className).n(args[0], args[1]);
		else
		    return this._packages.getClass(className).n(args);
	}
	return this._packages.getClass(className).n();
};
