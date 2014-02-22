/**
 * @fileOverview Contains the functions that control the keychain dialog
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


/**
 *	Function that loads the default information when the window dialog is loaded
 *  @function
 *  @param win this window dialog object
 */
function onLoad(win) {
	sizeToContent();
	document.getElementById("version").value = getversion();
}

function getversion() {
    var pref_service = Components.classes["@mozilla.org/preferences-service;1"];
    var preferences = pref_service.getService(Components.interfaces.nsIPrefService);
    var branch = preferences.getBranch('extensions.scramble.');
    var path = branch.getCharPref('version');            
    return path;
}
