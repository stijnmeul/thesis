#!/bin/sh

# This is a dodgy and quick way of automatise the building process for scramble
# It might be updated in a future for a better general way...

# Import Libraries
PROVIDER="jars/bcprov-ext-jdk16-145.jar"
BCOPENPGP="jars/bcpg-jdk16-145.jar"
MYLIB="cosic/"

# Define Flags
FLAGS="-g -O -cp "$PROVIDER":"$BCOPENPGP":"$MYLIB":"

# Compile....
echo "Compiling OpenPGP BC Lib for Scramble!"
echo $FLAGS
javac $FLAGS OpenPGP.java
