/*
 * Analyse the data sourse and parse it into a file with the following format:
 *
 * | Number_of_Nodes | trial1 | trial2 | trial3 ...
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
#include <assert.h>
#include <cmath>
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

int find_median (int a[], int n) {
    if (n % 2 == 1) {
        return a[n/2];
    } else {
        return (a[n/2-1]+a[n/2]) / 2;
    }
}

int main (int argc, char *argv[]) {
	char buf[256];
	char *temp = (char *) malloc (256);
	string base = "newdata";

	ofstream fout ("running_time.ods", ios::out);
	ofstream foutCPU ("running_time_CPU.ods", ios::out);

	vector<string> dirs = vector<string>();
	getdir(base, dirs,"");

	int n_paras = dirs.size();

	sort(dirs.begin(), dirs.end(), stringCompare);

	char n_seps[] = "_";

	for (int k = 0; k < n_paras; ++k) {

		//for each parameter
		string para = dirs[k];
		vector<string> times = vector<string>();

		// times[i] is something like Jun27_1232
		getdir(base + "/" + para,times,"");
		int n_times = times.size(); // number of trials

		vector<string> n_t_f = vector<string>();
		char * tb_parsed = new char [para.length()];
		strcpy (tb_parsed, para.data());
		parse_line (tb_parsed, n_t_f, n_seps);
		int pa_n = (int) atoi (n_t_f[0].c_str());
        int *trialmed;
        int *trialCPUmed;
        trialmed = new int [n_times];
        trialCPUmed = new int [n_times];

        // *n*, min, 1stQuatile, Median, 3rdQuartile, max
        fout << pa_n;
        foutCPU << pa_n;

		for (int t = 0; t < n_times; ++t) {
			vector<string> dkgfiles = vector<string>();
			getdir (base + "/" + para + "/" + times[t], dkgfiles, "dkg_");
			int n_files = dkgfiles.size();

			// int rts[n_files], cpu_sec[n_files];
            int *rts, *cpu_sec;
            rts = new int [n_files];
            cpu_sec = new int [n_files];

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

            assert (pa_n / 2 < n_files);
            assert (pa_n >= 4);
            trialmed[t] = find_median (rts, pa_n);
            trialCPUmed[t] = find_median (cpu_sec, pa_n);

            free (rts);
            free (cpu_sec); 
		}

        for (int i = 0; i < n_times; ++i) {
            fout << " " << trialmed[i];
            foutCPU << " " << trialCPUmed[i];
        }
        fout << endl;
        foutCPU << endl;

	} // end k

	fout.close();
    foutCPU.close();

	return 0;
}
