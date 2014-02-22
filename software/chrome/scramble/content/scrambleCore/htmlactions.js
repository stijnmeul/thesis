/**
 * @fileOverview Class that defines a misc of function that perform actions
 *               to parse, fetch and modify data on the HTML content transparently
 * @author <a href="mailto:filipe.beato@esat.kuleuven.be">Filipe Beato</a>
 * @version 1.0
 */


/**
  * Class that defines a misc of function that perform actions
  * to parse, fetch and modify data on the HTML content transparently
  * @class Class that defines a misc of function that perform actions
    * to parse, fetch and modify data on the HTML content transparently
  */
var htmlactions = {
    
    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "htmlactions",
          _enable: true
        };
        return params;
    },
    
    /**
     *  Function to execute on the fly decryption
     *  @public
     *  @param aWindow the window object
     *  @returns {String} Success or FAIL
     */
    ontheflyDecryption: function(aWindow) {
        monitor.log(this._debug()._name, "ontheflyDecryption", this._debug()._enable);
        
        if ( (!aWindow) || (aWindow === null) ) {
            aWindow = window.content; // if not defined use current window
        }
        
        if (aWindow.frames.length > 0) {
            var nFrames = aWindow.frames.length;
            for (var i = 0; i < nFrames; i++) {
                this.ontheflyDecryption(aWindow.frames[i]);
            }
        }
		
        var doc = aWindow.document;
        if ( (!doc) || !("body" in doc) ) {
            return FAIL;
        }

        // if( (doc.body.innerHTML.indexOf(PGPstart) > -1) || (doc.body.innerHTML.indexOf(PLstart) > -1) || (doc.body.innerHTML.indexOf(PLURLstart) > -1) ) {
        var value = this.isEncryptionPresent(doc.body.innerHTML);
        if( value.result ) {
            var url = doc.URL;
            // dump("URL: "+url+"\n");
            if (!url) {
                return FAIL;
            }
            var result = this.replaceDecryption(doc, url); //replace text by decrypted content

            return (result ? SUCC : FAIL);
        } else {
            return FAIL;
        }
    },

    /**
     *  Function that applies the execution on aDocument of decrytpion on text.  
     *  It will do separately for textNodes and Value Nodes
     *  @public
     *  @param aDocument document object
     *  @param aURL url value
     */
    replaceDecryption: function(aDocument, aURL) {
        monitor.log(this._debug()._name, "replaceDecryption", this._debug()._enable);
        
        // Work with the textNodes
        var result_textNodes = this.execute(aDocument, aURL, textNodesXpath, false);
        // Work with the values nodes
        var result_valueNodes = this.execute(aDocument, aURL, valueNodesXpath, true);
        return (result_textNodes + result_valueNodes);
    },


    /**
     *  Function that verifies the existance of encrypted content in the HTML content
     *  @public
     *  @param string The value to verify
     *  @returns {Object} {result: boolean, startPoint: string, endPoint: string}
     */    
    isEncryptionPresent: function(string) {
        var ret = {
            result: false,
            startPoint: "",
            endPoint: ""
        };

        if(string === undefined) {
            string = "";
        }

        if(string.indexOf(PGPstart) > -1) {
            ret.result = true;
            ret.startPoint = PGPstart;
            ret.endPoint = PGPend;
        } else if(string.indexOf(PLstart) > -1) {
            ret.result = true;
            ret.startPoint = PLstart;
            ret.endPoint = PLend;
        } else if(string.indexOf(PLURLstart) > -1 ) {
            ret.result = true;
            ret.startPoint = PLURLstart;
            ret.endPoint = PLURLend;
        } else {
            ret.result = false;
        }
        return ret;
    },

    /**
     *  Function to execute on the fly decryption in a Node
     *  @public
     *  @param aDocument document object
     *  @param aURL url value
     *  @param xPath XPATH element, used to navigate through elements and attributes in an XML document object
     *  @param isValue true if the Nodes are value nodes, false otherwise
     *  @returns {String} Success or FAIL
     */
    execute: function(aDocument, aURL, xPath, isValue) {
        var sameBlock = false;
        var result = 0;
        var xNodes = aDocument.evaluate(xPath, aDocument, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        var nXNodes = xNodes.snapshotLength;

        for (var i = 0; i < nXNodes; i++) {
            var xNode = xNodes.snapshotItem(i);
		
			// dump("[ type of NODE: "+xNode.nodeType +" ]\n ");

            var pgp_str = ( isValue ? xNode.value : xNode.textContent );
            var value = this.isEncryptionPresent(pgp_str);
            
            if( value.result ) {
                var startPoint = value.startPoint;
                var endPoint = value.endPoint;
                var xNodeEnd;
                var j = 0;
                var flag = pgp_str.indexOf(endPoint, startPoint);

                if(flag > -1) { // the PGP block is in the same NODE
                    // dump("====> PGP block is in the same NODE\n");
                    sameBlock = true;
                    pgp_str = this.getBlobByPos(pgp_str, startPoint, endPoint);
                    if(pgp_str != FAIL) {
                        flag = 1;
                    }
                } else { // the PGP block is in different nodes, search for the full block
                    // dump("====> PGP block is in different NODES\n");
                    sameBlock = false;
                    for(j = i+1; j < nXNodes; j++) {
                        xNodeEnd = xNodes.snapshotItem(j);
                        xNodeEnd = ( isValue ? xNodeEnd.value : xNodeEnd.textContent );
                        flag = xNodeEnd.indexOf(endPoint);
                        var auxiliar = ( (xNodeEnd.indexOf("\n") > -1) ? "" : "\n" );
                        pgp_str = pgp_str + auxiliar + xNodeEnd;
                        if(flag > -1) {
                            break;
                        }
                    }
                }

                if(flag > -1) { // There exists a PGP block
                    var clean_old = stripHTML(pgp_str, aURL);
                    var dec = kernel.decrypt(clean_old);
                    if(dec.substr(0, 4) != FAIL) {
                        if(isValue) {
                            xNode.value = xNode.value.replace( (sameBlock ? pgp_str : startPoint) , dec);
                        } else {
                            xNode.textContent = xNode.textContent.replace( (sameBlock ? pgp_str : startPoint) , dec);
                        }
                    }else {                        
                        if(isValue) {
                            xNode.value = xNode.value.replace( (sameBlock ? pgp_str : startPoint), ENC);
                        } else {
                            xNode.textContent = xNode.textContent.replace( (sameBlock ? pgp_str : startPoint), ENC);
                        }
                    }

                    var dad;
                    if(!sameBlock) {
                        var endindex = j;
                        for(var k = i+1; k < endindex; k++) {
                            dad = xNodes.snapshotItem(k).parentNode;
                            dad.removeChild(xNodes.snapshotItem(k));
                        }
                    
                        var endnode = xNodes.snapshotItem(endindex);
                    
                        if(isValue) {
                            endnode.value = endnode.value.replace(endPoint, "");
                        } else {
                            endnode.textContent = endnode.textContent.replace(endPoint, "");
                        }
                        
                        if( (aURL.indexOf("message") < 0)  && (aURL.indexOf("facebook") < 0) ) {
                            dad.style.display = "none";
                        }
                        i = k;
                    }
                    ret = true;
                    
                } 
            }
        }
        return ret;
    },
    
    
    
    /**
     *  Function to execute substitution of single encryption value
     *  @public
     *  @param aDocument document object
     *  @param aURL url value
     *  @param xPath XPATH element, used to navigate through elements and attributes in an XML document object
     *  @param isValue true if the Nodes are value nodes, false otherwise
     *  @returns {boolean} true if success, false otherwise
     */
    executeEncryption: function(aDocument, aURL, xPath, isValue, oldValue, newValue) {
        monitor.log(this._debug()._name, "executeEncryption", this._debug()._enable);
        var result = 0;
        var xNodes = aDocument.evaluate(xPath, aDocument, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        var nXNodes = xNodes.snapshotLength;
        for (var i = 0; i < nXNodes; i++) {
            var xNode = xNodes.snapshotItem(i);
            // dump(xNode);
            var value = ( isValue ? xNode.value : xNode.textContent );
            value = stripHTML(value, null);
            value = value.replace("\n","");
            // dump("["+value+"]["+oldValue+"]\n");
            if( value == oldValue ) {
                if(isValue) {
                    xNode.value = xNode.value.replace(value, newValue);
                    return true;
                } else {
                    // dump("xNode.textContent: "+xNode.textContent+"\n");
                    xNode.textContent = xNode.textContent.replace(value, newValue);
                    // dump("xNode.textContent (NEW): "+xNode.textContent+"\n");
                    // dump("nodeDad: "+xNode.value+"\n");
                    // dump("nodeHTML: "+xNode.nodeName+"\n");
                    // dump("nodeAttrib: "+xNode.hasAttributes()+"\n");
                    // xNode.replaceWholeText(newValue);
                    
                    // dump("["+value+"] ["+oldValue+"] ["+newValue+"]\n");
                    return true;
                }
            }
        }
        return false;
    },
    
    /**
	 *	Function to Update the page content according to the new encrypted content...
	 *  @public
	 *  @param str The text value to refresh
	 */
	refreshPage: function(str) {
        monitor.log(this._debug()._name, "refreshPage", this._debug()._enable);
		this.getPageContent().body.innerHTML = str;
	},
	
	
	/**
	 *	Function to Update a single content according to the new encrypted content...
	 *  @public
	 *  @param oldValue The old value to be refreshed
	 *  @param newValue The new value to refresh
	 *  @param {Node} aNode where the value is 
	 */
	refreshSingle: function(oldValue, newValue, aNode) {
        monitor.log(this._debug()._name, "refreshSingle: ", this._debug()._enable);

        
        if( (aNode === null) || (aNode === undefined) ) {
            var aDocument = window.content.document;
            var aURL = aDocument.URL;
            // Work with the textNodes
            var result_textNodes = this.executeEncryption(aDocument, aURL, textNodesXpath, false, oldValue, newValue);
            if(result_textNodes) {
                return true;
            }
            // Work with the values nodes
            var result_valueNodes = this.executeEncryption(aDocument, aURL, valueNodesXpath, true, oldValue, newValue);
            return result_valueNodes;
        }
        
        else if(aNode.nodeType != 1) {
            aNode.value = aNode.value.replace(oldValue, newValue);
            return true;
        } else {
            aNode.textContent = aNode.textContent.replace(oldValue, newValue);
            return true;
        } 
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
        monitor.log(this._debug()._name, "refreshFocus", this._debug()._enable);
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
        monitor.log(this._debug()._name, "getPageContent", this._debug()._enable);
		var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor);
		var mainWinInt = mainWindow.getInterface(Components.interfaces.nsIWebNavigation);
		var query_mainInt = mainWinInt.QueryInterface(Components.interfaces.nsIDocShellTreeItem);
		var int_requestor = query_mainInt.rootTreeItem.QueryInterface(Components.interfaces.nsIInterfaceRequestor);
		var finalWindow = int_requestor.getInterface(Components.interfaces.nsIDOMWindow);
		return finalWindow.getBrowser().selectedBrowser.contentDocument;
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
        monitor.log(this._debug()._name, "getBlobByPos: ["+start+","+end+"]", this._debug()._enable);
		var begin = htmltxt.search(start);
		var endOf = htmltxt.indexOf(end, begin);		
		if(begin == -1 || endOf == -1) {
			return FAIL;
		}
		return htmltxt.substring(begin, endOf+end.length);
	},
	
	/**
	 *	Function to get a text blob by selection
	 *  @public
	 *  @returns {String} Selected text or FAIL
	 *  @throws {Exception} If problems with the selected frame occurs
	 */	
	getSelectedTxt: function() {
        monitor.log(this._debug()._name, "getSelectedTxt", this._debug()._enable);
        
		// Select a text from the actual document
		var selectedtxt = getBrowser().contentWindow.getSelection();
		// return selectedtxt;
		var value = selectedtxt.toString();
        var node = null;
        var ret = { 
            node: null, 
            nodeVal: ""
        };

		// If text selection empty -> check frames
		if(value == "") {
			try {
				// selectedtxt = getFrame(getBrowser().contentWindow.frames);
				var frames = getBrowser().contentWindow.frames;
				for(i = 0; i < frames.length; ++i) {
					try {
						var tmp_frame = frames[i].getSelection();
						var tmpVal = tmp_frame.toString();
						if (tmpVal == "") { }// != don't work...
						else {
							value = tmpVal;
							selectedtxt = frames[i].getSelection();
						}
					}
					catch (e1) {
                        monitor.exception(this._debug()._name, e1, this._debug()._enable);
					}
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
						catch (e2) {
			                monitor.exception(this._debug()._name, e2, this._debug()._enable);
						}
					}
				}
				node = selectedtxt.anchorNode;
                value = selectedtxt.toString();
			}
			catch (e3) {
                // no text selected in frames
                monitor.exception(this._debug()._name, e3, this._debug()._enable);
			}
		}

		// If text selection is still empty -> check input and textboxes wich are on focus
		if(value == "") {
			try {
				var focused = document.commandDispatcher.focusedElement;
				value = focused.value;
				value = value.substring(focused.selectionStart,focused.selectionEnd);
				node = focused;
			}
			catch (e) { 
			    // No text selected in imput and textareas
                monitor.exception(this._debug()._name, e, this._debug()._enable);
			}
		} else {
			value = selectedtxt.getRangeAt(0);
			var documentFragment = value.cloneContents();
			var s = new XMLSerializer();
			var d = documentFragment;
			var str = s.serializeToString(d);
			value = str;
		}
		ret.node = node;
		ret.nodeVal = value;
		
		return ret;
	} ,
	
	/**
  	 * Function doLog (print warning or tracking messages to the console)
  	 * @param {str} str value to print
     * @private
     * @deprecated
	 */
	doLog: function(str) {
		dump("### HTMLActions: "+str+"\n");
	}	
	
    
    
};