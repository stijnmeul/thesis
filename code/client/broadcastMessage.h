#ifndef _BROADCAST_MESSAGE_H_
#define _BROADCAST_MESSAGE_H_

#include "client_funcs.h"

#include <string>
#include <vector>

class AuthenticatedData;

class BroadcastMessage {
protected:
    std::vector <std::string> recipients;
    std::string message;
    AuthenticatedData *autData;
    char sessionKey[HASH_LEN];

    Big sigma;
    Big r;

    void getIV(char (&iv)[HASH_LEN/2]);

    void getK1(char (&k1)[HASH_LEN/2]);
public:
    BroadcastMessage() {}

    BroadcastMessage(std::string message);

    int getNbOfRecipients();

    virtual std::string getMessage() =0;

    int getBroadcastMessageLength();

    Big getSessionKey();
};

#endif