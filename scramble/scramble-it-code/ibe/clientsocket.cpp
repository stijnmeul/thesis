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
#define BUF_SIZE 8192
#define BYTES_PER_BIG 80
#define P_FILE_NAME "P.key"
#define PPUB_FILE_NAME "Ppub.key"
#define SK_FILE_NAME "D.key"
#define SK_LENGTH 400
#define P_LENGTH 900
#define PPUB_LENGTH 900
#define START_OF_CIPHERTEXT "-----BEGIN SCRAMBLE-----"
#define END_OF_CIPHERTEXT "-----END SCRAMBLE-----"

struct ThreadParams {
    int sockfd;
    PFC *pfc;
    G2 P;
    G2 Ppub;
    G1 D;
};

string processXmlRequest(string xmlString, G1 D, G2 P, G2 Ppub, int sockfd, PFC *pfc);
PlaintextMessage getPlaintextMessage(string userId, string xmlString, PFC * pfc);
void error(const char* msg);
EncryptedMessage getEncryptedMessage(string xmlString);
string encodeToXmlResult(string result, string url="");
ThreadParams getParameters(string userId, PFC *aPfc);
bool retrieveSK(G1 &D, string password, string skPath);
void storeSK(G1 D, string password, string skPath);
void storePubParams(G2 P, G2 Ppub, string skPath);
void retrievePubParams(G2 &P, G2 &Ppub, string skPath);
string getXmlValue(string xmlString, const char * xmlNodeName);

//PFC pfc(AES_SECURITY);
bool * closeSocket = new bool();
/**
 * In order for this code to work publicpath must contain the Facebook ID of the user of the firefox extension
 * Privatepath must contain the location where the public parameters are stored in P.key and Ppub.key.
 * privatepath/D.key stores the private key in encrypted fashion based on the provided password in pwd.
 **/
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

    int so_reuseaddr = TRUE;
    setsockopt(sockfd,
               SOL_SOCKET,
               SO_REUSEADDR,
               &so_reuseaddr,
               sizeof(so_reuseaddr));

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
    //TODO: make encryption multithreaded
    bool isFirstMessage = true;
    bool skStored = false;
    bool skInitialised = false;

    while(!(*closeSocket) ){
    	newsockfd = accept(sockfd, (struct sockaddr *) &cli_addr, &clilen);
        if (newsockfd < 0)
            error("ERROR on accept");

        char buffer[BUF_SIZE];
        memset(buffer, 0, BUF_SIZE);

        cout << endl << "------------------------------" << endl;
        cout << "sockfd: " << newsockfd << endl;
        // Read out socket.
        int n = recv(newsockfd, buffer, sizeof(buffer),0);
        if (n < 0)
            error("ERROR reading from socket");

        // Convert buffer to string
        string xmlString(buffer);

        // If this is the first message, check if parameters are already initialised in the secretpath
        if(isFirstMessage) {
            cout << "This is the first message" << endl;
            ifstream file;

            // Parameters are initialised if P_FILE_NAME already exists
            string skPath = getXmlValue(xmlString, "secretpath");
            file.open((skPath + P_FILE_NAME).c_str());
            bool paramsInitialised = file.is_open();
            file.close();

            // Check if SK_FILE_NAME already exists
            file.open((skPath + SK_FILE_NAME).c_str());
            skStored = file.is_open();
            file.close();
            cout << "skStored" << endl << skStored << endl;

            // If parameters not initialised => retrieve them from the PKGs
            if(paramsInitialised == false) {
                cout << "Parameters not initialised yet. Retrieving parameters from PKGs." << endl;
                string userId = getXmlValue(xmlString, "publicpath");
                // TODO: what if DKGs lie?
                ThreadParams myParams = getParameters(userId, &pfc);
                P = myParams.P;
                D = myParams.D;
                Ppub = myParams.Ppub;

                storePubParams(P, Ppub, skPath);
                skInitialised = true;
                // Note that D can only be stored as soon as a decryption message arrives containing the password pwd
            } else {
                cout << "Parameters are initialised. Reading out from P.key, Ppub.key and D.key" << endl;
                retrievePubParams(P, Ppub, skPath);
                cout << "P.g" << endl << P.g << endl;
                cout << "Ppub.g" << endl << Ppub.g << endl;
            }

            isFirstMessage = false;
        }

        // First decryption action encrypts the secret key
        if (skStored == false && (getXmlValue(xmlString, "type").compare("decryption") == 0) ) {
            cout << "Secret key not stored yet. Storing secret key" << endl;
            string password = getXmlValue(xmlString, "pwd");
            cout << "password" << endl << password << endl;
            string skPath = getXmlValue(xmlString, "secretpath");
            cout << "skPath" << endl << skPath << endl;
            cout << "IMMEDIATE STORE AND RETRIEVE OF SECRET" << endl << endl;
            storeSK(D, password, skPath + SK_FILE_NAME);
            cout << "After store" << endl;
            cout << "D.g" << endl << D.g << endl;
            retrieveSK(D, password, skPath + SK_FILE_NAME);
            cout << "After retrieve" << endl;
            cout << "D.g" << endl << D.g << endl;
            get_mip()->IOBASE = 64;

            skStored = true;
        }

        if (skInitialised == false && (getXmlValue(xmlString, "type").compare("decryption") == 0)) {
            string password = getXmlValue(xmlString, "pwd");
            cout << "password" << endl << password << endl;
            string skPath = getXmlValue(xmlString, "secretpath");
            cout << "skPath" << endl << skPath << endl;
            retrieveSK(D, password, skPath + SK_FILE_NAME);
            skInitialised = true;
        }

        string xmlResult = processXmlRequest(xmlString, D, P, Ppub, newsockfd, &pfc);

        strcpy(buffer, xmlResult.c_str());

        n = send(newsockfd, buffer, sizeof(buffer), 0);

        if (n < 0) error("ERROR writing to socket");

        cout << "------------------------------" << endl;

        close(newsockfd);
    }
    close(sockfd);

	return 0;
}

/**
 * return the public parameters along with the private key
 **/
ThreadParams getParameters(string userId, PFC *aPfc) {
    PFC *pfc = aPfc;
    clock_t begin_time, begin_time1;
    float enc_time, enc_time1, dec_time, dec_time1, dec_time2, ext_time;
    ThreadParams params;

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

    const char * id = userId.c_str();
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
        }
    }

    D = getSecretKey(dkgIds, Qprivs, order, pfc);
    Ppub = getPpub(dkgIds, Ppubs, order, pfc);

    ext_time = getExecutionTime(begin_time);
    cout << "Extraction time was " << ext_time << endl << endl;
    params.P = P;
    params.Ppub = Ppub;
    params.D = D;
    return params;
}

string processXmlRequest(string xmlString, G1 D, G2 P, G2 Ppub, int sockfd, PFC *aPfc) {
	PFC *pfc = aPfc;
	get_mip()->IOBASE=64;
	int bytes_per_big = (MIRACL/8)*(get_mip()->nib-1);

    string messageType = getXmlValue(xmlString, "type");
    cout << "messageType: " << messageType << endl;
    cout << "Received XML Message:" << endl << xmlString << endl;

    string xmlResult;
    if(messageType.compare("encryption") == 0) {
        string userId = getXmlValue(xmlString, "publicpath");
	    PlaintextMessage plainMes = getPlaintextMessage(userId, xmlString, pfc);
        string strEncMes;
        cout << "plainMes.getMessage().size()" << endl << plainMes.getMessage().size() << endl;
        EncryptedMessage encMes = plainMes.encrypt(P, Ppub, pfc);
        //string strEncMes = encMes.getMessage();
        strEncMes = START_OF_CIPHERTEXT "\n\n" + encMes.getMessage() + "\n\n" END_OF_CIPHERTEXT;
	    xmlResult = encodeToXmlResult(strEncMes);
	} else if(messageType.compare("bye")==0) {
		*closeSocket = true;
	} else if(messageType.compare("decryption")==0) {
        string base64EncodedStr = getXmlValue(xmlString, "text");
        string strPlainMes;
        // Don't decrypt messages that are too small to be a ciphertext
        if (base64EncodedStr.size() < 800) {
            strPlainMes = "Message is not a ciphertext";
        } else { // Message is long enough to be a ciphertext
            string ciphertext = base64_decode(base64EncodedStr);
            // Check whether ciphertext contains START_OF_CIPHERTEXT
            bool containsStartOfCiphertext;
            if (ciphertext.find(START_OF_CIPHERTEXT) != std::string::npos) {
                containsStartOfCiphertext = true;
            }
            // Check whether ciphertext contains END_OF_CIPHERTEXT
            bool containsEndOfCiphertext = false;
            if (ciphertext.find(END_OF_CIPHERTEXT) != std::string::npos) {
                containsEndOfCiphertext = true;
            }

            if (containsEndOfCiphertext && containsStartOfCiphertext) {
                EncryptedMessage encMes = getEncryptedMessage(xmlString);
                cout << "encMes.getMessage()" << endl << encMes.getMessage() << endl;
                PlaintextMessage plainMes = encMes.decrypt(P, Ppub, D, pfc);
        		strPlainMes = plainMes.getMessage();
                cout << endl << "Decryption result:" << endl << strPlainMes << endl;
            } else { // Just put the original text back.
                strPlainMes = "Message is not a ciphertext";
            }
        }
		string url = getXmlValue(xmlString, "url");
		xmlResult = encodeToXmlResult(strPlainMes, url);
	}
    return xmlResult;
}

PlaintextMessage getPlaintextMessage(string userId, string xmlString, PFC * pfc) {
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

    // Add the user of the plugin to the plaintext as well.
    plainMes.addRecipient(userId, pfc);

    // Add all recipients from the XML message
    for (rapidxml::xml_node<> * recipient_node = root_node->first_node("recipient"); recipient_node; recipient_node = recipient_node->next_sibling())
	{
		plainMes.addRecipient(recipient_node->value(), pfc);
	}
	return plainMes;
}

void storePubParams(G2 P, G2 Ppub, string skPath) {
    ofstream outputFile;

    // Write P.key to outputfile
    string pFile = skPath + P_FILE_NAME;
    outputFile.open(pFile.c_str(), ios::out | ios::binary);
    string toStr = toString(P);
    char PAr[P_LENGTH];
    memset(PAr, 0, P_LENGTH);
    memcpy(PAr, toStr.c_str(), toStr.length());
    outputFile.write(PAr, P_LENGTH);
    outputFile.close();

    // Write Ppub.key to outputfile
    pFile = (skPath + PPUB_FILE_NAME);
    outputFile.open(pFile.c_str(), ios::out | ios::binary);
    toStr = toString(Ppub);
    char PpubAr[PPUB_LENGTH];
    memset(PpubAr, 0, PPUB_LENGTH);
    memcpy(PpubAr, toStr.c_str(), toStr.length());
    outputFile.write(PpubAr, PPUB_LENGTH);
    outputFile.close();
}

void retrievePubParams(G2 &P, G2 &Ppub, string skPath) {
    ifstream file;

    // Write P.key to outputfile
    string pFile = skPath + P_FILE_NAME;
    file.open(pFile.c_str(), ios::out | ios::binary);
    char PAr[P_LENGTH];
    memset(PAr, 0, P_LENGTH);
    file.read(PAr, P_LENGTH);
    string Pstr(PAr);
    cout << "Pstr" << endl << Pstr << endl;
    P = g2From(Pstr);
    file.close();

    // Write Ppub.key to outputfile
    pFile = (skPath + PPUB_FILE_NAME);
    file.open(pFile.c_str(), ios::out | ios::binary);
    char PpubAr[PPUB_LENGTH];
    memset(PpubAr, 0, PPUB_LENGTH);
    file.read(PpubAr, PPUB_LENGTH);
    string PpubStr(PpubAr);
    cout << "PpubStr" << endl << PpubStr << endl;
    Ppub = g2From(PpubStr);
    file.close();
}

void storeSK(G1 D, string password, string skPath) {
    char * pwd;
    ofstream outputFile;

    // Hash password string to two 128 bit big numbers h1 and h2.
    get_mip()->IOBASE = 256;
    char hash[HASH_LEN];
    memset(hash, 0, HASH_LEN);
    sha256 sh;
    pwd = (char *)password.c_str();

    shs256_init(&sh);
    for(int i = 0; pwd[i] != 0; i++) {
        shs256_process(&sh,pwd[i]);
    }
    shs256_hash(&sh,hash);
    get_mip()->IOBASE = 64;

    char hash1[HASH_LEN/2];
    char hash2[HASH_LEN/2];
    memcpy(hash1,hash,HASH_LEN/2);
    memcpy(hash2,&hash[HASH_LEN/2],HASH_LEN/2);

    char dArr[SK_LENGTH];
    memset(dArr, 0, SK_LENGTH);

    cout << "D.g" << endl << D.g << endl;
    stringstream ss;
    ss << D.g;
    string dString = ss.str();
    memcpy(dArr, dString.c_str(), SK_LENGTH);

    //get_mip()->IOBASE = 256;
    // Use GCM to encrypt the Master Secret Key
    gcm g;
    char C[SK_LENGTH];
    char Cread[SK_LENGTH];
    char T[TAG_LEN];
    char Tread[TAG_LEN];

    gcm_init(&g, HASH_LEN/2, hash1, HASH_LEN/2, hash2);
    gcm_add_cipher(&g, GCM_ENCRYPTING, dArr, SK_LENGTH, C);
    gcm_finish(&g, T);
    // Write encrypted MSK to file
    outputFile.open(skPath.c_str(), ios::out | ios::binary);
    outputFile.write(C, SK_LENGTH);
    outputFile.write(T, TAG_LEN);
    outputFile.close();

    //get_mip()->IOBASE = 64;
    cout << "Secret key is stored in encrypted format in " << skPath << "." << endl;
}

bool retrieveSK(G1 &D, string password, string skPath) {
    gcm g;
    sha256 sh2;
    //get_mip()->IOBASE = 256;
    char Cread[SK_LENGTH];
    char Tread[TAG_LEN];
    char T[TAG_LEN];
    char * pwd;
    char hash[HASH_LEN];

    char sk[SK_LENGTH];
    char plain[SK_LENGTH];
    memset(Cread, 0, SK_LENGTH);
    memset(sk, 0, SK_LENGTH);
    memset(plain, 0, SK_LENGTH);
    memset(T, 0, TAG_LEN);
    memset(hash, 0, HASH_LEN);

    pwd = (char *)password.c_str();

    get_mip()->IOBASE = 256;

    shs256_init(&sh2);
    for(int i = 0; pwd[i] != 0; i++) {
        shs256_process(&sh2,pwd[i]);
    }
    shs256_hash(&sh2,hash);
    get_mip()->IOBASE = 64;

    char hash1[HASH_LEN/2];
    char hash2[HASH_LEN/2];
    memcpy(hash1,hash,HASH_LEN/2);
    memcpy(hash2,&hash[HASH_LEN/2],HASH_LEN/2);

    // Read encrypted SK from file
    ifstream file;

    file.open(skPath.c_str(), ios::out | ios::binary);
    file.read(Cread, SK_LENGTH);
    file.read(Tread, TAG_LEN);
    file.close();

    // Decrypt SK
    gcm_init(&g, HASH_LEN/2, hash1, HASH_LEN/2, hash2);
    gcm_add_cipher(&g, GCM_DECRYPTING, plain, SK_LENGTH, Cread);
    gcm_finish(&g,T); // Overwrite previous T value

    bool encryptedIsDecrypted = true;
    for (int i = 0; i < TAG_LEN; i++) {
        if(T[i] != Tread[i]) {
            cout << "i" << endl << i << endl;
            encryptedIsDecrypted = false;
        }
    }
    if (encryptedIsDecrypted)
        cout << "Encrypted is decrypted in retrieveSK" << endl;
    else cout << "Encrypted is not the same as decrypted" << endl;

    get_mip()->IOBASE = 64;

    string dString(plain);
    D = g1From(dString);

    return encryptedIsDecrypted;
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

    // Remove the BEGIN SCRAMBLE and END SCRAMBLE tags
    encMessage.erase(std::remove(encMessage.begin(), encMessage.end(), '\n'), encMessage.end());
    encMessage = encMessage.erase(0, sizeof(START_OF_CIPHERTEXT)-1);
    size_t start_position_to_erase = encMessage.find(END_OF_CIPHERTEXT);
    encMessage = encMessage.erase(start_position_to_erase, encMessage.size());

    EncryptedMessage res = EncryptedMessage(encMessage);
    return res;
}

string getXmlValue(string xmlString, const char * xmlNodeName) {
    vector<char> xml_copy(xmlString.begin(), xmlString.end());
    xml_copy.push_back('\0');
    rapidxml::xml_document<> doc;
    rapidxml::xml_node<> * root_node;
    rapidxml::xml_node<> * mes_node;

    doc.parse<rapidxml::parse_declaration_node | rapidxml::parse_no_data_nodes>(&xml_copy[0]);
    root_node = doc.first_node("scramble");
    return root_node->first_node(xmlNodeName)->value();
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