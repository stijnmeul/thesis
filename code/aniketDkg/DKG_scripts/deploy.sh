#!/bin/bash
echo "============================================="
echo "deploy.sh"
echo "This script deploys the specified files to the "
echo "list of nodes given in the source file."
echo "NOTE: The difference between this script and"
echo "send.sh is that this script will probe to see"
echo "whether the target files/dirs already exist on"
echo "the target machine"
echo "AUTHOR: Andy Huang"
echo "CONTACT: y226huan@uwaterloo.ca"
echo "============================================="

if [ $# -lt 3 ]
then
    echo "USAGE: source username file/dir1 file/dir2 ..."
    exit
fi

echo "processing..."
nfiles=$[$#-2]
echo "$nfiles file/dirs to send over..."

usrn=$2
sf=$1

shift
shift

for file in "$@"
do
    echo "deploying $file..."
    for node in `cat $sf`
    do
        ssh -n $usrn@$node ls $file exit 1>/dev/null 2>/dev/null || scp -r $file $usrn@$node:. 1>/dev/null 2>/dev/null &
    done
done
