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

   g++-4.7 setupDkg.cpp shamir.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp -I ../cppmiracl/include/ -L ../cppmiracl/source/ -l miracl -o setupDkg
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
#include "shamir.h"

#define HASH_LEN 32
#define TAG_LEN 16

#define NB_OF_SHARES 6
#define THRESHOLD 3
#define HTDOCS_BASE "/Applications/XAMPP/htdocs/thesis/dkg/"
#define ENCRYPTED_KEY_FILENAME HTDOCS_BASE "encrypted_msk.key"

Big lagrange(int i, int *reconstructionPoints, int degree, Big order);
Big lagrange(int i, share_t *reconstructionPoints, int degree, Big order);
Big retrieveSecret(share_t *reconstructonPoints, int degree, Big order);


PFC pfc(AES_SECURITY);

int main()
{
	G2 P, Ppub;
	G1 Qid, Qjprivid, D;
	Big s, s2, h1, h2, q;
	big temp;

	char * pwd;

	miracl* mip = get_mip();
	mip->IOBASE = 64;

	// SETUP
	char seed[2];
	FILE *fp;
    fp = fopen("/dev/urandom", "r");
    int bytes_read = fread(&seed, 1, 2, fp);
    fclose(fp);

    irand((long)seed);
	pfc.random(s);

	// Choose a random generator P elementof G2
	pfc.random(P);
	pfc.precomp_for_mult(P);

	Big order = pfc.order();
	vector <DKG> serverlist;

	// Initialise all servers and put them in a list
	for (int i = 0; i < NB_OF_SHARES; i++) {
		int serverId = i + 1; // ServerId must be between 1 and NB_OF_SHARES
		pfc.random(s);
		serverlist.push_back(DKG(serverId, NB_OF_SHARES, THRESHOLD, order, &pfc, P, s));
	}

	// Servers connect to each other to receive their share
	for (int i = 0; i < NB_OF_SHARES; i++) {
		serverlist.at(i).getSharesFrom(serverlist);
	}

	/***
	* RECALCULATE THE SECRET BASED ON THRESHOLD NB OF SHARES
	***/
	cout << "Get all secret shares from Server 0, 1, 2, 3 and 4" << endl;
	share_t shares0[NB_OF_SHARES];
	share_t shares1[NB_OF_SHARES];
	share_t shares2[NB_OF_SHARES];
	share_t shares3[NB_OF_SHARES];
	share_t shares4[NB_OF_SHARES];

	serverlist[0].getShares(shares0, NB_OF_SHARES);
	serverlist[1].getShares(shares1, NB_OF_SHARES);
	serverlist[2].getShares(shares2, NB_OF_SHARES);
	serverlist[3].getShares(shares3, NB_OF_SHARES);
	serverlist[4].getShares(shares4, NB_OF_SHARES);
	share_t reconstructionPoints0[THRESHOLD];
	share_t reconstructionPoints1[THRESHOLD];
	share_t reconstructionPoints2[THRESHOLD];
	share_t reconstructionPoints3[THRESHOLD];
	share_t reconstructionPoints4[THRESHOLD];

	cout << "Walking through shares0:" << endl;
	for (int i = 0; i < NB_OF_SHARES; i++) {
		cout << "storing server: " << shares0[i].x << " shareGenerator: " << shares0[i].shareGenerator << endl;
	}

	cout << "Walking through shares1:" << endl;
	for (int i = 0; i < NB_OF_SHARES; i++) {
		cout << "storing server: " << shares1[i].x << " shareGenerator: " << shares1[i].shareGenerator << endl;
	}

	reconstructionPoints0[0] = shares0[0];
	reconstructionPoints0[1] = shares1[0];
	reconstructionPoints0[2] = shares2[0];

	cout << "Walking through reconstructionPoints0:" << endl;
	for (int i = 0; i < THRESHOLD; i++) {
		cout << "storing server: " << reconstructionPoints0[i].x << " shareGenerator: " << reconstructionPoints0[i].shareGenerator << endl;
	}
	cout << endl;

	cout << "Result of Lagrange interpolation on reconstructionPoints0" << endl << retrieveSecret(reconstructionPoints0, THRESHOLD, order)  << endl;

	reconstructionPoints1[0] = shares0[1];
	reconstructionPoints1[1] = shares1[1];
	reconstructionPoints1[2] = shares2[1];


	cout << "Walking through reconstructionPoints1:" << endl;
	for (int i = 0; i < THRESHOLD; i++) {
		cout << "storing server: " << reconstructionPoints1[i].x << " shareGenerator: " << reconstructionPoints1[i].shareGenerator << endl;
	}
	cout << endl;

	reconstructionPoints2[0] = shares0[2];
	reconstructionPoints2[1] = shares1[2];
	reconstructionPoints2[2] = shares2[2];

	Big sumOfSecrets = 0;
	sumOfSecrets += retrieveSecret(reconstructionPoints0, THRESHOLD, order);
	sumOfSecrets %= order;
	sumOfSecrets += retrieveSecret(reconstructionPoints1, THRESHOLD, order);
	sumOfSecrets %= order;
	sumOfSecrets += retrieveSecret(reconstructionPoints2, THRESHOLD, order);
	sumOfSecrets %= order;
	cout << "interpolationResult from server 0, 1 and 2" << endl << sumOfSecrets << endl;

	cout << "Recalculation of secret based on servers 2, 3 and 4" << endl;
	reconstructionPoints0[0] = shares3[0];
	reconstructionPoints0[1] = shares4[0];

	reconstructionPoints1[0] = shares3[1];
	reconstructionPoints1[1] = shares4[1];

	reconstructionPoints2[0] = shares3[2];
	reconstructionPoints2[1] = shares4[2];

	sumOfSecrets = 0;
	sumOfSecrets += retrieveSecret(reconstructionPoints0, THRESHOLD, order);
	sumOfSecrets %= order;
	sumOfSecrets += retrieveSecret(reconstructionPoints1, THRESHOLD, order);
	sumOfSecrets %= order;
	sumOfSecrets += retrieveSecret(reconstructionPoints2, THRESHOLD, order);
	sumOfSecrets %= order;

	cout << "interpolationResult from server 2, 3 and 4" << endl << sumOfSecrets << endl;

	// Check step 4 of keygen
	const char * id = "Stijn";
	Ppub = serverlist.at(0).getSjP();
	Qjprivid = serverlist.at(0).extract((char*)id);
	GT comp1 = pfc.pairing(P, Qjprivid);
	pfc.hash_and_map(Qid, (char*)"Stijn");
	GT comp2 = pfc.pairing(Ppub, Qid);
	if(comp1 == comp2) {
		cout << "Step 4 of KeyGen works!" << endl;
	} else {
		cout << "Step 4 of KeyGen fails!" << endl;
	}

	cout << endl << endl;

	vector <G1> Qprivs;
	int recServ1, recServ2, recServ3;
	int recServers[3];

	recServ1 = 3;
	recServ2 = 2;
	recServ3 = 4;
	Qprivs.push_back(serverlist.at(recServ1).extract((char*)id));
	Qprivs.push_back(serverlist.at(recServ2).extract((char*)id));
	Qprivs.push_back(serverlist.at(recServ3).extract((char*)id));
	recServers[0] = recServ1;
	recServers[1] = recServ2;
	recServers[2] = recServ3;

	for (int i = 0; i < THRESHOLD; i++) {
		Big l = lagrange(i, recServers, THRESHOLD, order);
		D = D + pfc.mult(Qprivs.at(i), l);
	}
	cout << "D based on servers " << recServ1 << ", " << recServ2 << " and " << recServ3 << endl << D.g << endl;
	Qprivs.clear();

	recServ1 = 1;
	recServ2 = 5;
	recServ3 = 2;
	Qprivs.push_back(serverlist.at(recServ1).extract((char*)id));
	Qprivs.push_back(serverlist.at(recServ2).extract((char*)id));
	Qprivs.push_back(serverlist.at(recServ3).extract((char*)id));

	recServers[0] = recServ1;
	recServers[1] = recServ2;
	recServers[2] = recServ3;
	G1 D1;
	for (int i = 0; i < THRESHOLD; i++) {
		Big l = lagrange(i, recServers, THRESHOLD, order);
		D1 = D1 + pfc.mult(Qprivs.at(i), l);
	}
	cout << "D based on servers " << recServ1 << ", " << recServ2 << " and " << recServ3 << endl << D1.g << endl;

    return 0;
}


Big lagrange(int i, int *reconstructionPoints, int degree, Big order) {
	Big z = 1;
	for (int k = 0; k < degree; k++) {
		if(k != i) {
			z = modmult(z, moddiv( (order - (Big)reconstructionPoints[k]), ((Big)reconstructionPoints[i] - (Big)reconstructionPoints[k]), order), order);
		}
	}
	return z;
}

// Calculates l_i(0)
Big lagrange(int i, share_t *reconstructionPoints, int degree, Big order) {
	Big z = 1;
	for (int k = 0; k < degree; k++) {
		if(k != i) {
			z = modmult(z, moddiv( (order - reconstructionPoints[k].x), (reconstructionPoints[i].x - reconstructionPoints[k].x), order), order);
		}
	}
	return z;
}
// Calculates f(x) = Sum(j=0..2)(y_i . l_i(x)) for x = 0
Big retrieveSecret(share_t *reconstructonPoints, int degree, Big order) {
	Big interpolationResult = 0;
	for (int i = 0; i < degree; i++) {
		Big l = lagrange(i, reconstructonPoints, degree, order);
		interpolationResult += modmult(l, reconstructonPoints[i].y, order);
		interpolationResult %= order;
	}
	return interpolationResult;
}