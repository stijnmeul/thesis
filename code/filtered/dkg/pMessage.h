#ifndef _PMESSAGE_H
#define _PMESSAGE_H

#include "DKGMessage.h"

class PMessage: public DKGMessage {
private:
	G2 P;
public:
	// Constructor only allowed if serverId = 1 (because only server 1 can generate P)
	PMessage(int sender, int receiver, G2 P);

	string toString();

	string printType();

	G2 getP();
};

#endif