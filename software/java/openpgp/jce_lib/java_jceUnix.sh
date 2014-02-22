#!/bin/bash

# This is a file to update the Java Virtual Machine with the JCE unrestricted policies
# Two arguments required  ./java_jce ["linux"/"mac"] [su pwd]

if [ $# -gt 1 ]
then
	pwd=$2;
	file1="US_export_policy"
	file2="local_policy"
	lib_path="lib/security/"

	if [ "$1" = "mac" ]
	then
		# MacOS
		echo "MacOS"
		java_home=$("/usr/libexec/java_home")
	else
		# General Unix  - TBD -
		echo "Unix/Linux"
		java_home=$JAVA_HOME
		echo "java home: ".$java_home

		if [ -z "$java_home" ] 
		then
			java_home=`which java`
			if [ -z "$java_home" ]
		        then
				echo "No Java installed"
			fi
		fi

		# remove all directories after '/bin'
		java_home=${java_home/bin*/}

	fi

	full_path=$java_home/$lib_path
	echo "full path: ".$full_path
	
	if [ -d "$full_path" ]; then
	    # Control will enter here if $DIRECTORY exists
		echo "path found... transfer files"
	else 
		echo "javahome:" $java_home
		if [ -d "$java_home/jre" ]; then
			echo "add jre to the path..."
			full_path="${java_home}/jre/${lib_path}"
		else	
			echo "error... path not found > exit 0!"
			exit
		fi
	fi

	echo $full_path
	if [ -d "$full_path" ]; then
	    # Control will enter here if $DIRECTORY exists
		echo "path found... transfer files"
	else
		echo "error... path not found > exit 1!"
		exit
	fi

	# Backup old files
	echo $file1" | "$file2
	echo $pwd | sudo -S cp "${full_path}/${file1}.jar" "${full_path}/${file1}_bkp.jar"
	echo "File "$file1" backup complete"
	sudo cp "${full_path}/${file2}.jar" "${full_path}/${file2}_bkp.jar"
	echo "File "$file2" backup complete"

	# Add new unrestricted policy files
	sudo cp "${file1}.jar" "${full_path}/${file1}.jar"
	echo "File "$file1" UPDATE complete"

	sudo cp "${file2}.jar" "${full_path}/${file2}.jar"
	echo "File "$file2" UPDATE complete"

	echo "DONE"
else
	echo "no valid arguments: ./java_jce [mac/linux] [sudo pwd]"
	exit
fi

