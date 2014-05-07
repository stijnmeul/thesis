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
#define minutes_IN_MINUTE 60
#define MINUTES_IN_MONTH DAYS_IN_MONTH*HOURS_IN_DAY*MINUTES_IN_HOUR

#define DAY_DIVISOR HOURS_IN_DAY*MINUTES_IN_HOUR*minutes_IN_MINUTE


using namespace std;

PFC pfc(AES_SECURITY);

miracl *mip = get_mip();
int bytes_per_big=(MIRACL/8)*(get_mip()->nib-1);

string getYear();
string getMonth();

int main(void)
{
    string name = "Stijn";
    mip->IOBASE = 256;
    char hash[HASH_LEN];
    sha256 sh;
    char * id = (char *)name.c_str();
    shs256_init(&sh);
    int i = 0;
    while (id[i]!=0) {
        shs256_process(&sh,id[i]);
        i++;
    }
    shs256_hash(&sh,hash);

    Big minutes = from_binary(sizeof(hash), hash);
    mip->IOBASE = 10;
    cout << "minutes is " << endl << minutes << endl;
    cout << "minutes in month is " << endl << MINUTES_IN_MONTH << endl;

    modulo((Big)(MINUTES_IN_MONTH+1));
    Big timeInMonth = nres(minutes);
    cout << "timeInMonth" << endl << timeInMonth << endl;
    int totalTime = size(timeInMonth.getbig());

/*    time_t begin_time = clock();
    modulo(days_in_month+1);
    day = nres(minutes);

    modulo(hours_in_day+1);
    hour = nres(minutes);
    if(hour == 24) {
        hour = 0;
    }

    modulo(min_in_hour+1);
    minute = nres(minutes);
    if(minute == 60) {
        minute = 0;
    }

    modulo(sec_in_min+1);
    sec = nres(minutes);
    if(sec == 60) {
        sec = 0;
    }
    cout << "Execution time mod method is "<< getExecutionTime(begin_time) << " ms" << endl;

    cout << name << "s expiry date is on " << day << " " << getMonth() << " " << getYear() << " at " << hour << ":" << minute << " and " << sec << " minutes." << endl;*/

    time_t begin_time = clock();
    int day = totalTime / (MINUTES_IN_HOUR * HOURS_IN_DAY);
    int minute = totalTime % minutes_IN_MINUTE;
    int hour = (totalTime / (MINUTES_IN_HOUR)) % HOURS_IN_DAY;
    // ((912415-10*(24*60*60))-(60*60*13))-26*60-55
    int test = (totalTime - day * (HOURS_IN_DAY*MINUTES_IN_HOUR) - hour * MINUTES_IN_HOUR - minute);
    if (  test == 0) {
        cout << "correct conversion from minutes to time" << endl;
    }

    cout << "Execution time division method is "<< getExecutionTime(begin_time) << " ms" << endl;
    cout << name << "s expiry date is on " << day << " " << getMonth() << " " << getYear() << " at " << hour << ":" << minute << endl;

    cout << "Executed sucessfully!" << endl;
    return 0;
}

string getMonth() {
    return string("April");
}

string getYear() {
    return string("2014");
}