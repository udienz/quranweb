<? session_start(); 
include('../config.php');
if ($_SESSION['ISADMIN'])
{
include('header.php');
$link = mysql_connect($sServer, $sUser, $sPass);
    
    if ($_GET['st']==2) echo '<p><center><h5>Ayat berhasil dihapus</h5></center></p>';
    $nosr = $_POST['nosr'];
    $novr = $_POST['novr'];
    if ($nosr!='' && $novr!='') {
//$sServer="localhost";
//    $sUser='waddh';
//    $sPass='w4ddh';
//    $sDB='quran';
    $uname = $_POST['user'];
    $pwd = md5($_POST['pass']);

    
if (!$link)
    die ('tidak bisa terhubung dengan server data ' . mysql_error());

if (!mysql_select_db($sDB))
    die ('tidak bisa terhubung dengan basis data' . mysql_error());
$q = <<<SQLinsert
insert into ayatPilihan 
(select a.id, a.no, a.no_sr, a.no_vr, a.teks, b.teks as teks_arab 
from quranIndonesia a, quranArabic b 
where a.id=b.id AND a.no='$nosr:$novr')
SQLinsert;
$result = mysql_query($q);
if(!$result)
   //die("query error : $q " . mysql_error());
   echo "<p><center><h5>Ayat tersebut sudah ada</h5></center></p>";
else 
    echo "<p><center><h5>Penambahan ayat pilihan berhasil</h5></center></p>";
    }


echo '<p><h2>Ayat pilihan</h2></p>';
?>
<table>
<form method="post" action="addayat.php">
<tr><td>No Surat : </td><td><input class="textbox" type="text" name="nosr"/></td></tr>
<tr><td>No Ayat  : </td><td><input class="textbox" type="text" name="novr"/></td> </tr>
<tr><td></td><td><input type="submit" class="button" value="Tambah"/></td></tr>
</form>
</table>
<br/>
<?
echo '<p>List ayat pilihan yg sudah masuk</p>';
$q = <<<SQLfeedback
SELECT id, no, teks_arab, teks FROM ayatPilihan ORDER BY id
SQLfeedback;
$result = mysql_query($q);
if(!$result)
   die("query error : $q " . mysql_error());
else
{
echo '<table border=0 cellpadding=1 cellspacing=1>';
echo '<thead bgcolor=#e6ce7b><tr><th>No</th><th>sr:vr</th><th>Arti</th><th>Hapus</th></tr></thead>';
echo '<tbody>';
#$count = mysql_num_rows($result);
$i=0;
while ($line = mysql_fetch_array($result, MYSQL_ASSOC))
{
    $kel = $i%2==0?'gen':'gan';
    echo "<tr class=$kel><td>".++$i."</td>";
        echo "<td>$line[no]</td>";
	#echo "<td class=\"AyahArabic2\">$line[teks_arab]</td>";
        echo "<td>$line[teks]</td>";
    echo '<td><a href="remove.php?no='.$line['no'].'">-x-</td>';
    echo '</tr>';
}
echo '<tbody>';
echo '</table>';
mysql_free_result($result);

}
mysql_close($link);
include('footer.php');
}  else header('location:'.$myURL); 

?>

