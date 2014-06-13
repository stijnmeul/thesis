#define MR_PAIRING_BLS    // AES-256 security
#define AES_SECURITY 256
#define BASE_PORT

#include "../cppmiracl/source/pairing_3.h"
#include "pkg.h"
#include "DKGMessage.h"
#include <vector>
#include <stdexcept>
#include "rapidxml.hpp"

using namespace std;

PMessage::PMessage(int sender, int receiver, G2 P) {
	init(sender, receiver, P_MESSAGE);
	this->P = P;
}

PMessage::PMessage(string xmlString) {
	vector<char> xml_copy(xmlString.begin(), xmlString.end());
    xml_copy.push_back('\0');
    rapidxml::xml_document<> doc;
    rapidxml::xml_node<> * root_node;
    rapidxml::xml_node<> * sender_node;
    rapidxml::xml_node<> * receiver_node;
    rapidxml::xml_node<> * type_node;

    // we are choosing to parse the XML declaration
    // parse_no_data_nodes prevents RapidXML from using the somewhat surprising
    // behavior of having both values and data nodes, and having data nodes take
    // precedence over values when printing
    // >>> note that this will skip parsing of CDATA nodes <<<
    doc.parse<rapidxml::parse_declaration_node | rapidxml::parse_no_data_nodes>(&xml_copy[0]);
    root_node = doc.first_node("dkgmessage");
    sender_node = root_node->first_node("sender");
    receiver_node = root_node->first_node("receiver");
    type_node = root_node->first_node("type");

    DKGMessageType type = (DKGMessageType)atoi(type_node->value());
    init(atoi(sender_node->value()), atoi(receiver_node->value()), type);
    string myP = root_node->first_node("P")->value();
    this->P.g = ECn4(myP);
}

string PMessage::toString() {
	stringstream result;
	result << "<dkgmessage> " << endl;
	result << "    <sender>" << this->sender << "</type>" << endl;
	result << "    <receiver>" << this->receiver << "</receiver>" << endl;
	result << "    <type>" << P_MESSAGE << "</type>" << endl;
	result << "    <P>" << this->P.g << "</P>" << endl;
	result << "</dkgmessage>";

	return result.str();
}

string PMessage::printType() {
	return "P_MESSAGE";
}

G2 PMessage::getP() {
	return this->P;
}