#!/usr/bin/env python

import pygame, math
import time

from pygame.locals import *
import sys; sys.path.insert(0, "..")
from pgu import gui

MAX_RANGE = []

class MessageLog:
    '''A MessageLog encapsulates the list of messages sent during the
    protocol run.'''

    SITESPOSFILE = "sitespos.txt"
    MESSAGEFILE = "messages.txt"
    sitelatlong = {}
    msglog = []
    canmsglog = []
    f = open('debugfile', 'w')


    def __init__(self):
	'''Read the message.txt and sitespos.txt files to construct the
	message log'''

        # Read the lats and longs for the sites used
        sitespos = open(self.SITESPOSFILE, 'r')
        sitecount = 0
        for line in sitespos:
            sitecount += 1
            parts = line[:-1].split('\t')
            self.sitelatlong[sitecount] = ((float)(parts[0]),(float)(parts[1]))

        sitespos.close()

        # Now read the message log
        messages = open(self.MESSAGEFILE, 'r')
        msgcount = 0
        MAX_RANGE.append(-1)
        for line in messages:
            msgcount += 1
            # type\tsrc\tdst\tstarttime\tendtime\n
            parts = line[:-1].split('\t')
            msgtype = parts[0]
            (srclat, srclng) = self.sitelatlong[(int)(parts[1])]
            (dstlat, dstlng) = self.sitelatlong[(int)(parts[2])]
            starttime = (float)(parts[3])
            endtime = (float)(parts[4])
            if MAX_RANGE[0] < endtime:
                MAX_RANGE[0] = endtime
            self.msglog.append((msgcount, starttime, endtime, msgtype, srclat, srclng, dstlat, dstlng))

    def init_canmsglog(self, timerange, startindex):
        lstartindex = 0

        if startindex == 0:
            # Progress bar dragged, delete the entire list
            # del self.canmsglog[:]
            self.canmsglog = []

        lstartindex = startindex

        (stime, etime) = timerange
        if stime == etime:
            return int(lstartindex)

        length = int(len(self.msglog) - lstartindex)
        for ind in range(length):
            msg = self.msglog[int(ind + lstartindex)]
            mstime = msg[1]
            metime = msg[2]
            # Does the starting time of the current message exceed the timerange
            if mstime <= etime:
                if metime >= stime:
                    self.canmsglog.append(msg)
            else:
                return int(msg[0])

        return int(len(self.msglog))

    def process(self, timerange, tobechecked, callback):
	'''Call the callback for each message that intersects with the
	given time range.'''
        (stime, etime) = timerange
        newcanmsglog = []
        for msg in self.canmsglog:
            # msg = self.msglog[msgind]
            mstime = msg[1]
            metime = msg[2]
            # Does the timerange intersect the message?
            if stime <= mstime:
                if etime >= metime:
                    callback.cb(msg, 0, 1)
                    newcanmsglog.append(msg)
                elif etime >= mstime:
                    callback.cb(msg, 0, (etime-mstime)/(metime-mstime))
                    newcanmsglog.append(msg)
            elif stime <= metime:
                if etime >= metime:
                    callback.cb(msg, (stime-mstime)/(metime-mstime), 1)
                    newcanmsglog.append(msg)
                elif etime >= mstime:
                    callback.cb(msg, (stime-mstime)/(metime-mstime), (etime-mstime)/(metime-mstime))
                    newcanmsglog.append(msg)

        self.canmsglog = newcanmsglog
        tbchecked = self.init_canmsglog(timerange, tobechecked)
        return tbchecked

class World:
    BLACK = [0,0,0]
    WHITE = [255,255,255]
    RED = [255,0,0]
    GREEN = [0,255,0]
    BLUE = [0,0,255]
    YELLOW = [255,255,0]
    CYAN = [0,255,255]
    MAGENTA = [255,0,255]
    msgcolours = {
	'0' : BLACK,
	'1' : WHITE,
	'2' : RED,
	'3' : GREEN,
	'4' : YELLOW,
	'5' : BLUE,
	'6' : CYAN,
	'7' : MAGENTA
    }
    scrwidth = 800
    scrheight = 600
    maxlati = 80
    R = (scrheight / 2) / math.log((math.sin(math.pi*maxlati/180)+1)/math.cos(math.pi*maxlati/180))
    msglog = None

    def __init__(self, msglog):
        self.msglog = msglog
        self.redraw_screen()

    def resize(self, size):
        self.scrwidth = size[0]
        self.scrheight = size[1]
        self.R = (self.scrheight / 2) / math.log((math.sin(math.pi*self.maxlati/180)+1)/math.cos(math.pi*self.maxlati/180))
        self.redraw_screen()

    def redraw_screen(self):
        self.screen = pygame.display.set_mode((self.scrwidth,self.scrheight),pygame.RESIZABLE)
        self.bgimage = pygame.transform.scale(pygame.image.load("Mercator-projection.jpg").convert(), (self.scrwidth,self.scrheight))
        self.bgrect = self.bgimage.get_rect()
        pygame.display.set_caption("DKG message flow");
        self.bg = pygame.Surface(self.screen.get_size())
        self.bg.fill(self.BLACK)
        self.bgpos = [0,0]

        # Draw the sites on the background image
        for sitepos in self.msglog.sitelatlong.values():
            pygame.draw.circle(self.bgimage, self.RED, self.xyfromlatlng(sitepos[0], sitepos[1]), self.scrheight/200);

    def xyfromlatlng(self, lat, lng):
        x = int(self.scrwidth * (float(lng) + 180) / 360)
        y = int((self.scrheight / 2 - self.R * math.log((math.sin(math.pi*float(lat)/180)+1)/math.cos(math.pi*float(lat)/180))))
        return (x,y)

    def newframe(self):
        self.screen.blit(self.bgimage, self.bgpos)

    def showframe(self):
        pygame.display.flip()

    def cb(self, msg, start, end):
        (srcx,srcy) = self.xyfromlatlng(msg[4], msg[5])
        (dstx,dsty) = self.xyfromlatlng(msg[6], msg[7])
        sx = int(srcx + start * (dstx-srcx))
        sy = int(srcy + start * (dsty-srcy))
        ex = int(srcx + end * (dstx-srcx))
        ey = int(srcy + end * (dsty-srcy))
        pygame.draw.line(self.screen,self.msgcolours[msg[3]],(sx,sy),(ex,ey),self.scrheight/300)


class Control(gui.Table):
	def __init__(self,**params):
		gui.Table.__init__(self,**params)
		fg = (255,255,255)

		self.tr()
		self.td(gui.Label("Speed: ",color=fg),align=1)
		e = gui.HSlider(0,0,2000,size=20,width=300,height=16,name='speed')
		self.td(e)

		self.tr()
		self.td(gui.Label("Progress: ",color=fg),align=1)
		e = gui.HSlider(1,0,MAX_RANGE[0],size=20,width=300,height=16,name='progress')
		self.td(e)

if __name__ == '__main__':
    pygame.init()
    msglog = MessageLog()
    world = World(msglog)
    form = gui.Form()
    app = gui.App()
    ctrl = Control()

    c = gui.Container(align=-1,valign=-1)
    c.add(ctrl,0,0)

    app.init(c)

    speed = form['speed'].value/100
    curtime = form['progress'].value
    pygame.time.set_timer(pygame.USEREVENT, 40)

    last_progress = curtime
    tobechecked = 0
    tobechecked = msglog.init_canmsglog((curtime, curtime+speed), tobechecked)

    done = False
    while not done:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                done = True
            elif event.type == pygame.VIDEORESIZE:
                world.resize(event.size)
            elif event.type == pygame.USEREVENT:
                world.newframe()
                tobechecked = msglog.process((curtime,curtime+speed), tobechecked, world)
                curtime = curtime + speed
                form['progress'].value = curtime
                app.paint()
                world.showframe()
            else:
                app.event(event)
                app.paint()
                speed = form['speed'].value/100

#	        	current_progress = form['progress'].value
                if form['progress'].value < curtime:
                    curtime = form['progress'].value
                    tobechecked = 0
                    tobechecked = msglog.init_canmsglog((curtime,curtime+speed), tobechecked)
                else:
                    curtime = form['progress'].value

#	         	if current_progress != last_progress:
#	 	        	last_progress = current_progress
#	         		curtime = current_progress
