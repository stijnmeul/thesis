// ***************************************************************************
// **                                                                       **
// **                -  Main Namespace and initialisations -                **
// **                                                                       **
// ***************************************************************************
dump("......................................................................\n");
dump("Starting Scramble! \n");
dump("Loading required Modules: ");
// import the utils modules
dump("[coins] ");
Components.utils.import("resource://scramble/core/coins.js");
dump("[utils] ");
Components.utils.import("resource://scramble/utils/utils.js");
dump("[monitor] ");
Components.utils.import("resource://scramble/utils/monitor.js");
dump("[kernel] ");
Components.utils.import("resource://scramble/core/kernel.js");
dump("[xmlMessages] ");
Components.utils.import("resource://scramble/lib/xmlMessages.js");
dump("[socket] ");
Components.utils.import("resource://scramble/utils/socket.js");
dump("-> Done!\n");
dump("......................................................................\n");

/**
 * ScrambleAppNS - application namespace definition...
 */
if ("undefined" == typeof(scrambleAppNS)) {
    var scrambleAppNS = {};
    /** 
   	* Constructor. 
   	*/
    (function() {
		dump("Create Scramble App Namespace\n");
    }).apply(scrambleAppNS);
};
