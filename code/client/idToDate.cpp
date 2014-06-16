#include "client_funcs.h"
#include <ctime>
#include <langinfo.h>
#include <locale.h>
#include "../mapToDate.h"
// Compilation command: g++-4.7 idToDate.cpp client_funcs.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp ../cppmiracl/source/mrgcm.c -I ../cppmiracl/include/ ../cppmiracl/source/mraes.c -L ../cppmiracl/source/ -l miracl -lcurl -o idToDate


// https://www.facebook.com/help/105399436216001#What-are-the-guidelines-around-creating-a-custom-username? for more information about which characters that can be used for usernames and profile_ids


#if AES_SECURITY == 256
#define U_LEN 900
#define W_LEN 45 // W is actually 44 chars long, 45 because of null termination
#define V_LEN 45 // V is actually 44 chars long, 45 because of null termination
#endif



using namespace std;

PFC pfc(AES_SECURITY);

miracl *mip = get_mip();
int bytes_per_big=(MIRACL/8)*(get_mip()->nib-1);

int main(int argc, char* argv[])
{
    string name = argv[1];
    cout << "mapToDate(name)" << endl << mapToDate(name) << endl;

    return 0;
}