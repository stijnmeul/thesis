/**
 * @fileOverview Contains the functions that control the newgroup dialog
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


// ***************************************************************************
// **                                                                       **
// **                 -  Encryption Dialog object -                    **
// **                                                                       **
// ***************************************************************************

/**
 * Class that contains the functions that control the encryption dialog
 * @class Class that contains the functions that control the encryption dialog
 */
var encdlg = {

	/**
	 *	Function called when the _Ok_ button is pressed.
	 *  @function
	 */	
	onAccept: function() {
		if(window.arguments != undefined) {
			/* the password */
			var txt = document.getElementById('scrambletxt').value;
	
			window.arguments[0].scrambletext = txt;
			window.arguments[0].result = true;
		}
		window.close();
	}
};