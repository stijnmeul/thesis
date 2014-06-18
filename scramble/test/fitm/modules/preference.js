//==============================================================================
//This is a file with methods to get Mozilla preferences' related services
//==============================================================================
const EXPORTED_SYMBOLS = ["preference"];

var preference = {

    //this function save the facebook token to preference return (true/false)
    saveToken: function (token)
    {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.fitm.");
        var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
        str.data = token.toString();
        prefs.setComplexValue("token", Components.interfaces.nsISupportsString, str);
    },

    //load the token from the preference return (token/null)
    loadToken: function () 
    {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.fitm.");
        var token = prefs.getComplexValue("token", Components.interfaces.nsISupportsString).data;
        if(token != "token")
            return token;
        else
            return null;
    },

    //this function save the user list preference
    saveUsersJSONFile: function (users) 
    {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.fitm.");
        var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
        str.data = users.toString();
        prefs.setComplexValue("users", Components.interfaces.nsISupportsString, str);
        prompts.alert("Preference saved!");
    },

    //load the user list from the preference return (JSONStringFile/null)
    loadUsers: function () 
    {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.fitm.");
        var users = prefs.getComplexValue("users", Components.interfaces.nsISupportsString).data;
        if(users != "users")
            return users;
        else
            return null;
    },

    //delete all user preference
    deleteUserPreference: function () 
    {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.fitm.")
        var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
        str.data = "users".toString();
        prefs.setComplexValue("users", Components.interfaces.nsISupportsString, str);
        str.data = "token".toString();
        prefs.setComplexValue("token", Components.interfaces.nsISupportsString, str);
        prompts.alert("Preference deleted!");
    },

    /*
    ------------------------------------------------------------------------------------------------
    add for local user
    */
    //this function save the local-userinfo
    saveLocalInfoUser: function (users) 
    {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.fitm.");
        var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
        str.data = users.toString();
        prefs.setComplexValue("local", Components.interfaces.nsISupportsString, str);
        prompts.alert("Local User Info Saved!");
    },

    //load the user list from the preference return (JSONStringFile/null)
    loadInfoLocalUser: function () 
    {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.fitm.");
        var users = prefs.getComplexValue("local", Components.interfaces.nsISupportsString).data;
        if(users != "local")
            return users;
        else
            return null;
    },
    /*
    ------------------------------------------------------------------------------------------------
    end local user json
    */

};

Components.utils.import("resource://fitm/prompts.js");