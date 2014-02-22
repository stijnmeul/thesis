/**
 * @fileOverview Contains a misc of functions used to listen and parse data of the HTML content
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

var javaObj = null;

/**
  * Class that defines the Progress Listeners that monitors actions on the website 
  * @class Class that defines the Progress Listeners that monitors actions on the website
  */
var myProgressListeners = {


    QueryInterface: function(aIID) {
		dump("myProgressListeners.QueryInterface:\n");
        monitor.log("myProgressListeners", "QueryInterface", true);
		if ( aIID.equals(Components.interfaces.nsIWebProgressListener) || 
			aIID.equals(Components.interfaces.nsISupportsWeakReference) || 
			aIID.equals(Components.interfaces.nsISupports) ) { 
			return this; 
		}
		throw Components.results.NS_NOINTERFACE;
    },

	/**
	 *	Function to monitor state changes
	 *  @public
	 *  @param aProgress
	 *  @param aRequest
	 *  @param aFlag
	 *  @param aStatus	
	 */
    onStateChange: function(aProgress, aRequest, aFlag, aStatus) {
        monitor.log("myProgressListeners", "onStateChange", true);

		if(!aRequest) {
			return 0;
		}

		if (aFlag & Components.interfaces.nsIWebProgressListener.STATE_START) { 
			// This fires when the load event is initiated 
            monitor.log("myProgressListeners", "Load even initiated", false);
		} else { 
				if (aFlag & Components.interfaces.nsIWebProgressListener.STATE_STOP) { 
						// Fires when ALL load are REALLY over,
						var ret = htmlactions.ontheflyDecryption(null);
                        monitor.log("myProgressListeners", "onStateChange: "+ret, true);
				} else {
            	    dump(" ");
        		}
		}
		return 0;
		
		
		
		
		 
	},

    onLocationChange: function(aProgress, aRequest, aURI) { return 0; },
    onProgressChange: function() { return 0; },
    onStatusChange: function() { return 0; },
    onSecurityChange: function(){ return 0; },
    onLinkIconAvailable: function() { return 0; }
};


/** 
  *	Contains the initialisation and activation of the event listeners to activate the on the fly decryption
  *	@class Class that contains the listeners to activate the on the fly decryption
  */
var myListeners = {

	/**
	 *	Function to initialise the event listener
	 *  @public
	 */
	init: function(debug, obj) {
		var appcontent = document.getElementById("appcontent");   // browser
		javaObj = obj;
		if(appcontent) {
			appcontent.addEventListener("DOMContentLoaded", myListeners.onPageLoad, true);
		}
		// For mail - Not needed for current scope
		var messagepane = document.getElementById("messagepane"); // mail
		if(messagepane) {
			messagepane.addEventListener("load", function () { myListeners.onPageLoad(); }, true);
		}
		gBrowser.addProgressListener(myProgressListeners, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);

	},

	/**
	 *	Function to detect the page load event
	 *  @public
	 *	@param aEvent Event
	 */	
	onPageLoad: function(aEvent) {
        // dump("myListeners.onPageLoad: ");    

		if (aEvent.originalTarget instanceof HTMLDocument) {
			var doc = aEvent.originalTarget; // doc is document that triggered "onload" event
			// var ret = ontheflyDecryption(null);
			// dump("On the Fly Decryption ----> "+ret+"\n");
		}
	},

	/**
	 *	Function to detect the page unload event
	 *  @public
	 *	@param aEvent Event
	 */
	onPageUnload: function(aEvent) {
        // dump("myListeners.onPageUnLoad:\n");
		if (aEvent.originalTarget instanceof HTMLDocument) {
			var doc = aEvent.originalTarget;
			// alert("page unloaded:" + doc.location.href);
		}
	}
};

/**
 * @event
 */
window.addEventListener("load", function() { myListeners.init(false); }, false);
