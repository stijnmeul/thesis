#!/bin/sh

# This is a dodgy and quick way of automatise the building process for scramble
# It might be updated in a future for a better general way...

# Import Libraries
PROVIDER="jars/bcprov-ext-jdk16-145.jar"
BCOPENPGP="jars/bcpg-jdk16-145.jar"
MYLIB="cosic/"

# Define Flags
FLAGS="-cp "$PROVIDER":"$BCOPENPGP":"$MYLIB":"

# Compile....
clear
echo "Compiling OpenPGP BC Lib for Scramble!"
echo $FLAGS
echo Test Public KeyRing ...
java $FLAGS OpenPGP pkeys
echo Test Encryption/Decryption ...
java $FLAGS OpenPGP testcrypt
echo Done ...