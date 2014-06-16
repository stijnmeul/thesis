#!/bin/bash
red='\x1B[0;31m'
NC='\x1B[0m' # No Color
echo ""
echo -e "${red}Compiling setup_dkg_server.cpp${NC}"
g++-4.7 setup_dkg_server.cpp ../mapToDate.cpp pkg.cpp DKGMessage.cpp ../miraclthread/source/bls_pair.cpp ../miraclthread/source/zzn24.cpp ../miraclthread/source/zzn8.cpp ../miraclthread/source/zzn4.cpp ../miraclthread/source/zzn2.cpp ../miraclthread/source/ecn4.cpp ../miraclthread/source/big.cpp ../miraclthread/source/zzn.cpp ../miraclthread/source/ecn.cpp ../miraclthread/source/miracl.a -I ../miraclthread/include/ -o setup_dkg_server
echo -e "${red}Executing ./setup_dkg_server 1 servers.list${NC}"
COUNTER=1
TOTNBOFLINES=$(grep -c ^ servers.list)
echo "TOTNBOFLINES is $TOTNBOFLINES"
let TOTNBOFLINES=TOTNBOFLINES+1
while [  $COUNTER -lt $TOTNBOFLINES ]; do
    echo The counter is $COUNTER
    osascript -e "tell application \"Terminal\" to do script \"yes | /Users/stijn/KUL/Master/Thesis/code/dkg/setup_dkg_server $COUNTER /Users/stijn/KUL/Master/Thesis/code/dkg/servers.list\""
    let COUNTER=COUNTER+1
done
echo -e "${red}All PKGs have been intialised${NC}"
exit 0
# exits script with status code 0
