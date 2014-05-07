/* A simple server in the internet domain using TCP
   The port number is passed as an argument */
#include <iostream>
#include <stdio.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "ibe_pkg.h"

#define PORT_NB 5000

void error(const char*);

int main()
{
     int sockfd, newsockfd;
     socklen_t clilen;

     char buffer[4096];
     struct sockaddr_in serv_addr, cli_addr;
     int n;
     string test;
     // Initialise the socket descriptor.
     sockfd = socket(AF_INET, SOCK_STREAM, 0);
     if (sockfd < 0)
        error("ERROR opening socket");
    // Set buffer to zero
     memset((char *) &serv_addr,'0',sizeof(serv_addr));

     // Bind socket to port
     serv_addr.sin_family = AF_INET;
     serv_addr.sin_addr.s_addr = INADDR_ANY;
     serv_addr.sin_port = htons(PORT_NB);
     if (bind(sockfd, (struct sockaddr *) &serv_addr, sizeof(serv_addr)) < 0)
              error("ERROR on binding");

     // Listen to socket and accept incoming connections
     listen(sockfd,5);
     clilen = sizeof(cli_addr);
     newsockfd = accept(sockfd, (struct sockaddr *) &cli_addr, &clilen);
     if (newsockfd < 0)
          error("ERROR on accept");

    // Read out socket.
     n = read(newsockfd,buffer,sizeof(buffer));
     if (n < 0) error("ERROR reading from socket");
     cout << "Received ID:" << endl << buffer << endl;

     test = getIbeParams(buffer);
     strcpy(buffer, test.c_str());


     n = write(newsockfd,buffer,sizeof(buffer));

     if (n < 0) error("ERROR writing to socket");

     close(newsockfd);
     return 0;
}

void error(const char* msg) {
    perror(msg);
    exit(1);
}
