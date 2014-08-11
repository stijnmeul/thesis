/**
 * @fileOverview Contains the core for the methods to encrpyt and replace cyphertext with dummy text
 * @author 
 * @version 1.0
 */

// ***************************************************************************
// **                                                                       **
// **                 -  Encrypt and hide data  -                    **
// **                                                                       **
// ***************************************************************************



/**
  * @class This is the class that communicates with the firefox extension menus as well as main function executers
  */
scrambleAppNS.steganography = {
		
	stegSpecs: null,
    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "steganography",
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
        monitor.log(this._debug()._name, "onLoad", this._debug()._enable);
        this.stegSpecs = this.readXML();
		
	},

    // ***************************************************************************
    // **                                                                       **
    // **                         -  Execution Functions -                      **
    // **                                                                       **
    // ***************************************************************************

    
    getXPathQueries: function(url) {
    	this.readXML();
    	var blocks = [];

    	monitor.log(this._debug()._name, "getXPathQueries: " + url , this._debug()._enable);
    	for (var i = 0; i < this.stegSpecs.length; i++){
    		var page = this.stegSpecs [i];
    		monitor.log(this._debug()._name, "current pattern: " + page.url, this._debug()._enable);
    		if (new RegExp(page.url).test(url)) {
    			monitor.log(this._debug()._name, "MATCHED: " + page.url, this._debug()._enable);
    			monitor.log(this._debug()._name, "blocks: " + blocks.length, this._debug()._enable);
    			var xpathBlocks = page.blocks;
    			for (var x = 0; x < xpathBlocks.length; x++) {
    				blocks.push(xpathBlocks[x]);
    				monitor.log(this._debug()._name, "x: " + x, this._debug()._enable);
    				var MSG_BLOCK_XPATH = xpathBlocks[x].region;
    				var SENDER_XPATH = xpathBlocks[x].sender;
    				var MESSAGE_XPATH = xpathBlocks[x].data;
    				monitor.log(this._debug()._name, "MSG_BLOCK_XPATH: " + MSG_BLOCK_XPATH, this._debug()._enable);
    				monitor.log(this._debug()._name, "SENDER_XPATH: " + SENDER_XPATH, this._debug()._enable);
    				monitor.log(this._debug()._name, "MESSAGE_XPATH: " + MESSAGE_XPATH, this._debug()._enable);
    			}
    		}
    	}	
    	return blocks;
    },
    
    readXML: function() {
    	monitor.log(this._debug()._name, "readXML", this._debug()._enable);
    	//var xmlDoc = new ActiveXObject("../../locale/en-US/stegpages.xml");
   	
    	if(this.stegSpecs)
    		return this.stegSpecs ;
    	
    	this.stegSpecs = [];
        var dirSer_comp = Components.classes["@mozilla.org/file/directory_service;1"];
        var dirService = dirSer_comp.getService(Components.interfaces.nsIProperties); 
        // returns an nsIFile object from the current profile directory
        var file = dirService.get("ProfD", Components.interfaces.nsIFile); 
        file.append("extensions");
        file.append(vars._EXTID);
        file.append("chrome");
        file.append("scramble");
        file.append("locale");
        file.append("en-US");
        /*
        file.append(EXTDIR);
        if( (!file.exists()) || (!file.isDirectory()) ) {   // if it doesn't exist, create directory
            file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0777);
            control = true;
        } */
        file.append("stegSpecs");
        monitor.log(this._debug()._name, "STEGSPECS folder:" + file.path, this._debug()._enable);
        if( (!file.exists()) || (!file.isDirectory()) ) {   // if it doesn't exist, create directory
            file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0777);
            control = true;
        }
        
     // file is the given directory (nsIFile)  
        var entries = file.directoryEntries;  
        var array = [];  
        
        while(entries.hasMoreElements())  
        {  
          var entry = entries.getNext();  
          entry.QueryInterface(Components.interfaces.nsIFile);  
          array.push(entry);  
          monitor.log(this._debug()._name, "found file:" + entry.path, this._debug()._enable);
          this.stegSpecs = this.stegSpecs.concat(this.parseXMLFile(entry));
          monitor.log(this._debug()._name, "stegSpecs size: " + this.stegSpecs.length, this._debug()._enable);
        } 
        
        
      //  var fileName = "stegpages.xml";
       // file.append(fileName);
        return this.stegSpecs;
      

    },
    
    parseXMLFile: function(file) {
		//get the available ways to access the keys
		var xmlhttp = new XMLHttpRequest();
	//	var extensionPath = "../../";//addon.getResourceURI("").QueryInterface(Components.interfaces.nsIFileURL).file.path;
	//	var extensionUrl = "file://" + extensionPath.replace(/\\/g, "/");
		monitor.log(this._debug()._name, "reading xml file " + file.path, this._debug()._enable);
		
		
		xmlhttp.open("GET", "file://" + file.path, false);
		xmlhttp.send(null);

		var xmlDoc = xmlhttp.responseXML;
	
		var pages = xmlDoc.getElementsByTagName("page");
		var ret_pages = []
		                 
	    for (var i=0; i < pages.length; i++) {
	      var url = pages[i].getElementsByTagName("url")[0].childNodes[0].nodeValue;
	      monitor.log(this._debug()._name, "page [" + i + "]: " + url, this._debug()._enable);
	      
	      var ret_blocks = this.parseBlocks(pages[i]);
		  ret_pages [i] = {url: url, blocks: ret_blocks};
	   }
		return ret_pages;
    },
    
    parseBlocks: function(page) {
        var ret_Blocks = [];
    	var blocks = page.getElementsByTagName("block");
	      for (var j=0; j < blocks.length; j++) {
	    	  monitor.log(this._debug()._name, "blocks [" + j + "]: " + blocks[j].getAttribute("id"), this._debug()._enable);
	    	  var region = blocks[j].getElementsByTagName("region")[0].childNodes[0].nodeValue;
		      var sender = blocks[j].getElementsByTagName("sender")[0].childNodes[0].nodeValue;
		      var data = blocks[j].getElementsByTagName("data")[0].childNodes[0].nodeValue;
		      var dataType =  blocks[j].getElementsByTagName("data")[0].getAttribute("type");
		      
		      ret_Blocks [j] = {region: region, sender: sender, data: data, dataType: dataType};
		      
		      monitor.log(this._debug()._name, "region: " + region, this._debug()._enable);
		      monitor.log(this._debug()._name, "sender: " + sender, this._debug()._enable);
		      monitor.log(this._debug()._name, "data: " + data, this._debug()._enable);
		      monitor.log(this._debug()._name, "-----------------------" , this._debug()._enable);
	      }
	     return ret_Blocks;
    }
    
};