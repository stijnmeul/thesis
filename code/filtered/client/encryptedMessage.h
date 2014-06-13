#ifndef _ENCRYPTEDMESSAGE_H_
#define _ENCRYPTEDMESSAGE_H_
#include "broadcastMessage.h"

class PlaintextMessage;

// Protected makes all public methods from BroadcastMessage only available from within EncryptedMessage
class EncryptedMessage: protected BroadcastMessage {
    int Clen;
    char * C;
    char T[TAG_LEN];
public:
    EncryptedMessage() {}

    EncryptedMessage(char * A, int Alen, char (&T)[TAG_LEN], char * C, int Clen);

    EncryptedMessage(string encryptedMessage);

    PlaintextMessage decrypt(const G2& P, const G2& Ppub, G1 D, PFC *pfc);

    // Get the encrypted message in base64 encoding
    string getMessage();

};

#endif