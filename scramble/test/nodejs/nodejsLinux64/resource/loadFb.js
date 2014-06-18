var https = require('https');

module.exports = function(path, callback) {
  var options = {
    host: 'graph.facebook.com',
    port: 443,
    path: (path.toString()).replace("\n",""),
    method: 'GET'
  };

  var req = https.get(options, function(res) {

    var pageData = "";

    if((path.toString()).indexOf("/")==0 && (path.toString()).indexOf("/GET / HTTP/")!=0) //for load only (I hope facebook profile)
    {
    
      console.log(options);

      res.setEncoding('utf8');
      
      res.on('data', function (chunk) {
        pageData += chunk;
      });
      
      res.on('end', function()
      {       
          
          var fs = require('fs');
          fs.writeFile("/tmp/profile", pageData, function(err) {
          if(err) {
              console.log(err);
          } else {
              console.log("The file was saved!");
          }
          callback(pageData);

         });

        

      });
    }
  });
};

