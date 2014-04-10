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
#endif

using namespace std;

static size_t WriteCallback(void *, size_t, size_t, void *);

G2 g2From(string);
G1 g1From(string);
int getAuthenticatedDataLength(int);
int getBroadcastMessageLength(int, string);

int main(void)
{
    PFC pfc(AES_SECURITY);
    miracl *mip = get_mip();
    /*************************************************
    *          Scrape localhost/thesis/?id=          *
    **************************************************/
    CURL *curl;
    CURLcode res;
    string readBuffer;

    curl = curl_easy_init();
    cout << PKG_ADDR << endl;
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
    int bytes_per_big=(MIRACL/8)*(get_mip()->nib-1);

    shs256_init(&sh);

    for(int i = 0; i < SES_KEY_LEN; i++) {
        shs256_process(&sh,k[i]);
        shs256_hash(&sh,hash);
    }

    char k1[HASH_LEN/2];
    char iv[HASH_LEN/2];
    memcpy(k1,hash,HASH_LEN/2);
    memcpy(iv,&hash[HASH_LEN/2],HASH_LEN/2);

    // The secret message
    Big ses_key;
    mip->IOBASE = 256;
    ses_key = (char *)hash;
    mip->IOBASE = 16;
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

    cout << "received Ppub: " << endl << Ppub.g << endl;
    cout << "received P: " << endl << P.g << endl;
    cout << "received D: " << endl << D.g << endl;

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

    // Vector of Q_id's
    vector <G1> recipientHashes;
    for(int i =0; i < nbOfRecipients; i++) {
        pfc.hash_and_map(Q1, (char *)recipients.at(i).c_str());
        recipientHashes.push_back(Q1);
    }
    // U = r.P
    U = pfc.mult(P, r);
    string testString;
    stringstream ss2;
    mip->IOBASE = 16;
    ss2 << U.g;
    testString = ss2.str();
    cout << "testString size: " << testString.length() << endl;
    cout << "U: " << U.g << endl;
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
    }

    mip->IOBASE = 2;
    cout << "V: " << endl << V << endl;
    mip->IOBASE = 16;

    // W = M XOR Hash(sigma)
    pfc.start_hash();
    pfc.add_to_hash(sigma);
    sigma_hash = pfc.finish_hash_to_group();
    W = lxor(ses_key, sigma_hash);

    /*************************************************
    *       AES GCM part of the encryption step      *
    **************************************************/

    gcm g;
    char A[getAuthenticatedDataLength(nbOfRecipients)];
    char C[SES_KEY_LEN];
    char T[TAG_LEN];
    char plain[bytes_per_big];
    gcm_init(&g, HASH_LEN/2, k1, HASH_LEN/2, iv);
    gcm_add_cipher(&g, GCM_ENCRYPTING, msk, bytes_per_big, C);
    gcm_finish(&g, T);

    "***********************************************************************************************************************";
    "*                                                           DECRYPT                                                   *";
    "***********************************************************************************************************************";
    /*************************************************
    *       AES GCM part of the decryption step      *
    **************************************************/

    /*************************************************
    *         IBE part of the decryption step        *
    **************************************************/
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
            cout << "Decrypted message:" << endl << ses_key << endl;
        }
        i++;
    }

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
int getAuthenticatedDataLength(int nbOfRecipients) {
    // +1 because of length(W)
    return U_LEN + (nbOfRecipients+1)*SES_KEY_LEN + sizeof(int);
}
int getBroadcastMessageLength(int nbOfRecipients, string message) {
    return getAuthenticatedDataLength(nbOfRecipients) + TAG_LEN + message.length();
}