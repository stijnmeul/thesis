var net = require('net');
var crypto = require('crypto');

//sjcl
var sjcl = require('./sjcl');

//retrive fb profile
var loadFb = require('./loadFb.js');
var loadFeed = require('./loadFeed.js');

//Lettura file json
var fs = require('fs');
var text = fs.readFileSync(__dirname + '/users.txt','utf8');

var HOST = 'localhost';
var PORT = 7000;

net.createServer(function(sock) {
    
    // We have a connection - a socket object is assigned to the connection automatically
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        
        //console.log("##########################################################################"+data.toString()+"##########################################################################");

        if((data.toString()).indexOf("GET / HTTP/1.1")!=0)
        {

        //decifro e splitto
        var userLocalKey = returnCurrentlyUserKey();
        userLocalKey = userLocalKey.replace("\n","");
        var cifra = (data.toString()).replace("\n","");
        var decifro = sjcl.decrypt(userLocalKey,cifra);
        var splitted = decifro.split("***");
        var B_requested = splitted[0];
        var A1_mitt = splitted[1];


        //NUOVA VERSIONE, CONTROLLO TOKEN
        //var resKey = checkAuth(data.toString());
        //if(resKey==null) //auth completed, else I have the key that I have to use for encrypted
        //{







            //leggo token
            var token = fs.readFileSync('/tmp/VF_infoB1.txt','utf8');

            //profilo+feed
            //var extendetPath = "/"+data+"?access_token="+token;
            //var extendetPath2= "/"+data+"/feed?access_token="+token;

            var extendetPath = "/"+B_requested+"?access_token="+token;
            var extendetPath2= "/"+B_requested+"/feed?access_token="+token;

            //call to retrive profile
            loadFb(extendetPath, function(pageData) 
            {
              //call to retrive feed
              loadFeed(extendetPath2, function(pageData2) 
              {



                //a questo punto ho gia il profilo scritto!!!

                
                var fs = require('fs');
                var profileText = fs.readFileSync('/tmp/profile','utf8');      
                
                //cifratura qui con la chiave di A1_mitt
                var a1_key = returnKeyFromUser(A1_mitt.replace("\n",""));
                var encyptedProfile = sjcl.encrypt(a1_key, profileText);

                //encrypted with Bob key
                //resKey is Bob's Key
                //var encyptedProfile = sjcl.encrypt(resKey, profileText);

                //send all the info
                //sock.write(profileText);

                //send encypted text
                sock.write(encyptedProfile);

              });

            });
        //}//if(resBool==true) //auth completed
    
      }//if data
    });
    
    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
    });
    
}).listen(PORT);

console.log('Server listening on ' + HOST +':'+ PORT);

function returnKeyFromUser(id)
{
  //text
  var trovata = false;
  var dati = JSON.parse(text);
  for(var i=0; i<dati.friendlist.friend.length && trovata==false; i++)
  {
    var user = (dati.friendlist.friend[i].username).replace("\n","");
    var userID = (id).replace("\n","");
    if(user==userID)
    {
      trovata=true;
      return ((dati.friendlist.friend[i].publicKey).toString()).replace("\n","");
    }
  }
  if(trovata==false)
    return null;
}

function returnCurrentlyUserKey()
{
  //text
  var trovata = false;
  var dati = JSON.parse(text);
  for(var i=0; i<dati.friendlist.friend.length && trovata==false; i++)
  {
    var local = (dati.friendlist.friend[i].localuser).replace("\n","");
    console.log("***************************************************************");
    console.log("POSSIBILITA DI AVERE UN BARRA N QUA!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    if(local=="true")
    {
      trovata=true;
      return ((dati.friendlist.friend[i].publicKey).toString()).replace("\n","");
    }
  }
  if(trovata==false)
    return null;
}


function checkAuth(tokenAuth)
{
  var dati = JSON.parse(text);
  for(var i=0; i<dati.friendlist.friend.length; i++)
  {
    var currentKey = (dati.friendlist.friend[i].publicKey).replace("\n","");
    var userID = crypto.createHash('md5').update(currentKey).digest('hex'); //check the tokenAuth
    if(tokenAuth==userID)
      return currentKey;
  }
  return null;
}