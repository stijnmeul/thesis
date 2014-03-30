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

//#define KEYGEN_PRECOMP

float getExecutionTime(float begin_time);

int main()
{
	PFC pfc(AES_SECURITY);  // initialise pairing-friendly curve

	float execution_time, set_time, gen_time, enc_time, dec_time;

	time_t seed;
	time(&seed);
    irand((long)seed);

    set_io_buffer_size(5000);

    // Get the miracl instance pointer
	// Can be used to access various internal parameters associated with the current instance of MIRACL
	// Set IOBASE to 256 such that Big M can contain all ASCII characters
	miracl* mip = get_mip();
	mip->IOBASE = 256;

	Big alpha, r_id1, r_id2, r_id3, id, order, s, sID, beta, sBeta, M, w, mask, r_id23;
	G2 p_2, g_1, u, gs_1, ps_2, psBeta_2;
	G1 q_1, h_1, h_2, h_3, h_id1, h_id2, h_id3, h_id23, q_1rid1, q_1rid2, q_1rid3;
	GT v, wm, dec, vr, y2, v_id23, y, p1h3;

	#ifdef KEYGEN_PRECOMP
	GT pair, pair_h1, pair_h2, pair_h3;
	#endif


	clock_t begin_time = clock();

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
	pfc.random(p_2);
	pfc.random(q_1);
	#ifndef KEYGEN_PRECOMP
	pfc.precomp_for_mult(p_2);
	pfc.precomp_for_mult(q_1);
	#endif
	pfc.random(h_1);
	pfc.random(h_2);
	pfc.random(h_3);
	pfc.random(r_id1);
	pfc.random(r_id2);
	pfc.random(r_id3);

	order = pfc.order();

	// If an element of G1, G2 or GT is fixed, then it can be
	// precomputed on, using pfc.precomp_for_mult() for G1 and G2
	// and pfc.precomp_for_power() for GT
	// P becomes read-only from this point onwards
	//pfc.precomp_for_mult(g);

	// Pick a random alpha elementof Z_p
	pfc.random(alpha);

	g_1 = pfc.mult(p_2, alpha);

	set_time = getExecutionTime(begin_time);

	/**********
	* KEYGEN
	*
	* takes place at the side of the TA
	***********/
	// The PKG generates random r_{id}_{i} elementof Z_p for i elementof {1,2,3}
	begin_time = clock();

	if(id != alpha) {

		// h_id[i] = (h_ig^(-r_id_i))^1/(alpha-ID)
		// negative multiplication is implemented in the same way in (ipe.cpp r:207)
		q_1rid1 = pfc.mult(q_1, -r_id1);
		h_id1 = h_1 + q_1rid1;
		h_id1 = pfc.mult(h_id1, inverse(alpha-id, order));

		q_1rid2 = pfc.mult(q_1, -r_id2);
		h_id2 = h_2 + q_1rid2;
		h_id2 = pfc.mult(h_id2, inverse(alpha-id, order));

		q_1rid3 = pfc.mult(q_1, -r_id3);
		h_id3 = h_3 + q_1rid3;
		h_id3 = pfc.mult(h_id3, inverse(alpha-id, order));
	} else {
		cout << "ID equals alpha. PKG aborted." << endl;
		return 0;
	}

	#ifdef KEYGEN_PRECOMP
	pair = pfc.pairing(p_2, q_1);
	pair_h1 = pfc.pairing(p_2, h_1);
	pair_h2 = pfc.pairing(p_2, h_2);
	pair_h3 = pfc.pairing(p_2, h_3);
	#endif

	gen_time = getExecutionTime(begin_time);

	/**********
	* ENCRYPTION
	*
	* takes place at the side of the transmitter
	***********/
	begin_time = clock();

	#ifdef KEYGEN_PRECOMP
	pfc.precomp_for_power(pair);
	pfc.precomp_for_power(pair_h1);
	pfc.precomp_for_power(pair_h2);
	pfc.precomp_for_power(pair_h3);
	#endif

	mip->IOBASE = 256;
	M = (char *)"I love you Bob";
	cout << "Message to encrypt:" <<endl;
	cout << M << endl;

	// Pick a random s elementof Z_p
	pfc.random(s);
	// Ciphertext C equals (u,v,w,y)
	sID = modmult(s, id, order);

	// u = g_{1}^{s}p_{1}^{-sID}
	gs_1 = pfc.mult(g_1, s);
	u = pfc.mult(p_2, -sID);
	u = gs_1 + u;;

	// v = e(g, g)^s = e(g.s, g)
	#ifdef KEYGEN_PRECOMP
	v = pfc.power(pair, s);
	#else
	ps_2 = pfc.mult(p_2, s);
	v = pfc.pairing(ps_2, q_1);
	#endif

	#ifdef KEYGEN_PRECOMP
	wm = pfc.power(pair_h1, s);
	#else
	wm = pfc.pairing(ps_2, h_1);
	#endif
	w = lxor(M, pfc.hash_to_aes_key(wm));

	// y = e(p_2, h_2)^{s}(p1,h_3)^{sBeta}
	pfc.start_hash();
	pfc.add_to_hash(u);
	pfc.add_to_hash(v);
	pfc.add_to_hash(w);
	beta = pfc.finish_hash_to_group();
	sBeta = modmult(beta, s, order);

	#ifdef KEYGEN_PRECOMP
	y = pfc.power(pair_h2, s);
	p1h3 = pfc.power(pair_h3, sBeta);
	#else
	y = pfc.pairing(ps_2, h_2);
	psBeta_2 = pfc.mult(p_2, sBeta);
	pfc.precomp_for_pairing(psBeta_2);
	p1h3 = pfc.pairing(psBeta_2, h_3);
	#endif

	y = y * p1h3;

	enc_time = getExecutionTime(begin_time);

	/**********
	* DERYPTION
	*
	* takes place at the side of the receiver
	***********/
	begin_time = clock();

	// Recipient tests whether y = y2
	// with y2 = e(u, h_{id,2}(h_{id,3})^beta)
	GT y_temp;
	G2 h_2q, h_3q, h_23q;

	h_id23 = pfc.mult(h_id3, beta);
	h_id23 = h_id2 + h_id23;
	y_temp = pfc.pairing(u, h_id23);

	r_id23 = modmult(r_id3, beta, order);
	r_id23 = modmult(r_id2 + r_id23, 1, order);
	v_id23 = pfc.power(v, r_id23);

	y2 = y_temp * v_id23;

	// y and y2 are sometimes not equal at this point of the code
	if(y == y2){
		dec = pfc.pairing(u, h_id1);
		vr = pfc.power(v, r_id1);
		dec = dec*vr;
		mask = pfc.hash_to_aes_key(dec);
		M = lxor(w, mask);

		dec_time = getExecutionTime(begin_time);
	} else {
		dec_time = getExecutionTime(begin_time);
		mip->IOBASE = 16;
		cout << "Hash of y:" << endl << pfc.hash_to_aes_key(y) << endl;
		cout << "Hash of y2:" << endl << pfc.hash_to_aes_key(y2) << endl;
		mip->IOBASE = 256;
		cout << "Warning: The ciphertext has been altered. Decrypted message:" << endl << M << endl;
	}
	mip->IOBASE = 256;

	cout << "{\"Decrypted message\": \"";
	cout << M << "\"}" << endl;
	cout << "Setup time:      " << set_time << endl;
	cout << "KeyGen time:     " << gen_time << endl;
	cout << "Encryption time: " << enc_time << endl;
	cout << "Decryption time: " << dec_time << endl;
	cout << "               + --------" << endl;
	cout << "Total time:      " << set_time + gen_time + enc_time + dec_time << endl;

	return 0;
}

float getExecutionTime(float begin_time) {
	return float( clock () - begin_time ) /  CLOCKS_PER_SEC;
}
