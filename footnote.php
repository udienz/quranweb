<? 
// Start timer:
list($TIMER1, $MTIMER1) = explode (' ', microtime());

$mySelf = 'index'; //!< obtain script name.

if (defined('LOADED_AS_MODULE')) { // !< as pn module
  define ('QSE_BASE_DIR', './modules/QuranSE/');
  define ('QSE_BASE_URL', './modules.php?op=modload&amp;name=QuranSE&amp;file=' . $mySelf);
  define ('QSE_PN', 1);
} else {
  define ('QSE_BASE_DIR', './'); //!< stand alone.
  define ('QSE_BASE_URL', $myURL . $mySelf . '?x=in');
} 
// Debug functions in common.inc:
GLOBAL $mdbGlobal;
$mdbGlobal->Debug = $_REQUEST['Debug']; //!< 0: inactive, 1: active.

session_start(); //!< if not started, start one!
?>
<?
require_once(QSE_BASE_DIR . "config.php");
require_once(QSE_BASE_DIR . 'include/QDisplay.class.php');

$noteTable['id'] = "noteIndonesia";
$no = $_REQUEST['no'];

if ($lang == "") $lang = "id";
if ($no == "") $no = 1;

$SQL = "SELECT teks FROM `$noteTable[$lang]` WHERE no=$no";
$result = mysql_query ($SQL);
if (!$result) die(mysql_error());
list ($teks) = mysql_fetch_row ($result);

// format footnote:
QDisplay :: footnoteLink($teks, $lang);

$TITLE = "Footnote $no";
$QURAN = "<p class=\"rOddLang\">$no: $teks</p>";
require_once(QSE_BASE_DIR . "include/randomframe.inc.php");

?>
