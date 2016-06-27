<body style="background-color: #eeeeee;">
<?
if (defined('LOADED_AS_MODULE')) { // !< as pn module
  define ('QSE_BASE_DIR', './modules/QuranSE/');
  define ('QSE_BASE_URL', './modules.php?op=modload&amp;name=QuranSE&amp;file=' . $file);
  define ('QSE_PN', 1);
} else {
  define ('QSE_BASE_DIR', './'); //!< stand alone.
  define ('QSE_BASE_URL', $myURL . '?');
} 

require QSE_BASE_DIR . 'include/tools.inc.php';

if ($_REQUEST['tool']) {
  print "<hr/>\n";
  require QSE_BASE_DIR . 'include/' . $_REQUEST['tool'] . '.inc.php';
} 

?>
</body>
