<? 
// Start timer:
list($TIMER1, $MTIMER1) = explode (' ', microtime());

preg_match('/([\w|\.]+)\.php$/', $_SERVER['PHP_SELF'], $matches);
$mySelf = $matches[1]; //!< obtain script name.

if (defined('LOADED_AS_MODULE')) { // !< as pn module
  define ('QSE_BASE_DIR', './modules/QuranSE/');
  define ('QSE_BASE_URL', './modules.php?op=modload&amp;name=QuranSE&amp;file=' . $mySelf);
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
if (defined('QSE_PN')) {
    define(QSE_FOOTNOTE_BASE, './modules.php?op=modload&name=QuranSE&file=footnote&');
} else {
	define(QSE_FOOTNOTE_BASE, './footnote.php?');
}
?>
      function setFocus() {
        document.querybox.kata.focus();
        document.querybox.kata.select();
      }

      function footnote(lang, number){ 
        lebar = screen.width * 0.30;
        panjang = screen.height * 0.20;
      
        kiri = screen.width - lebar - 30; // - (lebar / 2);    
        atas = (screen.height * 0.5);
      
        child = window.open(
          '<?=QSE_FOOTNOTE_BASE?>lang='+lang+'&no='+number,
          'Footnote','toolbar=0,location=0,directories=0,status=0,menubar=0,scrollbars=1,resizable=0,width='
          +lebar+',height='+panjang+',left='+ kiri +',top='+atas
        );
        child.focus();
      }
