#ifndef DKGTOOLS_H_
#define DKGTOOLS_H_

#include <string>
#include <vector>
#include <dirent.h>
#include <string.h>
#include <iostream>
using namespace std;

int getdir (string dir, vector<string> &files)
{
	DIR *dp;
	struct dirent *dirp;
	if((dp  = opendir(dir.c_str())) == NULL) {
	    return -1;
	}   

	while ((dirp = readdir(dp)) != NULL) {
	    if ((string(dirp->d_name)).compare(0, 7, "message") != 0)
	        continue;
	    files.push_back(string(dirp->d_name));
	}   
	closedir(dp);
	return 0;
}

int getdir (string dir, vector<string> &files, string matching)
{
	DIR *dp;
	struct dirent *dirp;
	if((dp  = opendir(dir.c_str())) == NULL) {
		return -1;
	}   

	while ((dirp = readdir(dp)) != NULL) {
		if (matching.length() != 0)  
		if ((string(dirp->d_name)).compare(0, matching.size(), matching) != 0)
			continue;
		if (string(dirp->d_name)[0] == '.')
			continue;
		files.push_back(string(dirp->d_name));
	}   
	closedir(dp);
	return 0;
}

void parse_line (char* buf, vector<string> &words) {
	if (buf == NULL)
		return;
	if (buf[0] == 0)
		return;
	char seps[] = " ."; //separator, being [space] and '.'
	char *temp;
	temp = strtok(buf, seps);
	words.push_back (string (temp));
	while (temp != NULL) {
		temp = strtok(NULL, seps);
		if (temp == NULL)
			break;
		words.push_back (string (temp));    
	}   
}

void parse_line (char* buf, vector<string> &words, char seps[]) {
	if (buf == NULL)
		return;
	if (buf[0] == 0)
		return;
	char *temp;
	temp = strtok(buf, seps);
	words.push_back (string (temp));
	while (temp != NULL) {
		temp = strtok(NULL, seps);
		if (temp == NULL)
			break;
		words.push_back (string (temp));    
	}   
}

#endif 
