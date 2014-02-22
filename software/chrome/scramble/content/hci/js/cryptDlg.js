/**
 * @fileOverview Crypto Box Dialog, contains a misc of functions used for/by the cryptDlg overlay
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


// ***************************************************************************
// **                                                                       **
// **                          -  Dialog loaders -                          **
// **                                                                       **
// ***************************************************************************

/** 
  *	Class that contains a misc of functions used for/by the cryptDlg overlay
  *	@class Class that contains a misc of functions used for/by the cryptDlg overlay
  */
var cryptdlg = {
    
	/**
	 *	Function that loads the default information when the window dialog is loaded
	 *  @function
	 *  @param win this window dialog object
	 */
	onLoad: function(win) {
		//get some prefs initiated
		sizeToContent();
		if(window.arguments === undefined) {
			return;
		}

		var params = window.arguments[0];
		
        var strbundle = document.getElementById(BUNDLE);
		if(params.result) {  //just to show encrypted text
		    monitor.messageDump(strbundle.getString("scramble.textload"));
			document.getElementById('but_enc').style.display = "none";
			document.getElementById('but_dec').style.display = "none";
			document.getElementById('but_enabletiny').style.display = "none";
			document.getElementById('crypttxtbox').value = params.str;
			document.getElementById('but_cancel').label = strbundle.getString("scramble.done");
			document.getElementById('caption_txt').label = strbundle.getString("scramble.encrypted");
		}
		else {  //normal options
			document.getElementById('but_enc').style.display = "block";
			document.getElementById('but_dec').style.display = "block";
			document.getElementById('but_enabletiny').style.display = "block";
			document.getElementById('crypttxtbox').value = params.str;
			document.getElementById('but_cancel').label = strbundle.getString("scramble.cancel");
			document.getElementById('caption_txt').label = strbundle.getString("scramble.insertText");
		}
	},
	
	/**
	 *	Function executed by the button to encrypt the value on the textbox to a link
	 *  @function
	 *  @see onEncrypt(flag)
	 */
	onEncryptTinyLink: function() {
		this.onEncrypt(true);
	},

	/**
	 *	Function to encrypt the string value on the textbox
	 *  @function
	 *  @param {boolean} flag true if TinyLink false otherwise
	 */
	onEncrypt: function(flag) {
		var doc = document.getElementById('crypttxtbox');
		var value = doc.value;

		if ( (flag == '') || (flag === undefined) ) {
			flag = false;
		}

        var strbundle = document.getElementById(BUNDLE);

		if(value != "") {
			value = stripHTML(value, null);
			//get a function to encrypt the str
			var result = kernel.encrypt(value, null, true, window.arguments[0].javaobj);
            
			if(result.substr(0, 3) != FAIL) {

				document.getElementById('crypttxtbox').value = strbundle.getString("scramble.running");
				if(flag) {
					this.encryptionURL(result);
				} else {
					doc.value = result;
                }
				document.getElementById('but_cancel').label = strbundle.getString("scramble.done");
				document.getElementById('caption_txt').label = strbundle.getString("scramble.encrypted");
			} 
			else {
                if(getPreferences().getCharPref(GnuPath) == "BC" ) {
                    monitor.messageAlert(strbundle.getString("encrypt.notsuccess")+result, true);
                } else {
                    monitor.messageAlert(strbundle.getString("encrypt.notsuccess"), true);
                }
			}
		} else {
		    monitor.messageAlert(strbundle.getString("scramble.notTextInserted"), true);
		}
	},
	
	/**
	 *	Function to post the encryption string (str) into a url 
	 *  @function
	 *  @param str The text to decrypt.
	 *  @see onEncrypt(flag)
	 */
	encryptionURL: function(str) {
		var http = new XMLHttpRequest();
		var url = kernel.getTinyServer();
		str = str.replace(/\+/g, "%2B");
		var params = "text="+str;
		http.open("POST", url, true);

		//Send the proper header information along with the request
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.setRequestHeader("Content-length", params.length);
		http.setRequestHeader("Connection", "close");

		/** @ignore */
		http.onreadystatechange = function() {
			if(http.readyState == 4 && http.status == 200) {
				document.getElementById('crypttxtbox').value = PLURLstart+"\n"+http.responseText+"\n"+PLURLend;
			} else if(http.status == 404 || http.status == 500 || http.status == 0) {
				document.getElementById('crypttxtbox').value = "fail> "+http.status+" | "+http.readyState;
			} 
		};
		http.send(params);
	},

	/**
	 *	Function to execute decryption of the string value on the textbox
	 *  @function
	 */
	onDecrypt: function(pwd) {
		var doc = document.getElementById('crypttxtbox');
		var value = strTrim(doc.value, '');
		
		var strbundle = document.getElementById(BUNDLE);

		if(pwd == undefined) {
			pwd = null;
		}      

		if(value != "") {
			if(value.indexOf(PLURLstart) != -1) {
			    value = value.replace(PLURLstart, " ");
				value = value.replace(PLURLend, " ");
				value = value.replace(new RegExp("[\\s]*", "g"), "");
				value = strTrim(value, '');
				this.decryptURL(value);
			} else {

				var temp = value.indexOf("http://");

				if(temp === 0) {
					this.decryptURL(value, pwd);
					return;
				}
				value = stripHTML(value, null);
				//get a function to decrypt the str
				var result = kernel.decrypt(value, pwd, true, window.arguments[0].javaobj);
                // dump("["+result.substr(0,3)+"]|["+result.substr(0, 4)+"]");
				if(result.substr(0,4) != FAIL) {
					doc.value = result;
					document.getElementById('but_cancel').label = strbundle.getString("scramble.done");
					document.getElementById('caption_txt').label = strbundle.getString("scramble.decrypted");
				}
				else {
					// try once again?
					var msg;
				    if(getPreferences().getCharPref(GnuPath) == "BC" ) {
                        msg = strbundle.getString("decrypt.notsuccessBC");
						monitor.log(result, true);
						// monitor.messageAlert(strbundle.getString("decrypt.notsuccessBC")+result, true);

				    } else {
						msg = strbundle.getString("decrypt.notsuccess");
                        // monitor.messageAlert(strbundle.getString("decrypt.notsuccess"), true);
			        }
					
					// just try it ONCE... second time refuse directly
					if(pwd != null) {
						monitor.messageAlert(msg, true);
					} else {

						if(dialogLoader.warningDialog(msg+" Do you want to try again ?").result) {
							var params = dialogLoader.pwdDialog();
						
						    if (params.result) {
						        if (params.pwd != "") {
						            pwd = params.pwd;
						            if (params.pwd_checkbox) {
						                kernel.saveSKey(pwd);
						            }
									this.onDecrypt(pwd);
						        } else {
									pwd = null;
						        }
						    } else {
								monitor.messageAlert(msg, true);
						    }
						}
					}
				}
			}
		} else {
			monitor.messageAlert(strbundle.getString("scramble.notTextInserted"), true);
		}
	},
	
	/**
	 *	Function to extract the encrypted text from a link and decrypt it
	 *  @function
	 *  @param url The url path 
	 *  @see decrypt_it()
	 */
	decryptURL: function(url, pwd) {
		var http = new XMLHttpRequest();
		url = strTrim(url);
		http.open("GET", url, true);
		http.send(null);

		if(pwd == undefined) {
			pwd = null;
		}
		/** @ignore */	
		http.onreadystatechange = function() {
			if(http.readyState == 4 && http.status == 200) {
				cryptdlg.decrypt_it(http.responseText, pwd);
			} else if (http.status == 404 || http.status == 500 || http.status == 0) {
                var strbundle = document.getElementById(BUNDLE);
                monitor.messageAlert(strbundle.getString("connectionError"), true);
			} 
		};
	},

	/**
	 *  Function to decrypt a value string and post the result into the textbox
	 *  @function
	 *  @param value The text to decrypt.
	 */
	decrypt_it: function(value, pwd) {
		var doc = document.getElementById('crypttxtbox');

		if(pwd == undefined) {
			pwd = null;
		}

		value = value.replace(/\%2B/g,'+');
		value = stripHTML(value, null);
		//get a function to decrypt the str
		var result = kernel.decrypt(value, pwd, false, window.arguments[0].javaobj);
        var strbundle = document.getElementById(BUNDLE);

		if(result != FAIL) {
			doc.value = result;
			document.getElementById('but_cancel').label = strbundle.getString("scramble.done");
			document.getElementById('caption_txt').label = strbundle.getString("scramble.decrypted");
		}
		else {
		    monitor.messageAlert(strbundle.getString("decrypt.notsuccess"), true);
		}
	},

	/**
	 *	Closes the current window dialog
	 *  @function
	 */
	onCancel: function() {
		window.close();
	}	
	
};