<?php

	$socket = socket_create(AF_INET,SOCK_STREAM,0);
    socket_connect($socket,"127.0.0.1",5000);


    $command = "Lorem Ipsum Dolor Sit Amet";
    echo $command;
    socket_write($socket,$command,strlen($command));

    socket_close($socket);


?>