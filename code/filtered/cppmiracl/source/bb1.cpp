/*
   Boneh and Boyen BB1 IBE
   See http://crypto.stanford.edu/~dabo/papers/bbibe.pdf
   Section 4.3

   Compile with modules as specified below

   For MR_PAIRING_CP curve
   cl /O2 /GX bb1.cpp cp_pair.cpp zzn2.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_MNT curve
   cl /O2 /GX bb1.cpp mnt_pair.cpp zzn6a.cpp ecn3.cpp zzn3.cpp zzn2.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_BN curve
   cl /O2 /GX bb1.cpp bn_pair.cpp zzn12a.cpp ecn2.cpp zzn4.cpp zzn2.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_KSS curve
   cl /O2 /GX bb1.cpp kss_pair.cpp zzn18.cpp zzn6.cpp ecn3.cpp zzn3.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   For MR_PAIRING_BLS curve
   cl /O2 /GX bb1.cpp bls_pair.cpp zzn24.cpp zzn8.cpp zzn4.cpp zzn2.cpp ecn4.cpp big.cpp zzn.cpp ecn.cpp miracl.lib

   Test program
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

//
// Observe that every major operation benefits from precomputation!
//

float getExecutionTime(float begin_time);

int main()
{
	PFC pfc(AES_SECURITY);  // initialise pairing-friendly curve
    miracl* mip=get_mip();

	Big alpha,delta,beta,a,r,s,c1,M;
	G2 ghat,ghat1,hhat,ghat0,da0,da1;
	G1 g,gone,h,c2,c3;
	GT v;
	float ext_time, set_time, enc_time, dec_time;
	clock_t begin_time;

	char message[12];
	int lsb;
	time_t seed;

	time(&seed);
    irand((long)seed);

// common values
    begin_time = clock();
	pfc.random(alpha);
	pfc.random(g);
	// g_1 = g^alpha
	gone=pfc.mult(g,alpha);
	pfc.random(ghat);
	ghat1=pfc.mult(ghat,alpha);
	pfc.random(delta);
	h=pfc.mult(g,delta);
	hhat=pfc.mult(ghat,delta);
	pfc.random(beta);
	ghat0=pfc.mult(ghat1,beta);
	v=pfc.pairing(ghat0,g);
	cout << "Precomputation" << endl;
	pfc.precomp_for_power(v);   // precomputation
	pfc.precomp_for_mult(g);
	pfc.precomp_for_mult(gone);
	pfc.precomp_for_mult(ghat);
	pfc.precomp_for_mult(ghat1);
	set_time = getExecutionTime(begin_time);
//extract
	begin_time = clock();
	a=pfc.hash_to_group((char *)"Alice");
	pfc.random(r);
	da0=ghat0+pfc.mult(hhat+pfc.mult(ghat1,a),r);
	da1=pfc.mult(ghat,r);	da1=-da1;
	pfc.precomp_for_pairing(da0);  // Alice precomputes on her private key !
	pfc.precomp_for_pairing(da1);
	ext_time = getExecutionTime(begin_time);

//encrypt
	begin_time = clock();
	mip->IOBASE=256;
	M=(char *)"test message"; // to be encrypted to Alice
	cout << "Message to be encrypted=   " << M << endl;
	mip->IOBASE=16;

	pfc.random(s);
	// C_1 = Mv^s
	c1=lxor(M,pfc.hash_to_aes_key(pfc.power(v,s)));
	// C_2 = g^s
	c2=pfc.mult(g,s);
	// C_3 = (hg_1^a)^s
	c3=pfc.mult(h+pfc.mult(gone,a),s);
	enc_time = getExecutionTime(begin_time);

//decrypt
	begin_time = clock();
	G1 *g1[2];
	G2 *g2[2];
	g1[0]=&c2; g1[1]=&c3;
	g2[0]=&da0; g2[1]=&da1;

	// in the paper: A XOR H(e(B,d_0)/e(C_1,d_1)) = A XOR H(e(c2,da0)/e(c1,da1))
	M=lxor(c1,pfc.hash_to_aes_key(pfc.multi_pairing(2,g2,g1)));	// Use private key
	mip->IOBASE=256;
	dec_time = getExecutionTime(begin_time);

	cout << "Decrypted message=         " << M << endl;
	cout << endl;
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
