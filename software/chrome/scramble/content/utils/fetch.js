/**
 * @fileOverview Contains a misc of functions used to fetch and update HTML data on the content
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


// ***************************************************************************
// **                                                                       **
// **              -  Fetch class: gets data from a page -                  **
// **                                                                       **
// ***************************************************************************

/**
 * Class that contains a misc of functions used to fetch and update data on the HTML content
 * @class Class that contains a misc of functions used to fetch and update data on HTML the content
 * @ignore
 */
var fetch = {
	
	/**
	 *	Function to Update the page content according to the new encrypted content...
	 *  @public
	 *  @param str The text value to refresh
	 */
	refreshPage: function(str) {
		doLog("refreshPage:");
		var newTab = this.getPageContent().body.innerHTML = str;

		//add the update page while loading...
		// newTab.addEventListener("load", function() { newTab.contentDocument.body.innerHTML = str; }, true);	
	},
	
	/** 
     *  Function to Update the focus element content according to the new encrypted content...
	 *  @public
	 *  @param str The text valye to refresh
	 *  @returns {String} Success or FAIL
	 *  @throws {Exception} If error in the fosused element
	 */
	refreshFocus: function(str) {
		// Get the focused element
		doLog("refreshFocus:");
		try {
			var focused = document.commandDispatcher.focusedElement;

			if(focused === null) {
				return FAIL;
			}

			var begin = focused.selectionStart;
			var end = focused.selectionEnd;
			var oldvalue = focused.value;
		
			if(oldvalue == "") {
				return FAIL;
			}
			
			focused.value = oldvalue.substring(0, begin) + str + oldvalue.substring(end, oldvalue.length);
			
			focused.selectionStart = startPos;
			focused.selectionEnd = startPos + str.length ;
			
			return SUCC;
		
		} catch(e) {
			return FAIL;
		}
	},
	
	
	//getPageContent: get main window content document object
	/**
	 *	Function to get main window content document object
	 *  @public
	 *  @returns {Object} selected window document object
	 */
	getPageContent: function() {
		doLog("getPageContent:");		
		var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation).QueryInterface(Components.interfaces.nsIDocShellTreeItem).rootTreeItem.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindow);
		return mainWindow.getBrowser().selectedBrowser.contentDocument;
	},
	
	/**
	 *	Function to get a text blob by Position on the main content window
	 *  @public
	 *  @param htmltxt html page
	 *  @param {int} start starting point
	 *  @param {int} end end point
	 *  @returns {String} the blob of text on the position or FAIL
	 */
	getBlobByPos: function(htmltxt, start, end) {			
		doLog("getBlobByPos: ["+start+","+end+"]");
		var begin = htmltxt.search(start);

		// dump("\n   ["+begin+"]   \n");
		// var myregexp = new RegExp("<(*?)>");
		// var begin2 = htmltxt.lastIndexOf("<", begin);
		// dump("\n   ["+begin2+"]   \n");
		
		var endOf = htmltxt.indexOf(end, begin);
		
		// var endOf2 = htmltxt.indexOf("</",endOf+end.length);
		// var endOf2 = htmltxt.indexOf(">",endOf2);		
		// dump("\n   ["+endOf2+"]   \n");
		
		if(begin == -1 || endOf == -1) {
			dump("= ["+begin+","+endOf+"]\n");
			return FAIL;
		}
			
		// endOf = endOf;	
		doLog("getBlobByPos: ["+begin+","+endOf+"]");		
		return htmltxt.substring(begin, endOf+end.length);
	},
	
	/**
	 *	Function to get a text blob by selection
	 *  @public
	 *  @returns {String} Selected text or FAIL
	 *  @throws {Exception} If problems with the selected frame occurs
	 */	
	getSelectedTxt: function() {
		doLog("getSelectedTxt");
		// Select a text from the actual document
		var selectedtxt = getBrowser().contentWindow.getSelection();
		// return selectedtxt;
		var value = selectedtxt.toString();

		// If text selection empty -> check frames
		if(value == "") {
			try {
				// selectedtxt = getFrame(getBrowser().contentWindow.frames);
				var frames = getBrowser().contentWindow.frames;
				for(i = 0; i < frames.length; ++i) {
					try {
						var tmpVal = frames[i].getSelection().toString();
						if (tmpVal == "") { }// != don't work...
						else {
							value = tmpVal;
							selectedtxt = frames[i].getSelection();
						}
					}
					catch (e1) {}
				}
				if (value == "") {
					for(i = 0; i < frames.length; ++i) {
						try {
							var tmpSelselObj = this.getFrame(frames[i].frames);
							if (tmpSelselObj.toString() == "") { }
							else {
								selectedtxt = tmpSelselObj;
							}
						}
						catch (e2) {}
					}
				}
				
				value = selectedtxt.toString();
			}
			catch (e3) { dump("No text selected in frames...\n"); }
		}

		// If text selection is still empty -> check input and textboxes wich are on focus
		if(value == "") {
			try {
				var focused = document.commandDispatcher.focusedElement;
				value = focused.value;
				value = value.substring(focused.selectionStart,focused.selectionEnd);
			}
			catch (e) { dump("No text selected in imput and textareas...\n"); }
		}
		else {
			value = selectedtxt.getRangeAt(0);
			var documentFragment = value.cloneContents();
			var s = new XMLSerializer();
			var d = documentFragment;
			var str = s.serializeToString(d);
			value = str;
		}
		return value;
	} ,
	
	/**
  	 * Function doLog (print warning or tracking messages to the console)
  	 * @param {str} str value to print
     * @private
	 */
	doLog: function(str) {
		dump("### Fetch: "+str+"\n");
	}	

};