#include "broadcastMessage.h"
#include "authenticatedData.h"

BroadcastMessage::BroadcastMessage(std::string message) {
    this->message = message;
}
int BroadcastMessage::getNbOfRecipients() {
    return recipients.size();
}

int BroadcastMessage::getBroadcastMessageLength() {
    if(recipients.size() == 0)
        return 0;
    else
        return (*autData).getLength(getNbOfRecipients()) + TAG_LEN + message.length();
}

Big BroadcastMessage::getSessionKey() {
    return from_binary(HASH_LEN, sessionKey);
}

void BroadcastMessage::getIV(char (&iv)[HASH_LEN/2]) {
    memcpy(iv,&sessionKey[HASH_LEN/2],HASH_LEN/2);
}
void BroadcastMessage::getK1(char (&k1)[HASH_LEN/2]) {
    memcpy(k1,&sessionKey,HASH_LEN/2);
}