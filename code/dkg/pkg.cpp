#define MR_PAIRING_BLS    // AES-256 security
#define AES_SECURITY 256
#define BASE_PORT

#include "../cppmiracl/source/pairing_3.h"
#include "pkg.h"
#include <vector>
#include <stdexcept>

using namespace std;

// Generate a random secret polynomial for internal use
void PKG::generatePolynomial(int threshold) {
	Big randCoef;

	// A THRESHOLD-1 degree polynomial is randomly chosen such that poly(0)=s
	poly[0] = this->secret;
	// Generate THRESHOLD-1 random numbers
	for (int i = 1; i < threshold; i++) {
		(*pfc).random(randCoef);
		poly[i] = randCoef;
	}
}

// Generate a share for each participating server
void PKG::generateShares(int nbOfShares, int threshold) {
	share_t myShare;
	for (int j = 0; j < nbOfShares; j++) {
		int i = j+1;
		Big qi=secret;
		myShare.x = i;
		for (int k = 1; k < threshold; k++)
		{ // evaluate polynomial a0+a1*x+a2*x^2... for x=i; => result is  q(i)
			qi += modmult(poly[k], (Big)i, order);
			i *= i;
			qi %= order;
		}
		myShare.y = qi;
		myShare.shareGenerator = serverId;
		myShares[j] = myShare;
	}
}
// This function will probably dissappear as well
void PKG::getSharesFrom(vector <PKG> serverlist) {
	int nbOfShares = serverlist.size();
	if(this->nbOfShares != nbOfShares )
		throw invalid_argument("Please provide a serverlist that contains as many servers as the total number of shares");
	for (int i = 0; i < nbOfShares; i++) {
		this->receivedShares[i] = serverlist.at(i).getShareOf(this->serverId);
	}
	this->sj = 0;
	for (int i = 0; i < nbOfShares; i++) {
		this->sj += receivedShares[i].y;
		this->sj %= this->order;
	}
	this->sjP = (*pfc).mult(this->P, this->sj);
}

G2 PKG::getSjP() {
	if(getState() != DKG_FINISHED) {
		throw logic_error("DKG is not finished yet");
	}
	G2 uninit;
	if (this->sjP == uninit) {

	}
	return this->sjP;
}

void PKG::setShare(share_t share) {
	cout << "setting share from server " << share.shareGenerator << " on server " << this->serverId << endl;
	if (this->lastReceivedShareGenerator + 1 != share.shareGenerator) {
		throw invalid_argument("DKGs have to distribute their shares in the same order as their IDs.");
	}
	if (this->serverId == share.shareGenerator) {
		throw invalid_argument("Can not use setShare() for a share that was generated on the same server.");
	}
	this->receivedShares[share.shareGenerator-1] = share;
	this->lastReceivedShareGenerator = share.shareGenerator;
	// If all shares are received, start calculating sjP
	if (this->lastReceivedShareGenerator == nbOfShares || (this->serverId == nbOfShares && lastReceivedShareGenerator + 1 == this->serverId )) { // second condition is needed for the last server to finish
		this->sj = 0;
		for (int i = 0; i < nbOfShares; i++) {
			this->sj += receivedShares[i].y;
			this->sj %= this->order;
		}
		this->sjP = (*pfc).mult(this->P, this->sj);
		this->state = DKG_FINISHED;
	}
}

// Note: normally a server would have to authenticate itself before being able to receive its share
share_t PKG::getShareOf(int serverId) {
	if(this->lastReceivedShareGenerator + 1 == this->serverId) { // Update lastReceivedShareGenerator if it's this server's turn to distribute shares.
		this->lastReceivedShareGenerator  = this->serverId;
	}
	return this->myShares[serverId-1];
}

G1 PKG::extract(char * id) {
	if(getState() != DKG_FINISHED) {
		throw logic_error("DKG is not finished yet");
	}
	/**********
	* EXTRACT
	***********/
	get_mip()->IOBASE=256;
	G1 Q1, D;
	// hash public key of Alice to Q1
	(*pfc).hash_and_map(Q1, (char*)id);
	// Calculate private key of Alice as D=s.Q1
	D = (*pfc).mult(Q1, this->sj);
	get_mip()->IOBASE=64;
	//return toString(D);
	return D;
}

void PKG::setP(G2 P) {
	if(this->getState() != DKG_WAITING_FOR_P) {
		throw logic_error("P is already initialised");
	} else {
		this->P = P;
		this->state = DKG_WAITING_FOR_SHARES;
	}
}

G2 PKG::getP() {
	if(getState() == DKG_WAITING_FOR_P) {
		throw logic_error("P is not initialised yet");
	}
	return this->P;
}
// All servers except server 1
PKG::PKG(int serverId, int portNb, int nbOfShares, int threshold, Big order, PFC *pfc, Big s) {
	this->pfc = pfc;
	if (serverId > nbOfShares || serverId < 1)
		throw invalid_argument("Please provide an integer serverID between 1 and nbOfShares.");
	if (serverId == 1)
		throw invalid_argument("A server with ID equal to 1 has to be initialised with a P value.");
	this->portNb = portNb;
	this->serverId = serverId;
	init(nbOfShares, threshold, order, s);
	this->state = DKG_WAITING_FOR_P;
}
// Only server 1
PKG::PKG(int serverId, int portNb, int nbOfShares, int threshold, Big order, PFC *pfc, G2 P, Big s) {
	this->pfc = pfc;
	if (serverId > nbOfShares || serverId < 1)
		throw invalid_argument("Please provide an integer serverID between 1 and nbOfShares");
	if (serverId != 1)
		throw invalid_argument("Only a server with ID equal to 1 can be initialised with a P value.");
	this->portNb = portNb;
	this->serverId = serverId;
	init(nbOfShares, threshold, order, s);
	this->P = P;
	this->state = DKG_WAITING_FOR_SHARES;
}

void PKG::init(int nbOfShares, int threshold, Big order, Big s) {
	this->myShares = new share_t[nbOfShares]();
	this->receivedShares = new share_t[nbOfShares]();
	this->poly = new Big[threshold];
	this->order = order;
	this->nbOfShares = nbOfShares;
	this->secret = s;
	generatePolynomial(threshold);
	generateShares(nbOfShares, threshold);
	// Assign a generated share to this server as well
	receivedShares[serverId-1] = myShares[serverId-1];
	this->lastReceivedShareGenerator = 0;
}

ServerState PKG::getState() {
	return this->state;
}

string PKG::printState() {
	switch(this->state)
	{
		case DKG_WAITING_FOR_P:
			return "DKG_WAITING_FOR_P";
		case DKG_WAITING_FOR_SHARES:
			return "DKG_WAITING_FOR_SHARES";
		case DKG_FINISHED:
			return "DKG_FINISHED";
	}
}

int PKG::getServerId() {
	return this->serverId;
}

int PKG::getLastReceivedShareGenerator() {
	return this->lastReceivedShareGenerator;
}
