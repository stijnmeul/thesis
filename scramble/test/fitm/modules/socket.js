const EXPORTED_SYMBOLS = ["socket"];

// set constants
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Components.utils.import("resource://gre/modules/NetUtil.jsm");

let socket = {
    
    /**
     *  @private
     *  Private Object for debugging purposes
     */
    _debug: function() {
          var params = {
            _name: "socket",
              _enable: true
          };
         var prefs = scrambleUtils.getPreferences();
          var debug = prefs.getBoolPref("debug");
         params._enable = debug;
          return params;
    },
    
    
    connect: function(server, port, data, callback) {
        // dump("ScrambleClient Connecting to ScrambleSocketServer...\n");
        //monitor.log(this._debug()._name, "ScrambleClient Connecting to ScrambleSocketServer...", this._debug()._enable);

        var transportService = Cc["@mozilla.org/network/socket-transport-service;1"].
             getService(Ci.nsISocketTransportService);        
        var transport = transportService.createTransport(null, 0, server, port, null);        
        var stream = transport.openInputStream(Ci.nsITransport.OPEN_UNBUFFERED, null, null);
        // var stream = transport.openInputStream(Ci.nsITransport.OPEN_BLOCKING, null, null);                        
        var instream = Cc["@mozilla.org/scriptableinputstream;1"].
             createInstance(Ci.nsIScriptableInputStream);
        
         // Initialize
         instream.init(stream);        
         var outstream = transport.openOutputStream(0, 0, 0);
        
         var dataListener = {
             receivedData: [],
             dtest: "",
        
             onStartRequest: function(request, context) {
                 dump("ScrambleClient Connected to ScrambleSocketServer [port: "+port+" | host: "+server+"]\n");
                 // monitor.log(this._debug()._name, "ScrambleClient Connected to ScrambleSocketServer [port: "+port+" | host: "+server+"]", this._debug()._enable);
             },
        
             onStopRequest: function(request, context, status) {
                 instream.close();
                 outstream.close();
             },
        
             onDataAvailable: function(request, context, inputStream, offset, count) {
                 //var data = instream.read(count).replace(/\n/gm, '');
                 var data = instream.read(count);
                 //receivedData.push(data);
                 dtest = data;
                 callback(data);
             }
         };
        
         var pump = Cc["@mozilla.org/network/input-stream-pump;1"].
             createInstance(Ci.nsIInputStreamPump);
        
         pump.init(stream, -1, -1, 0, 0, false);
         pump.asyncRead(dataListener, null);
       
          
         // Find category
         var inputStr = Cc["@mozilla.org/io/string-input-stream;1"].
             createInstance(Ci.nsIStringInputStream);        
         var outData = data + '\n';        
         inputStr.setData(outData, outData.length);        
         NetUtil.asyncCopy(inputStr, outstream, function(aResult) {
             if (!components.isSuccessCode(aResult)) {
                 dump("ERROR: writing to socket\n");
                 // monitor.log(this._debug()._name,"ERROR: writing to socket", this._debug()._enable);
             }
         });
    },
    
};
