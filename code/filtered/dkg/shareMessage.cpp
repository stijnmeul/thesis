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

ShareMessage::ShareMessage(int sender, int receiver, share_t share) {
	init(sender, receiver, SHARE_MESSAGE);
	this->share = share;
}
ShareMessage::ShareMessage(string xmlString) {
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
	root_node = root_node->first_node("share");
	share_t share;
	share.x = atoi(root_node->first_node("x")->value());
	share.y = (Big)root_node->first_node("y")->value();
	share.shareGenerator = atoi(root_node->first_node("shareGenerator")->value());
	this->share = share;
}

string ShareMessage::toString() {
	stringstream result;
	result << "<dkgmessage> " << endl;
	result << "    <sender>" << this->sender << "</type>" << endl;
	result << "    <receiver>" << this->receiver << "</receiver>" << endl;
	result << "    <type>" << SHARE_MESSAGE << "</type>" << endl;
	result << "    <share>" << endl;
	result << "        <x>" << this->share.x << "</x>" << endl;
	result << "        <y>" << this->share.y << "</y>" << endl;
	result << "        <shareGenerator>" << this->share.shareGenerator << "</shareGenerator>" << endl;
	result << "    </share>" << endl;
	result << "</dkgmessage>";

	return result.str();
}

string ShareMessage::printType() {
	return "SHARE_MESSAGE";
}

share_t ShareMessage::getShare() {
	return this->share;
}
