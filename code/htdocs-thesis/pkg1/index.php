<?php
$buf_size = 4096;
$socket = socket_create(AF_INET,SOCK_STREAM,0);
socket_connect($socket,'127.0.0.1',9101);

$binDir = '/Applications/XAMPP/htdocs/thesis/pkg1/';

$xml = new DOMDocument('1.0');

$root = $xml->createElement('scramble');
$result = $xml->createElement('result');
$xml->appendChild($root);

if(array_key_exists('id', $_POST) && isset($_POST['id']) && $_POST['id'] != ''){
	$command = htmlspecialchars($_POST['id']);
    socket_write($socket,$command,strlen($command));
    $DidResult = socket_read($socket, $buf_size, PHP_NORMAL_READ);
    socket_close($socket);

    // get contents of a file into a string
	$filename = $binDir . 'Ppub.key';
	$handle = fopen($filename, 'r');
	$PpubResult = fread($handle, filesize($filename));
	fclose($handle);

	// get contents of a file into a string
	$filename = $binDir . 'P.key';
	$handle = fopen($filename, 'r');
	$PResult = fread($handle, filesize($filename));
	fclose($handle);

	$P   = $xml->createElement('p');
	$PText = $xml->createTextNode($PResult);
	$P->appendChild($PText);

	$Ppub = $xml->createElement('p_pub');
	$PpubText = $xml->createTextNode($PpubResult);
	$Ppub->appendChild($PpubText);

	$Did = $xml->createElement('d_id');
	$DidText = $xml->createTextNode($DidResult);
	$Did->appendChild($DidText);
 
	$result->appendChild($Ppub);
	$result->appendChild($P);
	$result->appendChild($Did);
	$root->appendChild($result);
	$xml->formatOutput = true;
	echo $xml->saveXML();
} else {
	$root->appendChild($result);
	echo $xml->saveXML();
}?>