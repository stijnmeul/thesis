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

   g++-4.7 setupDkg.cpp pkg.cpp ../mapToDate.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp -I ../cppmiracl/include/ -L ../cppmiracl/source/ -l miracl -o setupDkg
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

#include "../commonparams.h"
//*********************************************

#include "ibe_pkg.h"
#include <termios.h>
#include <unistd.h>
#include <iostream>
#include <fstream>
#include <bitset>
#include "pkg.h"
#include "../mapToDate.h"

#define NB_OF_SHARES 6
#define THRESHOLD 3
#define HTDOCS_BASE "/Applications/XAMPP/htdocs/thesis/pkg/"
#define ENCRYPTED_KEY_FILENAME HTDOCS_BASE "encrypted_msk.key"

G1 getSecretKey(int (&contactedServers)[THRESHOLD], vector <G1> Qprivs, Big order, PFC *pfc);
G2 getPpub(int (&contactedServers)[THRESHOLD], vector <G2> Ppubs, Big order, PFC *pfc);
Big lagrange(int i, int *reconstructionPoints, int degree, Big order);

PFC pfc(AES_SECURITY);

int main()
{
	G2 P, Ppub;
	G1 Qid, Qjprivid;
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

	Big order = pfc.order();
	vector <PKG> serverlist;
	pfc.random(P);
	PKG leaderPKG = PKG(1, 1,NB_OF_SHARES, THRESHOLD, order, &pfc, P, s);
	cout << "leaderPKG.getState()" << endl << leaderPKG.getState() << endl;
	serverlist.push_back(leaderPKG);
	// Initialise the other servers and put them in a list
	for (int i = 1; i < NB_OF_SHARES; i++) {
		int serverId = i + 1; // ServerId must be between 1 and NB_OF_SHARES
		pfc.random(s);
		serverlist.push_back(PKG(serverId, i, NB_OF_SHARES, THRESHOLD, order, &pfc, s));
		cout << "server " << serverId << " after initialisation"<< endl << serverlist.at(i).getState() << endl;
	}

	// Server 1 distributes his P value to the other servers
	P = serverlist.at(0).getP();
	for (int i = 1; i < NB_OF_SHARES; i++) {
		serverlist.at(i).setP(P);
		cout << "server " << i+1 << " after P distribution"<< endl << serverlist.at(i).getState() << endl;
	}

	// In ascending order, each server spreads its shares
	for (int j = 0; j < NB_OF_SHARES; j++) { // j is the ID of the distributing server
		//DKG distribServer = serverlist.at(j); <- don't do this, this makes a new distribServerobject that doesn't change the state of the original one
		for (int i = 0; i < NB_OF_SHARES; i++) {
			int recServId = i+1;
			if(j != i) {
				cout << "Server " << j+1 << " has distributed his share to server " << recServId << endl;
				share_t aShare = serverlist.at(j).getShareOf(recServId);
				serverlist.at(i).setShare(aShare);

				cout << "State of all servers is " << endl;
				for (int k = 0; k < NB_OF_SHARES; k++) {
					cout << "Server " << k+1 << " has state: " << serverlist.at(k).getState() << " and lastReceivedShareGenerator: " << serverlist.at(k).getLastReceivedShareGenerator() << endl;
				}
				cout << endl << endl;
			}
		}
	}

	// Each server can now start to accept client requests for key generation
	const char * id = "Stijn";
	string idString = "";
	idString = idString + id;
	idString = mapToDate(idString);
	pfc.hash_and_map(Qid, (char*)idString.c_str());

	int contactedServers[THRESHOLD];
	int contactedServers2[THRESHOLD];
	for(int i = 0; i < THRESHOLD; i++) {
		contactedServers[i] = i+1;
		contactedServers2[i] = i+2;
	}
	//G1 D = getSecretKey((char*)id, contactedServers, serverlist, order);
	vector <G1> Qprivs;
	vector <G2> Ppubs;
	for (int i = 0; i < THRESHOLD; i++) {
		PKG contactedServer = serverlist.at(contactedServers[i]);
		Qjprivid = contactedServer.extract((char*)id);
		Qprivs.push_back(Qjprivid);
		Ppub = contactedServer.getSjP();
		Ppubs.push_back(Ppub);
		P = contactedServer.getP();
		GT QprivP = pfc.pairing(P, Qjprivid);
        GT QidPpub = pfc.pairing(Ppub, Qid);
        if(QprivP == QidPpub) {
        	cout << endl << "Rock and roll baby!" << endl;
        }
	}
	G1 D = getSecretKey(contactedServers, Qprivs, order, &pfc);
	Ppub = getPpub(contactedServers, Ppubs, order, &pfc);

	cout << "D based on servers " << contactedServers[0] << ", " << contactedServers[1] << " and " << contactedServers[2] << endl << D.g << endl;
	cout << "Ppub based on servers " << contactedServers[0] << ", " << contactedServers[1] << " and " << contactedServers[2] << endl << Ppub.g << endl;


	Qprivs.clear();
	Ppubs.clear();
	//int contactedServers2[3] = {3, 4, 5};
	//D = getSecretKey((char*)id, contactedServers2, serverlist, order);
	for (int i = 0; i < THRESHOLD; i++) {
		PKG contactedServer = serverlist.at(contactedServers2[i]);
		Qjprivid = contactedServer.extract((char*)id);
		Qprivs.push_back(Qjprivid);
		Ppub = contactedServer.getSjP();
		Ppubs.push_back(Ppub);
		P = contactedServer.getP();
		GT QprivP = pfc.pairing(P, Qjprivid);
        GT QidPpub = pfc.pairing(Ppub, Qid);
        if(QprivP == QidPpub) {
        	cout << endl << "Rock and roll baby!" << endl;
        }
	}
	D = getSecretKey(contactedServers2, Qprivs, order, &pfc);
	Ppub = getPpub(contactedServers2, Ppubs, order, &pfc);
	cout << "D based on servers " << contactedServers2[0] << ", " << contactedServers2[1] << " and " << contactedServers2[2] << endl << D.g << endl;
	cout << "Ppub based on servers " << contactedServers2[0] << ", " << contactedServers2[1] << " and " << contactedServers2[2] << endl << Ppub.g << endl;

    return 0;
}
/*
G1 getSecretKey(char* id, int (&contactedServers)[THRESHOLD], vector <PKG> serverlist, Big order) {
	G1 D;
	for (int i = 0; i < THRESHOLD; i++) {
		G1 Q = serverlist.at(contactedServers[i]).extract(id);
		Big l = lagrange(i, contactedServers, THRESHOLD, order);
		D = D + pfc.mult(Q, l);
	}
	return D;
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
}*/
// Added these extra ones.
G1 getSecretKey(int (&contactedServers)[THRESHOLD], vector <G1> Qprivs, Big order, PFC *pfc) {
    G1 D;
    for (int i = 0; i < THRESHOLD; i++) {
        G1 Q = Qprivs.at(i);
        Big l = lagrange(i, contactedServers, THRESHOLD, order);
        D = D + (*pfc).mult(Q, l);
    }
    return D;
}

G2 getPpub(int (&contactedServers)[THRESHOLD], vector <G2> Ppubs, Big order, PFC *pfc) {
    G2 Ppub;
    for (int i = 0; i < THRESHOLD; i++) {
        G2 myPpub = Ppubs.at(i);
        Big l = lagrange(i, contactedServers, THRESHOLD, order);
        Ppub = Ppub + (*pfc).mult(myPpub, l);
    }
    return Ppub;
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