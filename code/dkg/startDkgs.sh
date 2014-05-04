#!/bin/bash
red='\x1B[0;31m'
NC='\x1B[0m' # No Color
echo ""
echo -e "${red}Compiling setup_dkg_server.cpp${NC}"
g++-4.7 setup_dkg_server.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp -I ../cppmiracl/include/ -L ../cppmiracl/source/ -l miracl -o setup_dkg_server
echo -e "${red}Executing ./setup_dkg_server 1 servers.list${NC}"
./setup_dkg_server 1 servers.list
echo -e "${red}Finished execution of ./setup_dkg_server${NC}"
osascript -e 'tell application "Terminal" to do script "echo hello"'
exit 0
# exits script with status code 0
