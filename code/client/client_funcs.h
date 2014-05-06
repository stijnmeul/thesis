#ifndef _CLIENT_FUNCS_H
#define _CLIENT_FUNCS_H

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

#include "../cppmiracl/source/pairing_3.h"
#include <string>
#include <vector>

class G2;
class G1;
class Big;

G2 g2From(std::string aString);

G1 g1From(std::string aString);

std::string toString(G2 g2);

std::string toString(G1 g1);

std::string toString(Big big);

std::string toString(std::vector <std::string> recipients);

std::vector <std::string> toVector(std::string recipients);

static inline bool is_base64(unsigned char c);

std::string base64_encode(unsigned char const* bytes_to_encode, unsigned int in_len);

std::string base64_decode(std::string const& encoded_string);

size_t WriteCallback(void *contents, size_t size, size_t nmemb, void *userp);

float getExecutionTime(float begin_time);

#endif