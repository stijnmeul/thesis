#include <iostream>
#include <fstream>

using namespace std;

int main() {
	int byte_count = 64;
    char data[64];
    FILE *fp;
    fp = fopen("/dev/urandom", "r");
    int bytes_read = fread(&data, 1, byte_count, fp);
    fclose(fp);
    cout << bytes_read <<" were read out." << endl;

    cout << "your random integer:" << endl << data[0] << data[1] << data[2] << endl;
}