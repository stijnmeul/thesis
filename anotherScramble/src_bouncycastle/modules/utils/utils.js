/**
 * @fileOverview Contains a misc of functions used by the extension
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


// ***************************************************************************
// **                                                                       **
// **                       -  Misc Utils Functions -                       **
// **                                                                       **
// ***************************************************************************
var EXPORTED_SYMBOLS = ["scrambleUtils", "myAjax"];

// import the utils modules
Components.utils.import("resource://scramble/utils/monitor.js");
Components.utils.import("resource://scramble/core/coins.js");

// set constants
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
const EXTPrefs = "extensions.scramble.";
const EXTID = vars._EXTID;//"scramble@primelife.eu";


var scrambleUtils = {
    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "scrambleUtils",
            _enable: true
        };
		var prefs = scrambleUtils.getPreferences();
        var debug = prefs.getBoolPref("debug");
		params._enable = debug;
        return params;
    },

	/**
	 *	Accesses the firefox preferences system scramble branch using the preferences service xpcom
	 *  @public
	 *  @returns Scramble Preferences Branch
	 */
	getPreferences: function() {
	   	// monitor.log(this._debug()._name, "getPreferences", this._debug()._enable);
	    var pref_service = Cc["@mozilla.org/preferences-service;1"];
		var preferences = pref_service.getService(Ci.nsIPrefService);
		var branch = preferences.getBranch(EXTPrefs);
		return branch;
	},

	/**
	 *	Function to execute the bash script to update JCE unrestricted files
	 *  (Only for the BC version...)
	 *  @public
	 *  @returns process exitValue
	 */
	runJCEScript: function(sudo) {
		monitor.messageDump("runScript", true);		
		var args = [];
		var UnixJCEScript = "java/openpgp/jce_lib/java_jceUnix.sh";
		var WinJCEScript = "java/openpgp/jce_lib/java_jceWin32.bat";

		var script = WinJCEScript;
		if( (sudo == undefined) || (sudo == null) ) {
			sudo = "fail";
		}
		var os = scrambleUtils.detectOS();
		monitor.messageDump("Operating System: "+os, true);
		if(os != "Windows") { // unix script
			args[0] = ( (scrambleUtils.detectOS() == "MacOS" ) ? "mac" : "linux" );
			args[1] = sudo;
			script = UnixJCEScript;
		} 	
		// get profile directory
		// var em = Cc["@mozilla.org/extensions/manager;1"].
		//          getService(Ci.nsIExtensionManager);

		var file = null;	
		Cu.import("resource://gre/modules/AddonManager.jsm");
		AddonManager.getAddonByID(EXTID,  function(addon) {
		            var extensionPath = addon.getResourceURI("").QueryInterface(Ci.nsIFileURL).file.path;
		            var extensionUrl = "file:///" + extensionPath.replace(/\\/g, "/");
		           	file = extensionUrl + script;
					dump("FILE: "+file+"\n");
					// Trying to add unsupported property on NPObjectreturn file;

		// the path may use forward slash ("/") as the delimiter
		// returns nsIFile for the extension's install.rdf
		// var file = em.getInstallLocation(EXTID).getItemFile(EXTID, script);
		// create an nsIProcess
		var process = Cc["@mozilla.org/process/util;1"]
		                        .createInstance(Ci.nsIProcess);
		process.init(file);
		// Run the process.
		process.run(false, args, args.length);
		// dump("exit value: "+process.exitValue+"\n");
		});
		// return process.exitValue;
	},
	/**
	 *	Function to strip the HTML and other unwated tags and clean the text
	 *  @public
	 *  @param html html text to be cleaned
	 *  @param uri the current uri (it will affect the clean)
	 *  @returns {String} Cleaned text
	 */
	stripHTML: function(html, uri) {
	    monitor.log(this._debug()._name, "stripHTML", this._debug()._enable);
		if(uri !== null) {
			if(uri.indexOf("facebook") > -1||uri.indexOf("message") > -1) {
				html = html.replace(/<br>/gim,"\r\n"); //NEEDED FOR FACEBOOK AND MESSAGE BOX!
			}
		} 
		
		var strText = html.replace(/&(lt|gt);/g, function (strMatch, p1) {
			var ret =  ( (p1 == "lt") ? "<" : ">" );
			return ret;
		});
		
		strText = strText.replace(/<\/?[^>]+(>|$)/g, '').replace(/^\s+|\s+$/g, '');
		return strText;
	},
	
	
	/**
	 *	Function locate a string under a regular expression
	 *  @public
	 *  @param str string where to search
	 *  @param regex regx with the value for match
	 *  @returns {String} located string
	 */
	strLocate: function(str, regex) {
	    monitor.log(this._debug()._name, "stripLocate", this._debug()._enable);
	    var re = new RegExp(regex);    
	    var m = re.exec(str);
	    if (m === null) {
	        return "";        
	    } else {
	        return m[1];
	    }
	},
		
	/**
	 *	Function to trim the string
	 *  @public
	 *  @param str string to be trimmed 
	 *  @param chars (Optional) regx with the value for trim
	 *  @returns {String} Trimmed string
	 */
	strTrim: function(str, chars) {
	    monitor.log(this._debug()._name, "stripHTML", this._debug()._enable);

		chars = chars || "\\s";
		str = str.replace(new RegExp("[" + chars + "]+$", "g"), ""); // trim the right side
		str = str.replace(new RegExp("^[" + chars + "]+", "g"), ""); // trim the left side
		return str;
	},
	
	
	// This script sets OSName variable as follows:
	// "Windows"    for all versions of Windows
	// "MacOS"      for all versions of Macintosh OS
	// "Linux"      for all versions of Linux
	// "UNIX"       for all other UNIX flavors 
	// "Unknown OS" indicates failure to detect the OS

	/**
	 *	Function to detect the current OS
	 *  @public
	 *  @returns {String} Win, Mac or Unix
	 */
	detectOS: function() {
	    monitor.log(this._debug()._name, "detectOS", this._debug()._enable);
		var osString = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS;
		var ret;
		if (osString == "WINNT") {
			ret = "Windows";
		}else if (osString == "Darwin") {
			ret = "MacOS";
		} else {
			ret = "Unix";
		}
		return ret;
	},
	
	
	/**
	 *	Function Binary Search Array
	 *  @public
	 *  @returns index or -1 if not found   
	 */
	binarySearch: function(arr, key) {
        var left = 0;
        var right = arr.length - 1;
        while (left <= right)   {
            var mid = parseInt((left + right)/2);
            if (arr[mid] == key)
                return mid;
            else if (arr[mid] < key)
                left = mid + 1;
            else
                right = mid - 1;
        }
        return -1;
    },
	
		
	/**
	 *	Validates an input date value
	 *  @public
	 *  @param input_date Date value to validate
	 *  @returns {boolean} true or false
	 */
	checkDate: function(input_date) {
	    monitor.log(this._debug()._name, "checkDate", this._debug()._enable);
	    var validformat=/^\d{4}\-\d{2}\-\d{2}$/ //Basic check for format validity
	    if (!validformat.test(input_date)) {
	        return false; //invalid format
	    } else{ 
	        var date = input_date.split("-");
	        var my_year=date[0];
	        var my_month=date[1];
	        var my_day=date[2];
	        var my_date = new Date(my_year, my_month-1, my_day);
	        var today = new Date();
	        if(my_date > today) {
	            return true; 
	        } else {
	            return false;
	        }
	    }
	},

	// ***************************************************************************
	// **                                                                       **
	// **                      -  Files and Directories -                       **
	// **                                                                       **
	// ***************************************************************************

	/**
	 *	Function to copy data to a specific file
	 *  @public
	 *  @param data The data to be copied
	 *  @deprecated as window can't be represented on modules (see settings.js)
	 *  @returns {boolean} 
	 */
	copyToFile: function(data) {
        monitor.log(this._debug()._name, "copyToFile", this._debug()._enable);
		var nsIFilePicker = Ci.nsIFilePicker;
		var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, "Select where to save your File" , nsIFilePicker.modeSave);
		fp.appendFilters(nsIFilePicker.filterAll);
		if( ( fp.show() == nsIFilePicker.returnOK ) || (fp.show() == nsIFilePicker.returnReplace ) ) {
	        var path = fp.file.path+".key";

		    var file = Cc["@mozilla.org/file/local;1"].  
		               createInstance(Ci.nsILocalFile);  
		    file.initWithPath(path);
			Cu.import("resource://gre/modules/NetUtil.jsm");  
			Cu.import("resource://gre/modules/FileUtils.jsm");  
			var ostream = FileUtils.openSafeFileOutputStream(file)  
			var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].  
			                createInstance(Ci.nsIScriptableUnicodeConverter);  
			converter.charset = "UTF-8"; 
			var istream = converter.convertToInputStream(data);  
			// The last argument (the callback) is optional.  
			NetUtil.asyncCopy(istream, ostream, function(status) {  
			  	if (!Components.isSuccessCode(status)) {  
			    	return false;
			  	}  
				return true;
			});
			return true;
	    } else {		
			return false;
		}
	},
	
	/**
	 *	Function to copy a file to a specific directory
	 *  @public
	 *  @param sourceFile The source File
	 *  @param destDir The destination directory
	 *  @param newname Rename the file
	 *  @returns {String} File path URI
	 */
	copyFile: function(sourcefile, destdir, newname) {
		// get a component for the file to copy
        monitor.log(this._debug()._name, "copyFile", this._debug()._enable);

		if(newname == undefined) {
			newname = null;
		}
		var aFile = Cc["@mozilla.org/file/local;1"]
		  .createInstance(Ci.nsILocalFile);
		if (!aFile) {
			return false;
		}
		aFile.initWithPath(sourcefile);

		// get a component for the directory to copy to
		var aDir = Cc["@mozilla.org/file/local;1"]
		  .createInstance(Ci.nsILocalFile);
		if (!aDir) {
			return false;
		}
		// next, assign URLs to the file components
		aDir.initWithPath(destdir);
		// finally, copy the file, without renaming it
		try {
			aFile.copyTo(aDir,newname);
			return true;
		} catch(e) {
			//File already exists.. if so... erase it before

			var aNewFile = Cc["@mozilla.org/file/local;1"].createInstance();
			if (aNewFile instanceof Ci.nsILocalFile){
			  	aNewFile.initWithPath(destdir+"/"+newname);
				try {
			  		aNewFile.remove(false);
					aFile.copyTo(aDir,newname);
				} catch(ex) {
					monitor.exception(this._debug()._name+": copyFile", e, this._debug()._enable);		
					return false;
				}
				return true;
			} else {
				monitor.exception(this._debug()._name+": copyFile", e, this._debug()._enable);
				return false;
			}
		}	
	},
	
	/**
	 *	Function to get the path finder dialog and returns the selected File path 
	 *  @public
	 *  @deprecated as window can't be represented on modules
	 *  @returns File or null
	 */	
	onSelectFile: function(msg) {
        monitor.log(this._debug()._name, "onSelectFile", this._debug()._enable);
		var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
		fp.init(window, msg , Ci.nsIFilePicker.modeOpen);
		fp.appendFilters(Ci.nsIFilePicker.filterAll);
		if ( fp.show() == Ci.nsIFilePicker.returnOK ) {
	        return fp.file; //.path;
	    }
		return null;
	},
	
	/**
	 *	Function to get the path finder dialog and returns the selected Folder path 
	 *  @public
	 *  @deprecated as window can't be represented on modules
	 *  @returns {String} File path or null
	 */	
	 onSelectDir: function(msg) {
		monitor.log(this._debug()._name, "onSelectDir", this._debug()._enable);        
		var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
		fp.init(window, msg , Ci.nsIFilePicker.modeGetFolder);
		fp.appendFilters(Ci.nsIFilePicker.filterAll);
		if ( fp.show() == Ci.nsIFilePicker.returnOK ) {
	        return fp.file.path;
	    }
		return null;
	},
		
	
	// ***************************************************************************
	// **                                                                       **
	// **                   -  XML, DOM and Path Functions -                    **
	// **                                                                       **
	// ***************************************************************************

	/**
	 *	Function to remove a children from a node
	 *  @public
	 *  @param node node element
	 *  @param children children element to be removed
	 */
	removeChildrenFromNode: function(node, children) {
	    monitor.messageDump("removeChildFromNode", false);
		if(children === null) { //all children
			while (node.firstChild) {
				node.removeChild(node.firstChild);
			}
		} else { //single children
			for(var i=0; i< node.childNodes.length; i++) {
				if(node.childNodes[i].getAttribute('label') == children) {
					node.removeChild(node.childNodes[i]);
				} else if(node.childNodes[i].getAttribute('label') == ("Member: "+children)) {
					node.removeChild(node.childNodes[i]);
				}
			}
		}
	},
	
	/**
	 *	Function to convert a url to a file path
	 *  @public
	 *  @param aPath The URl path value
	 *  @returns {String} File path URI
	 */
	urlToPath: function(aPath) { 
	    monitor.log(this._debug()._name, "urlToPath", this._debug()._enable);
		try{
			if ( (!aPath) || (!(/^file:/.test(aPath))) ) {
				return ;
			}
			var prot = Cc["@mozilla.org/network/protocol;1?name=file"];
			var ph = prot.createInstance(Ci.nsIFileProtocolHandler);
			var rv = ph.getFileFromURLSpec(aPath).path;
			return rv;
		} catch (e) {
	        monitor.exception("utils: urlToPath", e, false);
			return;
		}		
	},
	
	/**
	 *	Function to convert a chrome path URI into a File Path URI
	 *  @public
	 *  @param aPath The chrome path value
	 *  @returns {String} File path URI
	 */
	chromeToPath: function (aPath) {
	    monitor.log(this._debug()._name, "chromeToPath", this._debug()._enable);
		try {
			if ( (!aPath) || (!(/^chrome:/.test(aPath))) ) {
				return null; //not a chrome url
			}
			var comp_io = Cc["@mozilla.org/network/io-service;1"];
			var ios = comp_io.getService(Ci["nsIIOService"]);
			var uri = ios.newURI(aPath, "UTF-8", null);
			var comp_reg = Cc["@mozilla.org/chrome/chrome-registry;1"];
			var cr = comp_reg.getService(Ci["nsIChromeRegistry"]);
			var rv = cr.convertChromeURL(uri).spec;

			if (/^file:/.test(rv)) {
				rv = this.urlToPath(rv);
			} else {
				rv = this.urlToPath("file://"+rv);
			}
		    return rv;

		} catch (e) {
	        monitor.exception(this._debug()._name+".chromeToPath", e, true);
	        return null;
		}
	},
	
	
	/**
	 *	Function to save a xml object into a file
	 *  @public
	 *  @param xmlDoc xml object value
	 *  @returns {boolean} true or false
	 *  @throws {Exception} Issues with the xml document or file
	 */
	saveXMLFile: function(xmlDoc, path) {
	    monitor.log(this._debug()._name, "saveXMLFile", this._debug()._enable);
		if( (path === undefined) || (path === null) ) {
		    path = scrambleUtils.getPreferences().getCharPref(KEYChainPath);
		}
		dump("path: "+path+"\n");
		try {

		    var somefile;
	        if( !( /^chrome:/.test(path) ) ) {
	            somefile = path;    
	        } else {
	                 somefile = scrambleUtils.chromeToPath(path);
	        }
			// var xmlDoc;
			// dump("doXmlStuff path: "+somefile+"\n");
			var file_local = Cc["@mozilla.org/file/local;1"];
			var file = file_local.createInstance(Ci.nsILocalFile);
			file.initWithPath(somefile);
			
			monitor.log(this._debug()._name, "somefile: " + somefile, this._debug()._enable);

			if (file.exists()) {
				monitor.log(this._debug()._name, "file exists", this._debug()._enable);
				var component = Cc["@mozilla.org/network/file-output-stream;1"];
				var fcStream = component.createInstance(Ci.nsIFileOutputStream);
				fcStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);	// write, create, truncate
			
				var ser = new XMLSerializer();
				//write the serialized XML to file
				monitor.log(this._debug()._name, "xmlDoc: " + xmlDoc, this._debug()._enable);
				ser.serializeToStream(xmlDoc, fcStream, "");
				fcStream.close();
				return true;
			} else {
				return false;
			}

		} catch (e) {
			monitor.log(this._debug()._name, "Error saving XML file" + e, this._debug()._enable);
			return false;
		}
	},
	
	
	/**
	 *	Function to convert a xml object to a string
	 *  @public
	 *  @param xmlobject xml object value
	 *  @returns {String} String text
	 */
	xmlToString: function(xmlobject) {
	    monitor.log(this._debug()._name, "xmlToString", this._debug()._enable);
	    var str = (new XMLSerializer()).serializeToString(xmlobject);
		return str;
	},
	
	/**
	 *	Function to convert a string text to a xml object
	 *  @public
	 *  @param str string text value
	 *  @returns Xml object
	 */
	stringToXml: function(str) {
	    monitor.messageDump("stringToXml", false);
		var xmlobject = (new DOMParser()).parseFromString(str, "text/xml");
		return xmlobject;
	}	
};


// ***************************************************************************
// **                                                                       **
// **                         -  Ajax Call Class -                          **
// **                                                                       **
// ***************************************************************************

/**
 * Class that contains functions to call the public key server to add or post new keys in tiny URL
 * @class Class that contains functions to call the public key server to add or post new keys in tiny URL
 */
var myAjax = {
	
	/**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "myAjax",
          _enable: true
        };
	    var pref_service = Cc["@mozilla.org/preferences-service;1"];
		var preferences = pref_service.getService(Ci.nsIPrefService);
		var prefs = preferences.getBranch(EXTPrefs);
		params._enable = debug;
        return params;
    },
	
	// http://pgp.mit.edu:11371/pks/lookup 
	// http://pgp.mit.edu:11371/pks/lookup?op=get&search=0xEC6D0421D86046B0
	
	/**
	 *	Function to call the url server 
	 *  @public
	 *  @param url The server URL (default http://pgp.mit.edu:11371/pks/lookup)
	 *  @param args The server commonly requested args
	 *  @returns {String} value or null
	 *  @throws {Exception} If there is a connection or a server issue
	 */
	callServer: function(url, args) {
		try {
            monitor.log(this._debug()._name, "callServer ["+url+"]", this._debug()._enable);
			
			if( (args === undefined) || (args === null)) {
                args = "";
			}
		    //url = url+args;
		
			if (url.indexOf("http://") != 0) {
				url = "http://"+url;
			}
			
			// var http = new XMLHttpRequest();
			var http = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]  
			                    .createInstance(Ci.nsIXMLHttpRequest);
			http.open("GET", url+args, false); //true for asynchronous
			dump("URL: "+url+args+"\n");
			http.send(null);
			
	    	if(http.readyState == 4 && http.status == 200) {
				return http.responseText;
			} else if (http.status == 404 || http.status == 500) {
				return null;
			}
		} catch(e) {
            monitor.exception(this._debug()._name, "Exception"+e, this._debug()._enable);
			return null;
		}
	},
	
	//http://pgp.mit.edu:11371/pks/add
	/**
	 *	Function to post a key on a PK server
	 *  @public
	 *  @param url The server URL (default http://pgp.mit.edu:11371/pks/add)
	 *  @param args The server commonly requested args
	 *  @returns {String} value or null
	 *  @throws {Exception} If there is a connection or a server issue
	 */
	postinServer: function(url, args) {
        try {
            monitor.log(this._debug()._name, "post inServer ["+url+"]", this._debug()._enable);
            // var http = new XMLHttpRequest();
			var http = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]  
			                    .createInstance(Ci.nsIXMLHttpRequest);
			
            if (!http) {
			    dump('Cannot create XMLHTTP instance\n');
				return null;
			}		
			
		    var params = "";
            if( (args !== undefined) && (args !== null)) {
                params += args;
            }
            http.open("POST", url, false);
            
            //Send the proper header information along with the request
            http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            http.setRequestHeader("Content-length", params.length);
            http.setRequestHeader("Connection", "close");

       		http.send(params);
			if(http.readyState == 4 && http.status == 200) {
			    return http.responseText;
			} else if (http.status == 404 || http.status == 500) {
			    return null;
			}

		} catch(e) {
            monitor.exception(this._debug()._name, e, this._debug()._enable);
			return null;
		}  
	},
	
	
};