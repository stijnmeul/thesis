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

int main()
{
	PFC pfc(AES_SECURITY);  // initialise pairing-friendly curve

	time_t seed;
	float execution_time;

	const clock_t begin_time = clock();

	int i;

	Big alpha, r_id1, r_id2, r_id3, id, order, s, sID, beta, sBeta, temp2, M, w, mask, r_id23;
	G1 p_1, g_1, u, temp, test, gs_1, ps_1, psBeta_1;
	G2 q_2, h_1, h_2, h_3, h_id1, h_id2, h_id3, h_id23, q_2rid1, q_2rid2, q_2rid3;
	GT v, wm, dec, vr, y2, v_id23, y, p1h3;

	// Before last line
	G1 p_salpha;
	G2 h_23pow, h_23;
	Big sAlpha, invsAlpha;
	GT res;

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
	pfc.random(p_1);
	pfc.random(q_2);
	pfc.random(h_1);
	pfc.random(h_2);
	pfc.random(h_3);
	pfc.random(r_id1);
	pfc.random(r_id2);
	pfc.random(r_id3);

	/* Following parameters stay the same*/
	mip->IOBASE = 16;
	cout << "p_1:" << endl << p_1.g << endl;
	cout << "q_2:" << endl << q_2.g << endl << endl;


	// If an element of G1, G2 or GT is fixed, then it can be
	// precomputed on, using pfc.precomp_for_mult() for G1 and G2
	// and pfc.precomp_for_power() for GT
	// P becomes read-only from this point onwards
	//pfc.precomp_for_mult(g);

	// Pick a random alpha elementof Z_p
	pfc.random(alpha);

	mip->IOBASE = 16;

	g_1 = pfc.mult(p_1, alpha);

	/**********
	* KEYGEN
	*
	* takes place at the side of the TA
	***********/
	// The PKG generates random r_{id}_{i} elementof Z_p for i elementof {1,2,3}
	order = pfc.order();
	if(id != alpha) {
		pfc.random(r_id1);
		// h_id[i] = (h_ig^(-r_id_i))^1/(alpha-ID)
		// negative multiplication is implemented in the same way in (ipe.cpp r:207)
		q_2rid1 = pfc.mult(q_2, -r_id1);
		h_id1 = h_1 + q_2rid1;
		h_id1 = pfc.mult(h_id1, inverse(alpha-id, order));

		pfc.random(r_id2);
		q_2rid2 = pfc.mult(q_2, -r_id2);
		h_id2 = h_2 + q_2rid2;
		h_id2 = pfc.mult(h_id2, inverse(alpha-id, order));

		pfc.random(r_id3);
		q_2rid3 = pfc.mult(q_2, -r_id3);
		h_id3 = h_3 + q_2rid3;
		h_id3 = pfc.mult(h_id3, inverse(alpha-id, order));
	} else {
		cout << "ID equals alpha. PKG aborted." << endl;
		return 0;
	}
	/*
	mip->IOBASE = 36;
	cout << "h_id1:" << endl << h_id1.g << endl;
	cout << "h_id2:" << endl << h_id2.g << endl;
	cout << "h_id3:" << endl << h_id3.g << endl << endl;
	cout << "q_2rid1:" << endl << q_2rid1.g << endl;
	cout << "q_2rid2:" << endl << q_2rid2.g << endl;
	cout << "q_2rid3:" << endl << q_2rid3.g << endl << endl;*/

	/**********
	* ENCRYPTION
	*
	* takes place at the side of the transmitter
	***********/
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
	u = pfc.mult(p_1, -sID);
	u = gs_1 + u;
	mip->IOBASE = 16;
	cout << "u:" << endl << u.g << endl;

	// v = e(g, g)^s = e(g.s, g)
	ps_1 = pfc.mult(p_1,s);
	v = pfc.pairing(q_2, ps_1);
	//pfc.precomp_for_power(v);
	mip->IOBASE = 16;
	//cout << "v:" << endl << v.g << endl;

	wm = pfc.pairing(h_1, p_1);
	wm = pfc.power(wm, s);
	w = lxor(M, pfc.hash_to_aes_key(wm));


	// y = e(p_1, h_2)^{s}(p1,h_3)^{sBeta}
	pfc.start_hash();
	pfc.add_to_hash(u);
	pfc.add_to_hash(v);
	pfc.add_to_hash(w);
	beta = pfc.finish_hash_to_group();
	sBeta = modmult(beta, s, order);

	y = pfc.pairing(h_2, ps_1);
	psBeta_1 = pfc.mult(p_1, sBeta);
	p1h3 = pfc.pairing(h_3, psBeta_1);

	y = y * p1h3;

	/**********
	* DERYPTION
	*
	* takes place at the side of the receiver
	***********/
	mip->IOBASE = 16;
	// Recipient tests whether y = y2
	// with y2 = e(u, h_{id,2}(h_{id,3})^beta)
	GT y_temp;
	h_id23 = h_id2 + pfc.mult(h_id3, beta);
	y_temp = pfc.pairing(h_id23, u);
	r_id23 = r_id2 + modmult(r_id3, beta, order);
	v_id23 = pfc.power(v, r_id23);
	y2 = y_temp*v_id23;

	mip->IOBASE = 16;

	/* Following parameters don't change
	cout << "p_1:" << endl << p_1.g << endl;
	cout << "q_2:" << endl << q_2.g << endl << endl;

	cout << "h_1:" << endl << h[0].g << endl;
	cout << "h_2:" << endl << h[1].g << endl;
	cout << "h_3:" << endl << h[2].g << endl << endl;

	cout << "h_id1:" << endl << h_id[0].g << endl;
	cout << "h_id2:" << endl << h_id[1].g << endl;
	cout << "h_id3:" << endl << h_id[2].g << endl << endl; */

	//cout << "y:" << endl << y.g << endl;
	//cout << "y2:" << endl << y2.g << endl;

	// Before last line
	/*sAlpha = modmult(s, (alpha - id), order);
	p_salpha = pfc.mult(p_1, sAlpha);
	invsAlpha = inverse((alpha - id), order);
	h_23 = h_2 + pfc.mult(h_3, beta);
	h_23pow = pfc.mult(h_23, invsAlpha);
	res = pfc.pairing(h_23pow, p_salpha);

	// Second line
	G2 q_2pow;
	Big r_idpow, r_id23beta;
	GT firstpair, secondpair;

	r_id23beta = r_id2 + modmult(r_id3, beta, order);
	r_idpow = moddiv(-r_id23beta, (alpha - id), order);
	q_2pow = pfc.mult(q_2, r_idpow);
	h_23pow = h_23pow + q_2pow;
	firstpair = pfc.pairing(h_23pow, p_salpha);
	secondpair = pfc.power(pfc.pairing(q_2, p_1),modmult(s,r_id23beta,order));
	firstpair = firstpair * secondpair;*/

	// y and y2 are sometimes not equal at this point of the code
	if(y == y2){
		dec = pfc.pairing(h_id1, u);
		vr = pfc.power(v, r_id1);
		dec = dec*vr;
		mask = pfc.hash_to_aes_key(dec);
		M = lxor(w, mask);

		execution_time = float( clock () - begin_time ) /  CLOCKS_PER_SEC;

		mip->IOBASE = 256;
		cout << "Decrypted message:" << endl;
		cout << M << endl;
	} else {
		execution_time = float( clock () - begin_time ) /  CLOCKS_PER_SEC;
		mip->IOBASE = 16;

		cout << "Hash of y:" << endl << pfc.hash_to_aes_key(y) << endl;
		cout << "Hash of y2:" << endl << pfc.hash_to_aes_key(y2) << endl;
		mip->IOBASE = 256;
		cout << "Warning: The ciphertext has been altered. Decrypted message:" << endl << M << endl;
	}


	cout << "Execution time: " << execution_time << endl;

	return 0;
}
