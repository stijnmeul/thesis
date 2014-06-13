
class DerivedClass_B: public Baseclass {
private:
	int share;

public:
	// Constructor only allowed if serverId = 1 (because only server 1 can generate P)
	DerivedClass_B(int sender, int receiver, share_t share);

};