#ifndef MAP_TO_DATE_H
#define MAP_TO_DATE_H

#define DAYS_IN_MONTH 28
#define HOURS_IN_DAY 24
#define MINUTES_IN_HOUR 60
#define minutes_IN_MINUTE 60
#define MINUTES_IN_MONTH DAYS_IN_MONTH*HOURS_IN_DAY*MINUTES_IN_HOUR

// TODO: make this independent of client or server
#include "commonparams.h"
#include <string>

// By using gmtime GMT+0 is used as a time reference.
int getYear();

std::string getMonthYear(int day, int hour, int minute);

std::string mapToDate(std::string name);

#endif