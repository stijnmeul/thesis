/**
 * @fileOverview Contains a misc of functions used by the extension
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

/**
  * Function doLog (print warning or tracking messages to the console)
  * @param {str} str String value to print
  */
function doLog(str) {
	dump("### "+str+"\n");
}

// ***************************************************************************
// **                                                                       **
// **                         -  Ajax Call Class -                          **
// **                                                                       **
// ***************************************************************************
// myAjax object 

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
        return params;
    },
	
	// http://pgp.mit.edu:11371/pks/lookup 
	// http://pgp.mit.edu:11371/pks/lookup?op=get&search=0xEC6D0421D86046B0
	
	/**
	 *	Function to call the url server 
	 *  @public
	 *  @param url The server URL (default http://pgp.mit.edu:11371/pks/lookup)
	 *  @param args The server commonly requested args
	 *  @returns {String} Success or FAIL
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
			
			var http = new XMLHttpRequest();
			http.open("GET", url+args, false); //true for asynchronous
			dump("URL: "+url+args+"\n");
			http.send(null);
			
	    	if(http.readyState == 4 && http.status == 200) {
				return http.responseText;
			} else if (http.status == 404 || http.status == 500) {
				return FAIL;
			}
		} catch(e) {
            monitor.exception(this._debug()._name, e, this._debug()._enable);
			return FAIL;
		}
	},
	
	//http://pgp.mit.edu:11371/pks/add
	/**
	 *	Function to post a key on a PK server
	 *  @public
	 *  @param url The server URL (default http://pgp.mit.edu:11371/pks/add)
	 *  @param args The server commonly requested args
	 *  @returns {String} Success or FAIL
	 *  @throws {Exception} If there is a connection or a server issue
	 */
	postinServer: function(url, args) {
        try {
            monitor.log(this._debug()._name, "post inServer ["+url+"]", this._debug()._enable);
            // var http = new XMLHttpRequest();
			var http = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]  
			                    .createInstance(Components.interfaces.nsIXMLHttpRequest);
			
            if (!http) {
			    dump('Cannot create XMLHTTP instance\n');
				return FAIL;
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
			    return FAIL;
			}

		} catch(e) {
            monitor.exception(this._debug()._name, e, this._debug()._enable);
			return FAIL;
		}
        
	}
	

};

// ***************************************************************************
// **                                                                       **
// **                       -  Misc Utils Functions -                       **
// **                                                                       **
// ***************************************************************************

/**
 *	Function to strip the HTML and other unwated tags and clean the text
 *  @public
 *  @param html html text to be cleaned
 *  @param uri the current uri (it will affect the clean)
 *  @returns {String} Cleaned text
 */
function stripHTML(html, uri) {
        monitor.messageDump("stripHtml", false);
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
}


/**
 *	Function to trim the string
 *  @public
 *  @param str string to be trimmed 
 *  @param chars (Optional) regx with the value for trim
 *  @returns {String} Trimmed string
 */
function strTrim(str, chars) {
    // doLog("Utils: strTrim");
	chars = chars || "\\s";
	str = str.replace(new RegExp("[" + chars + "]+$", "g"), ""); // trim the right side
	str = str.replace(new RegExp("^[" + chars + "]+", "g"), ""); // trim the left side
	return str;
}


/**
 *	Function locate a string under a regular expression
 *  @public
 *  @param str string where to search
 *  @param regex regx with the value for match
 *  @returns {String} located string
 */
function strLocate(str, regex) {
    // doLog("Utils: strLocate:");
    var re = new RegExp(regex);    
    var m = re.exec(str);
    if (m === null) {
        return "";        
    } else {
        return m[1];
    }
}

/**
 *	Function to retrieve the selected text by the user on the current window
 *  @public
 *  @deprecated
 *  @returns {String} With the selected text
 */
// function getSelectedTxt() {
//      // Select a text from the actual document
//         monitor.messageDump("getSelectedTxt", false);
//      var selectedtxt = getBrowser().contentWindow.getSelection();
//      return selectedtxt;
// }


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
function detectOS() {
    monitor.messageDump("detectOS", false);
	var ret;
	if (navigator.appVersion.indexOf("Win")!=-1) {
		ret = WIN;
	}else if (navigator.appVersion.indexOf("Mac")!=-1) {
		ret = MAC;
	} else {
		ret = UNIX;
	}
	return ret;
}

/**
 *	Function to execute the bash script to update JCE unrestricted files
 *  (Only for the BC version...)
 *  @public
 *  @returns process exitValue
 */

function runJCEScript(sudo) {
	monitor.messageDump("runScript", true);		
	var args = new Array();
	var script = WinJCEScript;
	if( (sudo == undefined) || (sudo == null) ) {
		sudo = "fail";
	}
	var os = detectOS();
	monitor.messageDump("Operating System: "+os, true);
	if(os != WIN) { // unix script
		args[0] = ( (detectOS() == MAC ) ? "mac" : "linux" );
		args[1] = sudo;
		script = UnixJCEScript;
	} 	
	// get profile directory
	// var em = Components.classes["@mozilla.org/extensions/manager;1"].
	//          getService(Components.interfaces.nsIExtensionManager);
	
	var file = null;	
	Components.utils.import("resource://gre/modules/AddonManager.jsm");
	AddonManager.getAddonByID(EXTID,  function(addon) {
	            var extensionPath = addon.getResourceURI("").QueryInterface(Components.interfaces.nsIFileURL).file.path;
	            var extensionUrl = "file:///" + extensionPath.replace(/\\/g, "/");
	           	file = extensionUrl + script;
				dump("FILE: "+file+"\n");
				// return file;

	// the path may use forward slash ("/") as the delimiter
	// returns nsIFile for the extension's install.rdf
	// var file = em.getInstallLocation(EXTID).getItemFile(EXTID, script);
	// create an nsIProcess
	var process = Components.classes["@mozilla.org/process/util;1"]
	                        .createInstance(Components.interfaces.nsIProcess);
	process.init(file);
	// Run the process.
	process.run(false, args, args.length);
	// dump("exit value: "+process.exitValue+"\n");
	});
	// return process.exitValue;
}

// ***************************************************************************
// **                                                                       **
// **                   -  XML, DOM and Path Functions -                    **
// **                                                                       **
// ***************************************************************************

//removeChildrenFromNode: Removes Children from a Node

/**
 *	Function to remove a children from a node
 *  @public
 *  @param node node element
 *  @param children children element to be removed
 */
function removeChildrenFromNode(node, children) {
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
}

/**
 *	Function to convert a string text to a xml object
 *  @public
 *  @param str string text value
 *  @returns Xml object
 */
function stringToXml(str) {
    monitor.messageDump("stringToXml", false);
	var xmlobject = (new DOMParser()).parseFromString(str, "text/xml");
	return xmlobject;
}


/**
 *	Function to convert a xml object to a string
 *  @public
 *  @param xmlobject xml object value
 *  @returns {String} String text
 */
function xmlToString(xmlobject) {
    monitor.messageDump("xmlToString", false);
    var str = (new XMLSerializer()).serializeToString(xmlobject);
	return str;
}


/**
 *	Function to convert a chrome path URI into a File Path URI
 *  @public
 *  @param aPath The chrome path value
 *  @returns {String} File path URI
 */
function chromeToPath (aPath) {
    monitor.messageDump("chromeToPath", false);
	try {
		if ( (!aPath) || (!(/^chrome:/.test(aPath))) ) {
			return null; //not a chrome url
		}
		var comp_io = Components.classes["@mozilla.org/network/io-service;1"];
		var ios = comp_io.getService(Components.interfaces["nsIIOService"]);
		var uri = ios.newURI(aPath, "UTF-8", null);
		var comp_reg = Components.classes["@mozilla.org/chrome/chrome-registry;1"];
		var cr = comp_reg.getService(Components.interfaces["nsIChromeRegistry"]);
		var rv = cr.convertChromeURL(uri).spec;
		
		if (/^file:/.test(rv)) {
			rv = this.urlToPath(rv);
		} else {
			rv = this.urlToPath("file://"+rv);
		}
	    return rv;
		
	} catch (e) {
        monitor.exception("utils: chromeToPath", e, true);
        return null;
	}
}

/**
 *	Function to save a xml object into a file
 *  @public
 *  @param xmlDoc xml object value
 *  @returns {String} Success or Fail
 *  @throws {Exception} Issues with the xml document or file
 */
function saveXMLFile (xmlDoc, path) {
    monitor.messageDump("saveXMLFile", false);	
	if( (path === undefined) || (path === null) ) {
	    path = getPreferences().getCharPref(KEYChainPath);
	}
		
	try {
	    
	    var somefile;
        if( !( /^chrome:/.test(path) ) ) {
            somefile = path;    
        } else {
                 somefile = chromeToPath(path);
        }
		// var xmlDoc;
		// dump("doXmlStuff path: "+somefile+"\n");
		var file_local = Components.classes["@mozilla.org/file/local;1"];
		var file = file_local.createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(somefile);
		 
		
		if (file.exists()) {
			var component = Components.classes["@mozilla.org/network/file-output-stream;1"];
			var fcStream = component.createInstance(Components.interfaces.nsIFileOutputStream);
			fcStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);	// write, create, truncate
			var ser = new XMLSerializer();
			//write the serialized XML to file
			ser.serializeToStream(xmlDoc, fcStream, "");
			fcStream.close();
			return SUCC;
		} else {
			return FAIL;
		}
		
	} catch (e) {
        monitor.messageDump("utils: saveXMLFile", e, true);
		return FAIL;
	}
}

/**
 *	Function to copy a file to a specific directory
 *  @public
 *  @param sourceFile The source File
 *  @param destDir The destination directory
 *  @param newname Rename the file
 *  @returns {String} File path URI
 */
function copyFile(sourcefile, destdir, newname) {
	// get a component for the file to copy

	if(newname == undefined) {
		newname = null;
	}
	var aFile = Components.classes["@mozilla.org/file/local;1"]
	  .createInstance(Components.interfaces.nsILocalFile);
	if (!aFile) {
		return false;
	}
	aFile.initWithPath(sourcefile);

	// get a component for the directory to copy to
	var aDir = Components.classes["@mozilla.org/file/local;1"]
	  .createInstance(Components.interfaces.nsILocalFile);
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

		var aNewFile = Components.classes["@mozilla.org/file/local;1"].createInstance();
		if (aNewFile instanceof Components.interfaces.nsILocalFile){
		  	aNewFile.initWithPath(destdir+"/"+newname);
			try {
		  		aNewFile.remove(false);
				aFile.copyTo(aDir,newname);
			} catch(ex) {
				monitor.exception("utils: copyFile", e, false);		
				return false;
			}
			return true;
		} else {
			monitor.exception("utils: copyFile", e, false);
			return false;
		}
	}	
}

/**
 *	Function to convert a url to a file path
 *  @public
 *  @param aPath The URl path value
 *  @returns {String} File path URI
 */
function urlToPath (aPath) { 
    monitor.messageDump("urlToPaths", false);
	try{
		if ( (!aPath) || (!(/^file:/.test(aPath))) ) {
			return ;
		}
		var prot = Components.classes["@mozilla.org/network/protocol;1?name=file"];
		var ph = prot.createInstance(Components.interfaces.nsIFileProtocolHandler);
		var rv = ph.getFileFromURLSpec(aPath).path;
		return rv;
	} catch (e) {
        monitor.exception("utils: urlToPath", e, false);
		return;
	}		
}


/**
 *	Function to get the path finder dialog and returns the selected Folder path 
 *  @public
 *  @returns {String} File path or FAIL
 */	
function onSelectDir(msg) {
    monitor.messageDump("onSelectDir", false);
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

	fp.init(window, msg , nsIFilePicker.modeGetFolder);
	fp.appendFilters(nsIFilePicker.filterAll);
	
	if ( fp.show() == nsIFilePicker.returnOK ) {
        return fp.file.path;
    }
	return FAIL;
}

/**
 *	Function to get the path finder dialog and returns the selected File path 
 *  @public
 *  @returns {String} File path or FAIL
 */	
function onSelectFile(msg) {
    monitor.messageDump("onSelectFile", false);
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

	fp.init(window, msg , nsIFilePicker.modeOpen);
	fp.appendFilters(nsIFilePicker.filterAll);
	
	if ( fp.show() == nsIFilePicker.returnOK ) {
        return fp.file.path;
    }
	return FAIL;
}


/**
 *	Accesses the firefox preferences system scramble branch using the preferences service xpcom
 *  @public
 *  @returns Scramble Preferences Branch
 */
function getPreferences() {
    monitor.messageDump("getPreferences", false);
    var pref_service = Components.classes["@mozilla.org/preferences-service;1"];
	var preferences = pref_service.getService(Components.interfaces.nsIPrefService);
	var branch = preferences.getBranch(EXTPrefs);
	return branch;
}



/**
 *	Validates an input date value
 *  @public
 *  @param input_date Date value to validate
 *  @returns {boolean} true or false
 */
function checkDate(input_date) {
    monitor.messageDump("checkDate", true);
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
}