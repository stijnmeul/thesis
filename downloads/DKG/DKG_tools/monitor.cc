/* This program monitors the running situation of all the DKG nodes,
starts the next run of the protocol when more than n - t nodes have finished, for each parameter, it runs k times.
*/

#include "dkgtools.h"
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <stdlib.h>
#include <sys/socket.h>
#include <netinet/in.h>
using namespace std;

struct Testcase {
	int n;
	int t;
	int f;
	int times;
	int non_responsive_server_num;
};

string system_param_part2 = "phaseDuration 15";
string system_param_part3 = "U [154421937288869892795189093810921235122476463839375326073591971056365930434602470186742385706265523539972032311143735573288479871818380689794065934739646,1053224359509564021923111819691635700583676517250934330501551578364631046844652405820767801196558009238591149557814028743651030702748906271871797495725636]";

string version_chars;
string target_dir;
string testcase_file;
string used_nodes_file;
string slice_name;

string commitment_type;

#define CONF_DELAY 5
#define COLL_DELAY 15
#define REMO_DELAY 15 
#define PORT 9000
#define BUFF 200 

#define MAX_N 100 
#define MAX_T 33
#define MAX_F 49

string used_nodes[MAX_N+1];
vector<Testcase> testcases;


int main () {

    fstream configStream ("monitor.conf");
    string configLine;
    while (configStream >> configLine) {
        int sep = configLine.find('=');
        string paraName = configLine.substr(0,sep);
        string paraVal = configLine.substr(sep+1);
        if (paraName.compare("slice_name") == 0) {
            slice_name = paraVal;
        } else if (paraName.compare("used_nodes_file") == 0) {
            used_nodes_file = paraVal;
        } else if (paraName.compare("testcase_file") == 0) {
            testcase_file = paraVal;
        } else if (paraName.compare("target_dir") == 0) {
            target_dir = paraVal;
        } else if (paraName.compare("commitment_type") == 0) {
            commitment_type = paraVal;
        } else if (paraName.compare("version_chars") == 0) {
            version_chars = paraVal;
        }
    }
    configStream.close();

    cout << "reading the configuration file: monitor.conf" << endl;

    string mkdirstr = "mkdir ";
    mkdirstr += target_dir;
	system (mkdirstr.c_str());

	// read all the nodes available
	fstream usedNodeStream (used_nodes_file.c_str(), ios::in);
	int ptr = 0;
	cout << "Initializing candidate nodes..." << endl;
	while (usedNodeStream >> used_nodes[ptr++])
		if (ptr >= MAX_N) break;
	usedNodeStream.close();

	// read test cases
	fstream testCasesStream (testcase_file.c_str(), ios::in);
	cout << "building testcases..." << endl;
	while (1) {
		string nextline;
		getline (testCasesStream, nextline);
		if (testCasesStream.eof()) break;
		int n, t, f, times, non_responsive_server_num;
		int res = sscanf (nextline.data(), "%d %d %d %d %d", &n, &t, &f, &non_responsive_server_num, &times);
		if (res < 5) {
			cerr << "Bad Scanned line: " << nextline << "\n";
			exit (-1);
		}
		Testcase tc;
		tc.n = n;
		tc.t = t;
		tc.f = f;
		tc.non_responsive_server_num = non_responsive_server_num;
		tc.times = times;
		if (n > MAX_N || t > MAX_T || f > MAX_F || non_responsive_server_num >= n) {
			cout << "Parameters n,t,f, non_responsive_server_num out of range!!" << endl;
			exit (1);
		}
		if (n < 0 || t < 0 || f < 0 || non_responsive_server_num < 0) {
			cout << "Parameters n,t,f, non_responsive_server_num must be non-negative!!" << endl;
			exit(1);
		}
		testcases.push_back(tc);
	}
	testCasesStream.close();

	// Now go through all the test cases
	int prev_n, prev_t, prev_f, prev_nrsn;
	prev_n = prev_t = prev_f = prev_nrsn = 0;
	for (int i = 0; i < testcases.size(); ++i) {
		cout << endl;
		cout << "====================================" << endl;
		cout << "TestCase #" << i + 1 << endl;
		cout << "n = " << testcases[i].n << endl;
		cout << "t = " << testcases[i].t << endl;
		cout << "f = " << testcases[i].f << endl;
		cout << "nrsn = " << testcases[i].non_responsive_server_num << endl;
		cout << endl;

		// craft contlist system.param 
		if (testcases[i].n != prev_n) {
			system ("rm used.txt");
			fstream usedTxtStream ("used.txt", ios::out);
			for (int j = 0; j < testcases[i].n; ++j) 
				usedTxtStream << used_nodes[j] << endl;
			usedTxtStream.close();
			system ("rm tmp");
			system ("rm contlist");
			system ("./makeconlist.sh");
			system ("./send.sh contlist > /dev/null");
		}

		if (testcases[i].n != prev_n || testcases[i].t != prev_t
			|| testcases[i].f != prev_f) {
			system ("rm system.param");
			fstream systemParamStream ("system.param", ios::out);
			systemParamStream << "n " << testcases[i].n << endl;
			systemParamStream << "t " << testcases[i].t << endl;
			systemParamStream << "f " << testcases[i].f << endl;
			systemParamStream << system_param_part2 << endl;
			systemParamStream << system_param_part3 << endl;
			system ("./send.sh system.param > /dev/null");
			cout << "sending configuration files over..." << endl;
			sleep (CONF_DELAY);
		}

		char* buf = (char *) malloc (MAX_N + MAX_T + MAX_F + BUFF);
		//to avoid buffer overflow
		sprintf (buf, "%s/%d_%d_%d_%d/", target_dir.c_str(), testcases[i].n, testcases[i].t, testcases[i].f, testcases[i].non_responsive_server_num);
		string paradir (buf);

		int runversion = 0;

		// figure out the version number
		vector<string> dirs;
        // cout << "paradir = " << paradir << endl;
		if (getdir (paradir, dirs, "") < 0) {
			cout << "Directory for the parameter does not exist!" << endl;	
			string mkdir_cmd = "mkdir ";
			mkdir_cmd.append(buf);
			system(mkdir_cmd.data());
			runversion = 0;
		} else {
			for (int i = 0; i < dirs.size(); ++i) {
				int cur_version = atoi(dirs[i].data()); 
				if (cur_version > runversion)
					runversion = cur_version;
			}
		}
		
		cout << "run version for the current parameter is " << runversion << endl;

		for (int j = 0; j < testcases[i].times; ++j) {
			cout << "\t" << "Round #" << j+1 << ":" << endl;

			// launch nodes
			cout << "launching nodes..." << endl;
			for (int k = 0; k < testcases[i].n; ++k) {
				sprintf (buf, "ssh -n %s@%s ./node%s 9900 certs/%d.pem certs/%d-key.pem contlist 0 %s %d&", slice_name.c_str(), used_nodes[k].data(), version_chars.c_str(), k + 1, k + 1, commitment_type.c_str(), testcases[i].non_responsive_server_num);
				system(buf);
			}
				
			system ("rm logdir -r");
			system ("mkdir logdir");
			
			int ex_ft = 10;
			// Should periodically check whether the collection is done or not
			while (1) {
				//sleep(ex_ft);
				for (int k = 0; k < testcases[i].n; ++k) {
					sprintf (buf, "scp -r %s@%s:./message.log logdir/message_%d.log > /dev/null&", slice_name.c_str(), used_nodes[k].data(), k + 1);
					system (buf);
					sprintf (buf, "scp -r %s@%s:./dkg*.log logdir/dkg_%d.log > /dev/null&", slice_name.c_str(), used_nodes[k].data(), k + 1);
					system (buf);
					sprintf (buf, "scp -r %s@%s:./timeout.log logdir/timeout_%d.log > /dev/null&", slice_name.c_str(), used_nodes[k].data(), k + 1);
					system (buf);
				}
					
				cout << "collecting running info from nodes..." << endl;
				sleep (COLL_DELAY);
				string dir = string("logdir/");
				vector<string> dkgfiles = vector<string> ();
				getdir (dir, dkgfiles, "dkg_");
				if (dkgfiles.size() >= testcases[i].n - testcases[i].t - testcases[i].f) {
					cout << "The run has finished.." << endl;
					break;
				}
				cout << "dkg file size = " << dkgfiles.size() << endl;
				cout << endl;
				ex_ft *= 2;
			}

			sprintf (buf, "mv logdir %s%d", paradir.data(), ++runversion);
            printf ("COMMAND: %s\n", buf);
			system (buf);
			
			//remove all the running instances
			cout << "remove all the running instances..." << endl;
			system ("./remove.sh");
            
			sleep (REMO_DELAY);
		}

		prev_n = testcases[i].n;
		prev_t = testcases[i].t;
		prev_f = testcases[i].f;
	}
}
	
