var https = require('https');

module.exports = function(path, info, callback) {
  var options = {
    host: 'graph.facebook.com',
    port: 443,
    path: (path.toString()).replace("\n",""),
    label: info,
    method: 'GET'
  };

  var req = https.get(options, function(res) {

    var pageData = "";

    if((path.toString()).indexOf("/")==0 && (path.toString()).indexOf("/GET / HTTP/")!=0) //for load only (I hope facebook profile)
    {
    
      //console.log(options);

      res.setEncoding('utf8');
      
      res.on('data', function (chunk) {
        pageData += chunk;
      });
      
      res.on('end', function()
      {       
          
            var fs = require('fs');

            /*
            console.log("**********************************************************************");
            console.log("options.label" + options.label);
            console.log("**********************************************************************");
            */
            
            fs.appendFileSync('/tmp/profile', "***"+options.label+pageData);

            /*

            fs.appendFile('/tmp/profile', "***"+pageData, function (err) {
              if (err) throw err;
              console.log('It\'s saved!');
            */  
              console.log(options.label);

              //if(path.search("statuses{")!=-1)
              if(options.label == "feed")
              {
                console.log("=> ritorno");
                callback(pageData);
              }

          //});      

      });
    }
  });
};

