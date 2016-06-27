<? 
// Start timer:
list($TIMER1, $MTIMER1) = explode (' ', microtime());

$file = 'random'; //!< obtain script name.

if (defined('LOADED_AS_MODULE')) { // !< as pn module
  define ('QSE_BASE_DIR', './modules/QuranSE/');
  define ('QSE_BASE_URL', './modules.php?op=modload&amp;name=QuranSE&amp;file=' . $file);
  define ('QSE_PN', 1);
} else {
  define ('QSE_BASE_DIR', './'); //!< stand alone.
  define ('QSE_BASE_URL', $myURL . '?x=in');
} 
// Debug functions in common.inc:
GLOBAL $mdbGlobal;
$mdbGlobal->Debug = $_REQUEST['Debug']; //!< 0: inactive, 1: active.

session_start(); //!< if not started, start one!


?>
<?

require_once (QSE_BASE_DIR . "lang/eng.php");
require_once (QSE_BASE_DIR . "include/random.inc.php"); 
// previous id:
$pid = $vid - 1;
if ($pid < 1) $pid = 1;
// next id:
$nid = $vid + 1;
if ($nid > 6236) $nid = 6236;

if ($fromQuranPhp) {
  $base_url = uri_replace('m', 'random', QSE_BASE_URL);
} else {
  $base_url = $_SERVER['PHP_SELF'] . '?';
} 

// collection of default result languages:
if ($_REQUEST['resultLang']) {
  $resultLang = &$_REQUEST['resultLang'];
} else {
  $resultLang[0] = 'id';
  $resultLang[1] = 'en';
  $resultLang[2] = 'de';
} 

ob_start();
qs_random($resultLang, $base_url);
$QURAN = ob_get_contents();
ob_end_clean();

ob_start(); //!< get errors.
print_logs();
$QURAN .= ob_get_contents();
ob_end_clean();

$TITLE = 'Quran Random Engine';
if (!$fromQuranPhp) {
  include QSE_BASE_DIR . "include/randomframe.inc.php";
} else {
  print $QURAN;
} 

?>
