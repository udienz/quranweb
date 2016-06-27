<? 
// Start timer:
list($TIMER1, $MTIMER1) = explode (' ', microtime());

$file = 'index';

if (defined('LOADED_AS_MODULE')) { // !< as pn module
  define ('QSE_BASE_DIR', './modules/QuranSE/');
  define ('QSE_BASE_URL', './modules.php?op=modload&amp;name=QuranSE&amp;file=' . $file);
  define ('QSE_PN', 1);
} else {
  define ('QSE_BASE_DIR', './'); //!< stand alone.
  define ('QSE_BASE_URL', $myURL . '?');
} 
// Debug functions in common.inc:
GLOBAL $mdbGlobal;
$mdbGlobal->Debug = $_REQUEST['Debug']; //!< 0: inactive, 1: active.

session_start(); //!< if not started, start one!

?>
<?
// Language file:
if (!isset($language)) {
    $language = 'eng';
    #$language = 'ina';
} 

require (QSE_BASE_DIR . "lang/$language.php");
require (QSE_BASE_DIR . "include/surah.inc.php");

$m = $_REQUEST['m'];
if (!$m) $m = 'main';

switch ($m) {
  case 'download':
    require QSE_BASE_DIR . 'download/download.inc.php';
    break;
} 

require "header.php";
require QSE_BASE_DIR . 'include/quran.inc.php';

list($TIMER2, $MTIMER2) = explode (' ', microtime());
#print "<p><small>Script completed in " . (($TIMER2 - $TIMER1) + ($MTIMER2 - $MTIMER1)) . " seconds.</small></p>";
require "footer.php";

?>
