#include "client_funcs.h"
#include "encryptedMessage.h"
#include "plaintextMessage.h"
#include "authenticatedData.h"

EncryptedMessage::EncryptedMessage(char * A, int Alen, char (&T)[TAG_LEN], char * C, int Clen) {
    autData = new AuthenticatedData(A);
    this->C = new char[Clen];
    memcpy(this->C, C, Clen);
    memcpy(this->T, T, TAG_LEN);

    this->Clen = Clen;
}

EncryptedMessage::EncryptedMessage(string encryptedMessage) {
    // Do the inverse operation
    string decRes = base64_decode(encryptedMessage);
    int resSize = decRes.size();
    char plainEnc[resSize];
    memcpy(plainEnc, decRes.c_str(), decRes.length());
    autData = new AuthenticatedData(plainEnc);
    int Alen = (*autData).getLength();
    this->Clen = resSize - Alen - TAG_LEN - 1;
    this->C = new char[Clen];
    memcpy(this->T, &plainEnc[Alen], TAG_LEN);
    memcpy(this->C, &plainEnc[Alen+TAG_LEN], Clen);
}

PlaintextMessage EncryptedMessage::decrypt(const G2& P, const G2& Ppub, G1 D, PFC *pfc) {
    G2 uCalc;
    G2 U = (*autData).getU();
    Big ud_hash = (*pfc).hash_to_aes_key((*pfc).pairing(U,D));
    Big ses_key;
    Big r;
    int nbOfRecipients = (*autData).getNbOfRecipients();

    Big W;
    Big V = (*autData).getV();
    Big rho, rho_hash;
    vector <Big> ws = (*autData).getEncryptedRecipientKeys();
    char P_text[Clen];
    bool integrity = false;

    time_t begin_time = clock();

    int i = 0;
    while(U != uCalc && i < nbOfRecipients){
        // rho = V XOR Hash(e(D,U))
        W=ws.at(i);
        rho = lxor(W, ud_hash);

        // M = W XOR Hash(rho)
        (*pfc).start_hash();
        (*pfc).add_to_hash(rho);
        rho_hash = (*pfc).finish_hash_to_group();
        ses_key = lxor(V, rho_hash);

        // r = Hash(rho,M)
        (*pfc).start_hash();
        (*pfc).add_to_hash(rho);
        (*pfc).add_to_hash(ses_key);
        r = (*pfc).finish_hash_to_group();
        uCalc = (*pfc).mult(P,r);
        i++;
    }
    cout << "ses_key is " << endl << ses_key << endl;

    /*************************************************
    *       AES GCM part of the decryption step      *
    **************************************************/
    to_binary(ses_key, HASH_LEN, sessionKey, TRUE);
    char k1[HASH_LEN/2];
    char iv[HASH_LEN/2];
    char Tdec[TAG_LEN];
    memset(P_text, 0, Clen+1);

    getIV(iv);
    getK1(k1);

    int Alen = (*autData).getLength();
    char A[Alen];
    (*autData).encodeTo(A);
    gcm g;
    gcm_init(&g, HASH_LEN/2, k1, HASH_LEN/2, iv);
    gcm_add_header(&g, A, Alen);
    gcm_add_cipher(&g, GCM_DECRYPTING, P_text, Clen, C);
    gcm_finish(&g, Tdec);

    integrity = true;
    for (int j = 0; j < TAG_LEN; j++) {
        if(Tdec[j] != T[j]) {
            integrity = false;
        }
    }

    if(integrity == false) {
        cout << "Received tag T does not correspond to decrypted T. There are some integrity issues here." << endl;
        message = "You are not in the recipient set.";
    } else {
        cout << "Successful integrity check!" << endl;
        message = (string)P_text;
    }

    return PlaintextMessage(message);
}


// Get the encrypted message in base64 encoding
string EncryptedMessage::getMessage() {
    stringstream ss;
    // Convert nbOfRecipients from string to int
    int nbOfRecipients;
    int Alen = (*autData).getLength();
    char A[Alen];

    // Do the same with a char array
    int resSize = Alen + TAG_LEN + Clen + 1;
    char encMes[resSize];
    memset(encMes, 0, resSize);
    (*autData).encodeTo(encMes);
    memcpy(&encMes[Alen], T, TAG_LEN);
    memcpy(&encMes[Alen + TAG_LEN], C, Clen);
    return base64_encode(reinterpret_cast<const unsigned char*>(encMes), resSize);
}