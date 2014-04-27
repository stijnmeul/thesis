/*
   Boneh-Gentry-Waters 
   Collusion Resistant Broadcast Encryption With Short Ciphertexts and Private Keys
   Implemented on Type-1 pairing

   Compile with modules as specified below

	For MR_PAIRING_SSP curves
	cl /O2 /GX bgw.cpp ssp_pair.cpp ecn.cpp zzn2.cpp zzn.cpp big.cpp miracl.lib
  
	For MR_PAIRING_SS2 curves
    cl /O2 /GX bgw.cpp ss2_pair.cpp ec2.cpp gf2m4x.cpp gf2m.cpp big.cpp miracl.lib
    
	or of course

    g++ -O2 bgw.cpp ss2_pair.cpp ec2.cpp gf2m4x.cpp gf2m.cpp big.cpp miracl.a -o bgw

   See http://eprint.iacr.org/2005/018.pdf
   Section 3.1
 
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

#define N 20             // total number of potential recipients

#define NS 5             // number of recipients for this broadcast
int S[NS]={2,4,5,6,14};  // group of recipients
#define PERSON 6		 // sample recipient

int main()
{   
	PFC pfc(AES_SECURITY);  // initialise pairing-friendly curve
	time_t seed;

	int i,j;
	/*
	* G1 is a point over the base field, and G2 is a point over an extension field of degree 3
 	* GT is a finite field point over the 18-th extension, where 18 is the embedding degree.
 	*/
	G1 g,v,gi[2*N],d[N],Hdr[2],s;
	GT K;
	Big alpha,gamma,t;

	time(&seed);       // initialise (insecure!) random numbers
    irand((long)seed);

//setup
	// g is random generator element of G
	pfc.random(g);
	// alpha is random element of Z_p
	pfc.random(alpha);
	// compute g_i = g^(alpha^i) for i = 1 .. 2*N
	// with N the total number of recipients
	gi[0]=pfc.mult(g,alpha);
	for (i=1;i<2*N;i++)
		gi[i]=pfc.mult(gi[i-1],alpha);
	//  pick a random gamma element of Z_p
	pfc.random(gamma);
	// compute v = g^(gamma), v is element of G
	v=pfc.mult(g,gamma);

	// the private key for user i is set as:
	// d_i = g_i^gamma
	for (i=0;i<N;i++)
		d[i]=pfc.mult(gi[i],gamma);
	// The algorithm outputs the public key PK 
	// (PK is gi[0..2N],v )
	// and the n private keys d_1, . . . , d_n
	// (private key of user i is obtained with d[i])

//encrypt to group S using Public Key
	// Choose a random t element of Z_p
	pfc.random(t);

	// Set K = e(g_n,g_1)^t
	K=pfc.power(pfc.pairing(gi[N-1],gi[0]),t);
	// Hdr[0] = g^t
	Hdr[0]=pfc.mult(g,t);
	// Hdr[1] = v * Product(g_n+1-j)^t, for all j element of S
	Hdr[1]=v;
	for (i=0;i<NS;i++)
	{
		j=S[i];
		Hdr[1]=Hdr[1]+gi[N-j];
	}
	// Effictevely calculate Hdr^t
	Hdr[1]=pfc.mult(Hdr[1],t);
	cout << "Encryption Key= " << pfc.hash_to_aes_key(K) << endl;

//decrypt by PERSON
	// Recalculate K by only using the private key
	s=d[PERSON-1];
	for (i=0;i<NS;i++)
	{
		j=S[i];
		if (j==PERSON) continue;
		s=s+gi[N-j+PERSON];
	}
	Hdr[0]=-Hdr[0];  // to avoid division
	G1 *g1[2],*g2[2];
	g1[0]=&gi[PERSON-1]; g1[1]=&s;
	g2[0]=&Hdr[1]; g2[1]=&Hdr[0];

	K=pfc.multi_pairing(2,g2,g1);

//	K=pfc.pairing(gi[PERSON-1],Hdr[1]);
//	K=K*pfc.pairing(s,Hdr[0]);  
	cout << "Decryption Key= " << pfc.hash_to_aes_key(K) << endl;

	// encryption key is same key as encryption key

    return 0;
}
