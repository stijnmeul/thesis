#define MR_PAIRING_BLS    // AES-256 security
#define AES_SECURITY 256
#define BASE_PORT

#include "../cppmiracl/source/pairing_3.h"
#include "shamir.h"
#include "DKGMessage.h"
#include <vector>
#include <stdexcept>

using namespace std;

void DKGMessage::init(int sender, int receiver, DKGMessageType type) {
	this->sender = sender;
	this->receiver = receiver;
	this->type = type;
}

DKGMessage::DKGMessage(int sender, int receiver, DKGMessageType type, G2 P) {
	init(sender, receiver, type);
	this->P = P;
}
DKGMessage::DKGMessage(int sender, int receiver, DKGMessageType type, share_t share) {
	init(sender, receiver, type);
	this->share = share;
}
DKGMessage::DKGMessage(string xmlString) {

}

string DKGMessagetoString() {
	string str("test");
	return str;
}

DKGMessageType DKGMessage::getType() {
	return this->type;
}

int DKGMessage::getSender() {
	return this->sender;
}

int DKGMessage::getReceiver() {
	return this->receiver;
}

share_t DKGMessage::getShare() {
	return this->share;
}