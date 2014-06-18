
	var NODEJS = {

		start: function(event) {

			try {
				var nodejs = Components.classes['@nodejsff.com/nodejs;1'].getService().wrappedJSObject;
				nodejs.start();  
			} catch (anError) {
				throw new Error("ERROR: " + anError);
			}
		
		},
		
		change: function(event) {

			try {
				var nodejs = Components.classes['@nodejsff.com/nodejs;1'].getService().wrappedJSObject;
				nodejs.change();  
			} catch (anError) {
				throw new Error("ERROR: " + anError);
			}
		
		},
		
		load: function(event) {

			window.removeEventListener('load', NODEJS.load, false);
	
			var firstRun = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService)
							 .getBranch("extensions.nodejs.")
							 .getBoolPref('firstrun');
			
			if (firstRun) {
			
				var toolbar = document.getElementById('nav-bar');
				
				if (!toolbar.currentSet.match('nodejs-button')) {
				
						var newset = toolbar.currentSet.concat(',nodejs-button');
						toolbar.currentSet = newset;
						toolbar.setAttribute('currentset', newset);
						document.persist(toolbar.id, "currentset");
						
				}
				
				Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService)
							 .getBranch("extensions.nodejs.")
							 .setBoolPref('firstrun',false);
				
			}

			try {
				var nodejs = Components.classes['@nodejsff.com/nodejs;1'].getService().wrappedJSObject;
				if(nodejs.process) NODEJS.addGreen();
				else NODEJS.addRed();  
			} catch (anError) {
				throw new Error("ERROR: " + anError);
			}
		
		},
		
		addGreen: function(event) {

			var n=document.getElementById("nodejs-button");
			if(n){
				n.classList.remove("nodeoff");
				n.classList.add("nodeon");
			}			
		
		},	
		
		addRed: function(event) {

			var n=document.getElementById("nodejs-button");
			if(n){
				n.classList.remove("nodeon");
				n.classList.add("nodeoff");
			}
		
		},
		
		debug: function(anError) {

			cS = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);       
			cS.logStringMessage(new Date().toLocaleTimeString() + ": " + anError);
		
		}

	}

	window.addEventListener("load",NODEJS.load,false);
