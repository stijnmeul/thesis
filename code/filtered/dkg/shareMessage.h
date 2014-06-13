#ifndef _SHAREMESSAGE_H
#define _SHAREMESSAGE_H

#include "DKGMessage.h"


class ShareMessage: public DKGMessage {
	share_t share;

public:
	ShareMessage(int sender, int receiver, share_t share);

	ShareMessage(string xmlString);

	share_t getShare();

	string toString();

	string printType();
};

#endif