<?
define ('QSE_BASE_DIR', './');

require_once (QSE_BASE_DIR . "include/translations.inc.php"); //!< translation table: $lang => $file
require_once (QSE_BASE_DIR . "include/QImport.class.php"); //!< import functions.

$lang = &$_REQUEST['lang'];
$import = &$_REQUEST['import'];
$option = &$_REQUEST['option'];
$droptable = &$_REQUEST['droptable'];
$checklang = &$_REQUEST['checklang'];

if ($import == "submit") {
  QImport :: WriteConfig(); //!< rewrite config on submit
} 

set_time_limit (1000);
require (QSE_BASE_DIR . "config.php"); //!< read.
if ($sLink) { // !< else, there is a connection.
  $DBINFO = "<font color=\"blue\">Database connection established</font><br>";
} 

if (!$import || !count($checklang)) {
  require_once (QSE_BASE_DIR . "include/importform.inc.php"); //!< display the form.
  
} else {
  // there is import request, then continue..
  require_once (QSE_BASE_DIR . "include/surah.inc.php"); //!< surah names
  require_once (QSE_BASE_DIR . "include/ayah.inc.php"); //!< number of ayahs in each surah
  if (count($checklang)) { // !< there is checked language to import.
    $importer = new QImport($surahs, $translationPath, $sLink);
    foreach ($checklang as $languageFilename => $selectedLanguage) {
      if ($selectedLanguage != "") {
        echo "<br><b>Processing Quran in $languageFilename => $selectedLanguage</b><br>";
        flush();
        $language = $selectedLanguage;

        switch ($option) {
          case "import":
            $importer -> ImportQuran($language, $languageFilename, $_REQUEST['droptable']);
            break;

          case "check":
            $importer -> CheckQuran($language, $languageFilename);
            break;

          default:
            echo "No option selected<br>";
            break;
        } 
      } 
    } //!< end foreach
  } else {
    echo "No requested quran language to import.";
  } // end if count
} 

?>
</body>
</html>
