#ifndef _MESSAGE_H
#define _MESSAGE_H

#include "constants.h"
#include <vector>
#include <iostream>
#include <iomanip>
using namespace std;

class Message {
	public:
		unsigned int msg_type;
		unsigned int msg_ID;
		unsigned int for_who;
		unsigned int msg_way;
		unsigned int from_who;
		unsigned int to_who;
		unsigned int sec;
		unsigned int usec;

		Message (unsigned int mt, unsigned int mi, unsigned int wfo,
				unsigned int mw, unsigned int wfr, unsigned int wt,
				unsigned int s, unsigned int us) :
			msg_type (mt), msg_ID (mi), for_who (wfo), msg_way (mw),
			from_who (wfr), to_who (wt), sec (s), usec (us) {}
		Message () {}
	friend ostream &operator << (ostream &out, Message m);
};

//friend ostream &operator<<(ostream &cout, Employee emp);

ostream &operator << (ostream &out, Message m) {
	
	if (m.msg_type == ENDMSG) {
		out << "ENDMSG ";
	} else if (m.msg_type == VSS_SEND) {
		out << "VSS_SEND ";
	} else if (m.msg_type == VSS_ECHO) {
		out << "VSS_ECHO ";
	} else if (m.msg_type == VSS_READY) {
		out << "VSS_READY ";
	} else if (m.msg_type == DKG_SEND) {
		out << "DKG_SEND ";
	} else if (m.msg_type == DKG_ECHO) {
		out << "DKG_ECHO ";
	} else if (m.msg_type == DKG_READY) {
		out << "DKG_READY ";
	} else if (m.msg_type == DKG_COMPLETE) {
		out << "DKG_COMPLETE ";
	} else if (m.msg_type == LEADER_CHANGE) {
		out << "LEADER_CHANGE ";
	} else if (m.msg_type == E_LEADER_CONFIRM) {
		out << "E_LEADER_CONFIRM ";
	} else if (m.msg_type == TIMEOUT) {
		out << "TIMEOUT ";
	} else if (m.msg_type == NEW_LEADER) {
		out << "NEW_LEADER ";
	} else if (m.msg_type == VSS_SHARED) {
		out << "VSS_SHARED ";
	} else if (m.msg_type == VSSECHO_STAGE1)  {
		out << "VSSECHO_STAGE1 ";
	} else if (m.msg_type == VSSECHO_STAGE2)  {
		out << "VSSECHO_STAGE2 ";
	} else if (m.msg_type == VSSECHO_STAGE3)  {
		out << "VSSECHO_STAGE3 ";
	} else if (m.msg_type == VSSECHO_STAGE4)  {
		out << "VSSECHO_STAGE4 ";
	} else if (m.msg_type == HALF_FIND_BUDDY)  {
		out << "HALF_FIND_BUDDY ";
	} else if (m.msg_type == BEFORE_LOCK)  {
		out << "BEFORE_LOCK ";
	} else if (m.msg_type == AFTER_LOCK)  {
		out << "AFTER_LOCK ";
	} else if (m.msg_type == AFTER_LOCK2)  {
		out << "AFTER_LOCK2 ";
	} else if (m.msg_type == COMPUTING_ZR)  {
		out << "COMPUTING_ZR ";
	} else if (m.msg_type == END_COMPUTING_ZR)  {
		out << "END_COMPUTING_ZR ";
	} else if (m.msg_type == COMPUTE_BI)  {
		out << "COMPUTE_BI ";
	} else if (m.msg_type == COMPUTE_CM)  {
		out << "COMPUTE_CM ";
	} else if (m.msg_type == COMPUTE_ZR2)  {
		out << "COMPUTE_ZR2 ";
	} else if (m.msg_type == COMPUTE_PL)  {
		out << "COMPUTE_PL ";
	} else if (m.msg_type == CVSS_SEND)  {
		out << "CVSS_SEND ";
	} else if (m.msg_type == PRE_VSS_READY)  {
		out << "PRE_VSS_READY ";
	} else if (m.msg_type == AFTER_AFTER_LOCK)  {
		out << "AFTER_AFTER_LOCK ";
	} else if (m.msg_type == FIND_BUDDY)  {
		out << "FIND_BUDDY ";
	} else if (m.msg_type == FINALLY_FIND_BUDDY)  {
		out << "FINALLY_FIND_BUDDY ";
	} else {
		out << "UNKNOWN_MSG ";
	}

	if (m.msg_ID == 0) {
		out << "* ";
	} else out << m.msg_ID << " ";

	out << "for ";

	if (m.for_who == 0) {
		out << "* ";
	} else out << m.for_who << " ";

	if (m.msg_way == RECEIVED) {
		out << "RECEIVED ";
	} else if (m.msg_way == SENT) {
		out << "SENT ";
	} else if (m.msg_way == RS) {
		out << "RS ";
	} else if (m.msg_way == BEGINNING) {
		out << "BEGINNING ";
	} else if (m.msg_way == NL) {
		out << "NL ";
	} else {
		out << "? ";
	}

	out << "from ";

	if (m.from_who == 0) {
		out << "* ";
	} else out << m.from_who << " ";

	out << "to ";

	if (m.to_who == 0) {
		out << "* ";
	} else out << m.to_who << " ";

	out << "at " << m.sec << "." << setw(6) << m.usec;

	return out;
}

#endif
