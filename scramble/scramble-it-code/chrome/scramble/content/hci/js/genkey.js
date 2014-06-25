/**
 * @fileOverview Password Dialog - Contains a misc of functions related to the password dialog
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */

// import the utils modules
Components.utils.import("resource://scramble/utils/monitor.js");

/** 
  *	Contains the data for the bridge between the application and the crypto
  *	@class Class that contains the main application functions, acting like the main kernel  
  */
var genkey = {
    
    onLoad: function() {
        monitor.log("genkey","onLoad", false);
		if(window.arguments == undefined) {
			return;
		}
    },

    onAccept: function() {
        monitor.log("genkey","onAccept", true);
        var name = document.getElementById("name").value;
        var email = document.getElementById("email").value;
        var description = document.getElementById("description").value;
        var pwd = document.getElementById("password").value;
        var size = document.getElementById("bitsize").value;
        if ( (name === "") && (pwd === "") && (name === "") && (pwd === "")) {
            window.close();
        }else if( (name === "") || (pwd === "") ) {
            alert("Please insert name and/or password", true);
        } else if( isNaN(size) && (size !="")) {
            alert("Please insert valid bit size value", true);
        } else {
            if(email != "") {
                email = "<"+email+">";
            }
            
            if(description != "") {
                description = "("+description+")";
            }
            var userid = name.trim()+" "+description+" "+email;
            window.arguments[0].userid = userid;
            window.arguments[0].pwd = pwd;
            window.arguments[0].bitsize = size;
            window.arguments[0].result = true;
			dump(window.arguments[0].result+" <<<<<\n");
            window.close();
        }
    },
    
    onCancel: function() {
        window.arguments[0].result = false;
        window.close();
    },
    
    
    /**
	 *	Function called when the checkbox is (un)checked to show the password in clear
	 *  @public
	 */
	onShowPwd: function() {
		var checked = document.getElementById("pwd-showbox").checked;
		if(checked) {
			document.getElementById("password").type = "";
		} else
			document.getElementById("password").type = "password";
	}
    
};