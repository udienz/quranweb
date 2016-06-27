<?
include('config.php');
$nama = addslashes(strip_tags($_POST['blogc']['Name']));
$lokasi = addslashes(strip_tags($_POST['blogc']['Location']));
$email = addslashes(strip_tags($_POST['blogc']['Email']));
$message = addslashes(strip_tags($_POST['blogc']['Message']));
$kode = $_POST['blogc']['Kode'];
$img = $_POST['blogc']['Img'];

$secret = strrev(base64_decode($img));
$jml = 0;
$bil = array (0,1,2,3,4,5,6,7,8,9);
for ($j=0; $j<4; $j++)
    if (in_array($secret[$j],$bil))
        $jml += (int)$secret[$j];


if ($nama!='' && $lokasi!='' && $email!='' && $message!='' && $kode!='')
{
if ($kode!=$secret) {
    #die ('kode yang anda tuliskan salah');
    header('location:'.$myURL.'?m=feedback&st=3');    
    die;
}

$link = mysql_connect($sServer, $sUser, $sPass);

if (!$link) {
    header('location:'.$myURL.'?m=feedback&st=4');    
    die;
    //die ('tidak bisa terhubung dengan server data ' . mysql_error());
}

if (!mysql_select_db($sDB)) {
    header('location:'.$myURL.'?m=feedback&st=5');    
    die;
    //die ('tidak bisa terhubung dengan basis data' . mysql_error());
}

$q = <<<SQLfeedback
INSERT INTO listFeedback (name, location, email, message) values ('$nama', '$lokasi','$email','$message') 
SQLfeedback;

$result = mysql_query($q);
mysql_close($link);

if(!$result)
   die("query error : $q " . mysql_error());
else
    header('location:'.$myURL.'?m=feedback&st=2');    
}
else {
    header('location:'.$myURL.'?m=feedback&st=1');
}
?>
