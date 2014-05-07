# !/usr/bin/python
### addyourslice.py
print "============================================"
print "This script contacts the planetlab server,"
print "and add the slice named by the user to the"
print "nodes in nodes.txt"
print "AUTHOR: Andy Huang (ref: planet-lab tutorial)"
print "CONTACT: y226huan@uwaterloo.ca"
print "============================================"

import xmlrpclib
import getpass
un = raw_input("Username: ")
pw = getpass.getpass()
api_server = xmlrpclib.ServerProxy('https://www.planet-lab.org/PLCAPI/')
auth = {}
auth['Username'] = un
auth['AuthString'] = pw
auth['AuthMethod'] = "password"

node_list = [line.strip() for line in open("nodes.txt")]

slicename = raw_input("Slice Name: ")
api_server.AddSliceToNodes(auth, slicename, node_list)
