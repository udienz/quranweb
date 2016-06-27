<? 
session_start();
include('../config.php');
if (!$_SESSION['ISADMIN'])
    header ('location:'.$myURL);

else {
include('header.php');

$nosr = $_POST['nosr'];
$novr = $_POST['novr'];
$arti = $_POST['arti'];
$uname = $_POST['username'];
$pwd = $_POST['pass'];

if ($_GET['st'] == 1) echo '<p><center><h5>Username/password salah</h5></center></p>';
else if ($_GET['st'] == 1) echo '<p><center><h5>Update arti ayat gagal!</h5></center></p>';
else if ($_GET['st'] == 1) echo '<p><center><h5>Update arti ayat berhasil!</h5></center></p>';

    if ($nosr!='' && $novr!='' &&  $arti!='' && $pwd!='')
    {
        $pwd = md5($pwd);
        $link = mysql_connect($sServer, $sUser, $sPass);

        if (!$link)
            die ('tidak bisa terhubung dengan server data ' . mysql_error());

        if (!mysql_select_db($sDB))
            die ('tidak bisa terhubung dengan basis data' . mysql_error());

        $qr = <<<SQLpwd
SELECT id from listUser where username='$uname' AND password='$pwd'
SQLpwd;

        $result = mysql_query($qr);
        if(mysql_num_rows($result) == 0) {
            echo '<p><center><h5>Otorisasi gagal</h5></center></p>';
            }
        else {
            $q = <<<SQL
UPDATE quranIndonesia SET teks='$arti'  where no='$nosr:$novr'
SQL;
        
            $result = mysql_query($q);

            if(!$result) {
                echo '<p><center><h5>Update arti gagal</h5></center></p>';
            }
            else { 
                mysql_close($link);
                echo '<p><center><h5>Update arti berhasil</h5></center></p>';
            }

        }
        
        }
    else {
       if ($_POST['btn']=='1')
           echo '<p><center><h5>Form belum lengkap</h5></center></p>';
    }
   
?>
<p><h2>Update Arti</h2></p>
<p><font color="#ff0000">PERHATIAN : Fasilitas ini sangat sensitif, HANYA digunakan bila BENAR-BENAR kompeten</font></p>
<form method="post" action="editcontent.php">
<table>
<tr><td>No surat : </td><td><input class="textbox" type="text" name="nosr"/></td></tr>
<tr><td>No ayat : </td><td><input class="textbox" type="text" name="novr"/></td></tr>
<tr><td>Arti : </td><td><textarea class="textbox" rows="5" cols="40" name="arti"></textarea></td></tr>
<tr><td>Username : </td><td><input class="textbox" type="text" name="username"/></td></tr>
<tr><td>Password : </td><td><input class="textbox" type="password" name="pass"/></td></tr>
<tr><td></td><td><input type="hidden" name="btn" value="1"/></td></tr>
<tr><td></td><td><input type="submit" class="button" value="Update"/></td></tr>
</table>
</form>

<? 
include('footer.php');
} ?>
