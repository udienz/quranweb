<?
include ('../config.php');
session_start();
if (!$_SESSION['ISADMIN'])
    header('location:'.$myURL);

    else {
include ('header.php');
        $nosr = $_POST['nosr'];
        $novr = $_POST['novr'];
        $filename = basename($_FILES['nfile']['name']);
        $uploadfile = $mediaPath.$nosr.'/'.basename($_FILES['nfile']['name']);
        $uname = $_POST['user1'];
        $pwd = $_POST['pass'];
        
        if ($nosr!='' && $novr!='' && $uploadfile!='' && $uname!='' && $pwd!='' && $filename!='')
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
                echo "<p><center><h5>username / password salah</h5></center></p>";
            }
            else {
                if (@move_uploaded_file($_FILES['nfile']['tmp_name'], $uploadfile)) {
                    rename($uploadfile, $mediaPath.$nosr.'/'.$nosr.'-'.$novr.'.mp3');
                    echo "<p><center><h5>Upload berhasil!\n</h5></center></p>";
                } else {
                    echo "<p><center><h5>Gagal upload, permission denied!\n</h5></center></p>";
                }
            }
         }
            
         else {
             if ($_POST['btn']=='1')
             echo "<p><center><h5>Form belum lengkap!</h5></center></p>";
         }
?>
<p><h2>Ganti file audio</h2></p>
<form enctype="multipart/form-data" method="post" action="audio.php">
<p><font color="#ff0000">PERHATIAN : Fasilitas ini sangat sensitif, HANYA digunakan bila BENAR-BENAR kompeten</font></p>
<table>
<tr><td>No surat : </td><td><input class="textbox" type="text" name="nosr" /></td></tr>
<tr><td>No ayat : </td><td><input class="textbox" type="text" name="novr"/></td></tr>
<tr><td>File mp3 : </td><td><input type="file" name="nfile"/></td></tr>
<tr><td>Username : </td><td><input class="textbox" type="text" name="user1"/></td></tr>
<tr><td>Password : </td><td><input class="textbox" type="password" name="pass"/></td></tr>
<tr><td></td><td><input type="hidden" name="btn" value="1"/></td></tr>
<tr><td></td><td><input type="submit" class="button" value="Ganti"/></td></tr>
</table>
</form>

<? 
include ('footer.php');

} ?>
