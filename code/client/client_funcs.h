#ifndef _CLIENT_FUNCS_H
#define _CLIENT_FUNCS_H

#include "../commonparams.h"
#include "../../code/cppmiracl/source/pairing_3.h"
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