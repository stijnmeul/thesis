/*
   Boneh and Franklin IBE

   Compile with modules as specified below

   For MR_PAIRING_CP curve
   cl /O2 /GX ibe.cpp cp_pair.cpp zzn2.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_MNT curve
   cl /O2 /GX ibe.cpp mnt_pair.cpp zzn6a.cpp ecn3.cpp zzn3.cpp zzn2.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_BN curve
   cl /O2 /GX ibe.cpp bn_pair.cpp zzn12a.cpp ecn2.cpp zzn4.cpp zzn2.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_KSS curve
   cl /O2 /GX ibe.cpp kss_pair.cpp zzn18.cpp zzn6.cpp ecn3.cpp zzn3.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_BLS curve
   cl /O2 /GX ibe.cpp bls_pair.cpp zzn24.cpp zzn8.cpp zzn4.cpp zzn2.cpp ecn4.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   See https://eprint.iacr.org/2001/090 for more information
   Section 4.1 and 4.2
*/

//********* choose just one of these pairs **********
//#define MR_PAIRING_CP      // AES-80 security
//#define AES_SECURITY 80

//#define MR_PAIRING_MNT	// AES-80 security
//#define AES_SECURITY 80

//#define MR_PAIRING_BN    // AES-128 or AES-192 security
//#define AES_SECURITY 128
//#define AES_SECURITY 192

//#define MR_PAIRING_KSS    // AES-192 security
//#define AES_SECURITY 192

#define MR_PAIRING_BLS    // AES-256 security
#define AES_SECURITY 256
//*********************************************

#include "../../cppmiracl/source/pairing_3.h"
#include "ibe_pkg.h"

/*class JsonArray {
	private:
		std::vector<string> keys;
		std::vector<string> values;
	public:
		string getJsonArray() {
			std::stringstream res;
			res << "{";
			for(int i = 0; i < keys.size(); i++) {
				res << "\"" << keys[i] << "\":\"" << values[i] << "\"";
				if(i != keys.size()-1) {
					res << ", ";
				}
			}
			res << "}";
			return res.str();
		};
		void add(string key, string value) {
			keys.push_back(key);
			values.push_back(value);
		};
} jsonArr;*/

string getIbeParams(const char * id)
{
	PFC pfc(AES_SECURITY);  // initialise pairing-friendly curve

	time_t seed;
	float ext_time, set_time, enc_time, dec_time;
	clock_t begin_time;

	Big s,r,sigma,c,M,V,W,sigma_hash;
	// Although in paper, generator P is an elementof G1, switch to G2 to allow precomputation with MIRACL library
	G2 P, Ppub, U, rP;
	G1 Q1, D, rQ;

	char* bytes;

	stringstream res;

	time(&seed);
    irand((long)seed);

    // Get the miracl instance pointer
	// Can be used to access various internal parameters associated with the current instance of MIRACL
	// Set IOBASE to 256 such that Big M can contain all ASCII characters
	miracl* mip = get_mip();
	mip->IOBASE = 16;


	/**********
	* SETUP
	*
	* happens at the side of the TA
	***********/
	begin_time = clock();

	// Choose a random generator P elementof G2
	pfc.random(P);
	// If an element of G1, G2 or GT is fixed, then it can be
	// precomputed on, using pfc.precomp_for_mult() for G1 and G2
	// and pfc.precomp_for_power() for GT
	// P becomes read-only from this point onwards
	pfc.precomp_for_mult(P);
	// Pick a random s elementof Z_q
	pfc.random(s);
	// Set Ppub = sP
	Ppub = pfc.mult(P, s);

	set_time = getExecutionTime(begin_time);
	/**********
	* EXTRACT
	*
	* happens at the side of the TA
	* later on Alice receives D over a secure channel
	***********/
	begin_time = clock();

	// hash public key of Alice to Q1
	pfc.hash_and_map(Q1, (char*)id);
	// Calculate private key of Alice as D=s.Q1
	D = pfc.mult(Q1, s);

	ext_time = getExecutionTime(begin_time);


	res << D.g;
    return res.str();
}

float getExecutionTime(float begin_time) {
	return float( clock () - begin_time ) /  CLOCKS_PER_SEC;
}

string toString(float number) {
	std::stringstream ss;
	ss << number;
	return ss.str();
}

int add(int a, int b) {
	return a+b;
}
