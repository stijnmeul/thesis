import sys, urllib, xmlrpclib
import random
api_server = xmlrpclib.ServerProxy('https://www.planet-lab.org/PLCAPI/')

auth = {}
auth['AuthMethod'] = "anonymous"
auth['Role'] = "user"

file = open('used.txt', 'r')
outfile = open('sitespos.txt', 'w')

for line in file:
	line = line[0:len(line)-1]
	query = api_server.GetNodes(auth, {'hostname': line}, ['site_id'])
	if len(query) == 0:
		outfile.write(str(random.randint(-60, 60)) + '\t' + str(random.randint(-179,179)))
	else:
		site_id = query[0]['site_id']
		site_info = api_server.GetSites(auth, {'site_id': site_id}, ['site_id', 'name', 'latitude', 'longitude'])
#outfile.write(str(site_info[0]['site_id'])+'\t'+str(site_info[0]['latitude'])+'\t'+str(site_info[0]['longitude']))
		outfile.write(str(site_info[0]['latitude'])+'\t'+str(site_info[0]['longitude']))
#	outfile.write(str(site_info[0]['site_id'])+'\t'+str(site_info[0]['name'])+'\t'+str(site_info[0]['latitude'])+'\t'+str(site_info[0]['longitude']))
	outfile.write('\n')

outfile.close()
