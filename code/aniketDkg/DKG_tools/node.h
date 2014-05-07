#ifndef _NODE_H
#define _NODE_H

#include "message.h"
#include <vector>
#include <string>
using namespace std;
class Node {
	public:
	unsigned int ID;
	vector<Message> msg_vec;
	Node () {};
	Node (unsigned int id) : ID(id) {}
};

#endif
