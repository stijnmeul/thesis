// http://www.codeproject.com/Articles/586000/Networking-and-Socket-programming-tutorial-in-C

#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <sys/types.h>

#define BUF_SIZE 1025;
#define PORT_NB 5000;

int main(void)
{
  int socketd = 0,connfd = 0;

  struct sockaddr_in serv_addr;

  char sendBuff[BUF_SIZE];
  int numrv;

  // Get the socket descriptor
  socketd = socket(AF_INET, SOCK_STREAM, 0);
  printf("socket retrieve success\n");

  // Initialise all addresses and buffers to zero
  memset(&serv_addr, '0', sizeof(serv_addr));
  memset(sendBuff, '0', sizeof(sendBuff));

  // AF_INET defines that external clients are allowed to communicate
  serv_addr.sin_family = AF_INET;
  // Permit any incoming IP address
  serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);
  // Which port to listen to
  serv_addr.sin_port = htons(PORT_NB);

  // Bind socket to address and port
  bind(socketd, (struct sockaddr*)&serv_addr,sizeof(serv_addr));

  //  Start listening. Allow a waiting qeue of 10.
  if(listen(socketd, 10) == -1){
      printf("Failed to listen\n");
      return -1;
  }

  while(1)
    {
      // Initialise the socket descriptor of an accepted client
      connfd = accept(socketd, (struct sockaddr*)NULL ,NULL); // accept awaiting request

      strcpy(sendBuff, "Message from server");
      write(connfd, sendBuff, strlen(sendBuff));

      close(connfd);
      sleep(1);
    }


  return 0;
}