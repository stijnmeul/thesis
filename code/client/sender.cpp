#include <stdio.h>
#include <curl/curl.h>
#include <string>
#include <iostream>
#include <vector>
#include "../cppmiracl/include/rapidxml.hpp"

#define MR_PAIRING_BLS    // AES-256 security
#define AES_SECURITY 256
#define SES_KEY_LEN 32
#define HASH_LEN 32
// Compilation command: g++-4.7 sender.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp ../cppmiracl/source/mrgcm.c -I ../cppmiracl/include/ ../cppmiracl/source/mraes.c -L ../cppmiracl/source/ -l miracl -lcurl -o sender

#include "../cppmiracl/source/pairing_3.h"

using namespace std;

static size_t WriteCallback(void *, size_t, size_t, void *);

G2 g2From(string);
G1 g1From(string);

int main(void)
{
    PFC pfc(AES_SECURITY);
    /*************************************************
    *          Scrape localhost/thesis/?id=          *
    **************************************************/
    CURL *curl;
    CURLcode res;
    string readBuffer;

    curl = curl_easy_init();
    if(curl) {
        curl_easy_setopt(curl, CURLOPT_URL, "http://localhost/thesis/?id=Stijn");
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

    /*************************************************
    *                   Encryption                   *
    **************************************************/
    G2 P, Ppub, U;
    G1 Q1, D, rQ;
    Big M, sigma, r, V, W, sigma_hash;
    miracl *mip = get_mip();
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

    // The secret message
    mip->IOBASE = 256;
    M = (char *)"I <3 you Alice";
    cout << "Message to encrypt" << endl << M << endl;

    // Choose a random sigma with length equal to AES_SECURITY as specified above
    pfc.rankey(sigma);
    // Calculate r=Hash(sigma,M)
    pfc.start_hash();
    pfc.add_to_hash(sigma);
    pfc.add_to_hash(M);
    r = pfc.finish_hash_to_group();

    // Bob calculates Q1 based on Alice's identity
    pfc.hash_and_map(Q1, (char *)"Alice");
    // U = r.P
    U = pfc.mult(P, r);
    // V = sigma XOR Hash(e(Q1,Ppub)^r)
    // Note that e(Q1,Ppub)^r = e(r.Q1, Ppub) such that
    // V = sigma XOR Hash(e(r.Q1,Ppub))
    rQ = pfc.mult(Q1, r);
    V = pfc.hash_to_aes_key(pfc.pairing(Ppub, rQ));
    V = lxor(sigma, V);
    // W = M XOR Hash(sigma)
    pfc.start_hash();
    pfc.add_to_hash(sigma);
    sigma_hash = pfc.finish_hash_to_group();
    W = lxor(M, sigma_hash);

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