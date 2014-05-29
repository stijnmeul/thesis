/*
   Boneh and Franklin IBE

   Compile with modules as specified below

   For MR_PAIRING_CP curve
   cl /O2 /GX ibe.cpp cp_pair.cpp zzn2.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_MNT curve
   cl /O2 /GX ibe.cpp mnt_pair.cpp zzn6a.cpp ecn3.cpp zzn3.cpp zzn2.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_BN curve
   cl /O2 /GX ibe.cpp bn_pair.cpp zzn12a.cpp ecn2.cpp zzn4.cpp zzn2.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_KSS curve
   cl /O2 /GX ibe.cpp kss_pair.cpp zzn18.cpp zzn6.cpp ecn3.cpp zzn3.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_BLS curve
   cl /O2 /GX ibe.cpp bls_pair.cpp zzn24.cpp zzn8.cpp zzn4.cpp zzn2.cpp ecn4.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   See https://eprint.iacr.org/2001/090 for more information
   Section 4.1 and 4.2

   g++-4.7 setup_dkg_server.cpp shamir.cpp DKGMessage.cpp ../miraclthread/source/bls_pair.cpp ../miraclthread/source/zzn24.cpp ../miraclthread/source/zzn8.cpp ../miraclthread/source/zzn4.cpp ../miraclthread/source/zzn2.cpp ../miraclthread/source/ecn4.cpp ../miraclthread/source/big.cpp ../miraclthread/source/zzn.cpp ../miraclthread/source/ecn.cpp ../miraclthread/source/miracl.a -I ../miraclthread/include/ -o setup_dkg_server
*/

//********* choose just one of these pairs **********
#define MR_PAIRING_BLS    // AES-256 security
#define AES_SECURITY 256
//*********************************************

#include "../cppmiracl/source/pairing_3.h"
#include "ibe_pkg.h"
#include "DKGMessage.h"
#include "shamir.h"
#include <termios.h>
#include <unistd.h>
#include <iostream>
#include <fstream>
#include <cstdlib>
#include <sys/stat.h>
#include <stdio.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <stdlib.h>


#define HASH_LEN 32
#define TAG_LEN 16
#define BYTES_PER_BIG 80
#define BUF_SIZE 4096
#define DKG_DIR "/Applications/XAMPP/htdocs/thesis/" // In this folder a subfolder dkgxx will be created with xx = id specified at startup
#define CLIENT_PORT_OFFSET 100

#define THRESHOLD 3

void storeMSK(Big s, int servId, string mskPath);
bool retrieveMSK(char * plain, int servId, string mskPath);
void listenForClients(int portNb, DKG *dkg);
void *connection_handler(void *arg);
int sendTo(int portNb, const char * message);
void listenTo(int portNb, DKG *dkg);
void writeIndexPhp(int portNb, const char * dkgDir);

struct Server{
	int portNb;
	string address;
	int id;
};

struct ThreadParams{
	int sockfd;
	DKG *dkg;
};

int main(int argc, char * argv[])
{
	mr_init_threading();
	PFC pfc(AES_SECURITY);
	ifstream file;
	ofstream outputFile;
	Big s;
	Big order = pfc.order();
	miracl* mip = get_mip();
	mip->IOBASE = 64;
	int servId;
	const char * serverlistFile;
	cout << endl;

	if(argc != 3) {
		cout << "Please provide:" << endl << "* a unique ID for this DKG server between 1 and the total number of servers," << endl <<"* a path to a file listing all servers. " << endl << "Command usage should be:" << endl;
		cout << "./setup_dkg_server.cpp id servers.list" << endl << endl;
		return 0;
	} else  {
		servId = atoi(argv[1]);
		serverlistFile = argv[2];
	}
	string dkgDir = (string)DKG_DIR + "dkg" + argv[1] + "/";
	mkdir(dkgDir.c_str(), S_IRWXU | S_IRWXG | S_IRWXO); // S_IRUSR|S_IRGRP|S_IROTH
	string mskFile = dkgDir + (string)"encrypted_msk.key";

	// Check if serverlistFile is correct and whether serverID is between 1 and the total nb of servers
	file.open(serverlistFile);
	int nbOfServers = 0;
	if(file.is_open()) {
		string unused;
		while ( getline(file, unused) ) {
   			nbOfServers++;
		}
		file.close();
		if( !(nbOfServers >= servId && 0 < servId) ) {
			cout << "Invalid ID specified for this server. Please provide an ID between 1 and the total number of servers in servers.list" << endl;
			cout << "Terminating setup." << endl << endl;
			return 0;
		}
		if( nbOfServers < THRESHOLD) {
			cout << "servers.list contains only " << nbOfServers << " while the threshold is set at " << THRESHOLD << "." << endl;
			cout << "Please specify at least " << THRESHOLD << " servers in servers.list for the DKG scheme to work." << endl;
			cout << "Terminating setup." << endl << endl;
			return 0;
		}
		// Copy servers.list to the correct DKG directory
		string serverlistFileLocation = dkgDir + "servers.list";
		ifstream  src(serverlistFile, std::ios::binary);
     	ofstream  dst(serverlistFileLocation.c_str(), std::ios::binary);
     	dst << src.rdbuf();
	} else {
		cout << "Please provide a path to an existing servers.list file." << endl << "Terminating setup." << endl << endl;
		file.close();
		return 0;
	}

	// Use /dev/urandom for the generation of the random seed
	char seed[2];
	FILE *fp;
    fp = fopen("/dev/urandom", "r");
    int bytes_read = fread(&seed, 1, 2, fp);
    fclose(fp);
    irand((long)seed);

	// Check if mskFile already exists
	file.open(mskFile.c_str());
	bool mskAlreadyGenerated = file.is_open();
	file.close();

	if(mskAlreadyGenerated) { 	// If the mskFile already exists generate a password prompt and decrypt it from the file
		cout << mskFile << " already exists." << endl;
		cout << "Retrieving the MSK from encrypted_msk.key. If you want to reset all the DKGs please execute" << endl << " bash resetDkgs.sh" << endl << endl;
		char plain[BYTES_PER_BIG];
		bool encryptedIsDecrypted = retrieveMSK(plain, servId, mskFile);
		if(!encryptedIsDecrypted) {
			cout << "Incorrect password specified. Terminating extraction process." << endl;
			return 0;
		} else {
			cout << "Successfully extracted the MSK." << endl;
		}
		s = from_binary(sizeof(plain), plain);
	} else { 					// If mskFile doesn't exist already, generate a new one and encrypt it to disk
		pfc.random(s);
		storeMSK(s, servId, mskFile);
	}

	// Create an array of all servers in servers.list and find your own portNb
	// TODO: check if all serverIDs are in ascending order. Otherwise throw an exception. This is now implicitly assumed.
	file.open(serverlistFile);
	int sId, pNb;
	int myPortNb = 0;
	Server serverlist[nbOfServers];
	while (file >> sId && file >> pNb) {
		if(sId == servId) {
			myPortNb = pNb;
		}
		Server serv;
		serv.portNb = pNb;
		serv.id = sId;
		serverlist[sId-1] = serv;
	}
	file.close();

	G2 P;
	DKG *dkg;
	/* PSEUDOCODE OF THE CODE BELOW

	if(servId == 1) {
		send_P();
		send_shares();
	} else {
		while(prev_server_not_ready()) {
			listen_to_dkgs();
		}
		send_shares();
	}
	while(!all_shares_received()) {
		listen_to_dkgs();
	}

	// end of DKG
	listen_to_clients();

	*/

	string pFile = (dkgDir + "P.key");
	file.open(pFile.c_str());
	bool pAlreadyGenerated = file.is_open();
	file.close();
	// The first DKG server decides which P value is used
	if(servId == 1) {
		if (pAlreadyGenerated) {
			fstream in(pFile.c_str(), ios::in | ios::binary);
			if (in)
			{
			    string contents;
			    in.seekg(0, std::ios::end);
			    contents.resize(in.tellg());
			    in.seekg(0, std::ios::beg);
			    in.read(&contents[0], contents.size());
			    in.close();
			    P = g2From(contents);
			}
		} else {
			pfc.random(P);
		}

		dkg = new DKG(servId, myPortNb, nbOfServers, THRESHOLD, order, &pfc, P, s);

	} else { // If this is not the first DKG server, initialise DKG without P
		dkg = new DKG(servId, myPortNb, nbOfServers, THRESHOLD, order, &pfc, s);
	}

	if(servId == 1) {
		P = (*dkg).getP();
		// Send P to all servers in serverlist
		for (int i = 1; i < nbOfServers; i++) {
			DKGMessage pMes = DKGMessage(servId, serverlist[i].id, P);
			sendTo(serverlist[i].portNb, pMes.toString().c_str());
		}
		// After sending P, send a share to each DKG.
		for (int i = 2; i < nbOfServers; i++) {
			share_t share = (*dkg).getShareOf(serverlist[i].id);
			DKGMessage sMes = DKGMessage(servId, serverlist[i].id, share);
			sendTo(serverlist[i].portNb, sMes.toString().c_str());
		}
		// The share to server 2 is sent as the last one because it serves as a kickoff sign for server 2 to distribute its shares.
		share_t share = (*dkg).getShareOf(serverlist[1].id);
		DKGMessage sMes = DKGMessage(servId, serverlist[1].id, share);
		sendTo(serverlist[1].portNb, sMes.toString().c_str());
	} else {
			listenTo(myPortNb, dkg);
			Server nextSharingServer;
			// Send to all servers except serverId + 1
			for (int i = 0; i < nbOfServers; i++) {
				if (serverlist[i].id != servId+1 && serverlist[i].id != servId) {
					share_t share = (*dkg).getShareOf(serverlist[i].id);
					DKGMessage sMes = DKGMessage(servId, serverlist[i].id, share);
					sendTo(serverlist[i].portNb, sMes.toString().c_str());
				} else {
					nextSharingServer = serverlist[i];
				}
			}
			// Send to serverId + 1
			if (servId != nbOfServers) {
				share_t share = (*dkg).getShareOf(nextSharingServer.id);
				DKGMessage sMes = DKGMessage(servId, nextSharingServer.id, share);
				sendTo(nextSharingServer.portNb, sMes.toString().c_str());
			}
	}
	// The last server shouldn't listen anymore
	if (servId != nbOfServers) {
		listenTo(myPortNb, dkg);
	}

	// Write P.key to outputfile
	P = (*dkg).getP();
	outputFile.open(pFile.c_str(), ios::out | ios::binary);
	string toStr = toString(P);
	outputFile.write(toStr.c_str(), toStr.length());
	outputFile.close();
	chmod(pFile.c_str(), S_IRWXU | S_IRWXG | S_IRWXO);

	// Write Ppub.key to outputfile
	G2 Ppub = (*dkg).getSjP();
	pFile = (dkgDir + "Ppub.key");
	outputFile.open(pFile.c_str(), ios::out | ios::binary);
	toStr = toString(Ppub);
	outputFile.write(toStr.c_str(), toStr.length());
	outputFile.close();
	chmod(pFile.c_str(), S_IRWXU | S_IRWXG | S_IRWXO);


	cout << "State of server " << servId << " is " << (*dkg).printState() << endl << endl;

	writeIndexPhp(myPortNb + CLIENT_PORT_OFFSET, dkgDir.c_str());

	// At this point all DKGs should be finished. Start listening for clients. This should be multithreaded of course.
	cout << "DKG server " << servId << " starts listening for client requests on port " << myPortNb + 100 << endl;
	listenForClients(myPortNb + CLIENT_PORT_OFFSET, dkg);

	cout << endl;
	return 0;
}

/*******
* Korte zender => zendt iets en leest antwoord uit
*******/
int sendTo(int portNb, const char * message) {
	int sockfd, n;
    const char* host;

    struct sockaddr_in serv_addr;
    struct addrinfo hints, *servinfo;

    host = "127.0.0.1";

    char buffer[BUF_SIZE];

    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;

    // Convert portNb to a const char*
    stringstream ss;
    ss << portNb << ends;
 	string temp = ss.str();
 	const char * portNbString = temp.c_str();

    if (getaddrinfo("127.0.0.1", portNbString, &hints, &servinfo) != 0) {
        error("ERROR getting addrinfo");
        return 1;
    }
    int i = 0;
    if((sockfd = socket(servinfo->ai_family, servinfo->ai_socktype, servinfo->ai_protocol)) == -1) {
        error("ERROR opening socket");
        return 1;
    }
    int so_reuseaddr = TRUE;
    setsockopt(sockfd,
               SOL_SOCKET,
               SO_REUSEADDR,
               &so_reuseaddr,
               sizeof(so_reuseaddr));

	// Wait until DKG server is online
	cout << "Waiting for server on port " << portNb << " to connect" << endl;
	while (connect(sockfd, servinfo->ai_addr, servinfo->ai_addrlen) == -1) {
		close(sockfd);
		sockfd = socket(servinfo->ai_family, servinfo->ai_socktype, servinfo->ai_protocol);
	}

    bzero(buffer,sizeof(buffer));
    strcpy(buffer,message);

    n = write(sockfd,buffer,strlen(buffer));
    if(n < 0)
        error("ERROR writing to socket");
/* iets terug uitlezen is niet nodig
    bzero(buffer,256);
    n = read(sockfd,buffer,255);

    if (n < 0)
        error("ERROR reading from socket");*/
    cout << "The following message was successfully sent:" << endl;
    DKGMessage dkgMes = DKGMessage(message);
    cout << "A " << dkgMes.printType() << " has been sent from server " << dkgMes.getSender() << " to server " << dkgMes.getReceiver() << endl << endl;
    //freeaddrinfo(servinfo);
    //freeaddrinfo(it);
    close(sockfd);
}

void listenForClients(int portNb, DKG *dkg) {
	int sockfd, newsockfd;
    socklen_t clilen;

    struct sockaddr_in serv_addr, cli_addr;

    // Initialise the socket descriptor.
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0)
        error("ERROR opening socket");

    // Bind socket to port
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = INADDR_ANY;
    serv_addr.sin_port = htons(portNb);
    if (bind(sockfd, (struct sockaddr *) &serv_addr, sizeof(serv_addr)) < 0)
        error("ERROR on binding");

     // Listen to socket and accept incoming connections
    listen(sockfd,5);
    clilen = sizeof(cli_addr);

    while( (newsockfd = accept(sockfd, (struct sockaddr *) &cli_addr, &clilen) )){
        cout << "newsockfd: " << newsockfd << endl;
        if (newsockfd < 0)
            error("ERROR on accept");

        // Initialise new thread
        pthread_t sniffer_thread;
        ThreadParams *params = new ThreadParams; // params is a pointer to a threadParams struct
		params->sockfd = newsockfd;
		params->dkg = dkg;
		//params->pfc = new PFC(AES_SECURITY); // MEMORY LEAK: this pointer is never being freed! :o
        if( pthread_create( &sniffer_thread , NULL ,  connection_handler , params) < 0 )
            perror("ERROR on creating thread");
    }
    mr_end_threading();
}

void *connection_handler(void *arg) {
	PFC pfc2(AES_SECURITY);
	get_mip()->IOBASE=64;
	int bytes_per_big = (MIRACL/8)*(get_mip()->nib-1);

	char buffer[BUF_SIZE];
	ThreadParams * params = (ThreadParams*)(arg);

	cout << "sockfd is " << params->sockfd << endl;
	// Read out socket.
    int n = recv(params->sockfd, buffer, sizeof(buffer),0);
    if (n < 0)
    	error("ERROR reading from socket");
    G1 D = params->dkg->extract(buffer);

    cout << "Received ID:" << endl << buffer << endl;
    cout << "Extracted private key:" << endl << D.g << endl;
    strcpy(buffer, toString(D).c_str());

    n = send(params->sockfd, buffer, sizeof(buffer),0);

    if (n < 0) error("ERROR writing to socket");

    close(params->sockfd);

    pthread_cancel(pthread_self());
    pthread_detach(pthread_self());

    return NULL;
}

void listenTo(int portNb, DKG *dkg) {
	/*************************************************
    * Eeuwige luisteraar => luistert en stuurt iets terug bij ontvangst
    **************************************************/
	int sockfd, newsockfd;
    socklen_t clilen;

    cout << "Server listening on port " << portNb << endl;
    struct sockaddr_in serv_addr, cli_addr;
    char buffer[BUF_SIZE];

    // Initialise the socket descriptor.
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0)
        error("ERROR opening socket");
    int so_reuseaddr = TRUE;
    setsockopt(sockfd,
               SOL_SOCKET,
               SO_REUSEADDR,
               &so_reuseaddr,
               sizeof(so_reuseaddr));

    // Bind socket to port
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = INADDR_ANY;
    serv_addr.sin_port = htons(portNb);
    if (bind(sockfd, (struct sockaddr *) &serv_addr, sizeof(serv_addr)) < 0)
        error("ERROR on binding");

     // Listen to socket and accept incoming connections
    listen(sockfd,5);
    clilen = sizeof(cli_addr);

    bool keepOnListening = true;
    // Start listening on myPortNb until keepListening is false
    while (keepOnListening) {
    	newsockfd = accept(sockfd, (struct sockaddr *) &cli_addr, &clilen);
        if (newsockfd < 0)
            error("ERROR on accept");
        char buffer[BUF_SIZE];
        memset(buffer, 0, sizeof(buffer));

		// Read out socket.
    	int n = recv(newsockfd,buffer,sizeof(buffer),0);
    	Big s;
    	if (n < 0)
    		error("ERROR reading from socket");
    	if (strlen(buffer) != 0) {
	    	string xmlMessage(buffer);
	    	DKGMessage dkgMes = DKGMessage(xmlMessage);
	    	cout << "Received message is" << endl;
	    	cout << "A " << dkgMes.printType() << " has been received on server " << dkgMes.getReceiver() << " from server " << dkgMes.getSender() << endl << endl;
	    	if (dkgMes.getType() == P_MESSAGE) {
		    	G2 P = dkgMes.getP();
		    	(*dkg).setP(P);
		    } else {
		    	share_t share = dkgMes.getShare();
		    	(*dkg).setShare(share);
		    	if( ( (*dkg).getServerId() == share.shareGenerator + 1 ) || ( (*dkg).getState() == DKG_FINISHED ) )
		    		keepOnListening = false;
		    }
	    }
    }
    close(sockfd);
    close(newsockfd);
}

void storeMSK(Big s, int servId, string mskPath) {
		termios oldt;
		char * pwd;
		ofstream outputFile;

		cout << "Please insert a password to encrypt the master secret key for server " << servId << ":";

	    // Turn off terminal output
	    tcgetattr(STDIN_FILENO, &oldt);
	    termios newt = oldt;
	    newt.c_lflag &= ~ECHO;
	    tcsetattr(STDIN_FILENO, TCSANOW, &newt);

	    string password;
	    getline(cin, password);

	    // Turn terminal output back on.
	    tcsetattr(STDIN_FILENO, TCSANOW, &oldt);
	    cout << endl;

		// Hash password string to two 128 bit big numbers h1 and h2.
		get_mip()->IOBASE = 256;
		char hash[HASH_LEN];
		sha256 sh;
		int bytes_per_big=(MIRACL/8)*(get_mip()->nib-1);
		char msk[bytes_per_big];
		pwd = (char *)password.c_str();
		shs256_init(&sh);
		while (*pwd!=0) {
			shs256_process(&sh,*pwd++);
			shs256_hash(&sh,hash);
		}
		char hash1[HASH_LEN/2];
		char hash2[HASH_LEN/2];
		memcpy(hash1,hash,HASH_LEN/2);
		memcpy(hash2,&hash[HASH_LEN/2],HASH_LEN/2);

		to_binary(s, bytes_per_big, msk, TRUE);


		// Use GCM to encrypt the Master Secret Key
		gcm g;
		char C[bytes_per_big];
		char Cread[bytes_per_big];
		char T[TAG_LEN];
		char Tread[TAG_LEN];
		char plain[bytes_per_big];
		gcm_init(&g, HASH_LEN/2, hash1, HASH_LEN/2, hash2);
		gcm_add_cipher(&g, GCM_ENCRYPTING, msk, bytes_per_big, C);
		gcm_finish(&g, T);
		// Write encrypted MSK to file
		outputFile.open(mskPath.c_str(), ios::out | ios::binary);
		outputFile.write(C, bytes_per_big);
		outputFile.write(T, TAG_LEN);
		outputFile.close();
		cout << "MSK successfully generated!" << endl;
		cout << "MSK is stored in encrypted format in " << mskPath << ". Please do not forget your password. " << endl;

		get_mip()->IOBASE = 64;
}

bool retrieveMSK(char * plain, int servId, string mskPath) {
	char Cread[BYTES_PER_BIG];
	char Tread[TAG_LEN];
	char T[TAG_LEN];
	char msk[BYTES_PER_BIG];
	char * pwd;
	char hash[HASH_LEN];

	ifstream file;
	gcm g;
	sha256 sh;

	// Hash password string to two 128 bit big numbers h1 and h2.
	/*if(argc > 1) {
		pwd = argv[1];
	} else {
		cout << "Please specify a password to decrypt the encrypted_msk.key" << endl;
		return 0;
	}*/
	termios oldt;

    cout << "Please insert a password to decrypt the master secret key for server " << servId << ":";

    // Turn off terminal output
    tcgetattr(STDIN_FILENO, &oldt);
    termios newt = oldt;
    newt.c_lflag &= ~ECHO;
    tcsetattr(STDIN_FILENO, TCSANOW, &newt);

    string password;
    getline(cin, password);

    // Turn terminal output back on.
    tcsetattr(STDIN_FILENO, TCSANOW, &oldt);
    cout << endl;

    pwd = (char *)password.c_str();
	shs256_init(&sh);
	int i =0;
	while (*pwd!=0) {
		shs256_process(&sh,*pwd++);
		shs256_hash(&sh,hash);
		i++;
	}
	char hash1[HASH_LEN/2];
	char hash2[HASH_LEN/2];
	memcpy(hash1,hash,HASH_LEN/2);
	memcpy(hash2,&hash[HASH_LEN/2],HASH_LEN/2);

	// Read encrypted MSK from file
	file.open(mskPath.c_str(), ios::in | ios::binary);
	file.read(Cread, BYTES_PER_BIG);
	file.read(Tread, TAG_LEN);
	file.close();

	// Decrypt MSK
	gcm_init(&g, HASH_LEN/2, hash1, HASH_LEN/2, hash2);
	gcm_add_cipher(&g, GCM_DECRYPTING, plain, BYTES_PER_BIG, Cread);
	gcm_finish(&g,T); // Overwrite previous T value

	bool encryptedIsDecrypted = true;
	for (int i = 0; i < TAG_LEN; i++) {
		if(T[i] != Tread[i]) {
			encryptedIsDecrypted = false;
		}
	}
	return encryptedIsDecrypted;
}

void writeIndexPhp(int portNb, const char * dkgDir) {
	stringstream indexPhp;
	ofstream outputFile;
	indexPhp << "<?php" << endl;
	indexPhp << "$buf_size = " << BUF_SIZE << ";" << endl;
	indexPhp << "$socket = socket_create(AF_INET,SOCK_STREAM,0);" << endl;
    indexPhp << "socket_connect($socket,'127.0.0.1'," << portNb << ");" << endl;
    indexPhp << endl;
    indexPhp << "$binDir = '" << dkgDir << "';" << endl;
    indexPhp << endl;
    indexPhp << "$xml = new DOMDocument('1.0');" << endl;
    indexPhp << endl;
	indexPhp << "$root = $xml->createElement('scramble');" << endl;
	indexPhp << "$result = $xml->createElement('result');" << endl;
	indexPhp << "$xml->appendChild($root);" << endl;
	indexPhp << endl;
    indexPhp << "if(array_key_exists('id', $_POST) && isset($_POST['id']) && $_POST['id'] != ''){" << endl;
    indexPhp << "	$command = htmlspecialchars($_POST['id']);" << endl;
    indexPhp << "    socket_write($socket,$command,strlen($command));" << endl;
    indexPhp << "    $DidResult = socket_read($socket, $buf_size, PHP_NORMAL_READ);" << endl;
    indexPhp << "    socket_close($socket);" << endl;
    indexPhp << endl;
    indexPhp << "    // get contents of a file into a string" << endl;
    indexPhp << "	$filename = $binDir . 'Ppub.key';" << endl;
    indexPhp << "	$handle = fopen($filename, 'r');" << endl;
    indexPhp << "	$PpubResult = fread($handle, filesize($filename));" << endl;
    indexPhp << "	fclose($handle);" << endl;
    indexPhp << endl;
    indexPhp << "	// get contents of a file into a string" << endl;
    indexPhp << "	$filename = $binDir . 'P.key';" << endl;
    indexPhp << "	$handle = fopen($filename, 'r');" << endl;
    indexPhp << "	$PResult = fread($handle, filesize($filename));" << endl;
    indexPhp << "	fclose($handle);" << endl;
    indexPhp << endl;
    indexPhp << "	$P   = $xml->createElement('p');" << endl;
    indexPhp << "	$PText = $xml->createTextNode($PResult);" << endl;
    indexPhp << "	$P->appendChild($PText);" << endl;
    indexPhp << endl;
    indexPhp << "	$Ppub = $xml->createElement('p_pub');" << endl;
    indexPhp << "	$PpubText = $xml->createTextNode($PpubResult);" << endl;
    indexPhp << "	$Ppub->appendChild($PpubText);" << endl;
    indexPhp << "" << endl;
    indexPhp << "	$Did = $xml->createElement('d_id');" << endl;
    indexPhp << "	$DidText = $xml->createTextNode($DidResult);" << endl;
    indexPhp << "	$Did->appendChild($DidText);" << endl;
    indexPhp << " " << endl;
    indexPhp << "	$result->appendChild($Ppub);" << endl;
    indexPhp << "	$result->appendChild($P);" << endl;
    indexPhp << "	$result->appendChild($Did);" << endl;
    indexPhp << "	$root->appendChild($result);" << endl;
    indexPhp << "	$xml->formatOutput = true;" << endl;
    indexPhp << "	echo $xml->saveXML();" << endl;
    indexPhp << "} else {" << endl;
    indexPhp << "	$root->appendChild($result);" << endl;
    indexPhp << "	echo $xml->saveXML();" << endl;
    indexPhp << "}";
	indexPhp << "?>";
	string phpFile = (string)dkgDir + "index.php";
	outputFile.open(phpFile.c_str(), ios::out | ios::binary);
	outputFile.write(indexPhp.str().c_str(), indexPhp.str().size());
	outputFile.close();
	chmod(phpFile.c_str(), S_IRWXU | S_IRWXG | S_IRWXO);
}