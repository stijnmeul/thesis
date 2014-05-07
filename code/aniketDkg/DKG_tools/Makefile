SRCS=$(wildcard *.cc)
OBJS=$(subst .cc,,$(SRCS))

all: analyse medianh printall monitor medianmachine

medianh: medianh.cc dkgtools.h constants.h node.h message.h
	g++ -ggdb -o medianh medianh.cc

medianmachine: medianmachine.cc dkgtools.h constants.h node.h message.h
	g++ -ggdb -o medianmachine medianmachine.cc

printall: printall.cc dkgtools.h
	g++ -ggdb -o printall printall.cc

analyse: analyse.cc dkgtools.h constants.h node.h message.h
	g++ -ggdb -o analyse analyse.cc

monitor: monitor.cc dkgtools.h
	g++ -ggdb -o monitor monitor.cc

clean:
	rm -f $(OBJS)
