#ifndef _SHAMIR_H
#define _SHAMIR_H

#include <vector>

struct share_t {
    int x; 				// This will correspond to the server ID storing the secret.
    Big y;				// This corresponds to the y coordinate of the secret polynomial. Often called sij in literature.
    int shareGenerator; // This corresponds to the server who generated the share
};

enum ServerState { DKG_WAITING_FOR_P, DKG_WAITING_FOR_SHARES, DKG_FINISHED};

class DKG {
private:
	PFC *pfc;
	Big secret;
	Big sj;
	share_t * myShares;
	share_t * receivedShares;
	Big * poly;
	int serverId;
	Big order;
	int nbOfShares;
	int portNb;
	ServerState state;
	int lastReceivedShareGenerator;
	// This value is the same for all servers
	G2 P;
	// This value is different for every server
	G2 sjP;

	// Generate a random secret polynomial for internal use
	void generatePolynomial(int threshold);

	// Generate a share for each participating server
	void generateShares(int nbOfShares, int threshold);

	void init(int nbOfShares, int threshold, Big order, Big s);

public:
	// Constructor only allowed if serverId = 1 (because only server 1 can generate P)
	DKG(int serverId, int portNb, int nbOfShares, int threshold, Big order, PFC *pfc, G2 P, Big s);
	// Constructor only allowed if serverId != 1
	DKG(int serverId, int portNb, int nbOfShares, int threshold, Big order, PFC *pfc, Big s);

	G2 getSjP();

	G1 extract(char * id);

	ServerState getState();

	void setP(G2 P);

	G2 getP();

	int getServerId();

	int getLastReceivedShareGenerator();

	void setShare(share_t share);

	void getSharesFrom(vector <DKG> serverList);

	share_t getShareOf(int serverId);
};

#endif