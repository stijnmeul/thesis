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

/**
 * Class that contains the functions that control the newgroup dialog
 * @class Class that contains the functions that control the newgroup dialog
 */
var newgroupdlg = {

	/**
	 *	Function that loads the default information when the window dialog is loaded
	 *  @function
	 *  @param win this window dialog object
	 */
	onLoad: function(win) {
		sizeToContent();

		if(window.arguments != undefined) {
			var params = window.arguments[0];
		} else
			return;
	},
	
	/**
	 *	Cancels all actions and closes dialog
	 *  @public
	 */	
	onCancel: function() {
		window.arguments[0].result = false;
		window.close();
	},
	
	/**
	 *	Saves the values into the window arguments
	 *  @public
	 */
	onSave: function() { 
		var groupName = document.getElementById("groupNameBox").value;
		if(groupName.length > 1) {
			window.arguments[0].result = true;
			window.arguments[0].value = groupName;
		} else {
            var strbundle = document.getElementById(BUNDLE);
		    monitor.messageAlert(strbundle.getString("ioxml.nogroups"), true);
		}
		    
		window.close();
	}
	
};