<?
include('../config.php');
session_start();
if (!$_SESSION['ISADMIN'])
    header('location:'.$myURL);
    else {
include('header.php');
 
$old = $_POST['old'];
$new = $_POST['new'];
$retype = $_POST['retype'];
if ($old!='' && $new!='' &&  $retype!='')
{
$link = mysql_connect($sServer, $sUser, $sPass);

if (!$link)
    die ('tidak bisa terhubung dengan server data ' . mysql_error());

if (!mysql_select_db($sDB))
    die ('tidak bisa terhubung dengan basis data' . mysql_error());
$q = <<<SQLpwd
SELECT password from listUser where username='admin'
SQLpwd;
$result = mysql_query($q);
if(!$result)
   die("query error : $q " . mysql_error());

   
   $row = mysql_fetch_assoc($result);
    if(md5($old) != $row['password'])
    echo '<p><center><h5>Password lama yang anda masukkan tidak benar!</h5></center></p>';
    else 
    {
        if ($new != $retype)
        echo '<p><center><h5>Pengulangan password baru tidak sama!</h5></center></p>';
        else {
            $pwd = md5($new);
$q = <<<SQLupdate
UPDATE listUser set password='$pwd' WHERE username='admin'
SQLupdate;
$result = mysql_query($q);
if(!$result)
   die("query error : $q " . mysql_error());
   else
   echo '<p><center><h5>Penggantian password berhasil!</h5></center></p>';
            }
        //update password
    }
    //mysql_free_result($result);
    mysql_close($link);
}
else {
    if ($_POST['btn']=='1')
    echo "<p><center><h5>Form belum lengkap!</h5></center></p>";
    }


?>
<p><h2>Ganti Password </h2></p>
<form method="post" action="password.php">
<table>
<tr><td>Password lama : </td>
    <td><input class="textbox" type="password" name="old"></td></tr>
<tr><td>Password baru : 
    <td><input class="textbox" type="password" name="new"></td></tr>
<tr><td>Sekali lagi : 
    <td><input class="textbox" type="password" name="retype"></td></tr>
<tr><td></td><td><input type="hidden" name="btn" value="1"/></td></tr>
<tr><td></td><td><input class="button" type="submit" value="Ganti"/></td></tr>
</table>
</form>
<? 
include('footer.php');
} ?>