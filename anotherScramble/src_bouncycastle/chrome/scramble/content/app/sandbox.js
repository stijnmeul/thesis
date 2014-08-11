Components.utils.import("resource://gre/modules/Services.jsm");
var mySandbox = Components.utils.Sandbox(window, {sandboxName: "scramble/loadns.js"});
mySandbox.window = window; // Expose window variable to scripts in the sandbox
Services.scriptloader.loadSubScript("chrome://scramble/content/loadns.js", mySandbox);
mySandbox.init(); // Call function init() of the script in the sandbox