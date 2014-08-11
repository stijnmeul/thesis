/**
 * @fileOverview Contains a misc of functions used to listen and parse data of the HTML content
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

/**
 * Class that defines the Progress Listeners that monitors actions on the website 
 * @class Class that defines the Progress Listeners that monitors actions on the website
 */
scrambleAppNS.myProgressListeners = {


		QueryInterface: function(aIID) {
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
			
            // rewrite the page to add our listeners for the image
            // scrambleAppNS.htmlactions.insertFileListeners(null); // commented for the CMU experiments
			var ret = scrambleAppNS.htmlactions.ontheflyDecryption();
			var ret = scrambleAppNS.htmlactions.ontheflySteganalysis(null);
		} else {
			dump(" ");
		}
	}
	return 0;


}

};


/** 
 *	Contains the initialisation and activation of the event listeners to activate the on the fly decryption
 *	@class Class that contains the listeners to activate the on the fly decryption
 */
scrambleAppNS.myListeners = {

		/**
		 *	Function to initialise the event listener
		 *  @public
		 */
		init: function(debug) {
	monitor.log("myListeners", "Initialise", debug);
	var appcontent = document.getElementById("appcontent");   // browser
	if(appcontent) {
		appcontent.addEventListener("DOMContentLoaded", this.onPageLoad, true);
	}
	// For mail - Not needed for current scope
	var messagepane = document.getElementById("messagepane"); // mail
	if(messagepane) {
		messagepane.addEventListener("load", function () { this.onPageLoad(); }, true);
	}
	gBrowser.addProgressListener(scrambleAppNS.myProgressListeners, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);

}

};

