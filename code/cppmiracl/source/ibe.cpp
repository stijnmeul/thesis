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

   g++-4.7 ibe.cpp bls_pair.cpp zzn24.cpp zzn8.cpp zzn4.cpp zzn2.cpp ecn4.cpp big.cpp zzn.cpp ecn.cpp -I ../include/ -L./ -l miracl -o ibe
*/

#include <iostream>
#include <ctime>
#include <time.h>

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

	time_t seed;
	float ext_time, set_time, enc_time, dec_time;
	clock_t begin_time;

	Big s,r,sigma,c,M,V,W,sigma_hash;
	// Although in paper, generator P is an elementof G1, switch to G2 to allow precomputation with MIRACL library
	G2 P, Ppub, U, rP;
	G1 Q1, D, rQ;
	char *comp1;
	char *comp2;

	time(&seed);
    irand((long)seed);

    // Get the miracl instance pointer
	// Can be used to access various internal parameters associated with the current instance of MIRACL
	// Set IOBASE to 256 such that Big M can contain all ASCII characters
	miracl* mip = get_mip();
	mip->IOBASE = 256;


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
	pfc.hash_and_map(Q1, (char *)"Alice");
	// Calculate private key of Alice as D=s.Q1
	D = pfc.mult(Q1, s);

	ext_time = getExecutionTime(begin_time);
	/**********
	* ENCRYPT
	*
	* happens at the side of Bob
	* Bob can calculate Q1 because he knows Alice's identity
	***********/

	//pfc.precomp_for_pairing(Ppub);
	pfc.precomp_for_mult(P);

	// The secret message
	M = (char *)"I <3 you Alice";
	//cout << "Encrypted message" << endl << M << endl;

	begin_time = clock();
	// Choose a random sigma with length equal to AES_SECURITY as specified above
	pfc.rankey(sigma);
	// Calculate r=Hash(sigma,M)
	pfc.start_hash();
	pfc.add_to_hash(sigma);
	pfc.add_to_hash(M);
	r = pfc.finish_hash_to_group();

	//mip->IOBASE = 2;
	//cout << "r: " << r << endl;
	//cout << "sigma: " << sigma << endl;

	// Bob calculates Q1 based on Alice's identity
	pfc.hash_and_map(Q1, (char *)"Alice");
	// U = r.P
	U = pfc.mult(P, r);
	// V = sigma XOR Hash(e(Q1,Ppub)^r)
	// Note that e(Q1,Ppub)^r = e(r.Q1, Ppub) such that
	// V = sigma XOR Hash(e(r.Q1,Ppub))
	rQ = pfc.mult(Q1, r);
	V = pfc.hash_to_aes_key(pfc.pairing(Ppub, rQ));
	V = lxor(sigma, V);
	// W = M XOR Hash(sigma)
	pfc.start_hash();
	pfc.add_to_hash(sigma);
	sigma_hash = pfc.finish_hash_to_group();
	W = lxor(M, sigma_hash);

	enc_time = getExecutionTime(begin_time);
	/**********
	* DECRYPT
	*
	* happens at the side of Alice
	***********/
	begin_time = clock();
	// sigma = V XOR Hash(e(D,U))
	// Alice knows her own secret key D
	sigma = lxor(V, pfc.hash_to_aes_key(pfc.pairing(U,D)));

	// M = W XOR Hash(sigma)
	pfc.start_hash();
	pfc.add_to_hash(sigma);
	sigma_hash = pfc.finish_hash_to_group();
	M = lxor(W, sigma_hash);

	// r = Hash(sigma,M)
	pfc.start_hash();
	pfc.add_to_hash(sigma);
	pfc.add_to_hash(M);
	r = pfc.finish_hash_to_group();

	dec_time = getExecutionTime(begin_time);

	if(U != pfc.mult(P,r)) {
		cout << "U does not equal rP. Rejected the ciphertext." << endl;
		return 0;
	}
	mip->IOBASE = 256;
		cout << "Result after decryption:" << endl << M << endl;

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
