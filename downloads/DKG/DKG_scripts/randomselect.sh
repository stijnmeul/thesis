#!/bin/bash
echo "============================================="
echo "This script randomly selects a specified number"
echo "of nodes from the given source file."
echo "AUTHOR: Andy Huang"
echo "CONTACT: y226huan@uwaterloo.ca"
echo "============================================="

if [ $# -ne 3 ]
then
    echo "USAGE: source node_number output"
    exit
fi

nl=$(wc -l $1 | awk '{ print $1;}')
if [ $nl -lt $2 ]
then
    echo "There are less than $2 nodes in $1"
    echo "You have to choose a number not greater than $nl"
    exit
fi

rm $3
echo "processing..."
count=0
while test "$count" -lt "$2"
do
    node=$(sed -n $((RANDOM%$nl+1))p $1)
    grep $node $3 1>/dev/null || { echo $node >> $3 && count=$[count+1]; }
done
