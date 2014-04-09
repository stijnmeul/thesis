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
#include <algorithm>


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
#include <string.h>
#include <sstream>

G2 g2From(string);

int main()
{
    PFC pfc(AES_SECURITY);
    stringstream ss1;
    string p_string;
    G2 P, G, L;
    pfc.random(P);
    int bytes_per_big=(MIRACL/8)*(get_mip()->nib-1);
    char p_bin[bytes_per_big];

    ss1 << P.g;
    p_string = ss1.str();

    ZZn4 zzn41, zzn42;
    ZZn2 zzn21, zzn22, zzn23, zzn24;
    Big big1, big2, big3, big4, big5, big6, big7, big8;
    int myMarker;
    P.g.getMarker(myMarker);
    P.g.get(zzn41, zzn42);
    zzn41.get(zzn21, zzn22);
    zzn42.get(zzn23, zzn24);
    zzn21.get(big1, big2);
    zzn22.get(big3, big4);
    zzn23.get(big5, big6);
    zzn24.get(big7, big8);

    ZZn4 azzn41, azzn42;
    ZZn2 azzn21, azzn22, azzn23, azzn24;
    azzn21.set(big1, big2);
    azzn22.set(big3, big4);
    azzn23.set(big5, big6);
    azzn24.set(big7, big8);
    azzn41.set(azzn21, azzn22);
    azzn42.set(azzn23, azzn24);
    G.g.set(azzn41, azzn42);
    G.g.setMarker(myMarker);
    cout << "P:" << P.g << endl << endl;
    cout << "G:" << G.g << endl << endl;


    L = g2From(p_string);

    cout << "L:" << endl << L.g << endl << endl;

    if(P == G) {
        cout << "Hurray! P equals G!" << endl;
    }
    if(P == L) {
        cout << "Hurray! P equals L!" << endl;
    }

    return 0;
}

G2 g2From(string aString) {
    G2 res;
    res.g = ECn4(aString);
    return res;
}
