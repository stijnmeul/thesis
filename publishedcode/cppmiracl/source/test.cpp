/*

 *   Program to calculate factorials.

 */

 

#include <iostream>

#include "big.h"   /* include MIRACL system */

 

using namespace std;

 

Miracl precision(500,10); // This makes sure that MIRACL

                         // is initialised before main()  // is called

int main()

{ /* calculate factorial of number */

    Big nf=1;       /* declare "Big" variable nf */

    int n;

    cout << "factorial program\n";

    cout << "input number n= \n";

    cin >> n;

    while (n>1)

        nf*=(n--);  /* nf=n!=n*(n-1)*(n-2)*....3*2*1  */

    cout << "n!= \n" << nf << "\n";

	return 0;
}