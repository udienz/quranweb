<?
include('../config.php');
session_start();

if ($_POST['user']=='' || $_POST['pass']=='')
{
    die('username / password kosong');
}
else {
    #    $sServer="localhost";
    #$sUser='waddh';
    #$sPass='w4ddh';
    #$sDB='quran';
    $uname = $_POST['user'];
    $pwd = md5($_POST['pass']);
$link = mysql_connect($sServer, $sUser, $sPass);

if (!$link)
    die ('tidak bisa terhubung dengan server data ' . mysql_error());

if (!mysql_select_db($sDB))
    die ('tidak bisa terhubung dengan basis data' . mysql_error());
$q = <<<SQLballoon
SELECT id from listUser where username='$uname' AND password='$pwd'
SQLballoon;
$result = mysql_query($q);
if(!$result)
   die("query error : $q " . mysql_error());

if(mysql_num_rows($result) == 0) {
   header('location:index.php?em=username / password anda salah');//die("tidak ditemukan catatan kaki $bid");
}
else {
       $_SESSION['ISADMIN'] = true;
      header('location:main.php'); 
}

       //while ($row=mysql_fetch_assoc($result))
    //$catatan = $row['teks'];
mysql_free_result($result);
mysql_close($link);
}
?>
