#include "client_funcs.h"
#include "../cppmiracl/source/pairing_3.h"
#include <vector>

class AuthenticatedData {
    G2 U;
    Big V;
    vector <Big> ws;
public:
    AuthenticatedData() {}
    // Decodes an array of authenticated data to an AuthenticatedData object
    AuthenticatedData(char * A);

    void add(Big encryptedRecipientKey);

    void encodeTo(char * array);

    vector <Big> getEncryptedRecipientKeys();

    int getLength();

    int getNbOfRecipients();

    G2 getU();

    Big getV();

    void setU(G2 U);

    void setV(Big V);
};