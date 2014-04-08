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

   g++-4.7 ibe_pkg_setup.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp -I ../cppmiracl/include/ -L ../cppmiracl/source/ -l miracl -o ibe_pkg_setup
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
#include <bitset>

#define HASH_LEN 32
#define TAG_LEN 16

int main()
{
	PFC pfc(AES_SECURITY);

	G2 P, Ppub;
	Big s, s2, h1, h2, q;
	big temp;

	char * pwd;

	miracl* mip = get_mip();
	mip->IOBASE = 16;

	ifstream file;
	ofstream outputFile;
	ofstream unencFile;
	file.open("encrypted_msk.key");

	if(file.is_open()) {
		cout << "encrypted_msk.key file already exists. Terminating to prevent losing the MSK." << endl;
		cout << "If you want to restart the system using the previous MSK please execute ./restartPKG" << endl;
		file.close();
		return 0;
	} else {
		file.close();
		outputFile.open("encrypted_msk.key", ios::out | ios::binary);
	}

	/**********
	* SETUP
	*
	* happens at the side of the TA
	***********/

	// Choose a random generator P elementof G2
	pfc.random(P);
	// If an element of G1, G2 or GT is fixed, then it can be
	// precomputed on, using pfc.precomp_for_mult() for G1 and G2
	// and pfc.precomp_for_power() for GT
	// P becomes read-only from this point onwards
	pfc.precomp_for_mult(P);

	// Pick a random s elementof Z_q
	// Normally this would be pfc.random(s) Such random numbers are not safe however.
	q = pfc.order();
	csprng *rng;
	int rawlen = 64;
	time_t tod;

	time(&tod);

    char raw[rawlen];
    FILE *fp;
    fp = fopen("/dev/urandom", "r");
    int bytes_read = fread(&raw, 1, rawlen, fp);
    fclose(fp);
	strong_init(rng, rawlen, raw, tod);
	s = strong_rand(rng, q);
	strong_kill(rng);

	// Set Ppub = sP
	Ppub = pfc.mult(P, s);
	// At the end of the SETUP algorithm P and Ppub are public. s is the Master Secret Key.


	/**********
	*
	*  Ask for a password to encrypt the new setup key.
	*
	**********/
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

	// Hash password string to two 128 bit big numbers h1 and h2.
	mip->IOBASE = 256;
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
	outputFile.write(C, bytes_per_big);
	outputFile.write(T, TAG_LEN);
	outputFile.close();
	cout << "MSK successfully generated!" << endl;
	cout << "MSK is stored in encrypted format in encrypted_msk.key. Please do not forget your password. " << endl;

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

    return 0;
}
