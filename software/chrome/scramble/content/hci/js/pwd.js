/**
 * @fileOverview Password Dialog - Contains a misc of functions related to the password dialog
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


/** 
  *	Contains the data for the bridge between the application and the crypto
  *	@class Class that contains the main application functions, acting like the main kernel  
  */
var pwddlg = {

	/**
	 *	Function that loads the default information when the window dialog is loaded
	 *  @function
	 *  @param win this window dialog object
	 */
	onLoad: function(win) {
		monitor.log("pwddlg","onLoad", true);
		if(window.arguments == undefined) {
			return;
		}
		
		var params = window.arguments[0];
		if(params.result) { // system password request
			document.getElementById('pwd-savebox').style.display = "none";
			document.getElementById('description').value = "Please Insert your System Password";
			document.getElementById('note').style.display = "block";
			document.getElementById('note1').style.display = "block";
			document.getElementById('note2').style.display = "block";
			// document.getElementById('note').value += "";
			window.arguments[0].result = false;
		} else {
			document.getElementById('pwd-savebox').checked = true;
		}
		document.getElementById('pwd-textbox').value = params.pwd;
		document.getElementById('pwd-showbox').checked = false;
		
	},

	/**
	 *	Function called when the checkbox is (un)checked to show the password in clear
	 *  @function
	 */	
	onShow: function() {
		if(document.getElementById('pwd-showbox').checked)
			document.getElementById('pwd-textbox').type = "none";
		else
			document.getElementById('pwd-textbox').type = "password";
	},
	
	/**
	 *	Function called when the _Ok_ button is pressed.
	 *  @function
	 */	
	onAccept: function() {
		if(window.arguments != undefined) {
			/* the password */
			var password = document.getElementById('pwd-textbox').value;
	
			window.arguments[0].pwd = password;
			window.arguments[0].result = true;
			window.arguments[0].pwd_checkbox = document.getElementById('pwd-savebox').checked;
		}
		window.close();
	}	
};