<?
/*
Used to preview image of a certain theme
*/
require_once("config.php");

if(!isset($_GET['ceker'])) {
	die("You must not access this page directly!"); //Just to stop people from visiting act_preview.php normally
}

$bid = trim($_GET['bid']); // theme id

$link = mysql_connect($sServer, $sUser, $sPass);

if (!$link)
	die ('tidak bisa terhubung dengan server data ' . mysql_error());

if (!mysql_select_db($sDB))
	die ('tidak bisa terhubung dengan basis data' . mysql_error());
$q = <<<SQLballoon
SELECT teks FROM noteIndonesia where no=$bid
SQLballoon;
$result = mysql_query($q);
if(!$result)
	die("query error : $q " . mysql_error());
if(mysql_num_rows($result) == 0)
	die("tidak ditemukan catatan kaki $bid");

while ($row=mysql_fetch_assoc($result))
	$catatan = $row['teks'];
mysql_free_result($result);
mysql_close($link);

echo $catatan;
?>

