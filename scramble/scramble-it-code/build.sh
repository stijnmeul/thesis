#!/bin/sh

# This is a dodgy and quick way of automatise the building process for scramble
# It might be updated in a future for a better general way...

if [ $# -gt 0 ]
then
#	VERSION=$2
#	NAME=$1
#	FNAME=$1-$2
	VERSION=$1
	FNAME=scramble-$1-signed
	rm $FNAME.xpi
	mkdir $FNAME
	cp -r * $FNAME
	find $FNAME -name .svn -print0 | xargs -0 rm -rf 
	find $FNAME -name .DS_Store -print0 | xargs -0 rm -rf 
	find $FNAME -name *.java -print0 | xargs -0 rm -rf 
	find $FNAME -name *.class -print0 | xargs -0 rm -rf 
#	zip -r $NAME.jar ../$FNAME/chrome/*
	#rm -rf ../$FNAME/chrome/scramble
#	mv $NAME.jar ../$FNAME/chrome/
	rm -f $FNAME/*.sh $FNAME/*.xpi

#	signtool -d db -k myTestCert -p "scramble12" $FNAME
	cd $FNAME
#       zip $FNAME.xpi META-INF/zigbert.rsa
#	zip -r -D $FNAME.xpi * -x META-INF/zigbert.rsa 
#	zip -r $FNAME.xpi *
	mv $FNAME.xpi ../
	cd ../
	MESSAGE="Update source code, version number $VERSION"
	
	#if [ $3 -eq "doc" ]
	#then
	#	echo "test"
	#fi
	
	rm -rf $FNAME
	echo $MESSAGE
#	svn commit -m "$MESSAGE"

fi

if [ $# -eq 0 ]
then 
	echo "Run build with the following parameters"
	echo ">./build [version]"
fi
