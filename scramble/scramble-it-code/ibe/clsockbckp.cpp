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

  g++-4.7 clientsocket.cpp mapToDate.cpp ../../../code/miraclthread/source/bls_pair.cpp ../../../code/miraclthread/source/zzn24.cpp ../../../code/miraclthread/source/zzn8.cpp ../../../code/miraclthread/source/zzn4.cpp ../../../code/miraclthread/source/zzn2.cpp ../../../code/miraclthread/source/ecn4.cpp ../../../code/miraclthread/source/big.cpp ../../../code/miraclthread/source/zzn.cpp ../../../code/miraclthread/source/ecn.cpp ../../../code/miraclthread/source/mrgcm.c encryptedMessage.cpp authenticatedData.cpp plaintextMessage.cpp client_funcs.cpp broadcastMessage.cpp ../../../code/miraclthread/source/mraes.c ../../../code/miraclthread/source/miracl.a -D_REENTRANT -I ../../../code/miraclthread/include/ -L ../../../code/miraclthread/source/ -l pthread -lcurl -o clientsocket
*/

//********* choose just one of these pairs **********
//#define MR_PAIRING_CP      // AES-80 security
//#define AES_SECURITY 80

//#define MR_PAIRING_MNT	// AES-80 security
//#define AES_SECURITY 80

//#define MR_PAIRING_BN    // AES-128 or AES-192 security
//#define AES_SECURITY 128
//#define AES_SECURITY 192

//#define MR_PAIRING_KSS    // AES-192 security
//#define AES_SECURITY 192

#include "../../../code/commonparams.h"
//*********************************************

#include "../../../code/miraclthread/source/pairing_3.h"
#include "mapToDate.h"
#include <iostream>
#include <fstream>
#include <stdio.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <termios.h>
#include "client_funcs.h"
#include "authenticatedData.h"
#include "broadcastMessage.h"
#include "plaintextMessage.h"
#include "encryptedMessage.h"
#include "client_dkg.h"


#define PORT_NB 6666
#define BUF_SIZE 4096
#define BYTES_PER_BIG 80

struct ThreadParams {
    char sPlain[BYTES_PER_BIG];
    int sockfd;
    PFC *pfc;
    G2 P;
    G2 Ppub;
    G1 D;
};

void processXmlRequest(ThreadParams *params);
PlaintextMessage getPlaintextMessage(string xmlString, PFC * pfc);
void error(const char* msg);
string getMessageType(string xmlString);
EncryptedMessage getEncryptedMessage(string xmlString);
string getUrl(string xmlString);
string encodeToXmlResult(string result, string url="");
bool extractPrivateKey(ThreadParams *params);

//PFC pfc(AES_SECURITY);
bool * closeSocket = new bool();
bool paramsInitialised = true;

int main(int argc, char *argv[])
{
    mr_init_threading();
	/*************************************************
    *   Get the public parameters from the PKGs      *
    **************************************************/
    // Initialise a strong random number generator

    char raw[256];
    FILE *fp;
    fp = fopen("/dev/urandom", "r");
    fread(&raw, 1, 256, fp);
    fclose(fp);
    time_t seed;
    csprng rng;
    time(&seed);
    strong_init(&rng,strlen(raw),raw,(long)seed);
    // Make sure all random PFC elements rely on strong random number generator
    PFC pfc(AES_SECURITY, &rng);
    miracl *mip = get_mip();
    int bytes_per_big=(MIRACL/8)*(get_mip()->nib-1);

    mip->IOBASE=64;

    ThreadParams *myParams = new ThreadParams;

    G2 P;
    G2 Ppub;
    G1 Qpriv, Qid;
    G1 D;

	/*************************************************
    *   Initialise client side socket for Scramble   *
    **************************************************/
    cout << "Socket is ready for Firefox requests. Listening:" << endl;
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
    serv_addr.sin_port = htons(PORT_NB);
    if (bind(sockfd, (struct sockaddr *) &serv_addr, sizeof(serv_addr)) < 0)
        error("ERROR on binding");

     // Listen to socket and accept incoming connections
    listen(sockfd,5);
    clilen = sizeof(cli_addr);

    *closeSocket = false;
    //mr_init_threading();
    //TODO: make encryption multithreaded
    paramsInitialised = false;
    while(!(*closeSocket) ){
    	newsockfd = accept(sockfd, (struct sockaddr *) &cli_addr, &clilen);
        if (newsockfd < 0)
            error("ERROR on accept");

        if(paramsInitialised == false) {
            myParams->pfc = &pfc;
            bool extractionSucceeded = extractPrivateKey(myParams);
            if(extractionSucceeded == false) {
                cout << "Some DKGs were dishonest. Please select other DKGs." << endl;
                return 0;
            }
            P = myParams->P;
            D = myParams->D;
            Ppub = myParams->Ppub;
            paramsInitialised = true;
        }
        // Initialise new thread
        //pthread_t sniffer_thread;
        //pthread_attr_t attributes;
        ThreadParams *params = new ThreadParams; // params is a pointer to a threadParams struct
		//params = myParams;
        params->sockfd = newsockfd;
		params->pfc = &pfc;
		params->P = myParams->P;
		params->Ppub = myParams->Ppub;
		params->D = myParams->D;
        processXmlRequest(params);
    }
    //mr_end_threading();
    sleep(5);

	return 0;
}

bool extractPrivateKey(ThreadParams *params) {
    PFC *pfc = params->pfc;
    clock_t begin_time, begin_time1;
    float enc_time, enc_time1, dec_time, dec_time1, dec_time2, ext_time;

    G2 P;
    G2 Ppub;
    G1 Qpriv, Qid;
    G1 D;

    Big order = pfc->order();

    // Specify the ids of the dkgs to contact
    //int dkgIds[THRESHOLD] = {1, 2, 3};
    //int dkgIds2[THRESHOLD] = {3, 4, 5};
    int dkgIds[THRESHOLD];
    for(int i = 0; i < THRESHOLD; i++) {
        dkgIds[i] = i+1;
    }
    //TODO: Change this to an id from the scramble extension

    /*
    ifstream infile("test.txt");
    string readoutId;
    if (infile.good())
    {
        getline(infile, readoutId);
        cout << "The read out ID is:" << endl << readoutId << endl;
    }
    infile.close();*/

    const char * id = "-3114599686203605494";
    //const char * id = readoutId.c_str();
    string urls[THRESHOLD];
    for (int i = 0; i < THRESHOLD; i++) {
        stringstream ss;
        ss << DKG_BASE_ADDR << dkgIds[i] << "/";
        urls[i] = ss.str();
    }
    vector <G1> Qprivs;
    vector <G2> Ppubs;
    DkgResult retParams;

    begin_time = clock();
    // Before doing the check, concatenate the expiration date
    string idString = "";
    idString = idString + id;
    idString = mapToDate(idString);
    (*pfc).hash_and_map(Qid, (char*)idString.c_str());

    for (int i = 0; i < THRESHOLD; i++) {
        retParams = scrapeDkg(urls[i], (char*)id);
        // Get Ppub, P and Qpriv from the PKG's XML message
        P = retParams.P;

        Qpriv = retParams.Qpriv;
        Qprivs.push_back(Qpriv);

        Ppub = retParams.Ppub;
        Ppubs.push_back(Ppub);

        // Verify if the DKG are being honest
        GT QprivP = (*pfc).pairing(P, Qpriv);
        GT QidPpub = (*pfc).pairing(Ppub, Qid);
        if (QprivP != QidPpub) {
            cout << "Server " << dkgIds[i] << " is dishonest. Select another DKG to continue the extraction process." << endl;
            return false;
        }
    }

    D = getSecretKey(dkgIds, Qprivs, order, pfc);
    Ppub = getPpub(dkgIds, Ppubs, order, pfc);

    ext_time = getExecutionTime(begin_time);
    cout << "Extraction time was " << ext_time << endl << endl;
    params->P = P;
    params->Ppub = Ppub;
    params->D = D;
    return true;
}

// The following function is executed concurrently with other threads
void processXmlRequest(ThreadParams *params) {
	PFC *pfc = params->pfc;
	get_mip()->IOBASE=64;
	int bytes_per_big = (MIRACL/8)*(get_mip()->nib-1);

	char buffer[BUF_SIZE];
    memset(buffer, 0, BUF_SIZE);

	cout << endl << "------------------------------" << endl;
	cout << "sockfd: " << params->sockfd << endl;
	// Read out socket.
    int n = recv(params->sockfd, buffer, sizeof(buffer),0);
    if (n < 0)
    	error("ERROR reading from socket");


    //string ext_pvt_key = extract(buffer, s, pfc);
    string xmlString(buffer);
    string messageType = getMessageType(xmlString);
    cout << "messageType: " << messageType << endl;
    cout << "Received XML Message:" << endl << buffer << endl;
    string xmlResult;
    if(messageType.compare("encryption")==0) {
	    PlaintextMessage plainMes = getPlaintextMessage(xmlString, pfc);
	    cout << "plainMes.getMessage()" << endl << plainMes.getMessage() << endl;
	    EncryptedMessage encMes = plainMes.encrypt(params->P, params->Ppub, pfc);
	    string strEncMes = encMes.getMessage();

	    cout << endl << "Encryption result:" << endl << strEncMes << endl;
	    //strcpy(buffer, ext_pvt_key.c_str());
	    xmlResult = encodeToXmlResult(strEncMes);

	    //string bye_mes("<?xml version='1.0' encoding='UTF-8' standalone='no'?><scramble><result>My custom result here</result></scramble>");
	    strcpy(buffer, xmlResult.c_str());

	    n = send(params->sockfd, buffer, sizeof(buffer), 0);

	    if (n < 0) error("ERROR writing to socket");
	} else if(messageType.compare("bye")==0) {
		//*closeSocket = true;
	} else if(messageType.compare("decryption")==0) {
		EncryptedMessage encMes = getEncryptedMessage(xmlString);
        cout << "encMes.getMessage()" << endl << encMes.getMessage() << endl;
        PlaintextMessage plainMes = encMes.decrypt(params->P, params->Ppub, params->D, params->pfc);
		string strPlainMes = plainMes.getMessage();

		cout << endl << "Decryption result:" << endl << strPlainMes << endl;
		string url = getUrl(xmlString);
		xmlResult = encodeToXmlResult(strPlainMes, url);

		strcpy(buffer, xmlResult.c_str());

		n = send(params->sockfd, buffer, sizeof(buffer), 0);

		if (n < 0) error("ERROR writing to socket");
	}

	cout << "------------------------------" << endl;

	close(params->sockfd);
    delete params;
}

PlaintextMessage getPlaintextMessage(string xmlString, PFC * pfc) {
	vector<char> xml_copy(xmlString.begin(), xmlString.end());
    xml_copy.push_back('\0');
    rapidxml::xml_document<> doc;
    rapidxml::xml_node<> * root_node;
    rapidxml::xml_node<> * mes_node;

    doc.parse<rapidxml::parse_declaration_node | rapidxml::parse_no_data_nodes>(&xml_copy[0]);
    root_node = doc.first_node("scramble");
    mes_node = root_node->first_node("text");
    string message = mes_node->value();
    PlaintextMessage plainMes = PlaintextMessage(message);
    vector<string> recips;
    root_node = root_node->first_node("recipients");
    for (rapidxml::xml_node<> * recipient_node = root_node->first_node("recipient"); recipient_node; recipient_node = recipient_node->next_sibling())
	{
		plainMes.addRecipient(recipient_node->value(), pfc);
	}
	return plainMes;
}

EncryptedMessage getEncryptedMessage(string xmlString) {
	vector<char> xml_copy(xmlString.begin(), xmlString.end());
    xml_copy.push_back('\0');
    rapidxml::xml_document<> doc;
    rapidxml::xml_node<> * root_node;
    rapidxml::xml_node<> * mes_node;

    doc.parse<rapidxml::parse_declaration_node | rapidxml::parse_no_data_nodes>(&xml_copy[0]);
    root_node = doc.first_node("scramble");
    mes_node = root_node->first_node("text");
    string encMessage = mes_node->value();
    encMessage = base64_decode(encMessage);
    EncryptedMessage res = EncryptedMessage(encMessage);
    return res;
}

string getMessageType(string xmlString) {
	vector<char> xml_copy(xmlString.begin(), xmlString.end());
    xml_copy.push_back('\0');
    rapidxml::xml_document<> doc;
    rapidxml::xml_node<> * root_node;
    rapidxml::xml_node<> * mes_node;

    doc.parse<rapidxml::parse_declaration_node | rapidxml::parse_no_data_nodes>(&xml_copy[0]);
    root_node = doc.first_node("scramble");
    return root_node->first_node("type")->value();
}

string getUrl(string xmlString) {
	vector<char> xml_copy(xmlString.begin(), xmlString.end());
    xml_copy.push_back('\0');
    rapidxml::xml_document<> doc;
    rapidxml::xml_node<> * root_node;
    rapidxml::xml_node<> * mes_node;

    doc.parse<rapidxml::parse_declaration_node | rapidxml::parse_no_data_nodes>(&xml_copy[0]);
    root_node = doc.first_node("scramble");
    return root_node->first_node("url")->value();
}

string encodeToXmlResult(string result, string url) {
	stringstream ss;
	ss << "<?xml version='1.0' encoding='UTF-8' standalone='no'?><scramble><result>";
	// Do another base64 encoding to send it over the socket
	if(url.compare("") == 0) {
		ss << base64_encode(reinterpret_cast<unsigned const char*>(result.c_str()), result.size());
		ss << "</result>";
	} else {
		// For a very odd reason decrypted texts are not base64 encoded?
		ss << result << "</result>";
		ss << "<url>" << url << "</url>";
	}
	ss << "</scramble>";

	cout << endl << "Returned XML message: " << endl << ss.str() << endl;
	return ss.str();
}

void error(const char* msg) {
    perror(msg);
    exit(1);
}