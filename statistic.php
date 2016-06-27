<?

session_start();
include('config.php');

if (!$_SESSION['ISADMIN'])
    header('location'.$myURL);
else {
include('./admin/header.php');
?>

<h2>Pencarian Terbanyak</h2>
<br/>
<?
require 'include/QTableViewer.class.php';

$qview = new QTableViewer();
$qview->init();
$qview->setBaseUrl(QSE_BASE_URL . "&amp;m=statistic");

$selectSQL = &$qview->selectSQL;
$selectSQL->InitAll();
$selectSQL->AddTable('listRequest');
$selectSQL->AddField('request', _REQUEST);
$selectSQL->AddField("CONCAT('URL|[link]|".QSE_BASE_URL . "&amp;kata=', request, '&amp;lang=', lang,IF(latin='1', '&amp;search=latin', ''))", _LINK);
$selectSQL->AddField('lang', _LANGUAGE);
$selectSQL->AddField('MAX(result)', _RESULT);
$selectSQL->AddField('COUNT(request)', _HITS);
$selectSQL->AddField('MAX(modified)', _LASTACCESS);
$selectSQL->AddGroup(_LANGUAGE);
$selectSQL->AddGroup(_REQUEST);

if (!isset($_REQUEST['sftb'])) {
  $_REQUEST['sftb'] = 6; //!< _LASTACCESS
  $_REQUEST['srtb'] = 'desc';
}


$qview->update();
$qview->show();

print_logs();
/*
$MOUTPUT .= ob_get_contents();
ob_end_clean();
print $MOUTPUT;

if (count ($Error)) {
  print "\n<pre>\n";
  foreach ($Error as $v) {
    print htmlentities($v) . "\n";
  }
  print "</pre>\n";
}*/
include('./admin/footer.php');
}
?>
