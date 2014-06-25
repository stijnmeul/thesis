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
scrambleAppNS.htmlactions = {
    
    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
        var params = {
          _name: "htmlactions",
            _enable: true
        };
	    var prefs = scrambleUtils.getPreferences();
        var debug = prefs.getBoolPref("debug");
		params._enable = debug;

        return params;
    },
    
    
    /**
     *  @private    
     * FiFo Queue implementation.
     * @author Tom Switzer at http://tomswitzer.net/2011/02/super-simple-javascript-queue/
     * @license MIT License
     * @adapted (Filipe Beato)
     */    
    _fifo: function() {
        var head, tail, undefined, f;
        return f = function(x) {
            if (x != undefined) {
                tail = tail ? tail.n = {v: x} : head = {v: x};
                x = f;
            } else {
                x = head ? head.v : undefined;
                // head = ( (head == tail) ? (tail = undefined) : head.n );
                head = head == tail ? (tail = undefined) : head.n;
            }
            return x;
        };
    },
    
    // queueTxt: null,
    // queueVal: null,
    map: [],
    

    /**
     *  Function to execute on the fly decryption
     *  @public
     *  @param aWindow the window object
     *  @returns {boolean} true or false
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
            return false;
        }

        // if( (doc.body.innerHTML.indexOf(PGPstart) > -1) || (doc.body.innerHTML.indexOf(PLstart) > -1) || (doc.body.innerHTML.indexOf(PLURLstart) > -1) ) {
        var value = this.isEncryptionPresent(doc.body.innerHTML);
        if( value.result ) {
            var url = doc.URL;
            // dump("URL: "+url+"\n");
            if (!url) {
                return false;
            }
            var result = this.replaceDecryption(doc, url); //replace text by decrypted content

            return result;
        } else {
            return false;
        }
    },
    
    
    /**
     * 
     *  @public
     *  @param aWindow the window object
     *  @returns {String} Success or FAIL
     */
    insertFileListeners: function(aWindow) {
    	monitor.log(this._debug()._name, "insertFileListeners", this._debug()._enable);

    	if ( (!aWindow) || (aWindow === null) ) {
    		aWindow = window.content; // if not defined use current window
    	}

    	if (aWindow.frames.length > 0) {
    		var nFrames = aWindow.frames.length;
    		for (var i = 0; i < nFrames; i++) {
    			this.insertFileListeners(aWindow.frames[i]);
    		}
    	}

    	var doc = aWindow.document;
    	if ( (!doc) || !("body" in doc) ) {
    		return ;
    	}

    	var url = doc.URL;
    	if (!url) {
    		return ;
    	}

    	var inputFiles = doc.evaluate("//input[@type=\"file\"]", doc, null, XPathResult.ANY_TYPE, null);
    	//identify input type = "file" elements
    	var inputFile;
    	try{
    		inputFile = inputFiles.iterateNext();
    	} catch(err){
    		monitor.log(this._debug()._name, "err: " + err, this._debug()._enable);
    		return;
    	}
    	while (inputFile){
    		monitor.log(this._debug()._name, "inputFile: " + inputFile.value, this._debug()._enable);
    		inputFile.addEventListener("change", function () {
                // dump("value: " + this.value);
            // dump("this: " + this);
    		if(confirm('Do you want to protect this picture?')) {
    			var watermarkedImg = scrambleAppNS.scramble.execImageSteg(this.value);
                // dump("watermarkedImg: " + watermarkedImg);
    			netscape.security.PrivilegeManager.enablePrivilege('UniversalFileRead');
    			netscape.security.PrivilegeManager.enablePrivilege('UniversalIXPConnect');
    				
    			this.value = watermarkedImg;
    			netscape.security.PrivilegeManager.disablePrivilege('UniversalFileRead');
    			netscape.security.PrivilegeManager.disablePrivilege('UniversalIXPConnect');
    		}
    			});
    		inputFile = inputFiles.iterateNext();
    	}
    },
    /**
     * 
     *  @public
     *  @param aWindow the window object
     *  @returns {String} Success or FAIL
     */
    ontheflySteganalysis: function(aWindow) {
    	monitor.log(this._debug()._name, "ontheflySteganalysis", this._debug()._enable);


    	if ( (!aWindow) || (aWindow === null) ) {
    		aWindow = window.content; // if not defined use current window
    	}

    	if (aWindow.frames.length > 0) {
    		var nFrames = aWindow.frames.length;
    		for (var i = 0; i < nFrames; i++) {
    			this.ontheflySteganalysis(aWindow.frames[i]);
    		}
    	}

    	var doc = aWindow.document;
    	if ( (!doc) || !("body" in doc) ) {
    		return ;
    	}

    	var url = doc.URL;
    	// monitor.log(this._debug()._name, "URL: " + url, this._debug()._enable);
    	if (!url) {
    		return ;
    	}

    	var blocks = scrambleAppNS.steganography.getXPathQueries(url);
    	if(!blocks){ // actually this can only be empty, but not null
    		monitor.log(this._debug()._name, "ontheflySteganalysis: nothing found for " + url, this._debug()._enable);
    		return;
    	}
    	monitor.log(this._debug()._name, "blocks: " + blocks.length, this._debug()._enable);
    	for (var x = 0; x < blocks.length; x++) {
//    		monitor.log(this._debug()._name, "x: " + x, this._debug()._enable);
    		var REGION_XPATH = blocks[x].region;
    		var SENDER_XPATH = blocks[x].sender;
    		var DATA_XPATH = blocks[x].data ;
    		var dataType = blocks[x].dataType ;


//    		monitor.log(this._debug()._name, "REGION_XPATH: " + REGION_XPATH, this._debug()._enable);
//    		monitor.log(this._debug()._name, "SENDER_XPATH: " + SENDER_XPATH, this._debug()._enable);
//    		monitor.log(this._debug()._name, "DATA_XPATH: " + DATA_XPATH, this._debug()._enable);
//    		monitor.log(this._debug()._name, "DATA_TYPE: " + dataType, this._debug()._enable);
    		var sender;
    		var data;


    		var regions = doc.evaluate(REGION_XPATH, doc, null, XPathResult.ANY_TYPE, null);

    		var region;
    		try{
    			region = regions.iterateNext();
    		} catch(err){
    			continue;
    		}
    		while (region ) {
//    			monitor.log(this._debug()._name, "tackling region " +region.textContent, this._debug()._enable);

    			sender = null; 
    			data = null;

//    			monitor.log(this._debug()._name, "searching for: " + SENDER_XPATH, this._debug()._enable);

    			// we expect just one sender
    			var senderNodes =  doc.evaluate(SENDER_XPATH, region, null, XPathResult.ANY_TYPE, null);
    			try{
    				var senderNode = senderNodes.iterateNext();
//    				monitor.log(this._debug()._name, "senderNode: " + senderNode, this._debug()._enable);

    				if (senderNode != null) { // we need to figure out what exactly we take from here, name, FB address, etc.
    					sender = senderNode.textContent;
    					var aeskey = keychain.getMemberAESKey(sender);
    					
    					if (aeskey) {
    						var dataNodes = doc.evaluate(DATA_XPATH, region, null, XPathResult.ANY_TYPE, null);
    						var dataNode = dataNodes.iterateNext();
    						while (dataNode) {
//    							monitor.log(this._debug()._name, "dataNode: " + dataNode, this._debug()._enable);

    							data = dataNode.innerHTML;
    							if(!data){
    								data = dataNode.textContent;
    							}
    							if(!data){ // perhaps it is an attribute
    								data = dataNode.value;
    							}
//    							monitor.log(this._debug()._name, "dataNode.innerHTML: " + dataNode.innerHTML, this._debug()._enable);
//    							monitor.log(this._debug()._name, "dataNode.textContent: " + dataNode.textContent, this._debug()._enable);
    							monitor.log(this._debug()._name, "-----------------", this._debug()._enable);
    							monitor.log(this._debug()._name, "sender: " + sender, this._debug()._enable);
    							monitor.log(this._debug()._name, "data: " + data, this._debug()._enable);
    							monitor.log(this._debug()._name, "aes key: " + aeskey, this._debug()._enable);
    							var pw = scrambleAppNS.scramble.getPwd();
    							var plaindata = kernel.steganalysis(aeskey, data, dataType, pw);
    							
    							//monitor.log(this._debug()._name, "plaindata: " + plaindata, this._debug()._enable);
    							monitor.log(this._debug()._name, "-----------------", this._debug()._enable);
    							if (plaindata) {
    								if(dataType == "text") {
    									dataNode.innerHTML = plaindata;
    									dataNode.textContent = plaindata;
    								}
    								if(dataType == "img") {
    									//alert("secret image: " + plaindata);
    									//var windowObjectReference = window.open(plaindata, "secret image");
    									scrambleAppNS.dialogLoader.imageDialog(plaindata, sender);
    								}
    								// perhaps we need to set the node value for image, not the innerHTML

    								monitor.log(this._debug()._name, "done refreshing page " , this._debug()._enable);
    							}

    							if (dataType == "img") {
    								// delete the file
    							}

    							dataNode = dataNodes.iterateNext();
    						}
    					}
    				} 
    			} catch(err){
    				//nothing found, ignore
    			}

    			region = regions.iterateNext();
    		}
    	}

    	monitor.log(this._debug()._name, "finished steganalysis", this._debug()._enable);
    },

    /**
     *  Function that applies the execution on aDocument of decryption on text.  
     *  It will do separately for textNodes and Value Nodes
     *  @public
     *  @param aDocument document object
     *  @param aURL url value
     */
    replaceDecryption: function(aDocument, aURL) {
        monitor.log(this._debug()._name, "replaceDecryption", this._debug()._enable);
        
        // Work with the textNodes
        // var result_textNodes = this.execute(aDocument, aURL, textNodesXpath, false);
        // // Work with the values nodes
        // var result_valueNodes = this.execute(aDocument, aURL, valueNodesXpath, true);
        
        
        // New version. Work with callbacks from the decryption...      
        var q1 = this.getEncryptionBlocks(aDocument, aURL, textNodesXpath, false);
        var q2 = this.getEncryptionBlocks(aDocument, aURL, valueNodesXpath, true);
        // dump("############## START read queue \n");        
		var pw = scrambleAppNS.scramble.getPwd();

        
        var obj1 = obj2 = "test";
        // dump("############## Up and go :) ("+obj1+"|"+obj2+")\n");        
        while( obj1 != undefined) {
            // dump("############## RETRIEVE FROM QUEUE TO DECRYPT\n");
            obj1 = q1(); //get head from queue
            if(obj1 != undefined) {
                // scrambleAppNS.htmlactions.queueTxt(obj1);
                // dump("############## QUEUE INTERACTIONS:  ("+obj1+") ##############\n");
                scrambleAppNS.htmlactions.map[obj1.url] = obj1;
                kernel.decryptAuto(obj1.data, pw, obj1.url, scrambleAppNS.htmlactions.executePerBlockText);
            }
        }
        // dump("############## DONE, next FIFO \n");
        while( obj2 != undefined) {
            // dump("############## RETRIEVE FROM QUEUE TO DECRYPT 2\n");            
            obj2 = q2();  //get head from queue
            if(obj2 != undefined) {
                // scrambleAppNS.htmlactions.queueVal(obj2);
                scrambleAppNS.htmlactions.map[obj2.url] = obj2;
                kernel.decryptAuto(obj2.data, pw, obj2.url, scrambleAppNS.htmlactions.executePerBlockVal);
            }
        }
        // dump("############## EXIT QUEUE process \n");
        // return (result_textNodes + result_valueNodes);
    },
    
    
    /**
     *  Function to execute on the fly decryption in a Node
     *  @public
     *  @param aDocument document object
     *  @param aURL url value
     *  @param xPath XPATH element, used to navigate through elements and attributes in an XML document object
     *  @param isValue true if the Nodes are value nodes, false otherwise
     *  @returns {boolean} true or false
     */
    getEncryptionBlocks: function(aDocument, aURL, xPath, isValue) {
        var sameBlock = false;
        var result = 0;
        var xNodes = aDocument.evaluate(xPath, aDocument, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        var nXNodes = xNodes.snapshotLength;
        var myfifo = this._fifo();
        for (var i = 0; i < nXNodes; i++) {
            var xNode = xNodes.snapshotItem(i);
            var pgp_str = ( isValue ? xNode.value : xNode.textContent );
            
            var value = this.isEncryptionPresent(pgp_str);

            if( value.result ) {
                // dump(">isEncryptionPresent in exec -------> "+value.result+"\n");
                var startPoint = value.startPoint;
                var endPoint = value.endPoint;
                var xNodeEnd;
                var j = 0;
                var flag = pgp_str.indexOf(endPoint, startPoint);
                // dump("######### FLAG : "+flag+"\n");

                if(flag > -1) { // the PGP block is in the same NODE
                    sameBlock = true;
                    ht = pgp_str;
                    pgp_str = this.getBlobByPos(pgp_str, startPoint, endPoint);
                    // dump("######### PGP_STR : "+pgp_str+"\n");
                    if(pgp_str != null) {
                        flag = 1;
                    }
                } else { // the PGP block is in different nodes, search for the full block
                    sameBlock = false;

                    for(j = i+1; j < nXNodes; j++) {
                        xNodeEnd = xNodes.snapshotItem(j);
                        xNodeEnd = ( isValue ? xNodeEnd.value : xNodeEnd.textContent );
                        flag = xNodeEnd.indexOf(endPoint);
                        var auxiliar = ( (xNodeEnd.indexOf("\n") > -1) ? "" : "\n" );
                        pgp_str = pgp_str + auxiliar + xNodeEnd;
                        if(flag > -1) {
                            // i = j;
                            break;
                        }
                    }
                }

                if(flag > -1) { // There exists a PGP block
                    var clean_old = scrambleUtils.stripHTML(pgp_str, aURL);
                    // ADD to the queue
                    var obj = {
                        data: null,
                        url: null,
                        size: 0,
                        startPoint: 0,
                        endPoint: 0,
                        nodeindex: 0,
                        node: null,
                    };
                    
					// In case of the URI and if its not requested from crypto text editor console...
			        if (clean_old.indexOf(vars._PLURLstart) > -1) {
                        // dump(clean_old);
			            var t = clean_old.indexOf(vars._PLURLstart)+vars._PLURLstart.length+1;
                        clean_old = clean_old.substring(t, clean_old.indexOf(vars._PLURLend))
                         // there are loads of garbage
                        if ( (clean_old.indexOf(vars._PLURLstart) > 0) && (clean_old.indexOf("tinyurl.com") != 0) )
                            clean_old = clean_old.substring(clean_old.indexOf(vars._PLURLstart)+vars._PLURLstart.length+1, clean_old.length);
			            			            
			            clean_old = clean_old.replace(vars._PLURLstart, " ");
			            clean_old = clean_old.replace(vars._PLURLend, " ");
			            clean_old = scrambleUtils.strTrim(clean_old.replace(new RegExp("[\\s]*", "g"), ""), '');
			            clean_old = scrambleUtils.strTrim(clean_old);
			            obj.url = clean_old;
			            clean_old = scrambleAppNS.scramble.getTinyLink(clean_old);
			            if ((clean_old.indexOf("\r\n\r\n") > 0) && (scrambleUtils.detectOS() != vars._WIN)) {
			                clean_old = clean_old.replace(/\n/g, "");			                
			            }
			        }			        	        		        					            
                    
                    // fill the object data to decrypt...
                    obj.data = clean_old;
                    obj.size = j;
                    obj.startPoint = startPoint;
                    obj.endPoint = endPoint;

                    if (sameBlock) {
                        obj.nodeindex = i;
                    } else {
                        obj.nodeindex = j - (j-i);
                        i = j;
                    }
                    
                    obj.node = xNodes;
                    obj.sameBlock = sameBlock;
                    myfifo(obj);                    
                    // dump("\n ---------------------------------\n");        
                    // dump("############## OBJECT data ADDED TO FIFO BEGIN ##############\n");
                    // dump("############## OBJECT obj.data -> "+obj.data+"\n");
                    // dump("############## OBJECT ADDED TO FIFO obj.url -> "+obj.url+"\n");
                    // dump("############## OBJECT obj.size -> "+obj.size+"\n");
                    // dump("############## OBJECT obj.startPoint -> "+obj.startPoint+"\n");
                    // dump("############## OBJECT obj.endPoint-> "+obj.endPoint+"\n");                                                
                    // dump("############## OBJECT obj.nodeindex-> "+obj.nodeindex+"\n");
                    // dump("############## OBJECT obj.node-> "+obj.node+"\n");
                    // dump("############## OBJECT data ADDED TO FIFO END ##############\n");                    
                    // dump("---------------------------------\n");
                } 
            }
        }
        return myfifo;
    },
    
    executePerBlockVal: function(data) {
        // var obj = scrambleAppNS.htmlactions.queueVal();
        dump("-----> execute per block Val\n");
        var url = data[1];   
        data = data[0];             
        var obj = scrambleAppNS.htmlactions.map[url];
        if(obj == undefined) return;
        
        var xNodes = obj.node;
        var xNode = xNodes.snapshotItem(obj.nodeindex);
        // dump("\n ---------------------------------\n");        
        // dump("############## OBJECT data BEGIN (per val) ##############\n");
        // dump("############## OBJECT obj.data -> "+obj.data+"\n");
        // dump("############## OBJECT data (per val) obj.url -> "+obj.url+"\n");
        // dump("############## OBJECT obj.size -> "+obj.size+"\n");
        // dump("############## OBJECT obj.startPoint -> "+obj.startPoint+"\n");
        // dump("############## OBJECT obj.endPoint-> "+obj.endPoint+"\n");                                                
        // dump("############## OBJECT obj.nodeindex-> "+obj.nodeindex+"\n");
        // dump("############## OBJECT obj.node-> "+obj.node+"\n");
        // dump("############## OBJECT xNode.value-> "+xNode.value+"\n");
        // dump("############## OBJECT xNodes.snapshotLength-> "+xNodes.snapshotLength+"\n");
        // dump("############## DATA data (per val) RESULT -> "+xNode.value+"\n");
        // dump("############## DATA data (per val) FINAL RESULT -> "+data+"\n");
        // dump("############## OBJECT data (per val) END ##############\n");                  
        // dump("---------------------------------\n");
        
        var sameBlock = obj.sameBlock;
        if(data != null) {
            xNode.value = xNode.value.replace( ( sameBlock ? obj.data : obj.startPoint) , data);
        }else {                        
            xNode.value = xNode.value.replace( ( sameBlock ? obj.data : obj.startPoint), vars._ENC);
        }

        var dad;
        if(!sameBlock) {
            var endindex = obj.size + 1;
            var node;
            for(var k = obj.nodeindex+1; k < endindex; k++) {
                node = xNodes.snapshotItem(k);
                if ( ( node.value.indexOf(obj.url) > -1) || (node.value.indexOf(obj.endPoint) > -1) ) {
                    dad = node.parentNode;
                    dad.removeChild(xNodes.snapshotItem(k));
                } else if ( node.value.indexOf(obj.startPoint) > -1) {
                    node.value = node.value.replace( obj.startPoint , data);
                }
            }    
            var endnode = xNodes.snapshotItem(endindex);
            endnode.value = endnode.value.replace(obj.endPoint, "");
            var aURL = window.content.document.URL;
            if( (aURL.indexOf("message") < 0)  && (aURL.indexOf("facebook") < 0) ) {
                // dump("--> dad.display = none\n");
                dad.style.display = "none";
                
            }
            if (data == "error") dad.style.display = "none";
        } else {
            if (data == "error") xNode.style.display = "none";
        }
        delete scrambleAppNS.htmlactions.map[url];
        
    },
    
    executePerBlockText: function(data) {
        dump("-----> execute per block Text\n")
        // var obj = scrambleAppNS.htmlactions.queueTxt();
        // data = data.split("|");
        var url = data[1];   
        data = data[0];     
        var obj = scrambleAppNS.htmlactions.map[url];
        // dump("############## MAP OBJECT size: "+scrambleAppNS.htmlactions.map+" | ("+obj.url+","+url+" ##############\n");
        if(obj === undefined) return;

        
        
        var xNodes = obj.node;
        var xNode = xNodes.snapshotItem(obj.nodeindex);
        var sameBlock = obj.sameBlock;
        
        dump("\n ---------------------------------\n");        
        dump("############## OBJECT data BEGIN (per txt) ##############\n");
        dump("############## OBJECT obj.data -> "+obj.data+"\n");
        dump("############## OBJECT data (per txt) obj.url -> "+obj.url+"\n");
        dump("############## OBJECT obj.size -> "+obj.size+"\n");
        dump("############## OBJECT obj.startPoint -> "+obj.startPoint+"\n");
        dump("############## OBJECT obj.endPoint-> "+obj.endPoint+"\n");                                                
        dump("############## OBJECT obj.nodeindex-> "+obj.nodeindex+"\n");
        dump("############## OBJECT obj.node-> "+obj.node+"\n");
        dump("############## OBJECT xNode.textContent-> "+xNode.textContent+"\n");
        dump("############## OBJECT xNodes.snapshotLength-> "+xNodes.snapshotLength+"\n");
        dump("############## DATA data (per txt) RESULT -> "+xNode.textContent+"\n");
        dump("############## DATA data (per txt) FINAL RESULT -> "+data+"\n");
        dump("############## OBJECT data (per txt) END ##############\n");                  
        dump("---------------------------------\n");
        dump("\n###########################\n");
        dump("\n OBJECT: \n");            
        dump("\n nodeindex: "+obj.nodeindex);
        dump("\n size: "+obj.size);        
        dump("\n sameblock?: "+obj.sameBlock);
        dump("\n startPoint: "+obj.startPoint);
        dump("\n endPoint: "+obj.endPoint);
        dump("\n url: "+obj.url);   
        dump("\n###########################");
        dump("\n textcontent: "+xNodes.snapshotItem(obj.size).textContent);
        dump("\n###########################\n");
        dump(" sameblock: "+sameBlock+" -> "+obj.url+"\n ")
        
        if(data != null) {
            xNode.textContent = xNode.textContent.replace( ( sameBlock ? obj.data : obj.startPoint) , data);
        } else {                        
            xNode.textContent = xNode.textContent.replace( ( sameBlock ? obj.data : obj.startPoint), vars._ENC);
        }


        var dad;
        if(!sameBlock) {
            var aURL = window.content.document.URL;
            if(aURL.indexOf("twitter") > -1) 
                obj.url = obj.url.substring(7,obj.url.length);
            var endindex = obj.size + 1;
            var node;
            for(var k = obj.nodeindex+1; k < endindex; k++) {
                node = xNodes.snapshotItem(k);
                if ( ( node.textContent.indexOf(obj.url) > -1) || (node.textContent.indexOf(obj.endPoint) > -1) ) {
                    dad = node.parentNode;
                    dad.removeChild(xNodes.snapshotItem(k));
                } else if ( node.textContent.indexOf(obj.startPoint) > -1) {
                    node.textContent = node.textContent.replace(obj.startPoint , data);
                }
            }
            
            var endnode = xNodes.snapshotItem(endindex);                    
            endnode.textContent = endnode.textContent.replace(obj.endPoint, "");

            // dump("Not sameblock: "+obj.url+" -> "+aURL+"\n ")            
            if( (aURL.indexOf("message") < 0)  && (aURL.indexOf("facebook") < 0) && (aURL.indexOf("twitter") < 0) ) {
                dump("--> dad.display = none\n");
                dad.style.display = "none";
            }
            if (data == "error") {
                dump("previous sibling: \n"+dad.parentNode+"\n")
                dad.parentNode.parentNode.style.display = "none";
            }
            
        } else {
            if (data == "error") xNode.style.display = "none";
        }
        delete scrambleAppNS.htmlactions.map[url];
    },
    


    /**
     *  Function to execute on the fly decryption in a Node
     *  @public
     *  @param aDocument document object
     *  @param aURL url value
     *  @param xPath XPATH element, used to navigate through elements and attributes in an XML document object
     *  @param isValue true if the Nodes are value nodes, false otherwise
     *  @returns {boolean} true or false
     */
    execute: function(aDocument, aURL, xPath, isValue) {
        var sameBlock = false;
        var result = 0;
        var xNodes = aDocument.evaluate(xPath, aDocument, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        var nXNodes = xNodes.snapshotLength;

        for (var i = 0; i < nXNodes; i++) {
            var xNode = xNodes.snapshotItem(i);
            var pgp_str = ( isValue ? xNode.value : xNode.textContent );
            
            var value = this.isEncryptionPresent(pgp_str);
            // dump("isEncryptionPresent in exec -------> "+value.result+"\n");
            if( value.result ) {
                var startPoint = value.startPoint;
                var endPoint = value.endPoint;
                var xNodeEnd;
                var j = 0;
                var flag = pgp_str.indexOf(endPoint, startPoint);
                // dump("######### FLAG : "+flag+"\n");

                if(flag > -1) { // the PGP block is in the same NODE
                    sameBlock = true;
                    ht = pgp_str;
                    pgp_str = this.getBlobByPos(pgp_str, startPoint, endPoint);
                    // dump("######### PGP_STR : "+pgp_str+"\n");
                    if(pgp_str != null) {
                        flag = 1;
                    }
                } else { // the PGP block is in different nodes, search for the full block
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
                    var clean_old = scrambleUtils.stripHTML(pgp_str, aURL);

					var pw = scrambleAppNS.scramble.getPwd();
					if(pw === null) return;
					// In case of the URI and if its not requested from crypto text editor console...
			        if (clean_old.indexOf(vars._PLURLstart) > -1) {
			            clean_old = clean_old.replace(vars._PLURLstart, " ");
			            clean_old = clean_old.replace(vars._PLURLend, " ");
			            clean_old = scrambleUtils.strTrim(clean_old.replace(new RegExp("[\\s]*", "g"), ""), '');
			            clean_old = scrambleUtils.strTrim(clean_old);
			            clean_old = scrambleAppNS.scramble.getTinyLink(clean_old);
			            if ((clean_old.indexOf("\r\n\r\n") > 0) && (scrambleUtils.detectOS() != vars._WIN)) {
			                clean_old = clean_old.replace(/\n/g, "");
			            }
			        }
			        	        		        
					var dec = kernel.decrypt(clean_old, pw);            
                    
                    if(dec != null) {
                        if(isValue) {
                            xNode.value = xNode.value.replace( (sameBlock ? pgp_str : startPoint) , dec);
                        } else {
                            xNode.textContent = xNode.textContent.replace( (sameBlock ? pgp_str : startPoint) , dec);
                        }
                    }else {                        
                        if(isValue) {
                            xNode.value = xNode.value.replace( (sameBlock ? pgp_str : startPoint), vars._ENC);
                        } else {
                            xNode.textContent = xNode.textContent.replace( (sameBlock ? pgp_str : startPoint), vars._ENC);
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
            value = scrambleUtils.stripHTML(value, null);
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
        	// dump("0. node undefined ");
            var aDocument = window.content.document;
            var aURL = aDocument.URL;
            // Work with the textNodes
            var result_textNodes = this.executeEncryption(aDocument, aURL, textNodesXpath, false, oldValue, newValue);
            // dump("result_textNodes " +result_textNodes);
            if(result_textNodes) {
                return true;
                
            }
            // Work with the values nodes
            var result_valueNodes = this.executeEncryption(aDocument, aURL, valueNodesXpath, true, oldValue, newValue);
            return result_valueNodes;
        } else if(aNode.nodeType != 1 && aNode.value) {
            aNode.value = aNode.value.replace(oldValue, newValue);
            // dump("1. aNode.value: " + aNode.value);
            return true;
        } else {
            aNode.textContent = aNode.textContent.replace(oldValue, newValue);
            // dump("2. aNode.textContent: " + aNode.textContent);
            return true;
        } 
	},
	
	
	/** 
     *  Function to Update the focus element content according to the new encrypted content...
	 *  @public
	 *  @param str The text value to refresh
	 *  @returns {boolean} true or false
	 *  @throws {Exception} If error in the fosused element
	 */
	refreshFocus: function(str) {
		// Get the focused element
        monitor.log(this._debug()._name, "refreshFocus", this._debug()._enable);
		try {
			var focused = document.commandDispatcher.focusedElement;

			if(focused === null) {
				return false;
			}

			var begin = focused.selectionStart;
			var end = focused.selectionEnd;
			var oldvalue = focused.value;
		
			if(oldvalue == "") {
				return false;
			}
			
			focused.value = oldvalue.substring(0, begin) + str + oldvalue.substring(end, oldvalue.length);
			focused.selectionStart = startPos;
			focused.selectionEnd = startPos + str.length ;
			return true;
		
		} catch(e) {
			return false;
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
        try {
            var ret = finalWindow.getBrowser().selectedBrowser.contentDocument;
            return ret;
	    } catch(e) { // in case there is no window or content...
	        return null;
	    }
	},
	
	/**
	 *	Function to get a text blob by Position on the main content window
	 *  @public
	 *  @param htmltxt html page
	 *  @param {int} start starting point
	 *  @param {int} end end point
	 *  @returns {String} the blob of text on the position or null
	 */
	getBlobByPos: function(htmltxt, start, end) {
        monitor.log(this._debug()._name, "getBlobByPos: ["+start+","+end+"]", this._debug()._enable);
		var begin = htmltxt.search(start);
		var endOf = htmltxt.indexOf(end, begin);		
		if(begin == -1 || endOf == -1) {
			return null;
		}
		return htmltxt.substring(begin, endOf+end.length);
	},
	
	/**
	 *	Function to get a text blob by selection
	 *  @public
	 *  @returns {String} Selected object {node, nodeVal}
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

		if(value == "") {
			try {
				// selectedtxt = getFrame(getBrowser().contentWindow.frames);
				var frames = getBrowser().contentWindow.frames;
                // dump("\n\nFrametext: "+frames+" ["+frames.length+"]\n\n");
				for(i = 0; i < frames.length; ++i) {
					try {
						//var tmp_frame = frames[i].getSelection();
						var tmp_frame = frames[i].document.activeElement;
						//var tmpVal = tmp_frame.toString();
						var tmpVal = tmp_frame.value;
                        // dump("selection:     "+tmpVal+"\n\n");
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
							var tmpSelselObj = frames[i].frames;
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
				if(value === "") value = focused.textContent;
                // dump("\n\n------>"+value+"<------\n\n");
				// value = value.substring(focused.selectionStart,focused.selectionEnd);
				node = focused;
			}
			catch (e) { 
			    // No text selected in imput and textareas
                monitor.exception(this._debug()._name, e, this._debug()._enable);
			}
		} else {
			/*dump("range count: " + selectedtxt.rangeCount);
			value = selectedtxt.getRangeAt(0);
			
			
			//value = selectedtxt.toString();
			dump ("selected value: " + value);
			
			var documentFragment = value.cloneContents();
			var s = new XMLSerializer();
			var d = documentFragment;
			var str = s.serializeToString(d);
			value = str;*/
			
			var focused = document.activeElement;

			// dump(focused.value);
			value = focused.value;
			if(value === "") value = focused.textContent;
            // dump("\n\n1------>"+value+"<------\n\n");
			// value = value.substring(focused.selectionStart,focused.selectionEnd);
			node = focused;				
		}
		ret.node = node;
		ret.nodeVal = value;
        dump("----########################################\n");
		dump("----######## Value: " + value + "\n");
		dump("----######## Node: " + node + "\n");
		dump("----######## Node.nodeType: " + node.nodeType + "\n");
		dump("----######## Node.nodeName: " + node.nodeName + "\n");
		dump("----######## Node.textContent: " + node.textContent + "\n");
		dump("----######## Node.value: " + node.value + "\n");
		dump("----######## Node.type: " + node.type + "\n");
		dump("----######## Node.innerHTML: " + node.innerHTML + "\n");
		dump("----######## Node.outerHTML: " + node.outerHTML + "\n");
        dump("----########################################\n");	  	
		return ret;
	},
	
	
	/**
     *  Function that verifies the existence of encrypted content in the HTML content
     *  @public
     *  @param string The value to verify
     *  @returns {Object} {result: boolean, startPoint: string, endPoint: string}
     */    
    isEncryptionPresent: function(string) {
        // monitor.log(this._debug()._name, "isEncryptionPresent", this._debug()._enable);
        var ret = {
            result: false,
            startPoint: "",
            endPoint: ""
        };

        if(string === undefined) {
            string = "";
        }
        if(string.indexOf(vars._PGPstart) > -1) {
            ret.result = true;
            ret.startPoint = vars._PGPstart;
            ret.endPoint = vars._PGPend;
        } else if(string.indexOf(vars._PLstart) > -1) {
            ret.result = true;
            ret.startPoint = vars._PLstart;
            ret.endPoint = vars._PLend;
        } else if(string.indexOf(vars._PLURLstart) > -1 ) {
            ret.result = true;
            ret.startPoint = vars._PLURLstart;
            ret.endPoint = vars._PLURLend;
        } else {
            ret.result = false;
        }
        return ret;
    },

    
};