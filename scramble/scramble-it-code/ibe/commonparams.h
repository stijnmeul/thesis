#ifndef _COMMONPARAMS_H_
#define _COMMONPARAMS_H_

#define MR_PAIRING_BLS    // AES-256 security
#define AES_SECURITY 256

#define SES_KEY_LEN AES_SECURITY/8
#define HASH_LEN AES_SECURITY/8
#define TAG_LEN 16

#if AES_SECURITY == 256
#define U_LEN 900
#define W_LEN 45 // W is actually 44 chars long, 45 because of null termination
#define V_LEN 45 // V is actually 44 chars long, 45 because of null termination
#endif

#include "../../../code/cppmiracl/source/pairing_3.h"

#endif