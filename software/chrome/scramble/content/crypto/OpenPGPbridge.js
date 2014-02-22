/**
 * @ignore
 */

var _password = "";
var _decrypt = "empty";

/**
 * @ignore
 */
function hello() {
	dump("hello...\n");
	
		var result = "FAIL";
		try {
		    var openpgp = JavaLoader.getOpenPGPObject();
		    if(openpgp != null)
				result = openpgp.listKeys();
		} catch (e) {}
		dump(result);
		
	dump("\nhello...end\n");
}

/**
 * @ignore
 */
function crypt() {
	dump("crypt...\n");
	
		var result = "FAIL";
		try {
		    var openpgp = JavaLoader.getOpenPGPObject();
		    if(openpgp != null)
				result = openpgp.encrypt("message1234", "5E1FD5AE");
				_decrypt = result;
		} catch (e) {}
		dump(result);
		
	dump("\ncrypt...end\n");
}

/**
 * @ignore
 */
function decrypt() {
	dump("decrypt...\n");

		var result = "FAIL";
		try {
		    var openpgp = JavaLoader.getOpenPGPObject();
		    if(openpgp != null)
				result = openpgp.decrypt(_decrypt, _password);
		} catch (e) {}
		dump(result);
		
	dump("\ndecrypt...end\n");
}

/**
 * @ignore
 */
function addPublicKey() {
	dump("decrypt...\n");

		var result = "FAIL";
		try {
		    var openpgp = JavaLoader.getOpenPGPObject();
		    if(openpgp != null)
				result = openpgp.addPublicKey(_publickey);
		} catch (e) {}
		dump(result);
		
	dump("\ndecrypt...end\n");
}

/**
 * @ignore
 */
function listKeys() {
	dump("listKeys...\n");

		var result = new Array();
		try {
		    var openpgp = JavaLoader.getOpenPGPObject();
		    if(openpgp != null)
				result = openpgp.listKeys();
				
				// dump("----------------------------------------------\n");
				// for(var h = 0 ; h < result.length; h++) {
				// 	dump(result[h]._name+"\n"+result[h]._email+"\n");
				// 	dump(result[h]._uid+"\n"+result[h]._fingerprint+"\n");			
				// 	dump("----------------------------------------------\n");
				// }			
							
		} catch (e) {}
		
	dump("\nlistKeys...end\n");
}