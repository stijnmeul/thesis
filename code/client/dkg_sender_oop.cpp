#include "client_funcs.h"
#include "authenticatedData.h"
#include "broadcastMessage.h"
#include "plaintextMessage.h"
#include "encryptedMessage.h"
// Compilation command:
// g++-4.7 dkg_sender_oop.cpp authenticatedData.cpp broadcastMessage.cpp client_funcs.cpp encryptedMessage.cpp plaintextMessage.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp ../cppmiracl/source/mrgcm.c -I ../cppmiracl/include/ ../cppmiracl/source/mraes.c -L ../cppmiracl/source/ -l miracl -lcurl -o dkgsender

// https://www.facebook.com/help/105399436216001#What-are-the-guidelines-around-creating-a-custom-username? for more information about which characters that can be used for usernames and profile_ids


#include <stdio.h>
#include <curl/curl.h>
#include <string>
#include <iostream>
#include <vector>
#include "../cppmiracl/include/rapidxml.hpp"
#include <stdexcept>
#include "client_funcs.h"
#define RECEIVER_ID "Alice"
#define PKG_POST "id=" RECEIVER_ID


#include "../cppmiracl/source/pairing_3.h"

#define THRESHOLD 3
#define DKG_BASE_ADDR "https://localhost/thesis/pkg"

using namespace std;


class PlaintextMessage;

// Avoid invalid returning of forward reference.

struct DkgResult {
    G2 Ppub;
    G1 Qpriv;
    G2 P;
};

DkgResult scrapeDkg(string url);
Big lagrange(int i, int *reconstructionPoints, int degree, Big order);
G1 getSecretKey(int (&contactedServers)[THRESHOLD], vector <G1> Qprivs, Big order, PFC *pfc);
G2 getPpub(int (&contactedServers)[THRESHOLD], vector <G2> Ppubs, Big order, PFC *pfc);

int main(void)
{
    // Initialise a strong random number generator
    char raw[256];
    FILE *fp;
    fp = fopen("/dev/urandom", "r");
    fread(&raw, 1, 256, fp);
    fclose(fp);
    time_t seed;
    csprng rng;
    time(&seed);
    strong_init(&rng,strlen(raw),raw,(long)seed);
    // Make sure all random PFC elements rely on strong random number generator
    PFC pfc(AES_SECURITY,&rng);
    miracl *mip = get_mip();
    int bytes_per_big=(MIRACL/8)*(get_mip()->nib-1);

    mip->IOBASE=64;
    clock_t begin_time, begin_time1;
    float enc_time, enc_time1, dec_time, dec_time1, dec_time2, ext_time;

    G2 P, Ppub;
    G1 Qpriv, Qid;
    G1 D;
    Big order = pfc.order();

    // Specify the ids of the dkgs to contact
    //int dkgIds[THRESHOLD] = {2, 3};
    //int dkgIds2[THRESHOLD] = {3, 4, 5};
    int dkgIds[THRESHOLD];
    for(int i = 0; i < THRESHOLD; i++) {
        dkgIds[i] = i+1;
    }

    const char * id = "Alice";
    string urls[THRESHOLD];
    for (int i = 0; i < THRESHOLD; i++) {
        stringstream ss;
        ss << DKG_BASE_ADDR << dkgIds[i] << "/";
        urls[i] = ss.str();
    }
    vector <G1> Qprivs;
    vector <G2> Ppubs;
    DkgResult retParams;

    begin_time = clock();
    pfc.hash_and_map(Qid, (char*)id);

    for (int i = 0; i < THRESHOLD; i++) {
        retParams = scrapeDkg(urls[i]);
        // Get Ppub, P and Qpriv from the PKG's XML message
        P = retParams.P;

        Qpriv = retParams.Qpriv;
        Qprivs.push_back(Qpriv);

        Ppub = retParams.Ppub;
        Ppubs.push_back(Ppub);

        // Verify if the DKG are being honest
        GT QprivP = pfc.pairing(P, Qpriv);
        GT QidPpub = pfc.pairing(Ppub, Qid);
        if (QprivP != QidPpub) {
            cout << "Server " << dkgIds[i] << " is dishonest. Select another DKG to continue the extraction process." << endl;
            return 0;
        }
    }

    D = getSecretKey(dkgIds, Qprivs, order, &pfc);
    Ppub = getPpub(dkgIds, Ppubs, order, &pfc);
    //cout << "D.g" << endl << D.g << endl;
    //cout << "Ppub.g" << endl << Ppub.g << endl;
    ext_time = getExecutionTime(begin_time);
    cout << "Extraction time was " << ext_time << endl;
    // This demonstrates that the DKGs are effectively working like they should
    /*
    for (int i = 0; i < THRESHOLD; i++) {
        stringstream ss;
        ss << DKG_BASE_ADDR << dkgIds2[i] << "/?id=" << id;
        urls[i] = ss.str();
    }

    Qprivs.clear();
    Ppubs.clear();
    for (int i = 0; i < THRESHOLD; i++) {
        retParams = scrapeDkg(urls[i]);
        // Get Ppub, P and Qpriv from the PKG's XML message
        P = retParams.P;

        Qpriv = retParams.Qpriv;
        Qprivs.push_back(Qpriv);

        Ppub = retParams.Ppub;
        Ppubs.push_back(Ppub);

        // Verify if the DKG are being honest
        GT QprivP = pfc.pairing(P, Qpriv);
        GT QidPpub = pfc.pairing(Ppub, Qid);
        if (QprivP != QidPpub) {
            cout << "Server " << dkgIds[i] << " is dishonest. Select another DKG to continue the extraction process." << endl;
            return 0;
        }
    }
    D = getSecretKey(dkgIds2, Qprivs, order,&pfc);
    Ppub = getPpub(dkgIds2, Ppubs, order, &pfc);
    cout << "D.g" << endl << D.g << endl;
    cout << "Ppub.g" << endl << Ppub.g << endl;*/

    PlaintextMessage mes = PlaintextMessage("Dit is een test");

    mes.addRecipient("Andre", &pfc);
    mes.addRecipient("Adam", &pfc);
    mes.addRecipient("Dylan", &pfc);
    mes.addRecipient("Fred", &pfc);
    // 5
    mes.addRecipient("Adam1", &pfc);
    mes.addRecipient("Dylan1", &pfc);
    mes.addRecipient("Fred1", &pfc);
    mes.addRecipient("Andre2", &pfc);
    mes.addRecipient("Adam2", &pfc);
    // 10
    mes.addRecipient("Dylan2", &pfc);
    mes.addRecipient("Patrick", &pfc);
    mes.addRecipient("Ferdinand", &pfc);
    mes.addRecipient("Filipe", &pfc);
    mes.addRecipient("Frits", &pfc);
    // 15
    mes.addRecipient("Frank", &pfc);
    mes.addRecipient("Giovanni", &pfc);
    mes.addRecipient("Gianni", &pfc);
    mes.addRecipient("Kennedy", &pfc);
    mes.addRecipient("John", &pfc);
    // 20
    mes.addRecipient("Aster", &pfc);
    mes.addRecipient("Jonas", &pfc);
    mes.addRecipient("Riek", &pfc);
    mes.addRecipient("Stefan", &pfc);
    //mes.addRecipient("Tim", &pfc);
    // 25
    mes.addRecipient("Alice", &pfc);

    pfc.precomp_for_mult(P);
    pfc.precomp_for_pairing(Ppub);
    begin_time = clock();

    EncryptedMessage encMes = mes.encrypt(P, Ppub, &pfc);
    cout << "encMes.getMessage()" << endl;
    string encMesPlain = encMes.getMessage();
    cout << "encMesPlain" << endl << encMesPlain << endl;
    EncryptedMessage encFromPlain = EncryptedMessage(encMesPlain);
    cout << "Encryption time:     " << getExecutionTime(begin_time) << endl;
    //cout << "encMes.getNbOfRecipients()" << endl << encMes.getNbOfRecipients() << endl;
    begin_time = clock();
    PlaintextMessage decMes = encMes.decrypt(P, Ppub, D, &pfc);
    PlaintextMessage decFromPlain = encFromPlain.decrypt(P, Ppub, D, &pfc);
    cout << "Decryption time:     " << getExecutionTime(begin_time) << endl;
    cout << "decMes " << decMes.getMessage() << endl;
    cout << "decFromPlain" << endl << decFromPlain.getMessage() << endl;

    return 0;
}

DkgResult scrapeDkg(string url) {
    CURL *curl;
    CURLcode res;
    string readBuffer;
    curl = curl_easy_init();

    if(curl) {
        // Suppose Bob already knows his private d_id value.
        // Therefore, ask Alice's ID such that the webpage only needs to be crawled once.
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        /* example.com is redirected, so we tell libcurl to follow redirection */
        curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
        // Turn off cerificate checking with external CA's since localhost uses a self-signed certificate
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, FALSE);
        // Do a POST request to get all results
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, PKG_POST);

        /* Perform the request, res will get the return code */
        res = curl_easy_perform(curl);
        /* Check for errors */
        if(res != CURLE_OK)
            fprintf(stderr, "curl_easy_perform() failed: %s\n",
        curl_easy_strerror(res));

        /* always cleanup */
        curl_easy_cleanup(curl);
    }

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
    DkgResult result;
    result.Ppub = g2From(p_pub);
    result.P = g2From(p);
    result.Qpriv = g1From(d_id);
    return result;
}

G1 getSecretKey(int (&contactedServers)[THRESHOLD], vector <G1> Qprivs, Big order, PFC *pfc) {
    G1 D;
    for (int i = 0; i < THRESHOLD; i++) {
        G1 Q = Qprivs.at(i);
        Big l = lagrange(i, contactedServers, THRESHOLD, order);
        D = D + (*pfc).mult(Q, l);
    }
    return D;
}

G2 getPpub(int (&contactedServers)[THRESHOLD], vector <G2> Ppubs, Big order, PFC *pfc) {
    G2 Ppub;
    for (int i = 0; i < THRESHOLD; i++) {
        G2 myPpub = Ppubs.at(i);
        Big l = lagrange(i, contactedServers, THRESHOLD, order);
        Ppub = Ppub + (*pfc).mult(myPpub, l);
    }
    return Ppub;
}


Big lagrange(int i, int *reconstructionPoints, int degree, Big order) {
    Big z = 1;
    for (int k = 0; k < degree; k++) {
        if(k != i) {
            z = modmult(z, moddiv( (order - (Big)reconstructionPoints[k]), ((Big)reconstructionPoints[i] - (Big)reconstructionPoints[k]), order), order);
        }
    }
    return z;
}