/**
 * @fileOverview Contains the functions that control the newgroup dialog
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


// ***************************************************************************
// **                                                                       **
// **                 -  Key Chain Main control object -                    **
// **                                                                       **
// ***************************************************************************
// import the utils modules
Components.utils.import("resource://scramble/utils/utils.js");
Components.utils.import("resource://scramble/utils/monitor.js");
// import the core modules
Components.utils.import("resource://scramble/core/coins.js");
Components.utils.import("resource://scramble/core/kernel.js");
Components.utils.import("resource://scramble/lib/xmlMessages.js");


/**
 * Class that contains the functions that control the warning dialog
 * @class Class that contains the functions that control the warning dialog
 */
var gkprog = {

	_BUNDLE: "scramble_strings",
	/**
	 *	Function that loads the default information when the window dialog is loaded
	 *  @function
	 *  @param win this window dialog object
	 */
	onLoad: function(win) {
		if(window.arguments != undefined) {
			var params = window.arguments[0];
			var strbundle = document.getElementById(this._BUNDLE);
						
			document.getElementById('message').value = strbundle.getString("scramble.keys.generating");
			document.getElementById('b_ok').disabled = true;
			document.getElementById('details').value = "( "+strbundle.getString("scramble.keys.genDetails")
														+" "+params.userid+" )";
			gkprog.onStart();			
		} else
			return;
	},
	
	onStart: function() {	
		var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);  
		var timer2 = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);  
		const TYPE_ONE_SHOT = Components.interfaces.nsITimer.TYPE_ONE_SHOT;
		document.getElementById('message').style.display = "block";

		timer2.init( function() {
			var val = document.getElementById('progbar').value;
			if(val != 100) document.getElementById('progbar').value = "70";
		}, 1000, TYPE_ONE_SHOT);

		timer.init(function() {
			var prefs = scrambleUtils.getPreferences();
			var pubpath = prefs.getCharPref(vars._PubRingPath);
			var secpath = prefs.getCharPref(vars._SecRingPath);
 			// generate keys
			var params = window.arguments[0];

			//change to kernel			
            var onDone = function(data) {
                var ret = xmlMessages.processReply(data);
                if(ret != "null") {
                    gkprog.onFinish(true);
                } else
                    gkprog.onFinish(false);
            };
            
            // var ret = 
			kernel.generateKeyPair(params.userid, params.pwd, params.bitsize, pubpath, secpath, onDone);
		}, 500, TYPE_ONE_SHOT);
		
	},
	
	onFinish: function(result) {
		var strbundle = document.getElementById(this._BUNDLE);
		document.getElementById('progbar').value = "100";
		document.getElementById('b_ok').disabled = false;
		if(result) {
			document.getElementById('b_ok').disabled = false;
			document.getElementById('message').value = strbundle.getString("scramble.keys.genOK");
		} else {
			document.getElementById("b_ok").label = "Retry?";
			document.getElementById('message').value = strbundle.getString("scramble.keys.genFail");
			document.getElementById('message').style.display = "none";
		}
		window.arguments[0].result = result;
	},
	
	
	/**
	 *	Saves the option and closes dialog
	 *  @public
	 */	
	onOK: function() {
		if(window.arguments[0].result) {
			window.close();	
		} else {
			document.getElementById('progbar').value = "30";
			this.onStart();
		}
	},
	
	/**
	 *	Saves the option and closes dialog
	 *  @public
	 */	
	onExit: function() {
		window.arguments[0].result = false;
		window.close();
	},
	
};