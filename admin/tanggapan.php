<? 
session_start();
include('../config.php');

if (!$_SESSION['ISADMIN']) {
    header('location:'.$myURL);
}
//$sServer="localhost";
//    $sUser='waddh';
//    $sPass='w4ddh';
//    $sDB='quran';
else {
include('header.php');

    //$uname = $_POST['user'];
    //$pwd = md5($_POST['pass']);
    if ($_GET['st']==2) echo '<p><center><h5>Tangapan berhasil dihapus!</h5></center></p>';
    else if ($_GET['st']==3) echo 'Terjadi kegagaln queri!';
    else if ($_GET['st']==4) echo 'Tidak bisa terhubung dengan server data!';
    else if ($_GET['st']==5) echo 'Tidak bisa terhubung dengan basis data!';
$link = mysql_connect($sServer, $sUser, $sPass);

if (!$link)
    die ('tidak bisa terhubung dengan server data ' . mysql_error());

if (!mysql_select_db($sDB))
    die ('tidak bisa terhubung dengan basis data' . mysql_error());
$q = <<<SQLfeedback
SELECT rid, name, email, location, message FROM listFeedback
SQLfeedback;
$result = mysql_query($q);
if(!$result)
   die("query error : $q " . mysql_error());
else
{
    echo '<p><h2>List Tanggapan<h2></p>';
echo '<center><table border=0 cellpadding=1 cellspacing=1>';
echo '<thead bgcolor=#E6CE7B><tr><th>No.</th><th>Nama</th><th>Email</th><th>Lokasi</th><th>Pesan</th><th>Hapus</th></tr></thead>';
echo '<tbody>';
#$count = mysql_num_rows($result);
$i=0;
while ($line = mysql_fetch_array($result, MYSQL_ASSOC))
{
    $kel = $i%2==0?'gen':'gan';
    echo "<tr class=$kel><td>".++$i."</td>";
        echo "<td>".stripslashes($line[name])."</td>";
        echo "<td>$line[email]</td>";
        echo "<td>$line[location]</td>";
        echo "<td>".stripslashes($line[message])."</td>";
    echo '<td><a href="deltanggapan.php?id='.$line['rid'].'">-x-</td>';
    echo '</tr>';
}


echo '<tbody>';
echo '</table></center>';
mysql_free_result($result);
mysql_close($link);
}
include('footer.php');
}
?>
