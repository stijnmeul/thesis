#include <stdio.h>
#include <curl/curl.h>
#include <string>
#include <iostream>
#include <vector>
#include "../cppmiracl/include/rapidxml.hpp"

#define MR_PAIRING_BLS    // AES-256 security
#define AES_SECURITY 256
#define SES_KEY_LEN AES_SECURITY/8
#define HASH_LEN AES_SECURITY/8
#define TAG_LEN 16
#define RECEIVER_ID "Alice"
#define PKG "http://localhost/thesis/?id="
#define PKG_ADDR PKG RECEIVER_ID
// Compilation command: g++-4.7 sender.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp ../cppmiracl/source/mrgcm.c -I ../cppmiracl/include/ ../cppmiracl/source/mraes.c -L ../cppmiracl/source/ -l miracl -lcurl -o sender

#include "../cppmiracl/source/pairing_3.h"

#if AES_SECURITY == 256
#define U_LEN 1300
#define W_LEN 65
#define V_LEN 65
#endif

using namespace std;

static size_t WriteCallback(void *, size_t, size_t, void *);

PFC pfc(AES_SECURITY);

struct authenticatedData_t {
    int nbOfRecipients;
    G2 U;
    Big W;
    vector <Big> vs;
};

class AuthenticatedData {
    int nbOfRecipients;
    G2 U;
    Big W;
    vector <Big> vs;
public:
    G2 getU() {
        return U;
    }
    Big getW() {
        return W;
    }
    int getNbOfRecipients() {
        return nbOfRecipients;
    }
    int getLength(int nbOfRecipients) {
        return U_LEN + nbOfRecipients*V_LEN + W_LEN + sizeof(int);
    }
    //void add
};

class BroadcastMessage {
    vector <string> recipients;
    vector <G1> recipientHashes;
    string message;
    AuthenticatedData autData;
    char * encryptedData;
    // Public parameters of the Boneh and Franklin scheme
    G2 P;
    G2 Ppub;
    char sessionKey[HASH_LEN];

    /********************************************************
     *  Private parameters of the Boneh and Franklin scheme *
     ********************************************************/
    Big sigma;
    Big r;

public:
    BroadcastMessage(string message) {
        this->message = message;

        /*************************************************
        *     Generate random symmetric session key      *
        **************************************************/
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
    void addRecipient(string recipient) {
        G1 Q1;

        // Add recipient to the recipient list
        recipients.push_back(recipient);
        // Add hash of recipient to the recipientHashes list
        pfc.hash_and_map(Q1, (char *)recipient.c_str());
        recipientHashes.push_back(Q1);
        // Add
    }
    int getNbOfRecipients() {
        return recipients.size();
    }
    string getMessage() {
        return message;
    }
    int getBroadcastMessageLength() {
        if(recipients.size() == 0)
            return 0;
        else
            return autData.getLength(recipients.size()) + TAG_LEN + message.length();
    }
    void getIV(char (&iv)[HASH_LEN/2]) {
        memcpy(iv,&sessionKey[HASH_LEN/2],HASH_LEN/2);
    }
    void getK1(char (&k1)[HASH_LEN/2]) {
        memcpy(k1,&sessionKey,HASH_LEN/2);
    }
};

G2 g2From(string);
G1 g1From(string);
string toString(G2);
string toString(G1);
string toString(Big);
int getAuthenticatedDataLength(int nbOfRecipients);
int getBroadcastMessageLength(int nbOfRecipients, string message);
float getExecutionTime(float begin_time);
void encodeAuthenticatedDataArray(authenticatedData_t ad, char * A);
authenticatedData_t decodeAuthenticatedDataArray(char * A);

miracl *mip = get_mip();
int bytes_per_big=(MIRACL/8)*(get_mip()->nib-1);

int main(void)
{
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

    "***********************************************************************************************************************";
    "*                                                           ENCRYPT                                                   *";
    "***********************************************************************************************************************";

    string message = "This is a broadcasted message!";

    /*************************************************
    *     Generate random symmetric session key      *
    **************************************************/
    // Read out 256 random bits from /dev/urandom
    char k[SES_KEY_LEN];
    FILE *fp;
    fp = fopen("/dev/urandom", "r");
    fread(&k, 1, SES_KEY_LEN, fp);
    fclose(fp);

    // Hash 256 bits to an encryption key K1 and an initialisation vector IV
    char hash[HASH_LEN];
    sha256 sh;

    shs256_init(&sh);

    for(int i = 0; i < HASH_LEN; i++) {
        shs256_process(&sh,k[i]);
        shs256_hash(&sh,hash);
    }
    cout << "hash:" << endl;
    for(int i = 0; i<HASH_LEN; i++) {
        cout << hex << hash[i];
    }
    cout << endl;
    char k1[HASH_LEN/2];
    char iv[HASH_LEN/2];
    memcpy(k1,hash,HASH_LEN/2);
    memcpy(iv,&hash[HASH_LEN/2],HASH_LEN/2);

    // The secret session key
    Big ses_key = from_binary(HASH_LEN, hash);
    cout << "Symmetric session key to encrypt" << endl << ses_key << endl;

    /*************************************************
    *        IBE part of the encryption step         *
    **************************************************/
    G2 P, Ppub, U;
    G1 Q1, D, rQ;
    Big sigma, r, V, W, sigma_hash;

    // Get Ppub, P and D from the PKG's XML message
    Ppub = g2From(p_pub);
    P = g2From(p);
    D = g1From(d_id);

    /*
    cout << "received Ppub: " << endl << Ppub.g << endl;
    cout << "received P: " << endl << P.g << endl;
    cout << "received D: " << endl << D.g << endl;
    */

    pfc.precomp_for_pairing(Ppub);
    pfc.precomp_for_mult(P);

    //Choose a random r
    pfc.random(r);

    // Vector of intended recipients
    vector<string> recipients;


    // First 4 (because Alice is number 5)
    /*
    recipients.push_back("Andre");
    recipients.push_back("Adam");
    recipients.push_back("Dylan");
    recipients.push_back("Fred");
    // 5
    recipients.push_back("Adam1");
    recipients.push_back("Dylan1");
    recipients.push_back("Fred1");
    recipients.push_back("Andre2");
    recipients.push_back("Adam2");
    // 10
    recipients.push_back("Dylan2");
    recipients.push_back("Patrick");
    recipients.push_back("Ferdinand");
    recipients.push_back("Filipe");
    recipients.push_back("Frits");
    // 15
    recipients.push_back("Frank");
    recipients.push_back("Giovanni");
    recipients.push_back("Gianni");
    recipients.push_back("Kennedy");
    recipients.push_back("John");
    // 20
    recipients.push_back("Aster");
    recipients.push_back("Jonas");
    recipients.push_back("Riek");
    recipients.push_back("Stefan");
    recipients.push_back("Tim");
    // 25
    recipients.push_back("Nolan");
    recipients.push_back("Vincent");
    recipients.push_back("Frederick");
    recipients.push_back("Gerrit");
    recipients.push_back("Anne-Laure");
    // 30
    recipients.push_back("Jean-Jeacques");
    recipients.push_back("Fitzgerald");
    recipients.push_back("Anton");
    recipients.push_back("Anteun");
    recipients.push_back("Antoin");
    // 35
    recipients.push_back("Michael");
    recipients.push_back("Alexander");
    recipients.push_back("Wouter");
    recipients.push_back("Bart");
    recipients.push_back("David");
    // 40
    recipients.push_back("Prisca");
    recipients.push_back("Isabel");
    recipients.push_back("Laure");
    recipients.push_back("Tine");
    recipients.push_back("Sarah");
    // 45
    recipients.push_back("Joke");
    recipients.push_back("Laura");
    recipients.push_back("Tess");
    recipients.push_back("Evelien");
    recipients.push_back("Eline");
    // 50
    recipients.push_back("Jules");
    recipients.push_back("Flor");
    recipients.push_back("Josef");
    recipients.push_back("Joseph");
    recipients.push_back("Jozef");
    // 55
    recipients.push_back("Appel");
    recipients.push_back("Banaan");
    recipients.push_back("Peer");
    recipients.push_back("Annanas");
    recipients.push_back("Aardbei");
    // 60
    recipients.push_back("Prei");
    recipients.push_back("Sla");
    recipients.push_back("Tomaat");
    recipients.push_back("Boontjes");
    recipients.push_back("Fritske");
    // 65
    recipients.push_back("Frankske");
    recipients.push_back("Giovannike");
    recipients.push_back("Giannike");
    recipients.push_back("Kennedyke");
    recipients.push_back("Johnny");
    // 70
    recipients.push_back("Astertje");
    recipients.push_back("Jonaske");
    recipients.push_back("Riekske");
    recipients.push_back("Stefanneke");
    recipients.push_back("Timpie");
    // 75
    recipients.push_back("Nolaneke");
    recipients.push_back("Vincentje");
    recipients.push_back("Frederickske");
    recipients.push_back("Gerritje");
    recipients.push_back("Anne-Lauretje");
    // 80
    recipients.push_back("Fanny");
    recipients.push_back("Kiekeboe");
    recipients.push_back("Konstantinopel");
    recipients.push_back("Moemoe");
    recipients.push_back("Goegebhuer");
    // 85
    recipients.push_back("Michaeltje");
    recipients.push_back("Alexanderke");
    recipients.push_back("Wouterke");
    recipients.push_back("Bartje");
    recipients.push_back("Davidje");
    // 90
    recipients.push_back("Priscatje");
    recipients.push_back("Isabelleke");
    recipients.push_back("Lauretje");
    recipients.push_back("Tineke");
    recipients.push_back("Sarahtje");
    // 95
    recipients.push_back("Joketje");
    recipients.push_back("Lauratje");
    recipients.push_back("Tesske");
    recipients.push_back("Evelientje");
    recipients.push_back("Elineke");
    //100
    */
    // Alice is here :)
    recipients.push_back(RECEIVER_ID);
    int nbOfRecipients = recipients.size();

    begin_time = clock();
    // Vector of Q_id's
    vector <G1> recipientHashes;
    for(int i =0; i < nbOfRecipients; i++) {
        pfc.hash_and_map(Q1, (char *)recipients.at(i).c_str());
        recipientHashes.push_back(Q1);
    }
    begin_time1 = clock();
    // U = r.P
    U = pfc.mult(P, r);
    mip->IOBASE = 16;

    // Vector of V values
    vector <Big> vs;
    // V = sigma XOR Hash(e(Q1,Ppub)^r)
    // Note that e(Q1,Ppub)^r = e(r.Q1, Ppub) such that
    // V = sigma XOR Hash(e(r.Q1,Ppub))
    for(int i = 0; i < nbOfRecipients; i++) {
        rQ = pfc.mult(recipientHashes.at(i), r);
        V = pfc.hash_to_aes_key(pfc.pairing(Ppub, rQ));
        V = lxor(ses_key, V);
        vs.push_back(V);
    }

    enc_time = getExecutionTime(begin_time);
    //cout << "Encryption time for first recipient:      " << enc_time1 << endl;
    //cout << "Encryption time per additional recipient: " << (enc_time - enc_time1)/(nbOfRecipients-1) << endl;

    /*************************************************
    *       AES GCM part of the encryption step      *
    **************************************************/
    // Encode A-array
    int Alen = getAuthenticatedDataLength(nbOfRecipients);
    char A[Alen];
    memset(A, 0, sizeof(A));
    authenticatedData_t ad1;
    ad1.nbOfRecipients = nbOfRecipients;
    ad1.U = U;
    ad1.vs = vs;
    encodeAuthenticatedDataArray(ad1, A);

    /*
    cout << "Content of A:" << endl;
    for(int i = 0; i < Alen; i=i+4) {
        cout << "A[" << dec << i << "]: " << hex << A[i] << "    " << "A[" << dec << i+1 << "]: " << hex << A[i+1] << "    "  << "A[" << dec << i+2 << "]: " << hex << A[i+2] << "    "  << "A[" << dec << i+3 << "]: " << hex << A[i+3] << "    " << endl;
    }
    cout << endl;*/

    char P_text[message.length()];
    memset(P_text, 0, sizeof(P_text));
    strcpy(P_text, message.c_str());

    gcm g;
    char C[message.length()];
    char T[TAG_LEN];
    gcm_init(&g, HASH_LEN/2, k1, HASH_LEN/2, iv);
    gcm_add_header(&g, A, Alen);
    gcm_add_cipher(&g, GCM_ENCRYPTING, P_text, message.length(), C);
    gcm_finish(&g, T);

    char broadCastMessage[getBroadcastMessageLength(nbOfRecipients, message)];

    int filled = 0;
    memcpy(broadCastMessage, A, Alen);
    filled += Alen;
    memcpy(&broadCastMessage[filled], T, TAG_LEN);
    filled += TAG_LEN;
    memcpy(&broadCastMessage[filled], C, message.length());
    /*cout << "broadCastMessage:" << endl;
    for(int i = 0; i < sizeof(broadCastMessage); i++) {
        cout << broadCastMessage[i];
    }
    cout << endl;*/
    cout << "Total encryption time:                    " << enc_time << endl;
    "***********************************************************************************************************************";
    "*                                                           DECRYPT                                                   *";
    "***********************************************************************************************************************";
    /*************************************************
    *         IBE part of the decryption step        *
    **************************************************/
    begin_time = clock();
    // Overwrite existing A array
    memcpy(A, broadCastMessage, Alen);

    // Decode A-array
    authenticatedData_t ad = decodeAuthenticatedDataArray(A);
    int readOut = Alen;

    /*
    if(ad.nbOfRecipients == nbOfRecipients && U == ad.U && W == ad.W) {
        cout << "successful decoding!" << endl;
        for(int i = 0; i < nbOfRecipients; i++) {
            if(ad.vs.at(i) != vs.at(i)) {
                cout << "altough V[" << i << "] differs from Vrec[" << i << "]" << endl;
            }
        }
    } else {
        cout << "Something went very very wrong" << endl;
    }*/
    int i = 0;
    // Iterate over all V values until U equals rP.
    G2 uCalc;
    Big ud_hash = pfc.hash_to_aes_key(pfc.pairing(U,D));
    bool integrity = false;
    while(!integrity && i < ad.nbOfRecipients){
        // sigma = V XOR Hash(e(D,U))
        V=ad.vs.at(i);
        ses_key = lxor(V, ud_hash);


        string sesKeyString = toString(ses_key);
        char sesKey[SES_KEY_LEN];
        to_binary(ses_key, HASH_LEN, sesKey, TRUE);

        memcpy(k1, sesKey, SES_KEY_LEN/2);
        memcpy(iv, &sesKey[SES_KEY_LEN/2], SES_KEY_LEN/2);

        gcm_init(&g, HASH_LEN/2, k1, HASH_LEN/2, iv);
        gcm_add_header(&g, A, Alen);
        gcm_add_cipher(&g, GCM_DECRYPTING, P_text, message.length(), C);
        gcm_finish(&g, T);
        char Trec[TAG_LEN];
        memcpy(Trec, &broadCastMessage[Alen], TAG_LEN);

        integrity = true;
        for (int j = 0; j < TAG_LEN; j++) {
            if(Trec[j] != T[j]) {
                integrity = false;
                break;
            }
        }
        if(!integrity) {
            cout << dec << i+1 << "th message was wrongly decrypted." << endl;
        } else {
            cout << dec << i+1 << "th message was SUCCESFULLY decrypted!" << endl;
        }
        /*
        if(U != pfc.mult(P,r)) {
            cout << "Decrypting " << recipients.at(i) << "'s session key." << endl;
            cout << "U does not equal rP. Rejected the ciphertext." << endl;
        } else {
            cout << "Decrypting " << recipients.at(i) << "'s session key." << endl;
            mip->IOBASE=16;
            cout << "Decrypted symmetric session key:" << endl << ses_key << endl;
            dec_time = getExecutionTime(begin_time);
        }
        if(i==0) {
            dec_time1 = getExecutionTime(begin_time);
            begin_time1 = clock();
        } else if(i==1) {
            dec_time2 = getExecutionTime(begin_time1);
        } */
        i++;
    }

    //cout << "Decryption time for first recipient:      " << dec_time1 << endl;
    //cout << "Decryption time per additional recipient: " << dec_time2 - dec_time1 << endl;

    /*************************************************
    *       AES GCM part of the decryption step      *
    **************************************************/
    dec_time = getExecutionTime(begin_time);
    cout << "Total decryption time:                    " << dec_time << endl;

    message = (string)P_text;

    cout << endl << "Received message:" << endl << message << endl;

    return 0;
}

static size_t WriteCallback(void *contents, size_t size, size_t nmemb, void *userp)
{
    ((std::string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb;
}

G2 g2From(string aString) {
    G2 res;
    res.g = ECn4(aString);
    return res;
}

G1 g1From(string aString) {
    G1 res;
    res.g = ECn(aString);
    return res;
}

string toString(G2 g2) {
    stringstream res;
    res << g2.g;
    return res.str();
}

string toString(G1 g1) {
    stringstream res;
    res << g1.g;
    return res.str();
}

string toString(Big big) {
    stringstream res;
    res << big;
    return res.str();
}
int getAuthenticatedDataLength(int nbOfRecipients) {
    return U_LEN + nbOfRecipients*V_LEN + sizeof(int);
}
int getBroadcastMessageLength(int nbOfRecipients, string message) {
    return getAuthenticatedDataLength(nbOfRecipients) + TAG_LEN + message.length();
}

float getExecutionTime(float begin_time) {
    return float( clock () - begin_time ) /  CLOCKS_PER_SEC;
}

void encodeAuthenticatedDataArray(authenticatedData_t ad, char * A) {
    memset(A, 0, sizeof(A));
    int filled = 0;
    memcpy(A,&(ad.nbOfRecipients), sizeof(ad.nbOfRecipients));
    filled = sizeof(ad.nbOfRecipients);
    strcpy(&A[filled],toString(ad.U).c_str());
    filled += U_LEN;
    for(int i = 0; i < ad.nbOfRecipients; i++){
        strcpy(&A[filled],toString(ad.vs.at(i)).c_str());
        filled += V_LEN;
    }
}

authenticatedData_t decodeAuthenticatedDataArray(char * A) {
    // Decode A-array
    authenticatedData_t ad;
    int readOut = 0;
    char tempString[U_LEN];
    char tempString2[W_LEN];
    memcpy(&(ad.nbOfRecipients), A, sizeof(ad.nbOfRecipients));
    readOut += sizeof(ad.nbOfRecipients);
    strncpy(tempString, &A[readOut], U_LEN);
    ad.U = g2From((string)tempString);
    readOut += U_LEN;
    for(int i = 0; i < ad.nbOfRecipients; i++) {
        strncpy(tempString2,&A[readOut], V_LEN);
        ad.vs.push_back((Big)tempString2);
        readOut += V_LEN;
    }
    return ad;
}