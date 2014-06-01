#include "client_funcs.h"
#include "encryptedMessage.h"
#include "plaintextMessage.h"
#include "authenticatedData.h"

EncryptedMessage::EncryptedMessage(char * A, int Alen, char (&T)[TAG_LEN], char * C, int Clen) {
    autData = new AuthenticatedData(A);
    this->A = new char[Alen];
    memcpy(this->A, A, Alen);
    cout << endl << endl;
    this->C = new char[Clen];
    memcpy(this->C, C, Clen);
    memcpy(this->T, T, TAG_LEN);

    this->Alen = Alen;
    this->Clen = Clen;
}

EncryptedMessage::EncryptedMessage(string encryptedMessage) {
    int nbOfRecipients;
    // Extract U based on brackets as U can vary in size
    size_t found = encryptedMessage.find("(");
    string stringNbOfRecipients = encryptedMessage.substr(0, found);
    if ( ! (istringstream(stringNbOfRecipients) >> nbOfRecipients) )
        nbOfRecipients = 0;
    size_t found2 = encryptedMessage.find("]])");
    string tempString = encryptedMessage.substr(found, found2-3);
    G2 U = g2From(tempString);
    (*autData).setU(U);
    found2 = found2+3;

    // The following 4 lines could be removed once this code is actually being used in Facebook
    // Apparently C++ saves the 0-chars in a string object as well
    // Look for the first non-zero char
    encryptedMessage = encryptedMessage.erase(0, found2);
    int posOfNonZeroChar = 0;
    while(encryptedMessage[posOfNonZeroChar] == 0)
        posOfNonZeroChar++;
    encryptedMessage = encryptedMessage.erase(0, posOfNonZeroChar);

    char tempString2[V_LEN];
    memcpy(tempString2, encryptedMessage.c_str(), V_LEN);
    encryptedMessage = encryptedMessage.erase(0, V_LEN);
    Big V = (Big)tempString2;
    (*autData).setV(V);
    for (int i = 0; i < nbOfRecipients; i++) {
        memcpy(tempString2, encryptedMessage.c_str(), W_LEN);
        encryptedMessage = encryptedMessage.erase(0, W_LEN);
        Big W = (Big)tempString2;
        (*autData).add(W);
    }

    this->Clen = encryptedMessage.length()+1-TAG_LEN;
    char encAr[encryptedMessage.length()+1];
    memset(encAr, 0, sizeof(encAr));

    memcpy(encAr, base64_decode(encryptedMessage).c_str(), encryptedMessage.length());

    memcpy(this->T, encAr, TAG_LEN);
    this->C = new char[Clen];
    memcpy(this->C, &encAr[TAG_LEN], Clen);

    int Alen = (*autData).getLength(nbOfRecipients);
    this->A = new char[Alen];
    (*autData).encodeTo(this->A);

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
    Big sigma, sigma_hash;
    vector <Big> ws = (*autData).getEncryptedRecipientKeys();
    char P_text[Clen];
    bool integrity = false;

    time_t begin_time = clock();

    int i = 0;
    while(U != uCalc && i < nbOfRecipients){
        // sigma = V XOR Hash(e(D,U))
        W=ws.at(i);
        sigma = lxor(W, ud_hash);

        // M = W XOR Hash(sigma)
        (*pfc).start_hash();
        (*pfc).add_to_hash(sigma);
        sigma_hash = (*pfc).finish_hash_to_group();
        ses_key = lxor(V, sigma_hash);

        // r = Hash(sigma,M)
        (*pfc).start_hash();
        (*pfc).add_to_hash(sigma);
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


    //int Alen = (*autData).getLength((*autData).getNbOfRecipients());
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
    } else {
        cout << "Successful integrity check!" << endl;
    }

    message = (string)P_text;

    return PlaintextMessage(message);
}


// Get the encrypted message in base64 encoding
string EncryptedMessage::getMessage() {
    stringstream ss;

    // Convert nbOfRecipients from string to int
    int nbOfRecipients;
    memcpy(&(nbOfRecipients), A, sizeof(nbOfRecipients));
    string stringNbOfRecipients = static_cast<ostringstream*>( &(ostringstream() << nbOfRecipients) )->str();

    // Convert array of chars to a string
    string aString(A, Alen);

    // concatenate tag T and ciphertext C
    char tc[TAG_LEN+Clen+1];
    memset(tc, 0, sizeof(tc));
    memcpy(tc, T, TAG_LEN);
    memcpy(&tc[TAG_LEN], C, Clen);

    // Concatenate all strings
    ss << stringNbOfRecipients;
    ss << aString;
    ss << base64_encode(reinterpret_cast<const unsigned char*>(tc), TAG_LEN+Clen);
    return ss.str();
}