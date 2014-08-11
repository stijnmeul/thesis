#ifndef CLIENT_DKG_H
#define CLIENT_DKG_H

#define THRESHOLD 2
#define DKG_BASE_ADDR "https://localhost/thesis/pkg"

#include <curl/curl.h>
#include "../../../code/cppmiracl/include/rapidxml.hpp"
#define RECEIVER_ID "Alice"
#define PKG_POST "id=" RECEIVER_ID

struct DkgResult {
    G2 Ppub;
    G1 Qpriv;
    G2 P;
};

Big lagrange(int i, int *reconstructionPoints, int degree, Big order) {
    Big z = 1;
    for (int k = 0; k < degree; k++) {
        if(k != i) {
            z = modmult(z, moddiv( (order - (Big)reconstructionPoints[k]), ((Big)reconstructionPoints[i] - (Big)reconstructionPoints[k]), order), order);
        }
    }
    return z;
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

DkgResult scrapeDkg(string url, char * id) {
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
        string postParams = "id=";
        postParams = postParams + id;
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, postParams.c_str());

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

#endif