<?
include('../config.php');
session_start();
if (!$_SESSION['ISADMIN'])
header('location:'.$myURL);
else {
    #include ('header.php');
if($no=$_GET['no'])
{
    $link = mysql_connect($sServer, $sUser, $sPass);
    if (!$link)
        die ('tidak bisa terhubung dengan server data ' . mysql_error());
    if (!mysql_select_db($sDB))
        die ('tidak bisa terhubung dengan basis data' . mysql_error());

$q = <<<SQLdelete
DELETE FROM ayatPilihan where no='$no'
SQLdelete;

$result = mysql_query($q);
mysql_close($link);
if(!$result)
   die("query error : $q " . mysql_error());
else {
    header('location:'.$_SERVER['HTTP_REFERER'].'?st=2');
    die;
    //echo "delete success <a href=\"addayat.php\">back</a>";
}

}
#include ('footer.php');
}
?>
