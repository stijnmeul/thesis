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

   g++-4.7 ibe_pkg_keygen.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp ../cppmiracl/source/mrgcm.c ../cppmiracl/source/mraes.c -I ../cppmiracl/include/ -L ../cppmiracl/source/ -l miracl -o ibe_pkg_keygen
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

#define MR_PAIRING_BLS    // AES-256 security
#define AES_SECURITY 256
//*********************************************

#include "../../cppmiracl/source/pairing_3.h"
#include "ibe_pkg.h"
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

#define HASH_LEN 32
#define TAG_LEN 16
#define PORT_NB 5000
#define BUF_SIZE 4096

PFC pfc(AES_SECURITY);  // initialise pairing-friendly curve
int bytes_per_big = (MIRACL/8)*(get_mip()->nib-1);

int main(int argc, char *argv[])
{
	/*************************************************
    *     Decrypt the MSK from encrypted_msk.key 	 *
    **************************************************/
	char Cread[bytes_per_big];
	char Tread[TAG_LEN];
	char T[TAG_LEN];
	char plain[bytes_per_big];
	char msk[bytes_per_big];
	char * pwd;
	char hash[HASH_LEN];
	Big s;

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

    cout << "Please insert a password to encrypt the master secret key:";

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
	file.open("encrypted_msk.key", ios::in | ios::binary);
	file.read(Cread, bytes_per_big);
	file.read(Tread, TAG_LEN);
	file.close();

	// Decrypt MSK
	gcm_init(&g, HASH_LEN/2, hash1, HASH_LEN/2, hash2);
	gcm_add_cipher(&g, GCM_DECRYPTING, plain, bytes_per_big, Cread);
	gcm_finish(&g,T); // Overwrite previous T value

	bool encryptedIsDecrypted = true;
	for (int i = 0; i < TAG_LEN; i++) {
		if(T[i] != Tread[i]) {
			cout << "T[" << i << "]: " << T[i] << "      Tread[" << i << "]: " << Tread[i] << endl;
			encryptedIsDecrypted = false;
		}
	}
	if(!encryptedIsDecrypted) {
		cout << "The given password " << argv[1] << " appears to be incorrect." << endl;
		cout << "Incorrect password specified. Terminating extraction process." << endl;
		return 0;
	}
	s = from_binary(bytes_per_big, plain);

	cout << "Recovered MSK:" << endl << s << endl;


    /*************************************************
    * Initialise server side socket for PKG purposes *
    **************************************************/
    int sockfd, newsockfd;
    socklen_t clilen;

    char buffer[BUF_SIZE];
    struct sockaddr_in serv_addr, cli_addr;
    int n;

    // Initialise the socket descriptor.
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0)
        error("ERROR opening socket");
    // Set buffer to zero
    memset((char *) &serv_addr,'0',sizeof(serv_addr));

    // Bind socket to port
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = INADDR_ANY;
    serv_addr.sin_port = htons(PORT_NB);
    if (bind(sockfd, (struct sockaddr *) &serv_addr, sizeof(serv_addr)) < 0)
        error("ERROR on binding");

     // Listen to socket and accept incoming connections
    listen(sockfd,5);
    while(1){
        memset((char *) &buffer,0,sizeof(buffer));
        clilen = sizeof(cli_addr);
        newsockfd = accept(sockfd, (struct sockaddr *) &cli_addr, &clilen);
        if (newsockfd < 0)
            error("ERROR on accept");

        // Read out socket.
        n = read(newsockfd,buffer,sizeof(buffer));
        if (n < 0)
        	error("ERROR reading from socket");

        string ext_pvt_key = extract(buffer, s);
        cout << "Received ID:" << endl << buffer << endl;
        cout << "Extracted private key:" << endl << ext_pvt_key << endl;

        strcpy(buffer, ext_pvt_key.c_str());

        n = write(newsockfd,buffer,sizeof(buffer));

        if (n < 0) error("ERROR writing to socket");

        close(newsockfd);
        sleep(1);
    }


	return 0;
}

string extract(char * id, Big s) {
	/**********
	* EXTRACT
	***********/
	G1 Q1, D;
	// hash public key of Alice to Q1
	pfc.hash_and_map(Q1, (char*)id);
	// Calculate private key of Alice as D=s.Q1
	D = pfc.mult(Q1, s);

	return toString(D);
}
/*
float getExecutionTime(float begin_time) {
	return float( clock () - begin_time ) /  CLOCKS_PER_SEC;
}*/

	/*

	outputFile.open("unenc_msk.key");
	outputFile.write(msk, bytes_per_big);
	outputFile.close();

	// Read encrypted MSK from file
	file.open("encrypted_msk.key", ios::in | ios::binary);
	file.read(Cread, bytes_per_big);
	file.read(Tread, TAG_LEN);
	file.close();

	// Check whether Cread equals C
	bool readIsWrite = true;
	for (int i = 0; i < bytes_per_big; i++) {
		if(C[i] != Cread[i]) {
			cout << "For i: " << i << "C[i] does not equal Cread[i]!" << endl;
			readIsWrite = false;
		}
	}
	for (int i = 0; i < TAG_LEN; i++) {
		if(T[i] != Tread[i]) {
			cout << "For i: " << i << "T[i] does not equal Tread[i]!" << endl;
			readIsWrite = false;
		}
	}
	if(readIsWrite) {
		cout << "Cread equals C and tags match!" << endl;
	}

	// Decrypt MSK
	gcm_init(&g, HASH_LEN/2, hash1, HASH_LEN/2, hash2);
	gcm_add_cipher(&g, GCM_DECRYPTING, plain, bytes_per_big, Cread);
	gcm_finish(&g,T); // Overwrite previous T value

	bool encryptedIsDecrypted = true;
	for (int i = 0; i < TAG_LEN; i++) {
		if(T[i] != Tread[i]) {
			cout << "For i: " << i << "Decrypted T[i] does not equal Tread[i]!" << endl;
			encryptedIsDecrypted = false;
		}
	}
	for (int i = 0; i < bytes_per_big; i++) {
		if(msk[i] != plain[i]) {
			cout << "For i: " << i << "Decrypted plain[i] does not equal msk[i]!" << endl;
			encryptedIsDecrypted = false;
		}
	}
	if(encryptedIsDecrypted) {
		cout << "Encrypted content equals decrypted content!" << endl;
	}
	s2 = from_binary(bytes_per_big, plain);

	if(s == s2) {
		cout << "Big MSK s equals Big MSK s2!" << endl;
	}
*/