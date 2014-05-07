#!/bin/bash
echo "============================================="
echo "This script selects the nodes from the source file "
echo "that do not appear in the checklist file, "
echo "and then print those nodes into a target file"
echo "AUTHOR: Andy Huang"
echo "CONTACT: y226huan@uwaterloo.ca"
echo "============================================="

if [ $# -ne 3 ]
then
    echo "USAGE: source checklist output"
    exit
fi

echo "removing the original output file..."
rm $3
echo "processing..."
for node in `cat $1`
do
    grep $node $2 1>/dev/null || echo $node >> $3
done
