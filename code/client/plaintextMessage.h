#ifndef _PLAINTEXTMESSAGE_H_
#define _PLAINTEXTMESSAGE_H_

#include "broadcastMessage.h"
#include <vector>
#include <string>

class EncryptedMessage;

class PlaintextMessage: protected BroadcastMessage {
	std::vector <std::string> recipients;
    std::vector <G1> recipientHashes;
    Big sigma;
    Big r;

public:
    PlaintextMessage(std::string message);

    void addRecipient(std::string recipient, PFC *pfc);

    EncryptedMessage encrypt(const G2& P, const G2& Ppub, PFC *pfc);

    // Get the plaintext message (without the recipients)
    std::string getMessage();

    std::vector <std::string> getRecipients();

private:
    void generateKeys(PFC *pfc);
};

#endif
