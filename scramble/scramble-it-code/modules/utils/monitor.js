/**
 * @fileOverview Contains a misc of functions used to monitor and trace code 
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


// ***************************************************************************
// **                                                                       **
// **              -  Monitor class: monitor and trace -                    **
// **                                                                       **
// ***************************************************************************

var EXPORTED_SYMBOLS = ["monitor"];

/**
 * Class that contains a misc of functions used to monitor and trace code 
 * @class Class that contains a misc of functions used to monitor and trace code 
 */
var monitor = {
        
    /**
	 *	Function to create a log into the system output (dump) 
	 *  @public
	 *  @param string The text to add as index
	 *  @param args The arguments to be printed
	 */
    log: function(string, args, enable) {
            this.messageDump(string+" > "+args, enable);
    },
    
    /**
	 *	Function to trace errors and exceptions
	 *  @public
	 *  @param string The text to add as index
	 *  @param exception The returned exception
	 */
    exception: function(string, exception, enable) {
            var msg;
            if (exception.getMessage) {
                msg = exception + ": " + exception.getMessage() + "\n";
                while (exception.getCause() !== null) {
                    exception = exception.getCause();
                    msg += "Caused by " + exception + ": " + exception.getMessage() + "\n";
                }
            } else {
                msg = exception;
            }
            this.messageDump(string+" > "+msg, enable);
    },
    
    /**
	 *	Function to create an alert message
	 *  @public
	 *  @param msg The message to be on the alert
	 */
    messageAlert: function(msg, enable, success) {
        if(enable) {
        	if(success) {
        		// show a nice icon
        	} else {
        		scrambleAppNS.dialogLoader.warningDialog(msg, true);
        	}
        }
    },
    
    /**
	 *  Function to system output (dump) a message
	 *  @public
	 *  @param msg The message to be outputed
	 */
    messageDump: function(msg, enable) {
        if(enable) {
            dump("### "+msg+"\n");
        }
    }
};