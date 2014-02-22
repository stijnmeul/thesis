/**
 * @fileOverview Deletion Dialog contains the functions that control the deletion dialog
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

// ***************************************************************************
// **                                                                       **
// **                  -  Deletion Main control object -                    **
// **                                                                       **
// ***************************************************************************

/** 
  *	Class that contains contains the functions that control the deletion dialog
  *	@class Class that contains the functions that control the deletion dialog
  */
var deletiondlg = {

	/**
	 *	Function that loads the default information when the window dialog is loaded
	 *  @function
	 *  @param win this window dialog object
	 */
	onLoad: function(win) {
		sizeToContent();
		this.doLog("Loaded");

		if(window.arguments == undefined) 
			return;

		var params = window.arguments[0];
		var value = params.value;

		if(params.result) {	 //delete group mode (simple mode - 2 buttons)
			document.getElementById('deleteLabel').value = "Are you sure you want to delete ["+value+"] "+params.ref+"?";
			document.getElementById('buttonremove').label = "Delete";

			document.getElementById('buttondelete').style.display = "none";
			document.getElementById('spacelabel').style.display = "none";

		} else {  // delete contact mode (complex mode - 3 buttons)
			document.getElementById('deleteLabel').value = "Are you sure you want remove ["+value+"] "+params.ref+"?";
			document.getElementById('buttondelete').style.display = "block";
			document.getElementById('spacelabel').style.display = "block";

		}
	},
	
	/**
	 *	Cancels all actions and closes the dialog
	 *  @public
	 */	
	onCancel: function() {
		this.doLog("onCancel");		
		window.arguments[0].action = 0;
		window.close();
	},
	
	/**
	 *	Function to remove contact from the group if window arguments result (false), delete group if (true) 
	 *  @public
	 */	
	onRemove: function() { 
		this.doLog("onRemove");	
		if(window.arguments[0].result) {
            window.arguments[0].action = 2;
		} else {
            window.arguments[0].action = 1;
        }
		window.close();
	},
	
	/**
	 *	Delete the contact permanetly 
	 *  @public
	 */	
	onDelete: function() { 
		this.doLog("onDelete");
		window.arguments[0].action = 2;
		window.close();		
	}, 

	/**
	  * Function doLog (print warning or tracking messages to the console)
	  * @param {str} str String value to print
	  */	
	doLog: function(str) {
		dump("### DeletionDlg: "+str+"\n");		
	}
	
};