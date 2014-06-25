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
 * Class that contains the functions that control the warning dialog
 * @class Class that contains the functions that control the warning dialog
 */
var images = {

	/**
	 *	Function that loads the default information when the window dialog is loaded
	 *  @function
	 *  @param win this window dialog object
	 */
	onLoad: function(win) {


		if(window.arguments != undefined) {
			var params = window.arguments[0];

			document.getElementById('img').setAttribute("src", "file://" + params.url);
			document.getElementById('sender').setAttribute("value", params.sender);
//			alert("img:" + document.getElementById('img').getAttribute("src"));
//			alert("url:" + "file://"+params.url);
//			window.open("file://"+params.url);
			sizeToContent();
			/*if(params.isAlert) {
				document.getElementById('but_Yes').style.display = "none";
				document.getElementById('but_No').label = "Ok";
			} */
		} else
			return;
	},
	
	/**
	 *	Saves the option and closes dialog
	 *  @public
	 */	
	onExit: function(value) {
		window.arguments[0].result = value;
		window.close();
	}
	
};