#ifndef _BROADCAST_MESSAGE_H_
#define _BROADCAST_MESSAGE_H_

#include "client_funcs.h"

#include <string>
#include <vector>

class AuthenticatedData;

class BroadcastMessage {
protected:
    std::string message;
    AuthenticatedData *autData;
    char sessionKey[HASH_LEN];

    void getIV(char (&iv)[HASH_LEN/2]);

    void getK1(char (&k1)[HASH_LEN/2]);

    Big getSessionKey();
public:
    BroadcastMessage() {}

    BroadcastMessage(std::string message);

    AuthenticatedData getAuthenticatedData();

    virtual std::string getMessage() =0;
};

#endif