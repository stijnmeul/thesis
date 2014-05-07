import os, string
import shutil
from operator import itemgetter

# The units in the output messages.txt file will be 1/gran of a second.
# In this case, 1/100 second = 10 ms.
gran = 100

# Delete unnecessary files
datadir = 'msgData/'
print "Deleting unnecessary input files..."
files = os.listdir(datadir)

hasused = 0

for file in files:
	if 'message_' in file:
		[]
	elif 'used' in file:
		[]
		hasused = 1
	else:
		if '.svn' in file:
			[]
		else:
			os.remove(datadir + file)

# Check whether the input file is OK to generate the graph
print "Check whether the input files are complete..."
files = os.listdir(datadir)
f_used = open ('used.txt', 'r')
count = 0  # This is the number of nodes in total

for line in f_used:
	count = count + 1

if count > len(files) - hasused:
	print "Warning: input files are NOT complete..."
	print "Supposed to be: " + str(count)
	print "Now there are only: " + str(len(files) - hasused)
else:
	print "Input files are complete."

f_used.close()

# Step1: no unrelated message
base1 = 'polished_data1/'

if not os.path.exists(base1):
	os.makedirs(base1)
else:
    shutil.rmtree(base1)
    os.makedirs(base1)

type_set = ['LEADER_CHANGE', 'VSS_SEND', 'VSS_ECHO', 'VSS_READY', 'VSS_SHARED', 'DKG_SEND', 'DKG_ECHO', 'DKG_READY']
# get rid of all the messages that are not necessary
# also look for the time base line
time_base = -1
for filename in files:
	if '.svn' in filename:
		[]
	elif 'used.' in filename:
		[]
	else:
		outfile = open(base1 + filename, 'w')
		file = open(datadir + filename, 'r')
		firstline = file.readline()
		words = string.split(firstline)

		for line in file:
			words = string.split(line)
			if len(words) != 0:
				if words[0] in type_set:
					outfile.write(line)

					if time_base == -1:
						time_base = float(words[10])
					else:
						if time_base > float(words[10]):
							time_base = float(words[10])

		outfile.close()
		file.close()

# Step2: send and receive messages should be separated, with less field in the form of
# FILEINDEX_SEND || FILEINDEX_RECEIVE
# TYPE ID FROM TO TIME
base2 = 'polished_data2/'
msgtmap = {'LEADER_CHANGE':0, 'VSS_SEND':1, 'VSS_ECHO':2, 'VSS_READY':3, 'VSS_SHARED':4, 'DKG_SEND':5, 'DKG_ECHO':6, 'DKG_READY':7}

if not os.path.exists(base2):
	os.makedirs(base2)
else:
    shutil.rmtree(base2)
    os.makedirs(base2)

rm = [None] * count # received message matrix
for i in range (count):
	rm[i] = [None] * count
	for j in range (count):
		ls = []
		rm[i][j] = ls

# (msg_type, id, received_time)

sm = [None] * count # sent message matrix
for i in range (count):
	sm[i] = [None] * count
	for j in range (count):
		ls = []
		sm[i][j] = ls
# (msg_type, id, send_time)

mm = []
# (msg_type, sender, receiver, send_time, receive_time)

for filename in files:
    if '.svn' in filename:
        []
    elif 'used.' in filename:
        []
    else:
        file = open(base1 + filename, 'r')
        for line in file:
            words = string.split(line)
            reltime = float(words[10]) - time_base
            sender = 1

            if words[6] != '*':
                sender = int(words[6]) - 1
            else:
#                filenamefields = string.split(filename, '.')
#                prefix = filenamefields[0]
#                indexstr = (string.split(prefix, '_'))[1]
#                sender = int(indexstr) - 1
                continue

            receiver = int(words[8]) - 1
            id = int(words[1])
            msg_type = msgtmap.get(str(words[0]), None)
            if words[4] == 'SENT':
                sm[sender][receiver].append((msg_type, id, reltime))
            else:
                rm[sender][receiver].append((msg_type, id, reltime))

        file.close()


for i in range (count):
	for j in range (count):
		for s_tuple in sm[i][j]:
			found = 0
			for r_tuple in rm[i][j]:
				if s_tuple[1] == r_tuple[1]: # compare id
					if s_tuple[0] == r_tuple[0]: # compare msg_type
						mm.append((s_tuple[0], i + 1, j + 1, int(s_tuple[2] * gran), int(r_tuple[2] * gran)))
						found = 1
			if found == 0:
				# This is a lost message
				# Something can appear in the demo
				# But I won't implement it in this version
				[]

# Sort mm
mm = sorted (mm, key=itemgetter(3))
file = open('messages.txt', 'w')
for line in mm:
	for ele in line:
		file.write(str(ele) + '\t')
	file.write('\n')
file.close()
