# !/bin/bash
echo "==========================================="
echo "This script contacts the planetlab server," 
echo "gets a list of nodes that are currently alive "
echo "AUTHOR: Andy Huang (ref: planet-lab tutorial)"
echo "CONTACT: y226huan@uwaterloo.ca"
echo "==========================================="

curl http://comon.cs.princeton.edu/status/tabulator.cgi?table=table_nodeviewshort\&format=nameonly\&persite=1\&select='resptime>0' > nodes.txt
