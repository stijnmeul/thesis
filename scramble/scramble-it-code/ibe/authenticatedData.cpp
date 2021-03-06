#include "authenticatedData.h"
#include "client_funcs.h"

AuthenticatedData::AuthenticatedData(char * A) {
    // Decode A-array
    int readOut = 0;
    char tempString[U_LEN];
    char tempString2[W_LEN];
    int nbOfRecipients;
    memcpy(&(nbOfRecipients), A, sizeof(nbOfRecipients));
    readOut += sizeof(nbOfRecipients);
    strncpy(tempString, &A[readOut], U_LEN);
    this->U = g2From((string)tempString);
    readOut += U_LEN;
    strncpy(tempString2, &A[readOut], W_LEN);
    this->V = (Big)tempString2;
    readOut += V_LEN;
    for(int i = 0; i < nbOfRecipients; i++) {
        strncpy(tempString2,&A[readOut], W_LEN);
        ws.push_back((Big)tempString2);
        readOut += W_LEN;
    }
}

G2 AuthenticatedData::getU() {
    return U;
}

Big AuthenticatedData::getV() {
    return V;
}

void AuthenticatedData::setU(G2 U) {
    this->U = U;
}

void AuthenticatedData::setV(Big V) {
    this->V = V;
}

int AuthenticatedData::getNbOfRecipients() {
    return ws.size();
}

vector <Big> AuthenticatedData::getEncryptedRecipientKeys() {
    return ws;
}

// nbOfRecipients is a required argument as recipientKeys only get added during encryption.
int AuthenticatedData::getLength() {
    return U_LEN + getNbOfRecipients()*(W_LEN) + V_LEN + sizeof(int);
}

void AuthenticatedData::add(Big encryptedRecipientKey) {
    ws.push_back(encryptedRecipientKey);
}


void AuthenticatedData::encodeTo(char * array) {
    int nbOfRecipients = getNbOfRecipients();
    int Alen = getLength();
    memset(array, 0, Alen);
    int filled = 0;
    memcpy(array,&(nbOfRecipients), sizeof(nbOfRecipients));
    filled = sizeof(nbOfRecipients);
    strcpy(&array[filled],toString(U).c_str());
    filled += U_LEN;
    strcpy(&array[filled],toString(V).c_str());
    filled += V_LEN;
    for(int i = 0; i < nbOfRecipients; i++){
        strcpy(&array[filled],toString(ws.at(i)).c_str());
        filled += V_LEN;
    }
}