/*
   This is a demo script to get acquainted with rapidXML
*/

#include <iostream>
#include <ctime>
#include <algorithm>
#include <vector>
#include <string.h>
#include <ostream>
#include <fstream>
#include "rapidxml.hpp"

using namespace std;

int main()
{
	string reqMessage = //"<?xml version='1.0' encoding='UTF-8' standalone='no'?>"
	"<scramble> "
	"    <type>TYPE</type>"
	"    <publicpath>PublicKeysPath</publicpath>"
	"    <secretpath>SecretKeyPath</secretpath>"
	"    <text>TextToProcess</text>"
	"</scramble>";

	vector<char> xml_copy(reqMessage.begin(), reqMessage.end());
	xml_copy.push_back('\0');

	// only use xml_copy from here on!
	rapidxml::xml_document<> doc;
	rapidxml::xml_node<> * root_node;
	rapidxml::xml_node<> * child_node;
	// we are choosing to parse the XML declaration
	// parse_no_data_nodes prevents RapidXML from using the somewhat surprising
	// behavior of having both values and data nodes, and having data nodes take
	// precedence over values when printing
	// >>> note that this will skip parsing of CDATA nodes <<<
	doc.parse<rapidxml::parse_declaration_node | rapidxml::parse_no_data_nodes>(&xml_copy[0]);
	root_node = doc.first_node("scramble");
	child_node = root_node->first_node("publicpath");

	cout << "Value of publicpath is:" << child_node->value() << endl;

	return 0;
}
