Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
 
function NodeJs() { }
 
NodeJs.prototype = {
	classDescription: "NodeJS Javascript XPCOM Component",
	classID:          Components.ID("{d68f9c51-54b3-44f5-bf66-8249db1222ec}"),
	contractID:       "@nodejsff.com/nodejs;1",
	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsINodeJs]),
	get wrappedJSObject() {return(this);},

	process:null,
	obs:false,

	start: function(event) {
	
		if(this.process) {
				
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			                        .getService(Components.interfaces.nsIPromptService);
			
			var textToShow=Components.classes["@mozilla.org/intl/stringbundle;1"]
           .getService(Components.interfaces.nsIStringBundleService)
           .createBundle("chrome://nodejs/locale/nodejs.properties")
		   .GetStringFromName("nodeclose"); 
			
			var result = prompts.confirm(null, "Node.JS", textToShow);
			
			if (result) {
			
				this.process.kill();

				this.redButton();
    		
    			this.process = null;			
			
				return;
			
			}
			
			return;
		
		}

	    // Import Services module for Observer (startup and shutdown events)
	    Components.utils.import("resource://gre/modules/Services.jsm");
	
	    // Create an nsILocalFile for the Node executable
		Components.utils.import("resource://gre/modules/FileUtils.jsm");
		 
		// get the "node" file in the resource directory
		var file = FileUtils.getFile("ProfD", ["extensions","nodejs@nodejsff.com","resource","node"]);
		
	    // Check for Node executable
	    if (!file.exists()) {
	        // Node executable is missing
	        return;
	    };
	
	    // Create an nsIProcess to manage the Node executable
	    var process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
	    process.init(file);
	    this.process=process;
	
		var that=this;
		var ObserverHandler = {
			// subject refers to the process nsIProcess object
			observe: function(subject, topic, data) {
				switch (topic) {
					// Process has finished running and closed
					case "process-finished":
						break;
					// Process failed to run
					case "process-failed":
						break;
					case "quit-application-granted":
						// Shut down any Node.js processes							
						if(that.process) that.process.kill();
						this.unregister();
						break;
				};
			},
			register: function() {
				Services.obs.addObserver(this, "quit-application-granted", false);
			},
			unregister: function() {
				Services.obs.addObserver(this, "quit-application-granted", false);
			}					
		};	
	
		var nodejsfile = FileUtils.getFile("ProfD", ["extensions","nodejs@nodejsff.com","resource","node.js"]);
	
	    // Run the Node process and observe for any changes
	    var args = [nodejsfile.path];
	    process.runAsync(args, args.length, ObserverHandler);
	
		if(!this.obs) {
			ObserverHandler.register();
			this.obs=true;	
		}
    
	    var window = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                    .getService(Components.interfaces.nsIWindowMediator)
					.getMostRecentWindow("navigator:browser");
	
		window.setTimeout(function(){
	
			// Add tab, then make active
			window.gBrowser.selectedTab = window.gBrowser.addTab("http://localhost:7000/");
		
		},500);
    	
		this.greenButton();
    
    },

  	change: function(event) {

		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
								.getService(Components.interfaces.nsIPromptService);
								
		var textToShow=Components.classes["@mozilla.org/intl/stringbundle;1"]
	   .getService(Components.interfaces.nsIStringBundleService)
	   .createBundle("chrome://nodejs/locale/nodejs.properties")
	   .GetStringFromName("noderestart"); 
		   
		var result = prompts.confirm(null, "Node.JS", textToShow);
		
		if (result) {
		
			if(this.process){
				
				this.process.kill();

				this.redButton();
			
				this.process=null;
			
			}			

			var window = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						.getService(Components.interfaces.nsIWindowMediator)
						.getMostRecentWindow("navigator:browser");
			
			const nsIFilePicker = Components.interfaces.nsIFilePicker;
			
			var fp = Components.classes["@mozilla.org/filepicker;1"]
						   .createInstance(nsIFilePicker);
			fp.init(window, "Node JS", nsIFilePicker.modeOpen);
			fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
			
			var rv = fp.show();
			if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
				var file = fp.file;
				// Get the path as string. Note that you usually won't 
				// need to work with the string paths.
				var nodejsfile = file;
				// work with returned nsILocalFile...

			  
				// Import Services module for Observer (startup and shutdown events)
				Components.utils.import("resource://gre/modules/Services.jsm");
			
				// Create an nsILocalFile for the Node executable
				Components.utils.import("resource://gre/modules/FileUtils.jsm");
				 
				// get the "node" file in the resource directory
				var file = FileUtils.getFile("ProfD", ["extensions","nodejs@nodejsff.com","resource","node"]);
				
				// Check for Node executable
				if (!file.exists()) {
					// Node executable is missing
					return;
				};
		
				// Create an nsIProcess to manage the Node executable
				var process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
				process.init(file);
				this.process=process;			
				
				var that=this;
				var ObserverHandler = {
					// subject refers to the process nsIProcess object
					observe: function(subject, topic, data) {
						switch (topic) {
							// Process has finished running and closed
							case "process-finished":
								break;
							// Process failed to run
							case "process-failed":
								break;
							case "quit-application-granted":
								// Shut down any Node.js processes							
								if(that.process) that.process.kill();
								this.unregister();
								break;
						};
					},
					register: function() {
						Services.obs.addObserver(this, "quit-application-granted", false);
					},
					unregister: function() {
						Services.obs.addObserver(this, "quit-application-granted", false);
					}					
				};				
				
				var nodejsfile = nodejsfile;
		
				// Run the Node process and observe for any changes
				var args = [nodejsfile.path];
				process.runAsync(args, args.length, ObserverHandler);
		
				if(!this.obs) {
					ObserverHandler.register();
					this.obs=true;	
				}
				
				var window = Components.classes["@mozilla.org/appshell/window-mediator;1"]
							.getService(Components.interfaces.nsIWindowMediator)
							.getMostRecentWindow("navigator:browser");
		
				window.setTimeout(function(){
			
					// Add tab, then make active
					//window.gBrowser.selectedTab = window.gBrowser.addTab("http://localhost:/");
					window.gBrowser.selectedTab = window.gBrowser.addTab("http://localhost:7000/");
				
				},500);
				
			
				this.greenButton();

			}
		
		}
    
    },
	
	greenButton: function () { 

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var type="navigator:browser";
		var enumerator = wm.getEnumerator(type);
		while(enumerator.hasMoreElements()) {
		  var win = enumerator.getNext();
		  // win is [Object ChromeWindow] (just like window), do something with it
			var n=win.document.getElementById("nodejs-button");
			if(n){
				n.classList.remove("nodeoff");
				n.classList.add("nodeon");
			}
		}	
	
	},		
	
	redButton: function () { 

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var type="navigator:browser";
		var enumerator = wm.getEnumerator(type);
		while(enumerator.hasMoreElements()) {
		  var win = enumerator.getNext();
		  // win is [Object ChromeWindow] (just like window), do something with it
			var n=win.document.getElementById("nodejs-button");
			if(n){			
				n.classList.remove("nodeon");
				n.classList.add("nodeoff");
			}			
		}	
	
	}
          
}


var components = [NodeJs];
if ("generateNSGetFactory" in XPCOMUtils)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);  // Firefox 4.0 and higher
else
  var NSGetModule = XPCOMUtils.generateNSGetModule(components);    // Firefox 3.x