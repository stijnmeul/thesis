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

struct authenticatedData_t {
  int nbOfRecipients;
  G2 U;
  Big W;
  vector <Big> vs;
};

G2 g2From(string);
G1 g1From(string);
string toString(G2);
string toString(G1);
string toString(Big);
int getAuthenticatedDataLength(int);
int getBroadcastMessageLength(int, string);
float getExecutionTime(float);
void encodeAuthenticatedDataArray(authenticatedData_t ad, char * A);
authenticatedData_t decodeAuthenticatedDataArray(char * A);

PFC pfc(AES_SECURITY);
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
    int bytes_read = fread(&k, 1, SES_KEY_LEN, fp);
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

    // The secret message
    Big ses_key;
    /*mip->IOBASE = 256;
    ses_key = (char *)hash;
    mip->IOBASE = 16;
    cout << "Symmetric session key to encrypt" << endl << ses_key << endl;*/
    ses_key = from_binary(HASH_LEN, hash);
    cout << "Symmetric session key to encrypt" << endl << ses_key << endl;

    /*************************************************
    *        IBE part of the encryption step         *
    **************************************************/
    G2 P, Ppub, U;
    G1 Q1, D, rQ;
    Big sigma, r, V, W, sigma_hash;
    ZZn4 test;

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

    // Choose a random sigma with length equal to AES_SECURITY as specified above
    pfc.rankey(sigma);
    // Calculate r=Hash(sigma,M)
    pfc.start_hash();
    pfc.add_to_hash(sigma);
    pfc.add_to_hash(ses_key);
    r = pfc.finish_hash_to_group();

    // Vector of intended recipients
    vector<string> recipients;
    recipients.push_back("Andre");
    recipients.push_back("Adam");
    recipients.push_back("Dylan");
    recipients.push_back("Fred");
    recipients.push_back(RECEIVER_ID);
    int nbOfRecipients = recipients.size();

    begin_time = clock();
    // Vector of Q_id's
    vector <G1> recipientHashes;
    for(int i =0; i < nbOfRecipients; i++) {
        pfc.hash_and_map(Q1, (char *)recipients.at(i).c_str());
        recipientHashes.push_back(Q1);
        if(i==0) {
            enc_time1 = getExecutionTime(begin_time);
        }
    }
    begin_time1 = clock();
    // U = r.P
    U = pfc.mult(P, r);
    string testString;
    stringstream ss2;
    mip->IOBASE = 16;

    // Vector of V values
    vector <Big> vs;
    // V = sigma XOR Hash(e(Q1,Ppub)^r)
    // Note that e(Q1,Ppub)^r = e(r.Q1, Ppub) such that
    // V = sigma XOR Hash(e(r.Q1,Ppub))
    for(int i = 0; i < nbOfRecipients; i++) {
        rQ = pfc.mult(recipientHashes.at(i), r);
        V = pfc.hash_to_aes_key(pfc.pairing(Ppub, rQ));
        V = lxor(sigma, V);
        vs.push_back(V);
        if(i==0) {
            enc_time1 += getExecutionTime(begin_time1);
        }
    }
    begin_time1 = clock();

    // W = M XOR Hash(sigma)
    pfc.start_hash();
    pfc.add_to_hash(sigma);
    sigma_hash = pfc.finish_hash_to_group();
    W = lxor(ses_key, sigma_hash);

    enc_time = getExecutionTime(begin_time);
    enc_time1 += getExecutionTime(begin_time1);
    cout << "Total encryption time:                    " << enc_time << endl;
    cout << "Encryption time for first recipient:      " << enc_time1 << endl;
    cout << "Encryption time per additional recipient: " << (enc_time - enc_time1)/(nbOfRecipients-1) << endl;

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
    ad1.W = W;
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
    cout << "broadCastMessage:" << endl;
    for(int i = 0; i < sizeof(broadCastMessage); i++) {
        cout << broadCastMessage[i];
    }
    cout << endl;
    "***********************************************************************************************************************";
    "*                                                           DECRYPT                                                   *";
    "***********************************************************************************************************************";
    /*************************************************
    *         IBE part of the decryption step        *
    **************************************************/
    // Overwrite existing A array
    memcpy(A, broadCastMessage, Alen);

    // Decode A-array
    authenticatedData_t ad = decodeAuthenticatedDataArray(A);

    if(ad.nbOfRecipients == nbOfRecipients && U == ad.U && W == ad.W) {
        cout << "successful decoding!" << endl;
        for(int i = 0; i < nbOfRecipients; i++) {
            if(ad.vs.at(i) != vs.at(i)) {
                cout << "altough V[" << i << "] differs from Vrec[" << i << "]" << endl;
            }
        }
    } else {
        cout << "Something went very very wrong" << endl;
    }

    begin_time = clock();
    r = 0;
    int i = 0;
    // Iterate over all V values until U equals rP.
    while(U != pfc.mult(P,r) && i < nbOfRecipients){
        // sigma = V XOR Hash(e(D,U))
        V=vs.at(i);
        sigma = lxor(V, pfc.hash_to_aes_key(pfc.pairing(U,D)));

        // M = W XOR Hash(sigma)
        pfc.start_hash();
        pfc.add_to_hash(sigma);
        sigma_hash = pfc.finish_hash_to_group();
        ses_key = lxor(W, sigma_hash);

        // r = Hash(sigma,M)
        pfc.start_hash();
        pfc.add_to_hash(sigma);
        pfc.add_to_hash(ses_key);
        r = pfc.finish_hash_to_group();

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
        }
        i++;
    }
    cout << "Total decryption time:                    " << dec_time << endl;
    cout << "Decryption time for first recipient:      " << dec_time1 << endl;
    cout << "Decryption time per additional recipient: " << dec_time2 - dec_time1 << endl;

    /*************************************************
    *       AES GCM part of the decryption step      *
    **************************************************/

    string sesKeyString = toString(ses_key);
    char sesKey[SES_KEY_LEN];
    to_binary(ses_key, HASH_LEN, sesKey, TRUE);

    memcpy(k1, sesKey, SES_KEY_LEN/2);
    memcpy(iv, &sesKey[SES_KEY_LEN/2], SES_KEY_LEN/2);

    gcm_init(&g, HASH_LEN/2, k1, HASH_LEN/2, iv);
    gcm_add_header(&g, A, Alen);
    gcm_add_cipher(&g, GCM_DECRYPTING, P_text, message.length(), C);
    gcm_finish(&g, T);

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
    // +1 because of length(W)
    return U_LEN + nbOfRecipients*V_LEN + W_LEN + sizeof(int);
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
    strcpy(&A[filled],toString(ad.W).c_str());
    filled += W_LEN;
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
    strncpy(tempString2, &A[readOut], W_LEN);
    ad.W = (Big)tempString2;
    readOut += W_LEN;
    for(int i = 0; i < ad.nbOfRecipients; i++) {
        strncpy(tempString2,&A[readOut], V_LEN);
        ad.vs.push_back((Big)tempString2);
        readOut += V_LEN;
    }
    return ad;
}

