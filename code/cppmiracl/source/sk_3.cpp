/*
   Sakai & Kasahara IBE key establishment
   using type 3 pairing. See P1363.3

   Compile with modules as specified below

   For MR_PAIRING_CP curve
   cl /O2 /GX sk_3.cpp cp_pair.cpp zzn2.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_MNT curve
   cl /O2 /GX sk_3.cpp mnt_pair.cpp zzn6a.cpp ecn3.cpp zzn3.cpp zzn2.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_BN curve
   cl /O2 /GX sk_3.cpp bn_pair.cpp zzn12a.cpp ecn2.cpp zzn4.cpp zzn2.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_KSS curve
   cl /O2 /GX sk_3.cpp kss_pair.cpp zzn18.cpp zzn6.cpp ecn3.cpp zzn3.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_BLS curve
   cl /O2 /GX sk_3.cpp bls_pair.cpp zzn24.cpp zzn8.cpp zzn4.cpp zzn2.cpp ecn4.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   Very Simple Test program
*/

#include <iostream>
#include <ctime>

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

#include "pairing_3.h"

float getExecutionTime(float begin_time);

int main()
{
	PFC pfc(AES_SECURITY);  // initialise pairing-friendly curve
	float ext_time, set_time, enc_time, dec_time;
	clock_t begin_time;


	Big q=pfc.order();

	Big z,b,SSV,r,H,t;
	G1 P,Z,R;
	G2 Q,KB;
	GT g,w;
	time_t seed;

	time(&seed);
    irand((long)seed);

// setup
    begin_time = clock();
	pfc.random(P);
	pfc.random(Q);
	g=pfc.pairing(Q,P);
	pfc.precomp_for_power(g);

	pfc.random(z);
	pfc.precomp_for_mult(P);

	Z=pfc.mult(P,z);
	pfc.precomp_for_mult(Q);
	set_time = getExecutionTime(begin_time);

// extract private key for Robert
	begin_time = clock();
	b=pfc.hash_to_group((char *)"Robert");
	KB=pfc.mult(Q,inverse(b+z,q));
	ext_time = getExecutionTime(begin_time);

	begin_time = clock();
// verify private key
	pfc.precomp_for_pairing(KB);  // Bob can precompute on his own private key
	if (pfc.pairing(KB,pfc.mult(P,b)+Z)!=g)
	{
		cout << "Bad private key" << endl;
		exit(0);
	}

// Send session key to Bob
	cout << "All set to go.." << endl;

	pfc.rankey(SSV);  // random AES key
	pfc.start_hash();
	pfc.add_to_hash(SSV);
	pfc.add_to_hash(b);
	r=pfc.finish_hash_to_group();

	R=pfc.mult(pfc.mult(P,b)+Z,r);
	t=pfc.hash_to_aes_key(pfc.power(g,r));
	H=lxor(SSV,t);
	cout << "Encryption key= " << SSV << endl;
	enc_time = getExecutionTime(begin_time);
// Receiver
	begin_time = clock();
	t=pfc.hash_to_aes_key(pfc.pairing(KB,R));
	SSV=lxor(H,t);
	pfc.start_hash();
	pfc.add_to_hash(SSV);
	pfc.add_to_hash(b);
	r=pfc.finish_hash_to_group();
	if (pfc.mult(pfc.mult(P,b)+Z,r)==R)
		cout << "Decryption key= " << SSV << endl;
	else
		cout << "The key is BAD - do not use!" << endl;
	dec_time = getExecutionTime(begin_time);


	cout << "Setup time:      " << set_time << endl;
	cout << "Extract time:    " << ext_time << endl;
	cout << "Encryption time: " << enc_time << endl;
	cout << "Decryption time: " << dec_time << endl;
	cout << "               + --------" << endl;
	cout << "Total time:      " << set_time + ext_time + enc_time + dec_time << endl;

    return 0;
}

float getExecutionTime(float begin_time) {
	return float( clock () - begin_time ) /  CLOCKS_PER_SEC;
}