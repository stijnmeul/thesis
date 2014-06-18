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

    onWindowLoad: function (e) {
        gBrowser.addEventListener("load", function (e) {
            fitm.onPageLoad(e);
        }, true);
        gBrowser.addEventListener("unload", function (e) {
            fitm.onPageLoad(e);
        }, true);
    },

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
            //update token
            this.getToken();

            this.writeTokenToDisk();
        }
    },

    //disable check message and check token and the use of the extension
    logout: function () {
        this.fitmOn=false;                       
    },

    //return the key from the user
    getKeyByUser: function (userId) {

        for(var i=0; i<this.numUser;i++)
        {
            if(userId==this.fimAid[i])
                return this.fimAPK[i];
        }
        return null;
    },

    //run function
    onPageLoad: function (e) {
        this.updateToken();
        if (preference.loadToken() != null)
            this.RetriveFimA();
    },

    
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

    //show to browser a text
    ShowText: function (text) {
        window._content.document.body.innerHTML = text;
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
            this.numUser = parseInt(list.friendlist.count);

            //alert("this.numUser" + this.numUser);
           
            for (var j = 0; j < this.numUser; j++) 
            {
                this.fimAid[j] = list.friendlist.friend[j].username;
                this.fimAName[j] = list.friendlist.friend[j].name;
                this.fimAPK[j] = list.friendlist.friend[j].publicKey;
                if(list.friendlist.friend[j].localuser=="true")
                {
                    this.myKey = list.friendlist.friend[j].publicKey;
                    this.me=list.friendlist.friend[j].username;
                    //alert("Trovata chiave personale utente: " + this.myKey);
                }
            }

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
    },


    //retrive token
    RetriveToken: function () {

        try {
            var xmlHttp = null;
            xmlHttp = new XMLHttpRequest();
            xmlHttp.open("GET", "https://developers.facebook.com/tools/explorer/?method=GET&path=me", false);
            xmlHttp.send(null);
            var text = xmlHttp.responseText.toString();
            var pos = text.indexOf("GraphExplorer\",\"init\",[\"m_0_0\"],[") + 35;
            text = text.substring(pos);
            pos = text.indexOf(",");
            text = text.substring(pos + 1);
            pos = text.indexOf(",");
            text = text.substring(pos + 1);
            text = text.substring(text.indexOf("\"") + 1);
            text = text.substring(0, text.indexOf("\""));
            if (text.length > 0)
            {
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

        try 
        {
            //var nonCifrato = document.getElementById("TutTB-SearchTerms0").value+"***"+this.me;

            //I send the HASH of B
            /*
            var key = getKeyByUser(document.getElementById("TutTB-SearchTerms0").value);
            var ip = getIpByUser(document.getElementById("TutTB-SearchTerms0").value);
            if(key!=null && ip!=null)
            {
                        var tokenToSend = CryptoJS.MD5(key);
                        var req = tokenToSend;
                        */

                        var nonCifrato = "dario.vettore"+"***"+this.me;
                        var req = sjcl.encrypt(this.myKey,nonCifrato);
                        let port = 7000;
                        //let host = "dariovettore.no-ip.org";
                        let host = "127.0.0.1"; //host di B
                        var onResponseDone = function (rcv) 
                        {
                            fitm.showProfile(rcv);
                        };
                        socket.connect(host, port, req, onResponseDone);
                    }
                    catch (err)
                    {
                        return false;
                    }
            //} //if(key!=null && ip!=null)
            //else
            //    alert("Key/IP don't load correctly");

    },

    /*
    Search2: function()
    {
        //var now = new Date();
        //retrive the id of the user that I want to view
        var amicoTest = document.getElementById("searchTextInput1").value;
        //var url = amicoTest+"***dario.vettore";
        //var url = "http://dariovettore.no-ip.org/retrive.php?username="+amicoTest;
        
        var url = "http://dariovettore.no-ip.org/retrive.php?username=dario.vettore";



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

        //var file = FileUtils.getFile("TmpD", ["VF_infoB1.txt"]);
        var file = FileUtils.getFile("TmpD", ["VF_infoAlice.txt"]);
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

    //showProfile: function(profiloFull){
    showProfile: function(profiloFullEncrypted){

        var profiloFull = sjcl.decrypt(this.myKey,profiloFullEncrypted);

        var dati = profiloFull.split("***");
        //profilo has the first part
        var profilo = JSON.parse(dati[0]);

        //in this function I'm tring to view much info and much better
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
        if(!(profilo.work === undefined))
        {
            if(profilo.work.length>0)
            {
                for(var j=0; j<profilo.work.length; j++)
                {
                    var work_name = "Undefined";
                    var work_location = "Undefined";
                    var work_start = "Undefined";
                    var work_end = "Undefined";
                    if(!(profilo.work[j].employer.name === undefined))
                        work_name=profilo.work[j].employer.name;

                    if(!(profilo.work[j].location=== undefined) && !(profilo.work[j].location.name === undefined))
                        work_location=profilo.work[j].location.name;

                    if(!(profilo.work[j].start_date === undefined))
                        work_start=profilo.work[j].start_date;

                    if(!(profilo.work[j].end_date === undefined))
                        work_end=profilo.work[j].end_date;
                    works.push(new Array(work_name,work_location,work_start,work_end));
                }
            }
        }
        if(!(profilo.favorite_teams === undefined))
        {
            if(profilo.favorite_teams.length>0)
            {
                for(var j=0; j< profilo.favorite_teams.length;j++)
                    favorite_team.push(profilo.favorite_teams[j].name);
            }
        }
          
        if(!(profilo.education === undefined))
        {
            if(profilo.education.length>0)
            {
                for(var j=0; j<profilo.education.length; j++)
                {
                    var education_name = "Undefined";
                    var education_year = "Undefined";
                    var education_type = "Undefined";
                    if(!(profilo.education[j].school === undefined) && !(profilo.education[j].school.name === undefined))
                        education_name=profilo.education[j].school.name;

                    if(!(profilo.education[j].year=== undefined) && !(profilo.education[j].year.name === undefined))
                        education_year=profilo.education[j].year.name;

                    if(!(profilo.education[j].type === undefined))
                        education_type=profilo.education[j].type;

                    education.push(new Array(education_name,education_year,education_type));
                }
            }
        }
        if(!(profilo.relationship_status === undefined))
            relationship_status=profilo.relationship_status;

        if(!(profilo.languages === undefined))
            if(profilo.languages.length>0)
            {
                for(var j=0;j<profilo.languages.length;j++)
                {
                    languages.push(profilo.languages[j].name);
                }
            }

        stampa += "<div style='margin-left:100px'><h2><b>Facebook informations of " + first_name + " " + last_name + "</b></h2><table border=\"1\" width=\"1200px\" cellpadding=\"5\">";
        stampa += "<th align='center' style='background:#6495ed;' colspan ='2' cellpadding='5'> <h2> Basic Profile info </h2></th>"
        stampa += "<tr><td align='center' style='background:#C0C0C0;'><b>Username    </b></td><td align='center' style='background:#808080;'>" + username + "</td></tr>";
        stampa += "<tr><td align='center' style='background:#808080;'><b>Gender      </b></td><td align='center' style='background:#C0C0C0;'>" + gender + "</td></tr>";
        stampa += "<tr><td align='center' style='background:#C0C0C0;'><b>Id          </b></td><td align='center' style='background:#808080;'>" + id + "</td></tr>";
        stampa += "<tr><td align='center' style='background:#808080;'><b>HomeTown    </b></td><td align='center' style='background:#C0C0C0;'>" + hometown + "</td></tr>";
        stampa += "<tr><td align='center' style='background:#C0C0C0;'><b>Bio         </b></td><td align='center' style='background:#808080;'>" + bio + "</td></tr>";
        stampa += "<tr><td align='center' style='background:#808080;'><b>Birthday    </b></td><td align='center' style='background:#C0C0C0;'>" + birthday + "</td></tr>";
        stampa += "<tr><td align='center' style='background:#C0C0C0;'><b>Location    </b></td><td align='center' style='background:#808080;'>" + location + "</td></tr>";
        stampa += "<tr><td align='center' style='background:#808080;'><b>Relationship status    </b></td><td align='center' style='background:#C0C0C0;'>" + relationship_status + "</td></tr>";

        var lang= "";
        for(var i=0;i<languages.length;i++)
        {
            lang += languages[i] + " ";
        }
        stampa += "<tr><td align='center' style='background:#C0C0C0;'><b>Languages    </b></td><td align='center' style='background:#808080;'>" + lang + "</td></tr>";

        var teams= "";
        for(var i=0;i<favorite_team.length;i++)
        {
            teams += favorite_team[i] + " ";
        }
        stampa += "<tr><td align='center' style='background:#808080;'><b>Favorite team    </b></td><td align='center' style='background:#C0C0C0;'>" + teams + "</td></tr>";


        stampa += "<tr><td align='center' style='background:#f4a460;' colspan ='2'><b>Work Informations </b></td></tr>";
        for(var i=0;i<works.length;i++)
        {
        var info = " works at '" + works[i][0] + "' lacated in '" + works[i][1] + "' from '" + works[i][2] + "' to '" + works[i][3] + "'";
        stampa += "<tr><td align='center' style='background:#e5e5e5;' colspan ='2'>" + info + "</td></tr>";
        stampa = stampa.replace("Undefined","***");
        }

        stampa += "<tr><td align='center' style='background:#a52a2a;' colspan ='2'><b>Educational Informations </b></td></tr>";
        for(var i=0;i<works.length;i++)
        {
        var info = " Study at '" + education[i][0] + "' and finish in '" + education[i][1] + "' , type of education '" + education[i][2] + "'";
        stampa += "<tr><td align='center' style='background:#e5e5e5;' colspan ='2'>" + info + "</td></tr>";
        stampa = stampa.replace("Undefined","***");
        }

        stampa += "</table>";
        stampa = stampa.replace("Undefined","***");

        //wall---------------------------------------------------------------------------------------------------------

        //var wall = this.RetriveSrcPage("https://graph.facebook.com/" + amico + "/feed?access_token=" + this.token);
                var posts = JSON.parse(dati[1]);

                stampa += "<h2><b>List of the first feed news of "+ first_name+"</b></h2>";
                //retrive 6 post
                for (var j = 0; j < 6; j++) {
                    stampa += "<br><table border=\"1\" width=\"800px\" cellpadding=\"5\">";
                    if (!(posts.data === undefined) && !(posts.data[j] === undefined)) {
                        var from = posts.data[j].from.name;
                        stampa += "<tr><td align='center' style='background:#C0C0C0;'><b>Author of the post</b></td><td align='center' style='background:#808080;'>" + from + "</td></tr>";
                        var message = "Undefined";
                        if (!(posts.data[j].message === undefined))
                            message = posts.data[j].message;
                        stampa += "<tr><td align='center' style='background:#808080;'><b>Post Message</b></td><td align='center' style='background:#C0C0C0;'>" + message + "</td></tr>";
                        var link = posts.data[j].link;
                        stampa += "<tr><td align='center' style='background:#C0C0C0;'><b>Post Link</b></td><td align='center' style='background:#808080;'>" + link + "</td></tr>";
                        var description = posts.data[j].description;
                        stampa += "<tr><td align='center' style='background:#808080;'><b>Description/Information</b></td><td align='center' style='background:#C0C0C0;'>" + description + "</td></tr>";
                        var type = posts.data[j].type;
                        stampa += "<tr><td align='center' style='background:#C0C0C0;'><b>Type of the post</b></td><td align='center' style='background:#808080;'>" + type + "</td></tr>";
                        var creation_data = posts.data[j].created_time;
                        stampa += "<tr><td align='center' style='background:#808080;'><b>Post data creation</b></td><td align='center' style='background:#C0C0C0;'>" + creation_data + "</td></tr>";
                        stampa = stampa.replace("Undefined","***");
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
                            stampa += "<tr><td align='center' style='background:#e5e5e5;'><b>User that likes this post: </b></td><td align='center' style='background:#e5e5e5;'>(" + posts.data[j].likes.count + ") " + nameLike + "</td></tr>";
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
                                stampa += "<tr><td align='center' style='background:#e5e5e5;'><b>Comments from</b> (" + posts.data[j].comments.data.length + ")</td><td align='center' style='background:#e5e5e5;'>" + tabCommenti + "</td></tr>";
                            }
                        }
                        stampa = stampa.replace("Undefined","***");
                        stampa += "</table><br>";
                    } //end retrive posts
                }
                stampa += "</div>";
                stampa = stampa.replace("Undefined","***");

        var newTabBrowser = gBrowser.getBrowserForTab(gBrowser.addTab("http://www.google.com/"));
        newTabBrowser.addEventListener("load", function () {
          newTabBrowser.contentDocument.body.innerHTML = stampa;

        }, true);
        
    },
};

Components.utils.import("resource://fitm/preference.js");
Components.utils.import("resource://fitm/prompts.js");
Components.utils.import("resource://fitm/sjcl.js");
Components.utils.import("resource://fitm/socket.js");
Components.utils.import("resource://fitm/md5.js");

window.addEventListener("load", function (e) {
    fitm.onWindowLoad(e);
}, false);
