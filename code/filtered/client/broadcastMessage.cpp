#include "broadcastMessage.h"
#include "authenticatedData.h"

BroadcastMessage::BroadcastMessage(std::string message) {
    this->message = message;
}

Big BroadcastMessage::getSessionKey() {
    return from_binary(HASH_LEN, sessionKey);
}

AuthenticatedData BroadcastMessage::getAuthenticatedData() {
	return *(this->autData);
}

void BroadcastMessage::getIV(char (&iv)[HASH_LEN/2]) {
    memcpy(iv,&sessionKey[HASH_LEN/2],HASH_LEN/2);
}
void BroadcastMessage::getK1(char (&k1)[HASH_LEN/2]) {
    memcpy(k1,&sessionKey,HASH_LEN/2);
}