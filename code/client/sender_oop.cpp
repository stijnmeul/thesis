#include "client_funcs.h"
// Compilation command: g++-4.7 sender_oop.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp ../cppmiracl/source/mrgcm.c -I ../cppmiracl/include/ ../cppmiracl/source/mraes.c -L ../cppmiracl/source/ -l miracl -lcurl -o oopsender


// https://www.facebook.com/help/105399436216001#What-are-the-guidelines-around-creating-a-custom-username? for more information about which characters that can be used for usernames and profile_ids


#if AES_SECURITY == 256
#define U_LEN 900
#define W_LEN 45 // W is actually 44 chars long, 45 because of null termination
#define V_LEN 45 // V is actually 44 chars long, 45 because of null termination
#endif

using namespace std;

PFC pfc(AES_SECURITY);

class PlaintextMessage;

class AuthenticatedData {
    G2 U;
    Big V;
    vector <Big> ws;
    char * authenticatedDataArray;
public:
    AuthenticatedData() {}
    // Decodes an array of authenticated data to an AuthenticatedData object
    AuthenticatedData(char * A) {
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
    G2 getU() {
        return U;
    }
    Big getV() {
        return V;
    }
    void setU(G2 U) {
        this->U = U;
    }
    void setV(Big V) {
        this->V = V;
    }
    int getNbOfRecipients() {
        return ws.size();
    }
    vector <Big> getRecipientKeys() {
        return ws;
    }
    // nbOfRecipients is a required argument as recipientKeys only get added during encryption.
    int getLength(int nbOfRecipients) {
        return U_LEN + nbOfRecipients*(W_LEN) + V_LEN + sizeof(int);
    }
    void addRecipientKey(Big recipientKey) {
        ws.push_back(recipientKey);
    }
public:
    void encodeToArray(char * A) {
        int nbOfRecipients = getNbOfRecipients();
        int Alen = getLength(nbOfRecipients);
        memset(A, 0, Alen);
        int filled = 0;
        memcpy(A,&(nbOfRecipients), sizeof(nbOfRecipients));
        filled = sizeof(nbOfRecipients);
        strcpy(&A[filled],toString(U).c_str());
        filled += U_LEN;
        strcpy(&A[filled],toString(V).c_str());
        filled += W_LEN;
        for(int i = 0; i < nbOfRecipients; i++){
            strcpy(&A[filled],toString(ws.at(i)).c_str());
            filled += V_LEN;
        }
    }
};

class BroadcastMessage {
protected:
    vector <string> recipients;
    string message;
    AuthenticatedData autData;
    char sessionKey[HASH_LEN];

    /********************************************************
     *  Private parameters of the Boneh and Franklin scheme *
     ********************************************************/
    Big sigma;
    Big r;

public:
    BroadcastMessage() {}
    BroadcastMessage(string message) {
        this->message = message;
    }
    int getNbOfRecipients() {
        return recipients.size();
    }
    // Get the message in its current form
    virtual string getMessage() =0;
    int getBroadcastMessageLength() {
        if(recipients.size() == 0)
            return 0;
        else
            return autData.getLength(getNbOfRecipients()) + TAG_LEN + message.length();
    }
    Big getSessionKey() {
        return from_binary(HASH_LEN, sessionKey);
    }
protected:
    void getIV(char (&iv)[HASH_LEN/2]) {
        memcpy(iv,&sessionKey[HASH_LEN/2],HASH_LEN/2);
    }
    void getK1(char (&k1)[HASH_LEN/2]) {
        memcpy(k1,&sessionKey,HASH_LEN/2);
    }
};

// Protected makes all public methods from BroadcastMessage only available from within EncryptedMessage
class EncryptedMessage: protected BroadcastMessage {
    //char * broadCastMessage;
public:
    char * A;
    // TODO: Determine Clen on the ciphertext
    int Alen;
    int Clen;
    char * C;
    char T[TAG_LEN];

    EncryptedMessage() {}
    EncryptedMessage(char * A, int Alen, char (&T)[TAG_LEN], char * C, int Clen) {
        autData = AuthenticatedData(A);
        this->A = new char[Alen];
        memcpy(this->A, A, Alen);
        this->C = new char[Clen];
        memcpy(this->C, C, Clen);
        memcpy(this->T, T, TAG_LEN);
        cout << "Binary T is " << endl;
        for (int i = 0; i < TAG_LEN; i++) {
            cout << T[i];
        }
        cout << endl << endl;
        this->Alen = Alen;
        this->Clen = Clen;
    }
    EncryptedMessage(string encryptedMessage) {
        int nbOfRecipients;
        // Extract U based on brackets as U can vary in size
        size_t found = encryptedMessage.find("(");
        string stringNbOfRecipients = encryptedMessage.substr(0, found);
        if ( ! (istringstream(stringNbOfRecipients) >> nbOfRecipients) )
            nbOfRecipients = 0;
        size_t found2 = encryptedMessage.find("]])");
        string tempString = encryptedMessage.substr(found, found2-3);
        G2 U = g2From(tempString);
        autData.setU(U);
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
        autData.setV(V);
        for (int i = 0; i < nbOfRecipients; i++) {
            memcpy(tempString2, encryptedMessage.c_str(), W_LEN);
            encryptedMessage = encryptedMessage.erase(0, W_LEN);
            Big W = (Big)tempString2;
            autData.addRecipientKey(W);
        }

        this->Clen = encryptedMessage.length()+1-TAG_LEN;
        char encAr[encryptedMessage.length()+1];
        memset(encAr, 0, sizeof(encAr));

        memcpy(encAr, base64_decode(encryptedMessage).c_str(), encryptedMessage.length());

        memcpy(this->T, encAr, TAG_LEN);
        this->C = new char[Clen];
        memcpy(this->C, &encAr[TAG_LEN], Clen);

        int Alen = autData.getLength(nbOfRecipients);
        this->A = new char[Alen];
        autData.encodeToArray(this->A);

    }
    // Avoid invalid returning of forward reference.
    PlaintextMessage decrypt(const G2& P, const G2& Ppub, G1 D);

    // Get the encrypted message in base64 encoding
    string getMessage() {
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
};

class PlaintextMessage: protected BroadcastMessage {
    vector <G1> recipientHashes;
public:
    PlaintextMessage(string message) {
        this->message = message;
        recipients = toVector(message);
    }
    void addRecipient(string recipient) {
        G1 Q1;

        // Add recipient to the recipient list
        recipients.push_back(recipient);
        // Add hash of recipient to the recipientHashes list
        pfc.hash_and_map(Q1, (char *)recipient.c_str());
        recipientHashes.push_back(Q1);
    }
    EncryptedMessage encrypt(const G2& P, const G2& Ppub) {
        // Generate keys
        generateKeys();

        if (getNbOfRecipients() == 0) {
            throw invalid_argument("Can not encrypt message if no recipients were specified.");
        }
        G2 myUnitVar;
        if (P == myUnitVar || P == myUnitVar) {
            throw invalid_argument("Please specify initialised public parameters.");
        }
        time_t begin_time = clock();
        // Add recipients to message
        message = message + toString(recipients);
        /************************************************/
        /*   PREPARE AUTHENTICATED DATA - IBE ENCRYPT   */
        /************************************************/
        // Add all recipients to Authenticated data
        for (int i = 0; i < getNbOfRecipients(); i++) {
            // Add K XOR g_ID = V to Authenticated Data
            G1 rQ = pfc.mult(recipientHashes.at(i), r);
            Big W = pfc.hash_to_aes_key(pfc.pairing(Ppub, rQ));
            W = lxor(sigma, W);
            autData.addRecipientKey(W);
        }

        // U = r.P
        G2 U = pfc.mult(P, r);
        autData.setU(U);

        // W = M XOR Hash(sigma)
        pfc.start_hash();
        pfc.add_to_hash(sigma);
        Big V = pfc.finish_hash_to_group();
        Big ses_key = getSessionKey();
        cout << "encrypt ses_key is " << endl << ses_key << endl;
        V = lxor(ses_key, V);
        autData.setV(V);

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
        int Alen = autData.getLength(getNbOfRecipients());
        char A[Alen];
        autData.encodeToArray(A);
        getIV(iv);
        getK1(k1);
        gcm_init(&g, HASH_LEN/2, k1, HASH_LEN/2, iv);
        gcm_add_header(&g, A, Alen);
        gcm_add_cipher(&g, GCM_ENCRYPTING, P_text, message.length(), C);
        gcm_finish(&g, T);

        return EncryptedMessage(A, Alen, T, C, message.length());
    }
    // Get the plaintext message (without the recipients)
    string getMessage() {

        string message = this->message;
        size_t found = message.find("|");
        message = message.substr(0, found);
        return message;
    }

    vector <string> getRecipients() {
        return recipients;
    }

private:
    void generateKeys() {
        // Read out 256 random bits from /dev/urandom
        char k[SES_KEY_LEN];
        FILE *fp;
        fp = fopen("/dev/urandom", "r");
        fread(&k, 1, SES_KEY_LEN, fp);
        fclose(fp);

        // Hash 256 bits to an encryption key K1 and an initialisation vector IV
        sha256 sh;

        shs256_init(&sh);

        for(int i = 0; i < HASH_LEN; i++) {
            shs256_process(&sh,k[i]);
            shs256_hash(&sh,sessionKey);
        }

        // Generate random sigma key with AES_LENGTH bits
        pfc.rankey(sigma);
        // Calculate r=Hash(sigma,M)
        pfc.start_hash();
        pfc.add_to_hash(sigma);
        Big ses_key = from_binary(HASH_LEN, sessionKey);
        pfc.add_to_hash(ses_key);
        r = pfc.finish_hash_to_group();
    }
};
// Avoid invalid returning of forward reference.
PlaintextMessage EncryptedMessage::decrypt(const G2& P, const G2& Ppub, G1 D) {
    // Iterate over all V values until U equals rP.
    G2 uCalc;
    G2 U = autData.getU();
    Big ud_hash = pfc.hash_to_aes_key(pfc.pairing(U,D));
    Big ses_key;
    int i = 0;
    int nbOfRecipients = autData.getNbOfRecipients();
    Big V = autData.getV();
    Big W;
    Big sigma, sigma_hash;
    vector <Big> ws = autData.getRecipientKeys();

    time_t begin_time = clock();
    while(U != uCalc && i < nbOfRecipients){
        // sigma = V XOR Hash(e(D,U))
        W=ws.at(i);
        sigma = lxor(W, ud_hash);

        // M = W XOR Hash(sigma)
        pfc.start_hash();
        pfc.add_to_hash(sigma);
        sigma_hash = pfc.finish_hash_to_group();
        ses_key = lxor(V, sigma_hash);

        // r = Hash(sigma,M)
        pfc.start_hash();
        pfc.add_to_hash(sigma);
        pfc.add_to_hash(ses_key);
        r = pfc.finish_hash_to_group();
        uCalc = pfc.mult(P,r);

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
    char P_text[Clen];
    memset(P_text, 0, Clen+1);

    getIV(iv);
    getK1(k1);


    //int Alen = autData.getLength(autData.getNbOfRecipients());
    char A[Alen];
    autData.encodeToArray(A);
    gcm g;
    gcm_init(&g, HASH_LEN/2, k1, HASH_LEN/2, iv);
    gcm_add_header(&g, A, Alen);
    gcm_add_cipher(&g, GCM_DECRYPTING, P_text, Clen, C);
    gcm_finish(&g, Tdec);

    bool integrity = true;
    for (int i = 0; i < TAG_LEN; i++) {
        if(Tdec[i] != T[i]) {
            integrity = false;
        }
    }
    cout << endl;

    if(integrity == false) {
        cout << "Received tag T does not correspond to decrypted T. There are some integrity issues here." << endl;
    } else {
        cout << "Successful integrity check!" << endl;
    }

    message = (string)P_text;

    return PlaintextMessage(message);
}

miracl *mip = get_mip();
int bytes_per_big=(MIRACL/8)*(get_mip()->nib-1);

int main(void)
{
    mip->IOBASE=64;
    clock_t begin_time, begin_time1;
    float enc_time, enc_time1, dec_time, dec_time1, dec_time2;
    /*************************************************
    *          Scrape localhost/thesis/?id=          *
    **************************************************/
    CURL *curl;
    CURLcode res;
    string readBuffer;

    curl = curl_easy_init();

    if(curl) {
        // Suppose Bob already knows his private d_id value.
        // Therefore, ask Alice's ID such that the webpage only needs to be crawled once.
        curl_easy_setopt(curl, CURLOPT_URL, PKG_ADDR);
        /* example.com is redirected, so we tell libcurl to follow redirection */
        curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);

        /* Perform the request, res will get the return code */
        res = curl_easy_perform(curl);
        /* Check for errors */
        if(res != CURLE_OK)
            fprintf(stderr, "curl_easy_perform() failed: %s\n",
        curl_easy_strerror(res));

        /* always cleanup */
        curl_easy_cleanup(curl);
    }

    /*************************************************
    *        Read out scraped data from XML          *
    **************************************************/
    vector<char> xml_copy(readBuffer.begin(), readBuffer.end());
    xml_copy.push_back('\0');
    rapidxml::xml_document<> doc;
    rapidxml::xml_node<> * root_node;
    rapidxml::xml_node<> * p_node;
    rapidxml::xml_node<> * p_pub_node;
    rapidxml::xml_node<> * d_id_node;
    // we are choosing to parse the XML declaration
    // parse_no_data_nodes prevents RapidXML from using the somewhat surprising
    // behavior of having both values and data nodes, and having data nodes take
    // precedence over values when printing
    // >>> note that this will skip parsing of CDATA nodes <<<
    doc.parse<rapidxml::parse_declaration_node | rapidxml::parse_no_data_nodes>(&xml_copy[0]);
    root_node = doc.first_node("scramble");
    root_node = root_node->first_node("result");
    p_node = root_node->first_node("p");
    p_pub_node = root_node->first_node("p_pub");
    d_id_node = root_node->first_node("d_id");

    string d_id = d_id_node->value();
    string p = p_node->value();
    string p_pub = p_pub_node->value();


    /*************************************************
    *     Generate random symmetric session key      *
    **************************************************/
    G2 P, Ppub;
    G1 D;
    // Get Ppub, P and D from the PKG's XML message
    Ppub = g2From(p_pub);
    P = g2From(p);
    D = g1From(d_id);

    PlaintextMessage mes = PlaintextMessage("Dit is een testje");
    vector<string> testVect = mes.getRecipients();

    mes.addRecipient("Andre");
    mes.addRecipient("Adam");
    mes.addRecipient("Dylan");
    mes.addRecipient("Fred");
    // 5
    mes.addRecipient("Adam1");
    mes.addRecipient("Dylan1");
    mes.addRecipient("Fred1");
    mes.addRecipient("Andre2");
    mes.addRecipient("Adam2");
    // 10
    mes.addRecipient("Dylan2");
    mes.addRecipient("Patrick");
    mes.addRecipient("Ferdinand");
    mes.addRecipient("Filipe");
    mes.addRecipient("Frits");
    // 15
    mes.addRecipient("Frank");
    mes.addRecipient("Giovanni");
    mes.addRecipient("Gianni");
    mes.addRecipient("Kennedy");
    mes.addRecipient("John");
    // 20
    mes.addRecipient("Aster");
    mes.addRecipient("Jonas");
    mes.addRecipient("Riek");
    mes.addRecipient("Stefan");
    mes.addRecipient("Tim");/*
    // 25
    mes.addRecipient("Nolan");
    mes.addRecipient("Vincent");
    mes.addRecipient("Frederick");
    mes.addRecipient("Gerrit");
    mes.addRecipient("Anne-Laure");
    // 30
    mes.addRecipient("Jean-Jeacques");
    mes.addRecipient("Fitzgerald");
    mes.addRecipient("Anton");
    mes.addRecipient("Anteun");
    mes.addRecipient("Antoin");
    // 35
    mes.addRecipient("Michael");
    mes.addRecipient("Alexander");
    mes.addRecipient("Wouter");
    mes.addRecipient("Bart");
    mes.addRecipient("David");
    // 40
    mes.addRecipient("Prisca");
    mes.addRecipient("Isabel");
    mes.addRecipient("Laure");
    mes.addRecipient("Tine");
    mes.addRecipient("Sarah");
    // 45
    mes.addRecipient("Joke");
    mes.addRecipient("Laura");
    mes.addRecipient("Tess");
    mes.addRecipient("Evelien");
    mes.addRecipient("Eline");
    // 50
    mes.addRecipient("Jules");
    mes.addRecipient("Flor");
    mes.addRecipient("Josef");
    mes.addRecipient("Joseph");
    mes.addRecipient("Jozef");
    // 55
    mes.addRecipient("Appel");
    mes.addRecipient("Banaan");
    mes.addRecipient("Peer");
    mes.addRecipient("Annanas");
    mes.addRecipient("Aardbei");
    // 60
    mes.addRecipient("Prei");
    mes.addRecipient("Sla");
    mes.addRecipient("Tomaat");
    mes.addRecipient("Boontjes");
    mes.addRecipient("Fritske");
    // 65
    mes.addRecipient("Frankske");
    mes.addRecipient("Giovannike");
    mes.addRecipient("Giannike");
    mes.addRecipient("Kennedyke");
    mes.addRecipient("Johnny");
    // 70
    mes.addRecipient("Astertje");
    mes.addRecipient("Jonaske");
    mes.addRecipient("Riekske");
    mes.addRecipient("Stefanneke");
    mes.addRecipient("Timpie");
    // 75
    mes.addRecipient("Nolaneke");
    mes.addRecipient("Vincentje");
    mes.addRecipient("Frederickske");
    mes.addRecipient("Gerritje");
    mes.addRecipient("Anne-Lauretje");
    // 80
    mes.addRecipient("Fanny");
    mes.addRecipient("Kiekeboe");
    mes.addRecipient("Konstantinopel");
    mes.addRecipient("Moemoe");
    mes.addRecipient("Goegebhuer");
    // 85
    mes.addRecipient("Michaeltje");
    mes.addRecipient("Alexanderke");
    mes.addRecipient("Wouterke");
    mes.addRecipient("Bartje");
    mes.addRecipient("Davidje");
    // 90
    mes.addRecipient("Priscatje");
    mes.addRecipient("Isabelleke");
    mes.addRecipient("Lauretje");
    mes.addRecipient("Tineke");
    mes.addRecipient("Sarahtje");
    // 95
    mes.addRecipient("Joketje");
    mes.addRecipient("Lauratje");
    mes.addRecipient("Tesske");
    mes.addRecipient("Evelientje");
    mes.addRecipient("Elineke");*/
    //100
    mes.addRecipient("Alice");


    pfc.precomp_for_mult(P);
    pfc.precomp_for_pairing(Ppub);
    begin_time = clock();

    EncryptedMessage encMes = mes.encrypt(P, Ppub);
    string temp = encMes.getMessage();
    EncryptedMessage encMes2 = EncryptedMessage(temp);
    cout << "Encryption time:     " << getExecutionTime(begin_time) << endl;
    begin_time = clock();
    PlaintextMessage decMes = encMes.decrypt(P, Ppub, D);
    cout << "Decryption time:     " << getExecutionTime(begin_time) << endl;
    cout << "decMes " << decMes.getMessage() << endl;

    return 0;
}

