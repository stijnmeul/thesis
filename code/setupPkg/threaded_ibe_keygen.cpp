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

void *connection_handler(void *);
string extract(char * id, Big s);

int bytes_per_big = 80;

//PFC pfc(AES_SECURITY);

struct ThreadParams {
	int s;
	int sockfd;
	PFC *pfc;
};

int main(int argc, char *argv[])
{
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
    mr_init_threading();

    while( (newsockfd = accept(sockfd, (struct sockaddr *) &cli_addr, &clilen) )){
        cout << "newsockfd: " << newsockfd << endl;
        if (newsockfd < 0)
            error("ERROR on accept");

        // Initialise new thread
        pthread_t sniffer_thread;
        //pthread_attr_t attributes;
        ThreadParams *params = new ThreadParams; // params is a pointer to a threadParams struct
		params->sockfd = newsockfd;
		params->pfc = new PFC(AES_SECURITY); // MEMORY LEAK: this pointer is never being freed! :o
		if(newsockfd == 4)
			params->s = 42;
		else params->s = 100;
        if( pthread_create( &sniffer_thread , NULL ,  connection_handler , params) < 0 )
            perror("ERROR on creating thread");
    }
    mr_end_threading();

	return 0;
}

// The following function is executed concurrently with other threads
void *connection_handler(void *arg) {
	Miracl *myMiracl = new Miracl(100,0);
	//Big s;

	//G1 Q1;
	//(*pfc).hash_and_map(Q1, (char *) "Stijn");
	//cout << "Q1" << endl << Q1.g << endl;
	cout << "Started sleeping..." << endl << endl;
	sleep(5);
	cout << "Waking up..." << endl << endl;

	char buffer[BUF_SIZE];
	ThreadParams * params = (ThreadParams*)(arg);
	int sockfd = params->sockfd;
	cout << "sockfd is " << sockfd << endl;
	cout << "passed additional parameter is " << params->s << endl;
	// Read out socket.
    int n = recv(params->sockfd,buffer,sizeof(buffer),0);
    if (n < 0)
    	error("ERROR reading from socket");


    //string ext_pvt_key = extract(buffer, params->s, *(params->pfc));
    cout << "Received ID:" << endl << buffer << endl;
    //cout << "Extracted private key:" << endl << ext_pvt_key << endl;
    string ext_pvt_key("testje");
    strcpy(buffer, ext_pvt_key.c_str());

    n = send(sockfd,buffer,sizeof(buffer),0);

    if (n < 0) error("ERROR writing to socket");


    delete params;

    //delete pfc;
    delete myMiracl;
    close(sockfd);

    pthread_cancel(pthread_self());
    pthread_detach(pthread_self());


    return NULL;
}

//string extract(char * id, Big s) {
	//Big s is a global variable!
	/**********
	* EXTRACT
	***********/
/*	G1 Q1, D;
	// hash public key of Alice to Q1
	pfc.hash_and_map(Q1, (char*)id);
	// Calculate private key of Alice as D=s.Q1
	D = pfc.mult(Q1, s);

	cout << "Value of s in extract is " << s << endl;

	return toString(D);
}*/
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