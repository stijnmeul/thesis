<?php
/*
$password = '"stijn"';
$binDir = "/Users/stijn/KUL/Master/Thesis/code/setupPkg/";

// Read out the ciphertext of MSK in PHP
$myFile = $binDir . "encrypted_msk.key";
$fh = fopen($myFile, 'rb');
$Cread = fread($fh, 80);
$Tread = fread($fh, 16);
echo "Cread:" . $Cread . "<br>";
echo "Tread:" . $Tread . "<br>";
fclose($fh);
$fh = fopen($myFile, 'rb');
$theData = fread($fh, fileSize($myFile));
fclose($fh);
echo "theData:" . $theData . "<br>";
$theData = bin2hex($theData);

if(file_exists($binDir . "P.key") && file_exists($binDir . "Ppub.key") && file_exists($binDir . "encrypted_msk.key")) {
	$command = $binDir . "ibe_pkg_keygen " . $password . " " . $theData;
	//echo "command: " . $command;
	system($command, $out);
} else {
	echo "PKG not initalised properly.";
}

echo "count(out): " . count($out) . "<br><br>";
for($i = 0; $i < count($out); $i++) {
	echo $out[$i] . "<br>";
}*/

	$socket = socket_create(AF_INET,SOCK_STREAM,0);
    socket_connect($socket,"127.0.0.1",5000);


    $command = "Lorem Ipsum Dolor Sit Amet";
    echo $command;
    socket_write($socket,$command,strlen($command));

    socket_close($socket);


?>