#ifndef _SHAMIR_H
#define _SHAMIR_H

#include <vector>

struct share_t {
    int x; 				// This will correspond to the server ID storing the secret.
    Big y;				// This corresponds to the y coordinate of the secret polynomial. Often called sij in literature.
    int shareGenerator; // This corresponds to the server who generated the share
};

enum ServerState { DKG_WAITING_FOR_P, DKG_WAITING_FOR_SHARES, DKG_FINISHED};

class PKG {
private:
	int lastReceivedShareGenerator;
	share_t * myShares;
	int nbOfShares;
	Big order;
	// This value is the same for all servers
	G2 P;

	PFC *pfc;
	Big * poly;
	int portNb;
	share_t * receivedShares;
	Big secret;
	int serverId;
	Big sj;
	// This value is different for every server
	G2 sjP;
	ServerState state;

	// Generate a random secret polynomial for internal use
	void generatePolynomial(int threshold);

	// Generate a share for each participating server
	void generateShares(int nbOfShares, int threshold);

	void init(int nbOfShares, int threshold, Big order, Big s);

public:
	// Constructor only allowed if serverId = 1 (because only server 1 can generate P)
	PKG(int serverId, int portNb, int nbOfShares, int threshold, Big order, PFC *pfc, G2 P, Big s);
	// Constructor only allowed if serverId != 1
	PKG(int serverId, int portNb, int nbOfShares, int threshold, Big order, PFC *pfc, Big s);

	G1 extract(char * id);

	int getLastReceivedShareGenerator();

	G2 getP();

	int getServerId();

	share_t getShareOf(int serverId);

	G2 getSjP();

	ServerState getState();

	string printState();

	void setP(G2 P);

	void setShare(share_t share);

	void getSharesFrom(vector <PKG> serverList);
};

#endif