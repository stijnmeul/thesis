# !/bin/bash
### testnodelist.sh
echo "==========================================="
echo "This script contacts the planetlab server,"
echo "gets the list of nodes assigned to the user's "
echo "slice, and then tests whether an ssh connection "
echo "could be established."
echo "AUTHOR: Andy Huang"
echo "CONTACT: y226huan@uwaterloo.ca"
echo "==========================================="

echo "slice_name: "
read slice_name
echo "Timeout Value (sec):"
read timeout
rm goodnodes.txt
for node in `cat nodes.txt`
do
    echo "connecting to $node" &
    ssh -q -q -o "BatchMode=yes" -o "ConnectTimeout=$timeout" $slice_name@$node exit 2>/dev/null && echo $node >> goodnodes.txt &
done
echo "DONE!! Check you result in goodnodes.txt!"
