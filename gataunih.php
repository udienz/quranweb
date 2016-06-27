<?
include('config.php');


$nama = $_POST['blogc']['Name'];
$lokasi = $_POST['blogc']['Location'];
$email = $_POST['blogc']['Email'];
$message = $_POST['blogc']['Message'];
$kode = $_POST['blogc']['Kode'];
$img = $_POST['blogc']['Img'];

$secret = strrev(base64_decode($img));
//$charset = "abcdefhijkmnoprstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789";
//for ($i=0; $i<6; $i++)
    //$key .= $charset[(mt_rand(0,(strlen($charset)-1)))];
$jml = 0;
$bil = array (0,1,2,3,4,5,6,7,8,9);
for ($j=0; $j<6; $j++)
    if (in_array($secret[$j],$bil))
        $jml += (int)$secret[$j];
$p = (string)$jml.$kode;
$die($p);
if ((string)$jml != $kode) 
    header('location:'.$myURL.'?m=feedback&st=3');


if ($nama!='' && $lokasi!='' && $email!='' && $message!='')
{

$link = mysql_connect($sServer, $sUser, $sPass);

if (!$link)
    die ('tidak bisa terhubung dengan server data ' . mysql_error());

if (!mysql_select_db($sDB))
    die ('tidak bisa terhubung dengan basis data' . mysql_error());
$q = <<<SQLfeedback
INSERT INTO listFeedback (name, email, location, message) values ('$nama', '$lokasi','$email','$message') 
SQLfeedback;
$result = mysql_query($q);
mysql_close($link);
if(!$result)
   die("query error : $q " . mysql_error());
else
    header('location:'.$myURL.'?m=feedback&st=2');
    
    
}
else
header('location:'.$myURL.'?m=feedback&st=1');
?>
