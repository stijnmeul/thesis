/*
   print the run time for every single node
   */
#include <iostream>
#include <vector>
#include <string>
#include <cstdlib>
#include <fstream>
#include <dirent.h>
#include <sys/types.h>
#include <errno.h>
#include <string.h>
#include <algorithm>
#include "dkgtools.h"
using namespace std;

bool stringCompare (const string &left, const string &right) {
	if (left.length() < right.length())
		return true;
	else if (left.length() > right.length())
		return false;
	for (string::const_iterator lit = left.begin(), rit = right.begin(); lit != left.end(), rit != right.end(); ++lit, ++rit) {
		if (*lit < *rit)
			return true;
		else if (*lit > *rit)
			return false;
	}
	return true;
}

int compare (const void * a, const void * b)
{
	return ( *(int*)a - *(int*)b );
}


int main (int argc, char *argv[]) {
	char buf[256];
	char *temp = (char *) malloc (256);
	string base = "newdata";

	ofstream fout ("allpoints.dat", ios::out);

	vector<string> dirs = vector<string>();
	getdir(base, dirs,"");

	int n_paras = dirs.size();
	fout << "number of different parameters: " << n_paras << endl;

	sort (dirs.begin(), dirs.end(), stringCompare);

	for (int k = 0; k < n_paras; ++k) {
		//for each parameter
		string para = dirs[k];
		vector<string> times = vector<string>();
		// times[i] is something like Jun27_1232
		getdir(base + "/" + para,times,"");
		int n_times = times.size();
		fout << "\t" << "P: " << para << endl;
		fout << "\t" << "number of trials: " << n_times << endl;
		for (int t = 0; t < n_times; ++t) {
			fout << "\t\t" << "trial: " << times[t] << endl;
			vector<string> dkgfiles = vector<string>();
			getdir (base + "/" + para + "/" + times[t], dkgfiles, "dkg_");
			int n_files = dkgfiles.size();
			fout << "\t\t" << "finished nodes#: " << n_files << endl;
			int rts, cpu_sec;
			for (int i = 0; i < n_files; ++i) {
				vector<string> words;
				ifstream fin ((base + "/" + para + "/" + times[t] + "/" + dkgfiles[i]).c_str(), ios::in);
				fin.getline (buf, 256);
				strcpy (temp, buf);
				parse_line (temp, words);
				if (words.size() < 2) {
					cout << "Error for para: " << para << " trial: " << times[t] << " dkg#" << dkgfiles[i] << endl;
					cout << "Buf: " << buf << endl;
					cout << endl;
					continue;
				}
				rts = (int) atoi (words[1].c_str());
				fin.getline (buf, 256);
				strcpy (temp, buf);
				words.clear();
				parse_line (temp, words);
				if (words.size() < 2) {
					cout << "Error for para: " << para << " trial: " << times[t] << " dkg#" << i << endl;
					cout << "Buf: " << buf << endl;
					cout << endl;
					continue;
				}
				cpu_sec = (int) atoi (words[1].c_str());
				fin.close();
				fout << "\t\t\t" << para << "\t" << rts << "\t" << cpu_sec << endl;
			}
		}
	}

	fout << endl;


	return 0;
}
