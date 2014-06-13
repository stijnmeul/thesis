
class Baseclass {
private:
	int receiver;
	int sender;

public:
	// Constructor only allowed if serverId = 1 (because only server 1 can generate P)
	Baseclass(int sender, int receiver, G2 P);

	Baseclass(int sender, int receiver, share_t share);

	Baseclass(int receiver, sender) {
		this->receiver = receiver;
		this->sender = sender;
	}

};