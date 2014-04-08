#ifndef IBE_PKG_H
#define IBE_PKG_H
#endif

string toString(G2 groupEl) {
	stringstream ss;
	ss << groupEl.g;
	return ss.str();
}