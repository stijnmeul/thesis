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

#include <iostream>
#include <ctime>


//********* CHOOSE JUST ONE OF THESE **********
#define MR_PAIRING_SS2    // AES-80 or AES-128 security GF(2^m) curve
//#define AES_SECURITY 80   // OR
#define AES_SECURITY 128

//#define MR_PAIRING_SSP    // AES-80 or AES-128 security GF(p) curve
//#define AES_SECURITY 80   // OR
//#define AES_SECURITY 128
//*********************************************

#include "pairing_1.h"



// Note that in fuzzy.cpp
//							° the mapping is also G x G -> GT
// 							° Y = e(g,g)^y is calculated as power(pairing((G2)Q,(G1)P),y)
//							° P and Q are only chosen this way because the MIRACL library does not support calculating pairings
//							  on two elements of the same group
int main()
{
	PFC pfc(AES_SECURITY);  // initialise pairing-friendly curve

	time_t seed;
	float execution_time;

	int i;

	Big alpha, r_id[3], id, order, s, sID, beta, sBeta, y, temp2, M;
	G1 g0, g_1, u, temp, test, h[3], h_id[3];
	GT v, w;

	const clock_t begin_time = clock();

	time(&seed);
    irand((long)seed);

    set_io_buffer_size(5000);

    // Get the miracl instance pointer
	// Can be used to access various internal parameters associated with the current instance of MIRACL
	// Set IOBASE to 256 such that Big M can contain all ASCII characters
	miracl* mip = get_mip();
	mip->IOBASE = 256;

	// Calculate ID elementof Z_p based on the ID of the receiver.
	id = (char *)"Bob";
	pfc.start_hash();
	pfc.add_to_hash(id);
	id = pfc.finish_hash_to_group();

	/**********
	* SETUP
	*
	* happens at the side of the TA
	***********/
	// P and Q function as the random generator g.
	pfc.random(g0);
	pfc.random(h[0]);
	pfc.random(h[1]);
	pfc.random(h[2]);
	// If an element of G1, G2 or GT is fixed, then it can be
	// precomputed on, using pfc.precomp_for_mult() for G1 and G2
	// and pfc.precomp_for_power() for GT
	// P becomes read-only from this point onwards
	//pfc.precomp_for_mult(g);

	// Pick a random alpha elementof Z_p
	pfc.random(alpha);

	mip->IOBASE = 16;

	g_1 = pfc.mult(g0, alpha);

	/*TEST: succeeded!
	pfc.random(temp);
	cout << "temp" << endl << temp.g << endl;
	test = pfc.mult(temp, alpha);
	cout << "temp^alpha" << endl << test.g << endl;
	cout << "temp^alpha^1/alpha" << endl << pfc.mult(test, moddiv(1, alpha, order)).g << endl;

	test = pfc.mult(temp, moddiv(1, alpha, order));
	cout << "temp^1/alpha" << endl << test.g << endl;
	cout << "temp^1/alpha^alpha" << endl << pfc.mult(test, alpha).g << endl;
	*/


	/**********
	* KEYGEN
	*
	* happens at the side of the TA
	***********/
	// The PKG generates random r_{id}_{i} elementof Z_p for i elementof {1,2,3}
	cout << "Calculating h_id[i]:" << endl << endl;
	if(id != alpha) {
		for (i=0; i<3; i++) {
			pfc.random(r_id[i]);
			// h_id[i] = (h_ig^(-r_id_i))^1/(alpha-ID)
			// h_i.g is implemented by:
			// 	° a +  operation (see bgw.cpp r:111)
			//	° a + operation (see hibe.cpp r:124)
			order = pfc.order();

			h_id[i] = h[i] + pfc.mult(g0, -r_id[i]);

			h_id[i] = pfc.mult(h_id[i], inverse(alpha-id, order));
		}
	} else {
		cout << "ID equals alpha. PKG aborted." << endl;
	}

	/**********
	* ENCRYPTION
	*
	* takes place at the side of the transmitter
	***********/
	mip->IOBASE = 256;
	M = (char *)"I love you Bob";
	cout << "Message to encrypt:";
	mip->IOBASE = 10;
	cout << M << endl;

	// Pick a random s elementof Z_p
	pfc.random(s);
	// Ciphertext C equals (u,v,w,y)
	sID = modmult(s, id, order);


	u = pfc.mult(g_1, s);
	u =  pfc.mult(g0, -sID);
	// v = e(g, g)^s = e(g.s, g)
	v = pfc.pairing(pfc.mult(g0,s), g0);
	pfc.precomp_for_power(v);

	// w = m.e(g,h_1)^(-s)
	// FILIPE: Is this correct?
	GT wm;
	wm=pfc.pairing(g0,h[0]);
	//pfc.power(g,-h)
	//w = pfc.pairing(pfc.mult(g0, -s), h[0]);
	w = M +pfc.power(wm,-s);

	pfc.start_hash();
	pfc.add_to_hash(u);
	pfc.add_to_hash(v);
	pfc.add_to_hash(w);
	beta = pfc.finish_hash_to_group();
	sBeta = lxor(beta, s);

	y = lxor(pfc.hash_to_aes_key(pfc.power(pfc.pairing(g0, h[1]), s)), pfc.hash_to_aes_key(pfc.power(pfc.pairing(g0, h[2]), sBeta)));
	/**********
	* DERYPTION
	*
	* takes place at the side of the receiver
	***********/
	cout << "Decrypted message:" << lxor(pfc.hash_to_aes_key(pfc.pairing(u, pfc.mult(h_id[1]+h_id[2], beta))), pfc.hash_to_aes_key(pfc.power(v, r_id[0]))) << endl;

	return 0;
}
