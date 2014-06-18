var fitm = {
    
    token: "",
    fitmOn: false,
    numUser: 0,
    myKey: "",
    me: "",
    //array degli id degli amici attivi
    fimAid: new Array(""),
    fimAName: new Array(""),
    fimAPK: new Array(""),
    //request
    requestFB: new Array(),
    snippet_author: new Array(),
    nrequestFB: 0,

    /*
    onWindowLoad: function (e) {
        gBrowser.addEventListener("load", function (e) {
            fitm.onPageLoad(e);
        }, true);
        gBrowser.addEventListener("unload", function (e) {
            fitm.onPageLoad(e);
        }, true);
    },
    */

    //login function set environment
    login: function () {
        this.fitmOn=true;
        this.ShowURL("https://www.facebook.com/");
        //alert("If you want to use all the extension function you have to login to facebook");
        this.token = this.RetriveToken();
        if(this.token != null)
        {
            //save token
            preference.saveToken(this.token);
            //retrive facebook friends from preference and load it to the menu
            this.RetriveFimA();
            //search if there are new message
            this.retriveMessages();
            this.cerca();
            this.writeTokenToDisk();
        }
    },

    //disable check message and check token and the use of the extension
    logout: function () {
        this.fitmOn=false; 
        this.removeAll();                      
    },

    removeAll: function()
    {
        //delete file token
        Components.utils.import("resource://gre/modules/FileUtils.jsm");
        //var file = FileUtils.getFile("TmpD", ["VF_infoB1.txt"]);
        var file = FileUtils.getFile("TmpD", ["VF_info"+this.me+".txt"]);
        if (file.exists())
            file.remove(false);
    },

    //return the key from the user
    getKeyByUser: function (userId) 
    {
        for(var i=0; i<this.numUser;i++)
        {
            //alert("userId: " + userId + " this.fimAid[i]: "+ this.fimAid[i]);
            if(userId==this.fimAid[i])
            {
                //alert("ritorno: " + this.fimAPK[i]);
                return this.fimAPK[i];
            }
        }
        return null;
    },

    /*
    //run function
    onPageLoad: function (e) {
        this.updateToken();
        if (preference.loadToken() != null)
            this.RetriveFimA();
    },
    */
    
    //every 30 seconds check if there is a fitm messages
    cerca: function()
    {
        setTimeout(function()
        {
                fitm.retriveMessages();
                fitm.cerca();
        }, 30000);
    },

    //every 10 minutes check the token
    getToken: function()
    {
        setTimeout(function()
        {
                fitm.updateToken();
                fitm.getToken();
        }, 600000);
    },
    
    //ecrypt by pass and info
    returnEncryptProfile: function (data) {
        //I'm here and I request the profile of 'data'
        return sjcl.encrypt(this.getKeyByUser(data), this.retriveProfile(data)); 
    },

    //show the options view
    showOptions: function() 
    {  
        window.openDialog("chrome://fitm/content/view.xul", "", "chrome,titlebar,toolbar,centerscreen,modal");
    },
  
    //show to browser an url
    ShowURL: function (url) {
        window._content.document.location = url;
        window.content.focus();
    },

    //retrive html/js source page, like ctrl+u
    RetriveSrcPage: function (addres) {
        try {
            var xmlHttp = null;
            xmlHttp = new XMLHttpRequest();
            xmlHttp.open("GET", addres, false);
            xmlHttp.send(null);
            var text = xmlHttp.responseText;
            return text;
        } catch (err) {
            return false;
        }
    },

    //populated the toolbaritem
    RetriveFimA: function () {

        //load preference
        var list = JSON.parse(preference.loadUsers());
        //alert("dopo load");
        if(list!=null)
        {
            this.numUser = parseInt(list.friendlist.friend.length);

            //alert("this.numUser" + this.numUser);
           
            for (var j = 0; j < this.numUser; j++) 
            {
                this.fimAid[j] = list.friendlist.friend[j].username;
                this.fimAName[j] = list.friendlist.friend[j].name;
                this.fimAPK[j] = list.friendlist.friend[j].publicKey;
                //if(list.friendlist.friend[j].localuser=="true")
                //{
                //    this.myKey = list.friendlist.friend[j].publicKey;
                //    this.me=list.friendlist.friend[j].username;
                //    //alert("Trovata chiave personale utente: " + this.myKey);
                //}
            }

            //retrive localuserinfo
            var currentUser = JSON.parse(preference.loadInfoLocalUser());
            this.myKey = currentUser.localuser.publicKey;
            this.me=currentUser.localuser.username;

            // Get the menupopup element that we will be working with
            var menu = document.getElementById("TutTB-SearchTermsMenu0");

            // Remove all of the items currently in the popup menu
            for (var i = menu.childNodes.length - 1; i >= 0; i--) {
                menu.removeChild(menu.childNodes.item(i));
            }

            // Specify how many items we should add to the menu
            var numItemsToAdd = this.numUser;

            for (var i = 0; i < numItemsToAdd; i++) {
                // Create a new menu item to be added
                var tempItem = document.createElement("menuitem");

                // Set the new menu item's label
                tempItem.setAttribute("label", this.fimAid[i]);

                // Add the item to our menu
                menu.appendChild(tempItem);
            }
        }
        else
        {
            alert("List empty");
            // Get the menupopup element that we will be working with
            var menu = document.getElementById("TutTB-SearchTermsMenu0");

            // Remove all of the items currently in the popup menu
            for (var i = menu.childNodes.length - 1; i >= 0; i--) {
                menu.removeChild(menu.childNodes.item(i));
            }

        }
    },


    //retrive token
    RetriveToken: function () {

        try {
            var xmlHttp = null;
            xmlHttp = new XMLHttpRequest();
            xmlHttp.open("GET", "https://developers.facebook.com/tools/explorer/?method=GET&path=me", false);
            xmlHttp.send(null);
            var text = xmlHttp.responseText.toString();
            //var pos = text.indexOf("GraphExplorer\",\"init\",[\"m_0_1\"],[") + 35;
            var pos = text.indexOf("GraphExplorer\",\"init\",[\"m_0_1\",\"m_0_0\"],")+41;
            text = text.substring(pos);
            //alert("1 " + text);
            pos = text.indexOf(",");
            text = text.substring(pos + 1);
            //alert("2 " + text);
            text = text.substring(text.indexOf("\"") + 1);
            //alert("3***" + text +"***");
            text = text.substring(0, text.indexOf("\""));
            //alert("4***" + text + "***");
            if (text.length > 0)
            {
                //alert(text);
                return text; //return the token
            }
            else
                return null;
        } catch (err) {
            alert("token non recuperato");
            return null;
        }
    },

    //step 1a) the request from A
    Search: function (event, tipo) {
        //check token NO, because A could not be a facebook user
        //if (preference.loadToken() == null) {
        if(preference.loadUsers() == null) {
            alert("Please setup FITM A1..n friends");
        } else {
            var amicoB = document.getElementById("searchTextInput").value;
            var amicoA1 = document.getElementById("TutTB-SearchTerms0").value;
            alert("Ho chiesto a " + amicoA1 + " di recuperare le informazioni di " + amicoB + "!");
            this.sendMailRequestProfile(amicoA1,amicoB);
        }
    },

    //step 1b) send the message with a mail client
    sendMailRequestProfile: function(amicoA,amicoB)
    {
        var link = "mailto:"+amicoA+"@facebook.com?" 
             //+ "?cc=dario.vettore@facebook.com"
             + "&subject=" + escape("FITM extension: Request the profile information of " + amicoB)
             + "&body=" + escape("Hi "+amicoA+", \n can you retrive for me the profile's information of **" + amicoB + "**. \n FITM extension");

        window.location.href = link;
    },

    //retrive message for A1..n friends
    retriveMessages: function()
    {
        if(this.fitmOn == true)
        {
            var query = "SELECT subject,snippet,snippet_author FROM thread WHERE folder_id=0 AND unread!=0";
            var link = "https://api.facebook.com/method/fql.query?query="+query+"&format=json&access_token=" + this.token;
            //alert(link);
            var testo = this.RetriveSrcPage(link);

            //array
            subject = new Array();
            snippet = new Array();
            //renew
            this.snippet_author = new Array();
            
            var i = 0;

            while(true)
            {
                var pos = testo.indexOf('"subject":"') + 11;
                testo = testo.substring(pos); //sono all'oggetto                
                pos = testo.indexOf("\","); //cerco
                subject[i] = testo.substring(0,pos);
                //messaggio
                pos = testo.indexOf('"snippet":"') + 11;
                testo = testo.substring(pos); //sono all'oggetto
                pos = testo.indexOf("\","); //cerco
                snippet[i]=testo.substring(0,pos);
                //username
                pos = testo.indexOf('"snippet_author":') + 17;
                testo = testo.substring(pos); //sono all'oggetto
                pos = testo.indexOf("}"); //cerco
                this.snippet_author[i]=testo.substring(0,pos);
                i++;
                //break while
                if(testo.search('"subject":"') == -1)
                    break;
            }
            this.requestFB = new Array();
            this.nrequestFB = 0;

            for(var j=0; j<i;j++)
            {
                if(snippet[j].search("FITM extension") != -1)
                {
                    this.requestFB[this.nrequestFB] = "";
                    var search = snippet[j];
                    var pos = search.indexOf('**') + 2;
                    search = search.substring(pos);
                    pos = search.indexOf("**"); //cerco
                    this.requestFB[this.nrequestFB] = search.substring(0,pos);
                    this.nrequestFB++;
                }
            }

            if(this.nrequestFB>0)
            {
                document.getElementById("request").label = "Requests: (" + this.nrequestFB + ")";
                    try
                    {
                        Components.classes['@mozilla.org/alerts-service;1'].
                                  getService(Components.interfaces.nsIAlertsService).
                                  showAlertNotification(null, "Fitm extension", "Hi, you have a FITM request", false, '', null);
                    }
                    catch(e)
                    {
                        alert("Error");
                    }
            }
            else
            {
                document.getElementById("request").label = "Requests: (0)";
            }
        }
    },

    //A1
    viewRequest: function()
    {
        this.retriveMessages();
        //this.requestFB,this.snippet_author,this.nrequestFB
        for(var j=0; j<this.nrequestFB;j++)
        {

            //recupero l'id 
            var query = "SELECT username FROM user WHERE uid = " + this.snippet_author[j];
            var link = "https://api.facebook.com/method/fql.query?query="+query+"&format=json&access_token=" + this.token;
            var testo = this.RetriveSrcPage(link);

            var pos = testo.indexOf('[{"username":"') + 14;
            testo = testo.substring(pos);
            pos = testo.indexOf('"}]');
            var idString=testo.substring(0,pos);
            //create panel
            var params = {inn:{usernameRequest:this.requestFB[j], author:idString}, out:null};
            window.openDialog("chrome://fitm/content/confermRequest.xul", "","chrome, dialog, modal, resizable=yes", params).focus();
            if (params.out.conferm == true)
            {
                //retrive info of the profile, I'm a A1..n fim, now I cdo the request on the tor network
                this.callSocket(this.requestFB[j]); 
                //se non voglio usare socket ma solo messaggi, qua recupero il profilo ed inoltro come mail...
            }
            else
            {
                // User clicked cancel. Typically, nothing is done here.
                var cc = 0;
            }
        }
    },
    
    //comunicate with the other friends
    callSocket: function (req) {


            //var nonCifrato = document.getElementById("TutTB-SearchTerms0").value+"***"+this.me;

            //I send the HASH of B
            var key = this.getKeyByUser(document.getElementById("searchTextInput1").value);
            //var ip = this.getIpByUser(document.getElementById("TutTB-SearchTerms0").value);
            //if(key!=null && ip!=null)
            if(key!=null)
            {
                    try 
                    {
                        var tokenToSend = CryptoJS.MD5(key);
                        var req = tokenToSend;
                        let port = 7000;
                        //let host = "XXXXX.no-ip.org";
                        let host = "127.0.0.1"; //host di B
                        var onResponseDone = function (rcv) 
                        {
                            var json = sjcl.decrypt(key,rcv);
                            fitm.showProfile(json);
                            
                            /*
                            Components.utils.import("resource://gre/modules/FileUtils.jsm");
                            var file = FileUtils.getFile("TmpD", ["profiloRicevuto.json"]);
                            file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, FileUtils.PERMS_FILE);

                            var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                                           createInstance(Components.interfaces.nsIFileOutputStream);

                            foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
                            var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                                            createInstance(Components.interfaces.nsIConverterOutputStream);
                            converter.init(foStream, "UTF-8", 0, 0);
                            //converter.writeString(htmlpage);
                            converter.writeString(json);
                            converter.close();
                            */

                        };
                        socket.connect(host, port, req, onResponseDone);
                    }
                    catch (err)
                    {
                        return false;
                    }
            } //if(key!=null && ip!=null)
            else
                alert("Key/IP don't load correctly");

    },

    showPage: function(htmlPage)
    {   
        //show new tab
    },

    /*
    Search2: function()
    {
        //var now = new Date();
        //retrive the id of the user that I want to view
        var amicoTest = document.getElementById("searchTextInput1").value;
        //var url = "http://XXXXXX.no-ip.org/retrive.php?username="+amicoTest;
        var http = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        http.open("GET", url, false); //true for asynchronous
        dump("URL: "+url+"\n");
        http.send(null);

        if(http.readyState == 4 && http.status == 200)
        {
            //alert(http.responseText);
            var profilo = JSON.parse(http.responseText.toString());
            fitm.showProfile(profilo);
        } 
        else if (http.status == 404 || http.status == 500) {
            return null; //exception
        }
    },
    */

    writeTokenToDisk: function()
    {
        Components.utils.import("resource://gre/modules/FileUtils.jsm");
        var file = FileUtils.getFile("TmpD", ["VF_info"+this.me+".txt"]);
        if (file.exists())
            file.remove(false);
        file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, FileUtils.PERMS_FILE);
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                       createInstance(Components.interfaces.nsIFileOutputStream);
        foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
        var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                        createInstance(Components.interfaces.nsIConverterOutputStream);
        converter.init(foStream, "UTF-8", 0, 0);
        converter.writeString(this.token);
        converter.close();
    },

    //update token and save it to preference
    updateToken: function () {
        if (preference.loadToken() != null && this.fitmOn == true) 
        {
            var token = fitm.RetriveToken();
            preference.saveToken(token);
            this.token = token;
            this.writeTokenToDisk();       
        }
    },

    showProfile: function(json)
    {

        var paginaHTML = "";

        /*
        paginaHTML += "<html>\n\t";
        paginaHTML += "<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t\t<title>Facebook Profile of</title>\n\t";
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
        paginaHTML += "</script></head>\n";
        */
        paginaHTML += "<body style=\"min-width:1400px;  width: 1400px ;     margin: auto;    background-color: #e7ebf2;\">";

        var INFOCOMPLETE = json.split("***");
        var picture=(INFOCOMPLETE[0].replace("{","")).toString();
        var picture=picture.replace("}","");
        picture=picture.replace("\n","");

        
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
        paginaHTML += "\n\n<div id=\"container\" style=\"border:1px solid black; padding:2px; width:55%; align:center; background-color: #fffff0; font-style:italic;  margin: auto;;\">\n\n";
        paginaHTML += "\n\n\n<div id=\"header\"  style=\"  background-color:#1e90ff; font-size:15px; text-align:center; \"> <h2> Profile info of "+name+" </h2>";
        paginaHTML += "</div>"; //chiudo header
        //picture
        paginaHTML += "\n\n\n<div id=\"div_picture\" style=\" height: 230px; background: url('https://"+INFOCOMPLETE[0]+"') no-repeat center; float:left;  width:20%; \"></div>";

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
        t = t.substring(4);                                                                   
        posts = JSON.parse(t);
      }

      var timeline = "";
      timeline += "<H2>Status update</H2>";
      for (var j = 0; j < posts.data.length; j++) 
      {
          if(true)
          {
              timeline += "<div id=\'post"+(j+1)+"\' style=\"margin-left:100px; border:1px solid black; padding:10px; width:600px; background-color: #fffff0; font-style:italic;  margin: auto; margin-bottom:5px; \">";
              timeline +=    "<div id='post"+(j+1)+"_header'>";
              timeline +=    "<table border=\'0\'>"
              timeline +=    "<tr>";
              timeline +=    "<td valign=\'top\'>";
              timeline += "<img src='https://graph.facebook.com/"+username+"/picture' /> </td>";
              timeline += "<td > <dl style=\"margin-left:30px;\">";
              timeline += "<dt style=\"color:#0000FF\">" + posts.data[j].from.name + "</dt> <dd>  </dd>  </dl>   </td>  </tr>  </table>  </div>";

              timeline += "<div id=\'post"+(j+1)+"message\' style=\"border:0px solid black; width:600px; align:center; background-color: #fffff0; font-style:italic;  margin: auto;\"> <h3>";
              var message = "";
                  if (!(posts.data[j].message === undefined))
                      message = posts.data[j].message;
              timeline += message;
              timeline += "</h3>  </div> ";

              //add likes if exist
              if (!(posts.data[j].likes === undefined)) 
              {
                  timeline += "<div id=\'post"+(j+1)+"likes\' style=\"border:0px solid black; width:600px; align:center;  margin: auto;\"><h5> ";
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
                      timeline += "<div id='post1_comment1' style=\"border:0px solid black; padding:5px; width:500px; align:center; background-color: #fffff0; font-style:italic;  margin: auto;\">";  
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
    /*
    paginaHTML += "\n\n\n\n<div id=\"navigation\" style=\" height: 30px; margin-top:330px; background-color:#10d02f; text-align:center; \" >";
    paginaHTML += "\n\n\n\n\n<input type=\"radio\" id=\"radio_info\" name=\"radio_info\" value=\"post\" checked=\"checked\" onclick='javascript:showInfo()'/> <label id=\"postLabel\"> Post </label>";
    paginaHTML += "<input type=\"radio\" id=\"radio_info\" name=\"radio_info\" value=\"friend\" onclick='javascript:showInfo()'/> <label id=\"friendLabel\"> Friend list </label>";
    paginaHTML += "<input type=\"radio\" id=\"radio_info\" name=\"radio_info\" value=\"like\" onclick='javascript:showInfo()'/> <label id=\"likeLabel\"> Likes </label>";
    paginaHTML += "<input type=\"radio\" id=\"radio_info\" name=\"radio_info\" value=\"foto\" onclick='javascript:showInfo()'/> <label id=\"fotoLabel\"> Photo </label>";
    paginaHTML += "<input type=\"radio\" id=\"radio_info\" name=\"radio_info\" value=\"mbg\" onclick='javascript:showInfo()'/> <label id=\"mbgLabel\"> Music-Books-Groups </label></div>";
    */
    //profile timeline
    paginaHTML += "\n\n\n\n<div id=\"post\" style=\" text-align:center; margin-left:100px; margin-top:350px; font-size:12px; \">";
    paginaHTML += timeline;
    paginaHTML += "</div>";

    //friendlist
    paginaHTML += "\n\n\n\n<div id=\"friend\" style=\"display:block; margin-left:100px; \">"

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
    //paginaHTML += "\n\n\n\n<div id=\"like\" style=\"display:none;\">";
    paginaHTML += "\n\n\n\n<div id=\"like\" style=\"display:block; margin-left:100px;\">";

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

    paginaHTML += "</div>"; //end likes


    //FOTO
    paginaHTML += "\n\n\n\n<div id=\"foto\" style=\"display:block; margin-left:100px;\">";

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
        paginaHTML += "<table border='0' style=\" width:800px; cellpadding:20;\"> <tr colspan='4' ><th colspan='4'><h2>Photo</h2></th> </tr>";
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


    paginaHTML += "</div>"; //end foto
    //end foto


    //Music-Books-Groups
    paginaHTML += "\n\n\n\n<div id=\"mbg\" style=\"display:block; margin-left:100px;\">";
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
        paginaHTML += "<table border='0' style=\" width:800px; cellpadding:20;\"> <tr colspan='2' ><th colspan='2'><h2>Music</h2></th> </tr>";
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
          paginaHTML += "<table border='0' style=\" width:800px; cellpadding:20;\" >  <tr colspan='2' ><th colspan='2'><h2>Books</h2></th> </tr>";
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
        paginaHTML += "<table border='0' style=\" width:800px; cellpadding:20;\">  <tr colspan='2' ><th colspan='2'><h2>Groups</h2></th> </tr>";
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

    paginaHTML += "</div>"; //end mbg

    //footer
    paginaHTML += "\n</div>"; //conteiner
    paginaHTML += "\n</body>";
    //paginaHTML += "\n</html>";
    paginaHTML = paginaHTML.replace("Undefined","--");
    paginaHTML = paginaHTML.replace("undefined","--");

    var newTabBrowser = gBrowser.getBrowserForTab(gBrowser.addTab());
        newTabBrowser.addEventListener("load", function () {
            newTabBrowser.contentDocument.body.innerHTML = paginaHTML;

        }, true);

    },
};

Components.utils.import("resource://fitm/preference.js");
Components.utils.import("resource://fitm/prompts.js");
Components.utils.import("resource://fitm/sjcl.js");
Components.utils.import("resource://fitm/socket.js");
Components.utils.import("resource://fitm/md5.js");

/*
window.addEventListener("load", function (e) {
    fitm.onWindowLoad(e);
}, false);
*/