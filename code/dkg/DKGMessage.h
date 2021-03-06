#ifndef _DKGMESSAGE_H
#define _DKGMESSAGE_H

#include "pkg.h"

enum DKGMessageType { P_MESSAGE, SHARE_MESSAGE};

class DKGMessage {
private:
	G2 P;
	int receiver;
	int sender;
	share_t share;
	DKGMessageType type;

	void init(int sender, int receiver, DKGMessageType);

public:
	// Constructor only allowed if serverId = 1 (because only server 1 can generate P)
	DKGMessage(int sender, int receiver, G2 P);

	DKGMessage(int sender, int receiver, share_t share);

	DKGMessage(string xmlString);

	G2 getP();

	string printType();

	int getReceiver();

	int getSender();

	share_t getShare();

	DKGMessageType getType();

	string toString();

};

#endif