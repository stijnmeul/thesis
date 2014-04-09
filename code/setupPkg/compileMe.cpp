#include <iostream>
#include <fstream>

using namespace std;
int main(int argc, char* argv[])
{
  /*
    // Ask for a password to encrypt the new setup key.
    termios oldt;

    cout << "Please insert a password to encrypt the master secret key:";
    // Turn off terminal output
    tcgetattr(STDIN_FILENO, &oldt);
    termios newt = oldt;
    newt.c_lflag &= ~ECHO;
    tcsetattr(STDIN_FILENO, TCSANOW, &newt);

    string s;
    getline(cin, s);

    // Turn terminal output back on.
    tcsetattr(STDIN_FILENO, TCSANOW, &oldt);

    /*string command = "./compileMe ";
    command = command + s;
    system(command.c_str());
    cout << endl;
    cout << argv[1] << endl;
    TODO na de pauze:
    1) Genereer een random key adhv /dev/urandom
    2) Encrypteer deze key adhv enciph.c
    3) Gebruik als random seed voorhet encrypteren van de key een wachtwoord dat in terminal wordt gevraagd
    */

    return 0;
}
