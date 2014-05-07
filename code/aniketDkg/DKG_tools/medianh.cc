/*
   print the median runtime for every single trial
   */
#include "dkgtools.h"
#include <iostream>
#include <vector>
#include <string>
#include <cstdlib>
#include <fstream>
#include <dirent.h>
#include <sys/types.h>
#include <errno.h>
#include <algorithm>
#include <string.h>
using namespace std;

int compare (const void * a, const void * b)
{
	  return ( *(int*)a - *(int*)b );
}

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


int main (int argc, char *argv[]) {
	char buf[256];
	char *temp = (char *) malloc (256);
	string base = "newdata";

	ofstream fout ("eachrun.dat", ios::out);

	vector<string> dirs = vector<string>();
	getdir(base, dirs,"");

	int n_paras = dirs.size();
	fout << "number of different parameters: " << n_paras << endl;

	sort(dirs.begin(), dirs.end(), stringCompare);

	char n_seps[] = "_";

	for (int k = 0; k < n_paras; ++k) {
		//for each parameter
		string para = dirs[k];
		vector<string> times = vector<string>();
		// times[i] is something like Jun27_1232
		getdir(base + "/" + para,times,"");
		int n_times = times.size();
		fout << "\t" << "P: " << para << endl;
		fout << "\t" << "number of trials: " << n_times << endl;
		vector<string> n_t_f = vector<string>();
		char * tb_parsed = new char [para.length()];
		strcpy (tb_parsed, para.data());
		parse_line (tb_parsed, n_t_f, n_seps);
		int pa_n = (int) atoi (n_t_f[0].c_str());
		int rts[pa_n], cpu_sec[pa_n];

		for (int t = 0; t < n_times; ++t) {
			vector<string> dkgfiles = vector<string>();
			getdir (base + "/" + para + "/" + times[t], dkgfiles, "dkg_");
			int n_files = dkgfiles.size();

			//number of finished nodes
			fout << "\t\t" << n_files;
			int rts[n_files], cpu_sec[n_files];
			for (int i = 0; i < n_files; ++i) {
				vector<string> words;
				ifstream fin ((base + "/" + para + "/" + times[t] + "/" + dkgfiles[i]).c_str(), ios::in);
				fin.getline (buf, 256);
				strcpy (temp, buf);
				parse_line (temp, words);
				if (words.size() < 2) {
					cout << "Error for #" << i << endl;
					continue;
				}
				rts[i] = (int) atoi (words[1].c_str());
				fin.getline (buf, 256);
				strcpy (temp, buf);
				words.clear();
				parse_line (temp, words);
				if (words.size() < 2) {
					cout << "Error 2 for #" << i << endl;
					continue;
				}
				cpu_sec[i] = (int) atoi (words[1].c_str());
				fin.close();
			}
			qsort (rts, n_files, sizeof(int), compare);
			qsort (cpu_sec, n_files, sizeof(int), compare);
			fout << "\t" << para << "\t" << rts[pa_n / 2] << "\t" << cpu_sec[pa_n/2] << endl;
		}
	}

	fout << endl;
	fout.close();

	return 0;
}
