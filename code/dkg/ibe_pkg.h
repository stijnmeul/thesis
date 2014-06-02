#ifndef IBE_PKG_H
#define IBE_PKG_H
#endif

#include <string>
#include "pkg.h"
#include "DKGMessage.h"

string toString(G2 groupEl) {
	stringstream ss;
	ss << groupEl.g;
	return ss.str();
}

string toString(G1 groupEl) {
	stringstream ss;
	ss << groupEl.g;
	return ss.str();
}

void error(const char* msg) {
    perror(msg);
    exit(1);
}

string extract(char *, Big);

G2 g2From(string aString) {
    G2 res;
    res.g = ECn4(aString);
    return res;
}