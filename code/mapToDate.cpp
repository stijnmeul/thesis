#include "mapToDate.h"
#include <ctime>
#include <sstream>

// By using gmtime GMT+0 is used as a time reference.
int getYear() {
    time_t t = time(0);
    struct tm * now = gmtime( & t ); // now corresponds to the current time in Greenwhich.
    return now->tm_year + 1900;
}

std::string getMonthYear(int day, int hour, int minute) {
    time_t t = time(0);   // get time now
    struct tm * now = gmtime( & t );
    std::stringstream ss;
    int resMon = now->tm_mon + 1;
    if (now->tm_mday > day) {
        resMon = resMon + 1;
    } else if ( (now->tm_mday == day) && (now->tm_hour <= hour) && (now->tm_min < minute)) {
        resMon = resMon + 1;
    }

    int resYear = getYear();
    if(resMon > 12) {
        resYear = resYear + 1;
        resMon = 1;
    }

    // If smaller than 10, concatenate an additional zero
    if(resMon < 10)
        ss << 0 << resMon;
    else {
        ss << resMon;
    }
    // Concatenate year
    ss << resYear;
    return ss.str();
}

std::string mapToDate(std::string name) {
    int origIOBASE = get_mip()->IOBASE;
    Big origModulus = get_modulus();

    get_mip()->IOBASE = 256;
    char hash[32];
    sha256 mySh;
    char * id = (char *)name.c_str();
    shs256_init(&mySh);
    int i = 0;
    while (id[i]!=0) {
        shs256_process(&mySh,id[i]);
        i++;
    }
    shs256_hash(&mySh,hash);

    Big minutes = from_binary(sizeof(hash), hash);
    get_mip()->IOBASE = 10;

    modulo((Big)(MINUTES_IN_MONTH+1));
    Big timeInMonth = nres(minutes);
    int totalTime = size(timeInMonth.getbig());

    time_t begin_time = clock();
    int day = (totalTime / (MINUTES_IN_HOUR * HOURS_IN_DAY))+1;
    int minute = totalTime % minutes_IN_MINUTE;
    int hour = (totalTime / (MINUTES_IN_HOUR)) % HOURS_IN_DAY;

    std::stringstream ss;
    ss << name;
    if(day < 10)
        ss << 0;
    ss << day << getMonthYear(day, hour, minute);
    if(hour < 10)
        ss << 0;
    ss << hour;
    if(minute < 10)
        ss << 0;
    ss << minute << endl;

    modulo(origModulus);
    get_mip()->IOBASE = origIOBASE;

    return ss.str();
}