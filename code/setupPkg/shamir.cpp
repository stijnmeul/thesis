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

   g++-4.7 ibe_pkg_setup.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp -I ../cppmiracl/include/ -L ../cppmiracl/source/ -l miracl -o ibe_pkg_setup
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

#include "../cppmiracl/source/pairing_3.h"
#include "ibe_pkg.h"
#include <termios.h>
#include <unistd.h>
#include <iostream>
#include <fstream>
#include <bitset>
#include <vector>

#define NB_OF_SHARES 6
#define THRESHOLD 3

struct CurvePoint_t {
    Big x;
    Big y;
};

Big lagrange(int i, CurvePoint_t *reconstructionPoints, int degree, Big order);
Big retrieveSecret(CurvePoint_t *reconstructonPoints, int degree, Big order);

int main()
{
	PFC pfc(AES_SECURITY);

	G2 P, Ppub;
	Big s, randCoef, qi, ai;
	Big poly[THRESHOLD];
	Big order = pfc.order();

	time_t seed;            // crude randomisation
	time(&seed);
    irand((long)seed);

	/***
	* GENERATE POLYNOMIAL
	***/
	// Pick a random secret S
	pfc.random(s);
	cout << "random secret s:" << endl << s << endl;

	// A THRESHOLD-1 degree polynomial is randomly chosen such that poly(0)=s
	poly[0] = s;

	// Generate THRESHOLD-1 random numbers
	for (int i = 1; i < THRESHOLD; i++) {
		pfc.random(randCoef);
		poly[i] = randCoef;
		cout << "randCoef " << dec << i << " is:" << endl << randCoef << endl;
	}

	/***
	* CALCULATE ALL THE SHARES
	***/
	CurvePoint_t shares[NB_OF_SHARES];
	CurvePoint_t pointOnCurve;
	for (int i = 0; i < NB_OF_SHARES; i++) {
		pfc.random(pointOnCurve.x);

		qi=s;
		ai = pointOnCurve.x;
		for (int k = 1; k < THRESHOLD; k++)
		{ // evaluate polynomial a0+a1*x+a2*x^2... for x=i; => result is  q(i)
			qi += modmult(poly[k], ai, order);
			ai = modmult(ai, ai, order);
			qi %= order;
		}
		pointOnCurve.y = qi;
		shares[i] = pointOnCurve;
		cout << "point" << i << endl;
		cout << "pointOnCurve.x" << endl << pointOnCurve.x << endl;
		cout << "pointOnCurve.y" << endl << pointOnCurve.y << endl;
		cout << endl;
	}

	/***
	* RECALCULATE THE SECRET BASED ON THRESHOLD NB OF SHARES
	***/
	cout << "Recalculation of secret based on point 1, 2 and 3" << endl;
	CurvePoint_t reconstructionPoints[THRESHOLD];
	reconstructionPoints[0] = shares[0];
	reconstructionPoints[1] = shares[1];
	reconstructionPoints[2] = shares[2];
	cout << "interpolationResult" << endl << retrieveSecret(reconstructionPoints, THRESHOLD, order) << endl;

	cout << "Recalculation of secret based on point 1, 3 and 4" << endl;
	reconstructionPoints[0] = shares[0];
	reconstructionPoints[1] = shares[2];
	reconstructionPoints[2] = shares[3];
	cout << "interpolationResult" << endl << retrieveSecret(reconstructionPoints, THRESHOLD, order) << endl;

	cout << "Recalculation of secret based on point 3, 4 and 5" << endl;
	reconstructionPoints[0] = shares[2];
	reconstructionPoints[1] = shares[3];
	reconstructionPoints[2] = shares[4];
	cout << "interpolationResult" << endl << retrieveSecret(reconstructionPoints, THRESHOLD, order) << endl;

    return 0;
}

Big lagrange(int i, CurvePoint_t *reconstructionPoints, int degree, Big order) {
	Big z = 1;
	for (int k = 0; k < degree; k++) {
		if(k != i)
			z = modmult(z, moddiv((order-reconstructionPoints[k].x), (reconstructionPoints[i].x-reconstructionPoints[k].x), order), order);
	}
	return z;
}

Big retrieveSecret(CurvePoint_t *reconstructonPoints, int degree, Big order) {
	Big interpolationResult = 0;
	for (int i = 0; i < degree; i++) {
		Big l = lagrange(i, reconstructonPoints, degree, order);
		interpolationResult += modmult(l, reconstructonPoints[i].y, order);
		interpolationResult %= order;
	}
	return interpolationResult;
}