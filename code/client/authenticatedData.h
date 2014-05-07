#include "client_funcs.h"
#include "../cppmiracl/source/pairing_3.h"
#include <vector>

class AuthenticatedData {
    G2 U;
    vector <Big> ws;
    char * authenticatedDataArray;
public:
    AuthenticatedData() {}
    // Decodes an array of authenticated data to an AuthenticatedData object
    AuthenticatedData(char * A);

    G2 getU();

    void setU(G2 U);

    int getNbOfRecipients();

    vector <Big> getRecipientKeys();

    int getLength(int nbOfRecipients);

    void addRecipientKey(Big recipientKey);

    void encodeToArray(char * A);
};