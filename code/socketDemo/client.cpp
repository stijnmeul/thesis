#include <stdio.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define PORT_NB 5000

void error(const char*);

int main()
{
    int sockfd, portNb, n;
    const char* id;
    const char* host;

    struct sockaddr_in serv_addr;
    struct addrinfo hints, *servinfo, *it, *server;

    id = "Stijn Meul";
    host = "127.0.0.1";

    char buffer[4096];

    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;

    if (getaddrinfo("127.0.0.1", "5000", &hints, &servinfo) != 0) {
        error("ERROR getting addrinfo");
        return 1;
    }
    it = servinfo;
    while(it != NULL) {
        if((sockfd = socket(it->ai_family, it->ai_socktype, it->ai_protocol)) == -1) {
            error("ERROR opening socket");
            it = it->ai_next;
        } else if (connect(sockfd, it->ai_addr, it->ai_addrlen) == -1) {
            close(sockfd);
            error("ERROR connecting");
            it = it->ai_next;
        } else {
            server = it;
            it = NULL;
        }
    }
    if(server == NULL) {
        error("ERROR client failed to connect");
    }

    bzero(buffer,256);
    strcpy(buffer,id);

    n = write(sockfd,buffer,strlen(buffer));
    if(n < 0)
        error("ERROR writing to socket");

    bzero(buffer,256);
    n = read(sockfd,buffer,255);

    if (n < 0)
        error("ERROR reading from socket");
    printf("%s\n",buffer);
    freeaddrinfo(servinfo);
    freeaddrinfo(it);
    close(sockfd);
    return 0;
}

void error(const char *msg)
{
    perror(msg);
    exit(0);
}