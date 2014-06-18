//net
var net = require('net');
//for md5
var crypto = require('crypto');
//sjcl
var sjcl = require('./sjcl');
//retrive fb info
var loadJ = require('./loadJ.js');
//read file
var fs = require('fs');
//read user list
var text = fs.readFileSync(__dirname + '/users.txt','utf8');
var local = fs.readFileSync(__dirname + '/local.txt','utf8');
//listening port
var PORT = 7000;

net.createServer(function(sock) {
    
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        
        if((data.toString()).indexOf("GET / HTTP/1.1")!=0)
        {

          var temp = (data.toString()).replace("\n","");
          var resKey = checkAuth(temp);
   
          if(resKey[0]!=null) //auth completed, else I have the key that I have to use for encrypted in resKey[0], in resKey[1] I have userId
          {

            //leggo token e mia chiave
            var userId = myKey(local);
            //var userId = myKey(text);

            var token = fs.readFileSync('/tmp/VF_info'+userId+".txt",'utf8');

            var user = resKey[1];
            //pathList = new Array("/"+user+"?access_token="+token,"/"+user+"/likes?access_token="+token,"/"+user+"/photos?limit=10&fields=width,from,source,height&access_token="+token,"/"+user+"/music?access_token="+token,"/"+user+"/friends?access_token="+token,"/"+user+"/books?access_token="+token,"/"+user+"/groups?access_token="+token,"/"+user+"/statuses?limit=10&fields=id,message,from&access_token="+token);
            //label = new Array("info","likes","photo","music","friends","books","groups","feed");

            pathList = new Array();
            pathList[0] = "/"+user+"?access_token="+token;
            pathList[1] = "/"+user+"/likes?access_token="+token;
            pathList[2] = "/"+user+"/photos?limit=10&fields=width,from,source,height&access_token="+token;
            pathList[3] = "/"+user+"/music?access_token="+token;
            pathList[4] = "/"+user+"/friends?access_token="+token;
            pathList[5] = "/"+user+"/books?access_token="+token;
            pathList[6] = "/"+user+"/groups?access_token="+token;
            pathList[7] = "/"+user+"/statuses?limit=10&fields=id,message,from&access_token="+token;

            label = new Array();
            label[0] = "info";
            label[1] = "likes";
            label[2] = "photo";
            label[3] = "music";
            label[4] = "friends";
            label[5] = "books";
            label[6] = "groups";
            label[7] = "feed";

           //start writing profile
            fs.writeFileSync("/tmp/profile", "graph.facebook.com/"+user+"/picture?type=large");

            for(var j=0; j<pathList.length; j++)
            {

                //console.log("0");
                //call to retrive profile
                loadJ(pathList[j],label[j], function(pageData) 
                {
                    console.log("1");
                    var fs = require('fs');
                    //console.log("2");
                    var profileText = fs.readFileSync('/tmp/profile','utf8');
                    //console.log("3");
                    //var pageHtlm = createProfile(profileText);
                    //console.log("4");
                    //fs.writeFileSync("/tmp/profile_server", profileText);
                    //console.log("5");
                    var encyptedProfile = sjcl.encrypt(resKey[0],profileText);
                    //console.log("6");
                    fs.writeFileSync("/tmp/profile_server_cifrato", encyptedProfile);
                    //console.log("6");                  
                    sock.write(encyptedProfile,'utf8');                    

                  });

            }//FOR

        }//if(resBool==true) //auth completed
    
      }//if data

    });
    
    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
    });
    
}).listen(PORT);

console.log('Server listening on ' + PORT);


function myKey(text)
{
  /*
  var dati = JSON.parse(text);
  for(var i=0; i<dati.friendlist.friend.length; i++)
  {
    if(((dati.friendlist.friend[i].localuser).toString()).replace("\n","") == "true")
    {
      //[0]= key of Bob, [1] => id of Bob
      //console.log("dati.friendlist.friend[i].username from NODE.JS" + ((dati.friendlist.friend[i].username).toString()).replace("\n","") + ")");
      return ((dati.friendlist.friend[i].username).toString()).replace("\n","");
    }
  }
  return null;
  */

  var dati = JSON.parse(text);
  return ((dati.localuser.username).toString()).replace("\n","");

}


function checkAuth(tokenAuth)
{
  var dati = JSON.parse(text);
  console.log("dati.friendlist.friend.length: " + dati.friendlist.friend.length);
  for(var i=0; i<dati.friendlist.friend.length; i++)
  {
    var currentKey = (dati.friendlist.friend[i].publicKey).replace("\n","");
    var userID = crypto.createHash('md5').update(currentKey).digest('hex'); //check the tokenAuth

    
    console.log("************************************");
    console.log("currentKey:" + currentKey);
    console.log("tokenAuth:" + tokenAuth);
    console.log("userID:" + userID);
    console.log("************************************\n\n");
    

    if(tokenAuth==userID)
    {
      //[0]= key of Bob, [1] => id of Bob
      return new Array(currentKey,((dati.friendlist.friend[i].username).toString()).replace("\n",""));
    }
  }
  return null;
}

function createProfile(profileAll)
{
    var paginaHTML="<html>\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t\t<title>Facebook Profile of</title>\n\t";
    paginaHTML +="<script type=\"text/javascript\">";
    paginaHTML += "function showInfo(){";
    paginaHTML += "var scelta=document.getElementsByName(\"radio_info\");";
    paginaHTML += "if (scelta[0].checked) {";
    paginaHTML += "   document.getElementById('post').style.display = 'block';";
    paginaHTML += "   document.getElementById('friend').style.display = 'none';";
    paginaHTML += "   document.getElementById('like').style.display = 'none'; ";
    paginaHTML += "   document.getElementById('foto').style.display = 'none'; ";
    paginaHTML += "   document.getElementById('mbg').style.display = 'none';";
    paginaHTML += "  }";
    paginaHTML += "if (scelta[1].checked) {";
    paginaHTML += "   document.getElementById('post').style.display = 'none';";
    paginaHTML += "   document.getElementById('friend').style.display = 'block';";
    paginaHTML += "   document.getElementById('like').style.display = 'none'; ";
    paginaHTML += "   document.getElementById('foto').style.display = 'none'; ";
    paginaHTML += "   document.getElementById('mbg').style.display = 'none';";
    paginaHTML += "  }";
    paginaHTML += "if (scelta[2].checked) {";
    paginaHTML += "   document.getElementById('post').style.display = 'none';";
    paginaHTML += "   document.getElementById('friend').style.display = 'none';";
    paginaHTML += "   document.getElementById('like').style.display = 'block'; ";
    paginaHTML += "   document.getElementById('foto').style.display = 'none'; ";
    paginaHTML += "   document.getElementById('mbg').style.display = 'none';";
    paginaHTML += "  }";
    paginaHTML += "if (scelta[3].checked) {";
    paginaHTML += "   document.getElementById('post').style.display = 'none';";
    paginaHTML += "   document.getElementById('friend').style.display = 'none';";
    paginaHTML += "   document.getElementById('like').style.display = 'none' ; ";
    paginaHTML += "   document.getElementById('foto').style.display = 'block'; ";
    paginaHTML += "   document.getElementById('mbg').style.display = 'none';";
    paginaHTML += "  }";
    paginaHTML += "if (scelta[4].checked) {";
    paginaHTML += "   document.getElementById('post').style.display = 'none';";
    paginaHTML += "   document.getElementById('friend').style.display = 'none';";
    paginaHTML += "   document.getElementById('like').style.display = 'none'; ";
    paginaHTML += "   document.getElementById('foto').style.display = 'none'; ";
    paginaHTML += "   document.getElementById('mbg').style.display = 'block';";
    paginaHTML += "  }";
    paginaHTML += " }";
    paginaHTML += "</script></head>\n<body style=\"min-width:1400px;  width: 1400px ;     margin: auto;    background-color: #e7ebf2;\">";

    var INFOCOMPLETE = profileAll.split("***");
    var picture=(INFOCOMPLETE[0].replace("{","")).toString();
    var picture=picture.replace("}","");
    picture=picture.replace("\n","");

    paginaHTML += "\n\n<div id=\"container\" style=\"border:1px solid black; padding:2px; width:80%; align:center; background-color: #fffff0; font-style:italic; font-weight:bold margin: auto;;\">\n\n";

    //paginaHTML += "\n\n\n<div id=\"header\"  style=\"  background-color:#1e90ff; font-size:30px; text-align:center; \"> PROFILE INFO OF DARIO ";
    paginaHTML += "\n\n\n<div id=\"header\"  style=\"  background-color:#1e90ff; font-size:15px; text-align:center; \"> <h2> PROFILE INFO OF DARIO </h2>";
    paginaHTML += "</div>"; //chiudo header

    //picture
    paginaHTML += "\n\n\n<div id=\"div_picture\" style=\"border:1px solid black; height: 230px; background: url('https://"+INFOCOMPLETE[0]+"') no-repeat center; float:left;  width:20%; \"></div>";

    //profile info
    var profilo = "";
    for(var cont=0; cont<INFOCOMPLETE.length; cont++)
      if(INFOCOMPLETE[cont].search("info{")!=-1)
      {
        var t = INFOCOMPLETE[cont];
        t = t.replace("info","");
        profilo =  JSON.parse(t);  
      }


    var stampa = "";
    var id = profilo.id;
    var name = profilo.name;
    var first_name = profilo.first_name;
    var last_name = profilo.last_name;
    var username = profilo.username;
    var gender = profilo.gender;
    var hometown = "Undefined";
    var bio = "Undefined";
    var birthday = "Undefined";
    var location = "Undefined";
    var relationship_status = "Undefined";
    var works = new Array();
    var education = new Array();
    var favorite_team = new Array();
    var languages = new Array();
    if (!(profilo.hometown === undefined) && !(profilo.hometown.name === undefined))
        hometown = profilo.hometown.name;
    if (!(profilo.bio === undefined))
        bio = profilo.bio;
    if (!(profilo.bio === undefined))
        bio = profilo.bio;
    if (!(profilo.birthday === undefined))
        birthday = profilo.birthday;
    if (!(profilo.location === undefined) && !(profilo.location.name === undefined))
        location = profilo.location.name;
    //gestione lavori
    if (!(profilo.work === undefined)) 
    {
        if (profilo.work.length > 0) {
            for (var j = 0; j < profilo.work.length; j++) {
                var work_name = "Undefined";
                var work_location = "Undefined";
                var work_start = "Undefined";
                var work_end = "Undefined";
                if (!(profilo.work[j].employer.name === undefined))
                    work_name = profilo.work[j].employer.name;

                if (!(profilo.work[j].location === undefined) && !(profilo.work[j].location.name === undefined))
                    work_location = profilo.work[j].location.name;

                if (!(profilo.work[j].start_date === undefined))
                    work_start = profilo.work[j].start_date;

                if (!(profilo.work[j].end_date === undefined))
                    work_end = profilo.work[j].end_date;
                works.push(new Array(work_name, work_location, work_start, work_end));
            }
        }
    }
    if (!(profilo.favorite_teams === undefined)) 
    {
        if (profilo.favorite_teams.length > 0) {
            for (var j = 0; j < profilo.favorite_teams.length; j++)
                favorite_team.push(profilo.favorite_teams[j].name);
        }
    }

    if (!(profilo.education === undefined)) 
    {
        if (profilo.education.length > 0) {
            for (var j = 0; j < profilo.education.length; j++) {
                var education_name = "Undefined";
                var education_year = "Undefined";
                var education_type = "Undefined";
                if (!(profilo.education[j].school === undefined) && !(profilo.education[j].school.name === undefined))
                    education_name = profilo.education[j].school.name;

                if (!(profilo.education[j].year === undefined) && !(profilo.education[j].year.name === undefined))
                    education_year = profilo.education[j].year.name;

                if (!(profilo.education[j].type === undefined))
                    education_type = profilo.education[j].type;

                education.push(new Array(education_name, education_year, education_type));
            }
        }
    }
    if (!(profilo.relationship_status === undefined))
        relationship_status = profilo.relationship_status;

    if (!(profilo.languages === undefined))
        if (profilo.languages.length > 0) 
        {
            for (var j = 0; j < profilo.languages.length; j++) 
            {
                languages.push(profilo.languages[j].name);
            }
        }
  

//TIMELINE************************************************************************************************

var posts = "";
for(var cont=0; cont<INFOCOMPLETE.length; cont++)
  if(INFOCOMPLETE[cont].search("feed{")!=-1)
  {
    var t = INFOCOMPLETE[cont];
    //console.log("******************************************************************************");
    //console.log("t prima di replace\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    t = t.substring(4);                                                                   
    //console.log("******************************************************************************\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    posts = JSON.parse(t);
  }

  var timeline = "";
  timeline += "<H2>Status update</H2>";
  for (var j = 0; j < posts.data.length; j++) 
  {
      if(true)
      {
          timeline += "<div id=\'post"+(j+1)+"\' style=\"margin-left:100px; border:1px solid black; padding:10px; width:600px; background-color: #fffff0; font-style:italic; font-weight:bold margin: auto; margin-bottom:5px; \">";
          timeline +=    "<div id='post"+(j+1)+"_header'>";
          timeline +=    "<table border=\'0\'>"
          timeline +=    "<tr>";
          timeline +=    "<td valign=\'top\'>";
          timeline += "<img src='https://graph.facebook.com/dario.vettore/picture' /> </td>";
          timeline += "<td > <dl style=\"margin-left:30px;\">";
          timeline += "<dt style=\"color:#0000FF\">" + posts.data[j].from.name + "</dt> <dd>  <b>"+posts.data[j].created_time+"</b>  </dd>  </dl>   </td>  </tr>  </table>  </div>";

          timeline += "<div id=\'post"+(j+1)+"message\' style=\"border:0px solid black; width:600px; align:center; background-color: #fffff0; font-style:italic; font-weight:bold margin: auto;\"> <h3>";
          var message = "";
              if (!(posts.data[j].message === undefined))
                  message = posts.data[j].message;
          timeline += message;
          timeline += "</h3>  </div> ";

          //add likes if exist
          if (!(posts.data[j].likes === undefined)) 
          {
              timeline += "<div id=\'post"+(j+1)+"likes\' style=\"border:0px solid black; width:600px; align:center; font-weight:normal; margin: auto;\"><h5> ";
              if (parseInt(posts.data[j].likes.data.length) > 0)
              {
                      //timeline += "parseInt(posts.data[j].likes.length: " + parseInt(posts.data[j].likes.length);
                      for (var l = 0; l <parseInt(posts.data[j].likes.data.length); l++)
                      {
                          //likes[l]= posts.data[j].likes.data[l].name;             
                          if (!(parseInt(posts.data[j].likes.data[l]) === undefined))
                              timeline += posts.data[j].likes.data[l].name + ", ";
                      }
                      timeline += "like this post </h5> </div>";
              }// if (!(posts.data[j].likes === undefined)) {
          }
       
          //comments
          if (!(posts.data[j].comments === undefined)) 
          {
              if (parseInt(posts.data[j].comments.data.length) > 0) 
              {
                  timeline += "<div id='post1_comment1' style=\"border:0px solid black; padding:5px; width:500px; align:center; background-color: #fffff0; font-style:italic; font-weight:bold margin: auto;\">";  
                  timeline += "<table border='0' cellspacing='10'>";
                  
                  for (var i = 0; i < posts.data[j].comments.data.length; i++) 
                  {
                      timeline += "<tr id='post"+(j+1)+"_comment_"+(i+1)+"' style=\"padding:5px; \">";
                      timeline += "<td><img src='https://graph.facebook.com/"+posts.data[j].comments.data[i].from.id+"/picture' /> </td>";
                      timeline += "<td> <b>" + posts.data[j].comments.data[i].from.name +"</b> ";
                      timeline += posts.data[j].comments.data[i].message;
                      timeline += "</td></tr>";
                  }
                  
              }
              timeline += "</table>";
              timeline += "</div>";
          }
          timeline += "</div>"; //end div post
      }
  } //end retrive posts
//TIMELINE************************************************************************************************


paginaHTML += "\n\n\n<div id=\"personal_detail\" style=\" border:1px solid black; height: auto;  float:right; width:75%; background-color:#fffff0; \">";


paginaHTML += "<table border='0' style=\" width:800px;\" > <tr><td>";

if(works.length>0)
{
    paginaHTML += "<h3>Work and education</h3>";
    paginaHTML += "<dl>";
    for(var i=0;i<works.length;i++)
    {
        paginaHTML += "<dt><b>"+works[i][0]+"</b></dt> <dd> from "+works[i][2]+" to "+works[i][3]+" </dd> ";
        paginaHTML = paginaHTML.replace("Undefined","--");
        paginaHTML = paginaHTML.replace("undefined","--");
        paginaHTML = paginaHTML.replace("\n","");
    }
    //paginaHTML += "</dl>";
}
else
    paginaHTML += "<h3>Work and education</h3>\n<dl>";

if(education.length>0)
{
    for(var i=0;i<education.length;i++)
    {
        paginaHTML += "<dt><b>"+education[i][0]+"</b></dt> <dd> from "+education[i][2]+" to "+education[i][3]+" </dd> ";
        paginaHTML = paginaHTML.replace("Undefined","--");
        paginaHTML = paginaHTML.replace("undefined","--");
        paginaHTML = paginaHTML.replace("\n","");
    }
    paginaHTML += "</dl>";
}
else
    paginaHTML += "</dl>";

paginaHTML += "</td><td>";

paginaHTML += "<h3><b>Basic Information</b></h3> <dl><dt><b>Name </b></dt><dd>" + name+"</dd></dt>";
paginaHTML += "<dt><b>Birthday </b></dt> <dd>" + birthday+"</dd></dt>";
paginaHTML += "<dt><b>Relationship status </b></dt><dd> " + relationship_status +"</dd></dt>";
paginaHTML += "<dt><b>Hometown </b></dt> <dd>" + hometown +"</dd></dt>";
paginaHTML += "<dt><b>Location </b></dt><dd> " + location +"</dd></dt>";
paginaHTML += "</dl></td></tr></table></div>";


//navigation
paginaHTML += "\n\n\n\n<div id=\"navigation\" style=\" height: 30px; margin-top:330px; background-color:#10d02f; text-align:center; \" >";
paginaHTML += "\n\n\n\n\n<input type=\"radio\" id=\"radio_info\" name=\"radio_info\" value=\"post\" checked=\"checked\" onclick='javascript:showInfo()'/> <label id=\"postLabel\"> Post </label>";
paginaHTML += "<input type=\"radio\" id=\"radio_info\" name=\"radio_info\" value=\"friend\" onclick='javascript:showInfo()'/> <label id=\"friendLabel\"> Friend list </label>";
paginaHTML += "<input type=\"radio\" id=\"radio_info\" name=\"radio_info\" value=\"like\" onclick='javascript:showInfo()'/> <label id=\"likeLabel\"> Likes </label>";
paginaHTML += "<input type=\"radio\" id=\"radio_info\" name=\"radio_info\" value=\"foto\" onclick='javascript:showInfo()'/> <label id=\"fotoLabel\"> Photo </label>";
paginaHTML += "<input type=\"radio\" id=\"radio_info\" name=\"radio_info\" value=\"mbg\" onclick='javascript:showInfo()'/> <label id=\"mbgLabel\"> Music-Books-Groups </label></div>";

//profile timeline
paginaHTML += "\n\n\n\n<div id=\"post\" style=\" text-align:center; margin-left:100px; \">";
paginaHTML += timeline;
paginaHTML += "</div>";

//friendlist
paginaHTML += "\n\n\n\n<div id=\"friend\" style=\"display:none;\">"

var amici = "";
for(var cont=0; cont<INFOCOMPLETE.length; cont++)
  if(INFOCOMPLETE[cont].search("friends{")!=-1)
  {
    var t = INFOCOMPLETE[cont];
    //console.log("******************************************************************************");
    //console.log("t prima di replace\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    t = t.substring(7);                                                                   
    //onsole.log("******************************************************************************\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    amici = JSON.parse(t);                                                                          
  }

if(!(amici.data === undefined))
{
    paginaHTML += "<table border='0' style=\" width:800px; margin-left:200px; cellpadding:20;\" >";
    paginaHTML += "<dl>";
    for(var j=0; j<amici.data.length;j=j+2)
    //for(var j=0; j<coppie;j++)
    {
        paginaHTML += "<tr><td><dt><h3  style=\" font-style:italic; \" >"+amici.data[j].name+"</h3></dt>";
        paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+amici.data[j].id+"/picture?width=250&height=250\"  width='150px' height='150px'/></dd></td>";


        if(!(amici.data[j+1] === undefined))
        {
            paginaHTML += "<td><dt><h3 style=\" font-style:italic; \" >"+amici.data[j+1].name+"</h3></dt>";
            paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+amici.data[j+1].id+"/picture?width=250&height=250\"  width='150px' height='150px' /></dd>";
        }
        
        paginaHTML += "</tr>";
    }
    paginaHTML += "</dl>";
    paginaHTML += "</table>";
}
else
    paginaHTML += "No friendlist visible";

paginaHTML += "</div>";
//end friendlist


var likes = "";
for(var cont=0; cont<INFOCOMPLETE.length; cont++)
  if(INFOCOMPLETE[cont].search("likes{")!=-1)
  {
    var t = INFOCOMPLETE[cont];
    //console.log("******************************************************************************");
    //console.log("t prima di replace\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    t = t.substring(5);                                                                   
    //onsole.log("******************************************************************************\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    likes = JSON.parse(t);                                                                            
  }

//start likes
paginaHTML += "\n\n\n\n<div id=\"like\" style=\"display:none;\">";

if(!(likes.data === undefined))
{
    paginaHTML += "<table border='0' style=\" width:800px; margin-left:200px; cellpadding:20;\" >";
    paginaHTML += "<dl>";
    for(var j=0; j<likes.data.length;j=j+2)
    //for(var j=0; j<coppie;j++)
    {
        paginaHTML += "<tr><td><dt><h3  style=\" font-style:italic; \" >"+likes.data[j].name+"</h3></dt>";
        paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+likes.data[j].id+"/picture?width=150&height=150\"  width='150px' height='150px'/></dd></td>";


        if(!(likes.data[j+1] === undefined))
        {
            paginaHTML += "<td><dt><h3 style=\" font-style:italic; \" >"+likes.data[j+1].name+"</h3></dt>";
            paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+likes.data[j+1].id+"/picture?width=150&height=150\"  width='150px' height='150px' /></dd>";
        }
        
        paginaHTML += "</tr>";
    }
    paginaHTML += "</dl>";
    paginaHTML += "</table>";
}
else
    paginaHTML += "No friendlist visible";

paginaHTML += "</div>"; //end likes


//FOTO
paginaHTML += "\n\n\n\n<div id=\"foto\" style=\"display:none;\">";

//start foto
var photo = "";
for(var cont=0; cont<INFOCOMPLETE.length; cont++)
  if(INFOCOMPLETE[cont].search("photo{")!=-1)
  {
    var t = INFOCOMPLETE[cont];
    //console.log("******************************************************************************");
    //console.log("t prima di replace\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    t = t.substring(5);                                                                   
    //onsole.log("******************************************************************************\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    photo = JSON.parse(t);                                                                          
  }

if(!(photo.data === undefined))
{
    paginaHTML += "<table border='0' style=\" width:800px; margin-left:30px; cellpadding:20;\"> <tr colspan='4' ><th colspan='4'><h2>Photo</h2></th> </tr>";
    paginaHTML += "<dl>";
    for(var j=0; j<photo.data.length;j=j+4) //J=J+2;
    //for(var j=0; j<coppie;j++)
    {
        paginaHTML += "<tr><td><dt></h3></dt>";
        //paginaHTML += "<dd><img src=\""+photo.data[j].source+"\"  width='"+photo.data[j].width/2+"px' height='"+photo.data[j].height/2+"px'/></dd></td>";
        paginaHTML += "<dd><img src=\""+photo.data[j].source+"\"  width='211px' height='211px'/></dd></td>";

        if(!(photo.data[j+1] === undefined))
        {
        paginaHTML += "<td><dt></h3></dt>";
        //paginaHTML += "<dd><img src=\""+photo.data[j].source+"\"  width='"+photo.data[j].width/2+"px' height='"+photo.data[j].height/2+"px'/></dd></td>";
        paginaHTML += "<dd><img src=\""+photo.data[j+1].source+"\"  width='211px' height='211px'/></dd></td>";
        }

        if(!(photo.data[j+2] === undefined))
        {
        paginaHTML += "<td><dt></h3></dt>";
        //paginaHTML += "<dd><img src=\""+photo.data[j].source+"\"  width='"+photo.data[j].width/2+"px' height='"+photo.data[j].height/2+"px'/></dd></td>";
        paginaHTML += "<dd><img src=\""+photo.data[j+2].source+"\"  width='211px' height='211px'/></dd></td>";
        }

        if(!(photo.data[j+3] === undefined))
        {
            paginaHTML += "<td><dt></h3></dt>";
            //paginaHTML += "<dd><img src=\""+photo.data[j+1].source+"\"  width='"+photo.data[j].width/2+"px' height='"+photo.data[j].height/2+"px'/></dd></td>";
            paginaHTML += "<dd><img src=\""+photo.data[j+3].source+"\"  width='211px' height='211px'/></dd></td>";
        }
        
        paginaHTML += "</tr>";
    }
    paginaHTML += "</dl>";
    paginaHTML += "</table>";
}
else
    paginaHTML += "No Phpto visible";

paginaHTML += "</div>"; //end foto
//end foto


//Music-Books-Groups
paginaHTML += "\n\n\n\n<div id=\"mbg\" style=\"display:none;\">";
//start music

var music = "";
for(var cont=0; cont<INFOCOMPLETE.length; cont++)
  if(INFOCOMPLETE[cont].search("music{")!=-1)
  {
    var t = INFOCOMPLETE[cont];
    //console.log("******************************************************************************");
    //console.log("t prima di replace\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    t = t.substring(5);                                                                   
    //onsole.log("******************************************************************************\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    music = JSON.parse(t);                                                                           
  }

if(!(music.data === undefined))
{
    paginaHTML += "<table border='0' style=\" width:800px; margin-left:200px; cellpadding:20;\"> <tr colspan='2' ><th colspan='2'><h2>Music</h2></th> </tr>";
    paginaHTML += "<dl>";
    for(var j=0; j<music.data.length;j=j+2)
    //for(var j=0; j<coppie;j++)
    {
        paginaHTML += "<tr><td><dt><h3  style=\" font-style:italic; \" >"+music.data[j].name+"</h3></dt>";
        paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+music.data[j].id+"/picture?width=150&height=150\"  width='150px' height='150px'/></dd></td>";


        if(!(music.data[j+1] === undefined))
        {
            paginaHTML += "<td><dt><h3 style=\" font-style:italic; \" >"+music.data[j+1].name+"</h3></dt>";
            paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+music.data[j+1].id+"/picture?width=150&height=150\"  width='150px' height='150px' /></dd>";
        }
        
        paginaHTML += "</tr>";
    }
    paginaHTML += "</dl>";
    paginaHTML += "</table>";
}
else
    paginaHTML += "No Music visible";

var books = "";
for(var cont=0; cont<INFOCOMPLETE.length; cont++)
  if(INFOCOMPLETE[cont].search("books{")!=-1)
  {
    var t = INFOCOMPLETE[cont];
    //console.log("******************************************************************************");
    //console.log("t prima di replace\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    t = t.substring(5);                                                                   
    //onsole.log("******************************************************************************\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    books = JSON.parse(t);                                                                           
  }

//start books
paginaHTML += "\n\n";
if(!(books.data === undefined))
{
  if(books.data.length>0)
  {
      paginaHTML += "<table border='0' style=\" width:800px; margin-left:200px; cellpadding:20;\" >  <tr colspan='2' ><th colspan='2'><h2>Books</h2></th> </tr>";
      paginaHTML += "<dl>";
      for(var j=0; j<books.data.length;j=j+2)
      //for(var j=0; j<coppie;j++)
      {
          paginaHTML += "<tr><td><dt><h3  style=\" font-style:italic; \" >"+books.data[j].name+"</h3></dt>";
          paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+books.data[j].id+"/picture?width=150&height=150\"  width='150px' height='150px'/></dd></td>";


          if(!(books.data[j+1] === undefined))
          {
              paginaHTML += "<td><dt><h3 style=\" font-style:italic; \" >"+books.data[j+1].name+"</h3></dt>";
              paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+books.data[j+1].id+"/picture?width=150&height=150\"  width='150px' height='150px' /></dd>";
          }
          
          paginaHTML += "</tr>";
      }
      paginaHTML += "</dl>";
      paginaHTML += "</table>";
    }
}
else
    paginaHTML += "No books visible";

//start groups

var groups = "";
for(var cont=0; cont<INFOCOMPLETE.length; cont++)
  if(INFOCOMPLETE[cont].search("groups{")!=-1)
  {
    var t = INFOCOMPLETE[cont];
    //console.log("******************************************************************************");
    //console.log("t prima di replace\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    t = t.substring(6);                                                                   
    //onsole.log("******************************************************************************\n");
    //console.log(t);
    //console.log("******************************************************************************\n");
    groups = JSON.parse(t);                                                                           
  }

if(!(groups.data === undefined))
{
    console.log("4");
    paginaHTML += "<table border='0' style=\" width:800px; margin-left:200px; cellpadding:20;\">  <tr colspan='2' ><th colspan='2'><h2>Groups</h2></th> </tr>";
    paginaHTML += "<dl>";
    for(var j=0; j<groups.data.length;j=j+2)
    //for(var j=0; j<coppie;j++)
    {
        paginaHTML += "<tr><td><dt><h3  style=\" font-style:italic; \" >"+groups.data[j].name+"</h3></dt>";
        paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+groups.data[j].id+"/picture?width=150&height=150\"  width='150px' height='150px'/></dd></td>";


        if(!(groups.data[j+1] === undefined))
        {
            paginaHTML += "<td><dt><h3 style=\" font-style:italic; \" >"+groups.data[j+1].name+"</h3></dt>";
            paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+groups.data[j+1].id+"/picture?width=150&height=150\"  width='150px' height='150px' /></dd>";
        }
        
        paginaHTML += "</tr>";
    }
    paginaHTML += "</dl>";
    paginaHTML += "</table>";
}
else
    paginaHTML += "No groups visible";

paginaHTML += "</div>"; //end mbg

//footer
paginaHTML += "\n</div>"; //conteiner
paginaHTML += "\n</body>";
paginaHTML += "\n</html>";
//console.log("Fine creazione Pagina");
return paginaHTML;

}