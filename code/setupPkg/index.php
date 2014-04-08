<?php


exec("/Users/stijn/KUL/Master/Thesis/code/cppmiracl/source/ibe_PKG", $out);

$params = json_decode($out[0]);
echo "extracting time: " . $params->extractTime;

?>