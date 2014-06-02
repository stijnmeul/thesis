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

   g++-4.7 start_dkg_server.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp -I ../cppmiracl/include/ -L ../cppmiracl/source/ -l miracl -o start_dkg_server
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

#include "../cppmiracl/source/pairing_3.h"
#include "ibe_pkg.h"
#include <termios.h>
#include <unistd.h>
#include <iostream>
#include <fstream>
#include <cstdlib>

#define HASH_LEN 32
#define TAG_LEN 16
#define BYTES_PER_BIG 80

int main(int argc, char * argv[])
{
	PFC pfc(AES_SECURITY);
	int servId, portNb;
	const char * servlist;
	Big s;
	ifstream file;

	if(argc != 4) {
		cout << "Please provide:" << endl << "* a unique ID for this DKG server between 1 and the total number of servers," << endl << "* a port number for this DKG server," << endl << "* a path to a file listing all servers. " << endl << "Command usage should be:" << endl;
		cout << "./start_dkg_server id portnumber server.list" << endl;
		return 0;
	} else  {
		servlist = argv[1];
		servId = atoi(argv[2]);
		portNb = atoi(argv[3]);
	}

	file.open(servlist);
	if(!file.is_open()) {
		cout << "Please provide a path to an existing server.list file" << endl;
		file.close();
		return 0;
	} else {
		file.close();
	}

	/*************************************************
    *     Decrypt the MSK from encrypted_msk.key 	 *
    **************************************************/
	char Cread[BYTES_PER_BIG];
	char Tread[TAG_LEN];
	char T[TAG_LEN];
	char plain[BYTES_PER_BIG];
	char msk[BYTES_PER_BIG];
	char * pwd;
	char hash[HASH_LEN];

	gcm g;
	sha256 sh;
	termios oldt;

    cout << "Please insert a password to decrypt the master secret key:";

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
			cout << "T[" << i << "]: " << T[i] << "      Tread[" << i << "]: " << Tread[i] << endl;
			encryptedIsDecrypted = false;
		}
	}
	if(!encryptedIsDecrypted) {
		cout << "Incorrect password specified. Terminating extraction process." << endl;
		return 0;
	} else {
		cout << "Successfully extracted the MSK." << endl;
	}


   return 0;
}