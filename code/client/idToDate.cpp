#include "client_funcs.h"
// Compilation command: g++-4.7 idToDate.cpp ../cppmiracl/source/bls_pair.cpp ../cppmiracl/source/zzn24.cpp ../cppmiracl/source/zzn8.cpp ../cppmiracl/source/zzn4.cpp ../cppmiracl/source/zzn2.cpp ../cppmiracl/source/ecn4.cpp ../cppmiracl/source/big.cpp ../cppmiracl/source/zzn.cpp ../cppmiracl/source/ecn.cpp ../cppmiracl/source/mrgcm.c -I ../cppmiracl/include/ ../cppmiracl/source/mraes.c -L ../cppmiracl/source/ -l miracl -lcurl -o idToDate


// https://www.facebook.com/help/105399436216001#What-are-the-guidelines-around-creating-a-custom-username? for more information about which characters that can be used for usernames and profile_ids


#if AES_SECURITY == 256
#define U_LEN 900
#define W_LEN 45 // W is actually 44 chars long, 45 because of null termination
#define V_LEN 45 // V is actually 44 chars long, 45 because of null termination
#endif

#define DAYS_IN_MONTH 28
#define HOURS_IN_DAY 24
#define MINUTES_IN_HOUR 60
#define SECONDS_IN_MINUTE 60
#define SECONDS_IN_MONTH DAYS_IN_MONTH*HOURS_IN_DAY*MINUTES_IN_HOUR*SECONDS_IN_MINUTE

#define DAY_DIVISOR HOURS_IN_DAY*MINUTES_IN_HOUR*SECONDS_IN_MINUTE


using namespace std;

PFC pfc(AES_SECURITY);

miracl *mip = get_mip();
int bytes_per_big=(MIRACL/8)*(get_mip()->nib-1);

string getYear();
string getMonth();

int main(void)
{
    string name = "Sébastien";
    mip->IOBASE = 256;
    char hash[HASH_LEN];
    sha256 sh;
    char * id = (char *)name.c_str();
    shs256_init(&sh);
    while (*id!=0) {
        shs256_process(&sh,*id++);
        shs256_hash(&sh,hash);
    }
    Big seconds = from_binary(sizeof(hash), hash);
    mip->IOBASE = 10;
    cout << "seconds is " << endl << seconds << endl;
    cout << "seconds in month is " << endl << SECONDS_IN_MONTH << endl;

    modulo((Big)(SECONDS_IN_MONTH+1));
    Big timeInMonth = nres(seconds);
    cout << "timeInMonth" << endl << timeInMonth << endl;
    int totalTime = size(timeInMonth.getbig());

/*    time_t begin_time = clock();
    modulo(days_in_month+1);
    day = nres(seconds);

    modulo(hours_in_day+1);
    hour = nres(seconds);
    if(hour == 24) {
        hour = 0;
    }

    modulo(min_in_hour+1);
    minute = nres(seconds);
    if(minute == 60) {
        minute = 0;
    }

    modulo(sec_in_min+1);
    sec = nres(seconds);
    if(sec == 60) {
        sec = 0;
    }
    cout << "Execution time mod method is "<< getExecutionTime(begin_time) << " ms" << endl;

    cout << name << "s expiry date is on " << day << " " << getMonth() << " " << getYear() << " at " << hour << ":" << minute << " and " << sec << " seconds." << endl;*/

    time_t begin_time = clock();
    int day = totalTime / (MINUTES_IN_HOUR * SECONDS_IN_MINUTE * HOURS_IN_DAY);
    int minute = (totalTime / MINUTES_IN_HOUR) % SECONDS_IN_MINUTE;
    int hour = (totalTime / SECONDS_IN_MINUTE) % HOURS_IN_DAY;
    int sec = (totalTime / MINUTES_IN_HOUR) % SECONDS_IN_MINUTE;

    cout << "Execution time division method is "<< getExecutionTime(begin_time) << " ms" << endl;
    cout << name << "s expiry date is on " << day << " " << getMonth() << " " << getYear() << " at " << hour << ":" << minute << " and " << sec << " seconds." << endl;

    cout << "Executed sucessfully!" << endl;
    return 0;
}

string getMonth() {
    return string("April");
}

string getYear() {
    return string("2014");
}