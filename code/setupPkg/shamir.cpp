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
#include "shamir.h"
#include <termios.h>
#include <unistd.h>
#include <iostream>
#include <fstream>
#include <bitset>
#include <vector>
#include <stdexcept>

#define NB_OF_SHARES 6
#define THRESHOLD 3

Big lagrange(int i, share_t *reconstructionPoints, int degree, Big order);
Big retrieveSecret(share_t *reconstructonPoints, int degree, Big order);

PFC pfc(AES_SECURITY);

int main()
{

	G2 P, Ppub;
	Big s, randCoef, qi, ai;
	Big poly[THRESHOLD];
	Big order = pfc.order();
	share_t shares[NB_OF_SHARES];
	vector <Server> serverlist;

	time_t seed;            // crude randomisation
	time(&seed);
    irand((long)seed);

	// Initialise all servers and put them in a list
	for (int i = 0; i < NB_OF_SHARES; i++) {
		serverlist.push_back(Server(i, NB_OF_SHARES, THRESHOLD, order));
	}

	// Servers connect to each other to receive their share
	for (int i = 0; i < NB_OF_SHARES; i++) {
		serverlist.at(i).getSharesFrom(serverlist);
	}


	serverlist[0].getShares(shares, NB_OF_SHARES);

	/***
	* RECALCULATE THE SECRET BASED ON THRESHOLD NB OF SHARES
	***/
	cout << "Recalculation of secret based on point 1, 2 and 3" << endl;
	share_t reconstructionPoints[THRESHOLD];
	reconstructionPoints[0] = shares[0];
	reconstructionPoints[1] = shares[1];
	reconstructionPoints[2] = shares[2];
	cout << "interpolationResult" << endl << retrieveSecret(reconstructionPoints, THRESHOLD, order) << endl;

	cout << "Recalculation of secret based on point 1, 3 and 4" << endl;
	reconstructionPoints[0] = shares[0];
	reconstructionPoints[1] = shares[2];
	reconstructionPoints[2] = shares[3];
	cout << "interpolationResult" << endl << retrieveSecret(reconstructionPoints, THRESHOLD, order) << endl;

	cout << "Recalculation of secret based on point 3, 4 and 5" << endl;
	reconstructionPoints[0] = shares[2];
	reconstructionPoints[1] = shares[3];
	reconstructionPoints[2] = shares[4];
	cout << "interpolationResult" << endl << retrieveSecret(reconstructionPoints, THRESHOLD, order) << endl;

	serverlist[1].getShares(shares, NB_OF_SHARES);

	/***
	* RECALCULATE THE SECRET BASED ON THRESHOLD NB OF SHARES
	***/
	cout << "Recalculation of secret based on point 1, 2 and 3" << endl;
	reconstructionPoints[THRESHOLD];
	reconstructionPoints[0] = shares[0];
	reconstructionPoints[1] = shares[1];
	reconstructionPoints[2] = shares[2];
	cout << "interpolationResult" << endl << retrieveSecret(reconstructionPoints, THRESHOLD, order) << endl;

	cout << "Recalculation of secret based on point 1, 3 and 4" << endl;
	reconstructionPoints[0] = shares[0];
	reconstructionPoints[1] = shares[2];
	reconstructionPoints[2] = shares[3];
	cout << "interpolationResult" << endl << retrieveSecret(reconstructionPoints, THRESHOLD, order) << endl;

	cout << "Recalculation of secret based on point 3, 4 and 5" << endl;
	reconstructionPoints[0] = shares[2];
	reconstructionPoints[1] = shares[3];
	reconstructionPoints[2] = shares[4];
	cout << "interpolationResult" << endl << retrieveSecret(reconstructionPoints, THRESHOLD, order) << endl;


    return 0;
}

// Generate a random secret polynomial for internal use
void Server::generatePolynomial(int threshold) {
	Big randCoef;

	// Pick a random secret S
	pfc.random(secret);

	// A THRESHOLD-1 degree polynomial is randomly chosen such that poly(0)=s
	poly[0] = secret;

	// Generate THRESHOLD-1 random numbers
	for (int i = 1; i < threshold; i++) {
		pfc.random(randCoef);
		poly[i] = randCoef;
	}
}

// Generate a share for each participating server
void Server::generateShares(int nbOfShares, int threshold) {
	share_t pointOnCurve;
	for (int i = 0; i < nbOfShares; i++) {
		pfc.random(pointOnCurve.x);

		Big qi=secret;
		Big ai = pointOnCurve.x;
		for (int k = 1; k < threshold; k++)
		{ // evaluate polynomial a0+a1*x+a2*x^2... for x=i; => result is  q(i)
			qi += modmult(poly[k], ai, order);
			ai = modmult(ai, ai, order);
			qi %= order;
		}
		pointOnCurve.y = qi;
		pointOnCurve.fromServer = serverId;
		pointOnCurve.toServer = i;
		myShares[i] = pointOnCurve;
		cout << "i" << endl << i << endl;
	}
}

void Server::getSharesFrom(vector <Server> serverlist) {
	int nbOfShares = serverlist.size();
	if(this->nbOfShares != nbOfShares )
		throw invalid_argument("Please provide a serverlist that contains as many servers as the total number of shares");
	for (int i = 0; i < nbOfShares; i++) {
		int servId = serverlist.at(i).getServerId();
		receivedShares[servId] = serverlist.at(i).getShareOf(servId);
	}
}

// Note: normally a server would have to authenticate itself before being able to receive its share
share_t Server::getShareOf(int serverId) {
	return this->myShares[serverId];
}

Server::Server(int serverId, int nbOfShares, int threshold, Big order) {
	if (serverId > nbOfShares)
		throw invalid_argument("Please provide a serverID between 0 and nbOfShares - 1");
	this->serverId = serverId;
	this->myShares = new share_t[nbOfShares]();
	this->receivedShares = new share_t[nbOfShares]();
	this->poly = new Big[threshold];
	this->order = order;
	this->nbOfShares = nbOfShares;
	generatePolynomial(threshold);
	generateShares(nbOfShares, threshold);
	// Assign a generated share to this server as well
	receivedShares[serverId] = myShares[serverId];
}

Big lagrange(int i, share_t *reconstructionPoints, int degree, Big order) {
	Big z = 1;
	for (int k = 0; k < degree; k++) {
		if(k != i)
			z = modmult(z, moddiv((order-reconstructionPoints[k].x), (reconstructionPoints[i].x-reconstructionPoints[k].x), order), order);
	}
	return z;
}

Big retrieveSecret(share_t *reconstructonPoints, int degree, Big order) {
	Big interpolationResult = 0;
	for (int i = 0; i < degree; i++) {
		Big l = lagrange(i, reconstructonPoints, degree, order);
		interpolationResult += modmult(l, reconstructonPoints[i].y, order);
		interpolationResult %= order;
	}
	return interpolationResult;
}