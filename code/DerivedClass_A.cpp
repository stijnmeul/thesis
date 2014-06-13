
class DerivedClass_A: public Baseclass {
private:
	int P;

public:
	// Constructor only allowed if serverId = 1 (because only server 1 can generate P)
	DerivedClass_A(int sender, int receiver, G2 P);

	Baseclass(int sender, int receiver, share_t share);

	Baseclass(int receiver, sender) {
		this->receiver = receiver;
		this->sender = sender;
	}

};