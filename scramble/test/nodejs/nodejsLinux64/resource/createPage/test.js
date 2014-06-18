//console.log("Inizio creazione HTML profilo");

var fs = require('fs');
var profileText = fs.readFileSync('allInfo.txt','utf8');

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

var INFOCOMPLETE = profileText.split("***");
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
var profilo = JSON.parse(INFOCOMPLETE[1]);
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
if (!(profilo.work === undefined)) {
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
if (!(profilo.favorite_teams === undefined)) {
    if (profilo.favorite_teams.length > 0) {
        for (var j = 0; j < profilo.favorite_teams.length; j++)
            favorite_team.push(profilo.favorite_teams[j].name);
    }
}

if (!(profilo.education === undefined)) {
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
    if (profilo.languages.length > 0) {
        for (var j = 0; j < profilo.languages.length; j++) {
            languages.push(profilo.languages[j].name);
        }
    }


//TIMELINE************************************************************************************************
//var wall = this.RetriveSrcPage("https://graph.facebook.com/" + amico + "/feed?access_token=" + this.token);
var posts = JSON.parse(INFOCOMPLETE[2]);

var timeline = "<div style=\" align:center; \"> <h2><b>TIMELINE of " + first_name + "</b></h2>";
//retrive 6 post
for (var j = 0; j < 6; j++) {
    timeline += "<br><table border=\"1\" width=\"800px\" cellpadding=\"5\" align=center; >";
    if (!(posts.data === undefined) && !(posts.data[j] === undefined)) {
        var from = posts.data[j].from.name;
        timeline += "<tr><td align='center' style='background:#C0C0C0;'><b>Author of the post</b></td><td align='center' style='background:#808080;'>" + from + "</td></tr>";
        var message = "Undefined";
        if (!(posts.data[j].message === undefined))
            message = posts.data[j].message;
        timeline += "<tr><td align='center' style='background:#808080;'><b>Post Message</b></td><td align='center' style='background:#C0C0C0;'>" + message + "</td></tr>";
        var link = posts.data[j].link;
        timeline += "<tr><td align='center' style='background:#C0C0C0;'><b>Post Link</b></td><td align='center' style='background:#808080;'>" + link + "</td></tr>";
        var description = posts.data[j].description;
        timeline += "<tr><td align='center' style='background:#808080;'><b>Description/Information</b></td><td align='center' style='background:#C0C0C0;'>" + description + "</td></tr>";
        var type = posts.data[j].type;
        timeline += "<tr><td align='center' style='background:#C0C0C0;'><b>Type of the post</b></td><td align='center' style='background:#808080;'>" + type + "</td></tr>";
        var creation_data = posts.data[j].created_time;
        timeline += "<tr><td align='center' style='background:#808080;'><b>Post data creation</b></td><td align='center' style='background:#C0C0C0;'>" + creation_data + "</td></tr>";
        timeline = timeline.replace("Undefined", "***");
        //comments + likes
        likes = new Array();
        var nameLike = "";
        if (!(posts.data[j].likes === undefined)) {
            if (parseInt(posts.data[j].likes.count) > 0)
                for (var l = 0; l < posts.data[j].likes.count; l++) {
                    //likes[l]= posts.data[j].likes.data[l].name;
                    if (!(posts.data[j].likes.data[l] === undefined))
                        nameLike += posts.data[j].likes.data[l].name + " ";
                }
            timeline += "<tr><td align='center' style='background:#e5e5e5;'><b>User that likes this post: </b></td><td align='center' style='background:#e5e5e5;'>(" + posts.data[j].likes.count + ") " + nameLike + "</td></tr>";
        }
        comments = new Array();
        var tabCommenti = "";
        if (!(posts.data[j].comments === undefined)) {
            if (parseInt(posts.data[j].comments.data.length) > 0) {
                tabCommenti += "<br><table border=\"1\" width=\"600px\" cellpadding=\"5\"><th colspan='3'>Post Comments</th><tr><td align='center' style='background:#e5e5e5;'><b>Comment from</b></td><td align='center' style='background:#e5e5e5;'><b>Message</b></td><td align='center' style='background:#e5e5e5;'><b>Likes count</b></td></tr>";
                for (var i = 0; i < posts.data[j].comments.data.length; i++) {
                    comments[i] = new Array(posts.data[j].comments.data[i].from.name, posts.data[j].comments.data[i].message, posts.data[j].comments.data[i].like_count);
                    tabCommenti += "<tr><td align='center' style='background:#e5e5e5;'>" + posts.data[j].comments.data[i].from.name + "</td><td align='center' style='background:#e5e5e5;'>" + posts.data[j].comments.data[i].message + "</td><td align='center' style='background:#e5e5e5;'>" + posts.data[j].comments.data[i].like_count + "</td></tr>";
                }
                tabCommenti += "</table><br><br>";
                timeline += "<tr><td align='center' style='background:#e5e5e5;'><b>Comments from</b> (" + posts.data[j].comments.data.length + ")</td><td align='center' style='background:#e5e5e5;'>" + tabCommenti + "</td></tr>";
            }
        }
        timeline = timeline.replace("Undefined", "***");
        timeline += "</table>";
    } //end retrive posts
}
timeline += "</div>";
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

var amici = JSON.parse(INFOCOMPLETE[6]);
if(!(amici.data === undefined))
{
	paginaHTML += "<table border='0' style=\" width:800px; margin-left:200px; cellpadding:20;\" >";
	paginaHTML += "<dl>";
	for(var j=0; j<amici.data.length;j=j+2)
	//for(var j=0; j<coppie;j++)
	{
		paginaHTML += "<tr><td><dt><h3  style=\" font-style:italic; \" >"+amici.data[j].name+"</h3></dt>";
		paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+amici.data[j].id+"/picture?width=250&height=250\"  width='250px' height='250px'/></dd></td>";


		if(!(amici.data[j+1] === undefined))
		{
			paginaHTML += "<td><dt><h3 style=\" font-style:italic; \" >"+amici.data[j+1].name+"</h3></dt>";
			paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+amici.data[j+1].id+"/picture?width=250&height=250\"  width='250px' height='250px' /></dd>";
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


//start likes
paginaHTML += "\n\n\n\n<div id=\"like\" style=\"display:none;\">";
var likes = JSON.parse(INFOCOMPLETE[3]);
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
var photo = JSON.parse(INFOCOMPLETE[4]);

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
var music = JSON.parse(INFOCOMPLETE[5]);
if(!(music.data === undefined))
{
	paginaHTML += "<table border='0' style=\" width:800px; margin-left:200px; cellpadding:20;\"> <tr colspan='2' ><th colspan='2'><h2>Music</h2></th> </tr>";
	paginaHTML += "<dl>";
	for(var j=0; j<music.data.length;j=j+2)
	//for(var j=0; j<coppie;j++)
	{
		paginaHTML += "<tr><td><dt><h3  style=\" font-style:italic; \" >"+music.data[j].name+"</h3></dt>";
		paginaHTML += "<dd><img src=\"http://graph.facebook.com/"+music.data[j].id+"/picture?width=150&height=150\"  width='150px' height='150px'/></dd></td>";


		if(!(likes.data[j+1] === undefined))
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


//start books
paginaHTML += "\n\n";
var books = JSON.parse(INFOCOMPLETE[7]);
if(!(books.data === undefined))
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
else
	paginaHTML += "No books visible";

//start groups
paginaHTML += "\n\n\n\n";
var groups = JSON.parse(INFOCOMPLETE[8]);
if(!(groups.data === undefined))
{
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
console.log(paginaHTML);