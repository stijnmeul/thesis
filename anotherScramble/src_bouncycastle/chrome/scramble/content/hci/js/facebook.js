var facebook = {

		/**
		 * function to access facebook and get an access token
		 */
		init: function() {
			var app_id = '303565553004595';
			var redirect_uri = 'https://www.facebook.com/connect/login_success.html';
			var permissions = ['user_photos', 'friends_photos', 
			                   'publish_stream', 'offline_access'];
			var url = 'https://www.facebook.com/dialog/oauth?' +
			'client_id=' + app_id + '&redirect_uri=' + redirect_uri + 
			'&scope=' + permissions.join(',') + '&response_type=token';
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]  
                   .getService(Components.interfaces.nsIWindowMediator);
			 
			var mainWindow = wm.getMostRecentWindow("navigator:browser");  
			var browser = mainWindow.gBrowser.getBrowserForTab(mainWindow.gBrowser.addTab(url));
			browser.addEventListener("load", function() {
							browser.addProgressListener(fbListener);
					}, true);
		}
};

var fbListener =
{
	QueryInterface: function(aIID)
	{
		if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
		   aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
		   aIID.equals(Components.interfaces.nsISupports))
		return this;
		throw Components.results.NS_NOINTERFACE;
	},

	onStateChange: function(aWebProgress, aRequest, aFlag, aStatus)
	{
		// If you use myListener for more than one tab/window, use
		// aWebProgress.DOMWindow to obtain the tab/window which triggers the state change
		if(aFlag & STATE_START)
		{
		 // This fires when the load event is initiated
		}
		if(aFlag & STATE_STOP)
		{
		 // This fires when the load finishes
		}
	},

	onLocationChange: function(aProgress, aRequest, aURI)
	{
		var string = String(aRequest.name);
		if(string.indexOf('access_token') > 0)
		{
			var accessToken = string.slice(string.indexOf('=') + 1, string.indexOf('&'));

			initdlg.connectToFacebook(accessToken);
//			alert(accessToken);
		}
	},

	// For definitions of the remaining functions see related documentation
	onProgressChange: function(aWebProgress, aRequest, curSelf, maxSelf, curTot, maxTot) { },
	onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) { },
	onSecurityChange: function(aWebProgress, aRequest, aState) { }
};
