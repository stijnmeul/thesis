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

   g++-4.7 ibe_pkg_extract.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp ../cppmiracl/source/mrgcm.c ../cppmiracl/source/mraes.c -I ../cppmiracl/include/ -L ../cppmiracl/source/ -l miracl -o ibe_pkg_extract
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

#define HASH_LEN 32
#define TAG_LEN 16

int main(int argc, char *argv[])
{
	PFC pfc(AES_SECURITY);  // initialise pairing-friendly curve
	int bytes_per_big = (MIRACL/8)*(get_mip()->nib-1);
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
	if(argc > 1) {
		pwd = argv[1];
	} else {
		cout << "Please specify a password to decrypt the encrypted_msk.key" << endl;
		return 0;
	}
	shs256_init(&sh);
	while (*pwd!=0) {
		shs256_process(&sh,*pwd++);
		shs256_hash(&sh,hash);
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
			encryptedIsDecrypted = false;
		}
	}
	if(!encryptedIsDecrypted) {
		cout << "Incorrect password specified. Terminating extraction process." << endl;
		return 0;
	}
	s = from_binary(bytes_per_big, plain);

	cout << "Recovered MSK:" << endl << s << endl;

	return 0;
}

	/**********
	* EXTRACT
	*
	* happens at the side of the TA
	* later on Alice receives D over a secure channel
	***********/
/*	begin_time = clock();

	// hash public key of Alice to Q1
	pfc.hash_and_map(Q1, (char*)id);
	// Calculate private key of Alice as D=s.Q1
	D = pfc.mult(Q1, s);

	ext_time = getExecutionTime(begin_time);


	res << D.g;
    res.str();
    return 0;
}

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
