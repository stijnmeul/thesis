#include "client_funcs.h"
#include "../mapToDate.h"
#include "plaintextMessage.h"
#include "encryptedMessage.h"
#include "authenticatedData.h"


#include <stdexcept>

PlaintextMessage::PlaintextMessage(std::string message) {
    this->message = message;
    recipients = toVector(message);
}

void PlaintextMessage::addRecipient(std::string recipient, PFC *pfc) {
    G1 Q1;
    string recipConcatDate = mapToDate(recipient);

    // Add recipient to the recipient list
    recipients.push_back(recipConcatDate);
    // Add hash of recipient to the recipientHashes list
    (*pfc).hash_and_map(Q1, (char *)recipConcatDate.c_str());
    recipientHashes.push_back(Q1);
}

EncryptedMessage PlaintextMessage::encrypt(const G2& P, const G2& Ppub, PFC *pfc) {
    get_mip()->IOBASE=64;
    // Generate keys
    generateKeys(pfc);
    autData = new AuthenticatedData();

    if (recipients.size() == 0) {
        throw invalid_argument("Can not encrypt message if no recipients were specified.");
    }
    G2 myUnitVar;
    if (P == myUnitVar || Ppub == myUnitVar) {
        throw invalid_argument("Please specify initialised public parameters.");
    }
    time_t begin_time = clock();
    // Add recipients to message
    message = message + toString(recipients);

    /************************************************/
    /*         PREPARE AUTHENTICATED DATA           */
    /************************************************/
    // Add all recipients to authenticated data
    for (int i = 0; i < recipients.size(); i++) {
        G1 rQ = (*pfc).mult(recipientHashes.at(i), r);
        Big W = (*pfc).hash_to_aes_key((*pfc).pairing(Ppub, rQ));
        W = lxor(rho, W);
        (*autData).add(W);
    }
    // U = rP
    G2 U = (*pfc).mult(P, r);
    (*autData).setU(U);

    // W = M XOR Hash(rho)
    (*pfc).start_hash();
    (*pfc).add_to_hash(rho);
    Big V = (*pfc).finish_hash_to_group();
    Big ses_key = getSessionKey();
    V = lxor(ses_key, V);
    (*autData).setV(V);

    /************************************************/
    /*                 AES ENCRYPT                  */
    /************************************************/
    char P_text[message.length()];
    memset(P_text, 0, sizeof(P_text));
    strcpy(P_text, message.c_str());

    gcm g;
    char C[message.length()];
    memset(C, 0, sizeof(C));
    char T[TAG_LEN];
    char k1[HASH_LEN/2];
    char iv[HASH_LEN/2];
    int Alen = (*autData).getLength();
    char A[Alen];
    (*autData).encodeTo(A);
    getIV(iv);
    getK1(k1);
    gcm_init(&g, HASH_LEN/2, k1, HASH_LEN/2, iv);
    gcm_add_header(&g, A, Alen);
    gcm_add_cipher(&g, GCM_ENCRYPTING, P_text, message.length(), C);
    gcm_finish(&g, T);

    return EncryptedMessage(A, Alen, T, C, message.length());
}

// Get the plaintext message (without the recipients)
std::string PlaintextMessage::getMessage() {

    std::string message = this->message;
    size_t found = message.find("|");
    message = message.substr(0, found);
    return message;
}

std::vector <std::string> PlaintextMessage::getRecipients() {
    return recipients;
}

void PlaintextMessage::generateKeys(PFC *pfc) {
    // Read out 256 random bits from /dev/urandom
    char k[SES_KEY_LEN];
    FILE *fp;
    fp = fopen("/dev/urandom", "r");
    fread(&k, 1, SES_KEY_LEN, fp);
    fclose(fp);

    // Hash 256 bits to an encryption key K1 and an initialisation std::vector IV
    sha256 sh;

    shs256_init(&sh);

    for(int i = 0; i < HASH_LEN; i++) {
        shs256_process(&sh,k[i]);
    }
    shs256_hash(&sh,sessionKey);

    // Generate random rho key with AES_LENGTH bits
    (*pfc).rankey(rho);
    // Calculate r=Hash(rho,M)
    (*pfc).start_hash();
    (*pfc).add_to_hash(rho);
    Big ses_key = from_binary(HASH_LEN, sessionKey);
    (*pfc).add_to_hash(ses_key);
    r = (*pfc).finish_hash_to_group();
}