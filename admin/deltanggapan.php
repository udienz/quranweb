<?
include('../config.php');
session_start();
if (!$_SESSION['ISADMIN'])
header('location:'.$myURL);
else {
    #include ('header.php');
if($id=$_GET['id'])
{
    $link = mysql_connect($sServer, $sUser, $sPass);
    if (!$link) {
        #header('location:'.$myURL.'admin/tanggapan.php?st=4');
        #die;
        die ('tidak bisa terhubung dengan server data ' . mysql_error());
    }
    if (!mysql_select_db($sDB)) {
        #header('location:'.$myURL.'admin/tanggapan.php?st=5');
        #die;
        die ('tidak bisa terhubung dengan basis data' . mysql_error());
    }

$q = <<<SQLdelete
DELETE FROM listFeedback where rid='$id'
SQLdelete;

$result = mysql_query($q);
if(!$result) {
        header('location:'.$_SERVER['HTTP_REFERER'].'?st=3');
        die;
   //die("query error : $q " . mysql_error());
}
else {
        header('location:'.$_SERVER['HTTP_REFERER'].'?st=2');
        //header('location:'.$myURL.'admin/tanggapan.php?st=2');
        die;
    //echo "delete success <a href=\"tanggapan.php\">back</a>";
}

mysql_close($link);
}
#include ('footer.php');
}
?>
