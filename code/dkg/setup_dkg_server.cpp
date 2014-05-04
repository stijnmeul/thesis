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

   g++-4.7 setup_dkg_server.cpp shamir.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp -I ../cppmiracl/include/ -L ../cppmiracl/source/ -l miracl -o setup_dkg_server
*/

//********* choose just one of these pairs **********
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
#include <sys/stat.h>
#include "shamir.h"

#define HASH_LEN 32
#define TAG_LEN 16
#define BYTES_PER_BIG 80
#define DKG_DIR "/Applications/XAMPP/htdocs/thesis/" // In this folder a subfolder dkgxx will be created with xx = id specified at startup

#define THRESHOLD 3

void storeMSK(Big s, int servId, string mskPath);
bool retrieveMSK(char * plain, int servId, string mskPath);

int main(int argc, char * argv[])
{
	PFC pfc(AES_SECURITY);
	ifstream file;
	ofstream outputFile;
	Big s;
	Big order = pfc.order();
	miracl* mip = get_mip();

	int servId;
	const char * serverlist;
	cout << endl;

	if(argc != 3) {
		cout << "Please provide:" << endl << "* a unique ID for this DKG server between 1 and the total number of servers," << endl <<"* a path to a file listing all servers. " << endl << "Command usage should be:" << endl;
		cout << "./setup_dkg_server.cpp id servers.list" << endl << endl;
		return 0;
	} else  {
		servId = atoi(argv[1]);
		serverlist = argv[2];
	}
	string dkgDir = (string)DKG_DIR + "dkg" + argv[1] + "/";
	mkdir(dkgDir.c_str(), S_IRWXU);
	string mskFile = dkgDir + (string)"encrypted_msk.key";

	// Check if serverlist is correct and whether serverID is between 1 and the total nb of servers
	file.open(serverlist);
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
		string serverlistLocation = dkgDir + "servers.list";
		ifstream  src(serverlist, std::ios::binary);
     	ofstream  dst(serverlistLocation.c_str(), std::ios::binary);
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

	G2 P;
	// The first DKG server decides which P value is used
	if(servId == 1) {
		pfc.random(P);
		outputFile.open((dkgDir + "P.key").c_str(), ios::out | ios::binary);
		string toStr = toString(P);
		outputFile.write(toStr.c_str(), toStr.length());
		outputFile.close();
	}
	// TODO: what if servId != 1? P is not initialised!
	DKG dkg = DKG(servId, nbOfServers, THRESHOLD, order, &pfc, P, s);

	cout << endl;
	return 0;
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