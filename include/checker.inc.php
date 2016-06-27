<?
require QSE_BASE_DIR . 'config.php';
require QSE_BASE_DIR . 'include/ayah.inc.php';
require QSE_BASE_DIR . 'include/surah.inc.php';
require QSE_BASE_DIR . 'include/QSearch.class.php';

GLOBAL $quranLanguage;

$quranLanguage = qs_fetch_languages();

?>
<h2>Quran Checker</h2>
Select Quran language to check: <br/>
<form action="" method="post">
<?qs_language_selector('check', $_REQUEST['check']);

?>
<input type="submit" value="Check" />
</form>
<?

if ($_REQUEST['check'] == 'all') {
  set_time_limit(1000);
  foreach ($quranLanguage as $code => $lang) {
    qs_check_quran($code);
  } 
} else if ($_REQUEST['check']) {
  set_time_limit(1000);
  qs_check_quran($_REQUEST['check']);
} 

print_logs();

?>
<?

function qs_check_quran($lang)
{
  GLOBAL $quranLanguage;
  if ($quranLanguage[$lang] == '') {
    print 'Invalid language!<br/>';
    return;
  } 

  print "<hr/>Checking Quran <b>$quranLanguage[$lang]</b>:<br/>";

  GLOBAL $surahs; //!< in ayah.inc.php
  foreach ($surahs as $sr => $nvr) {
    qs_check_surah($sr, $nvr, $lang);
  } 
  print "<br/>Done!";
} 

function qs_check_surah($sr, $nvr, $lang)
{
  GLOBAL $quranLanguage;

  $ok = _OK;
  for ($vr = 1;$vr <= $nvr;$vr++) {
    if (QSearch::getVerseId($sr, $vr, $lang) == 0) {
      print _MISSINGVERSE . " [$sr:$vr]<br/>\n";
      $ok = '<b style="color: red;"' . _ERROR . "</b>";
    } 
  } 
  // one more thing:
  $res = QSearchPrivate::ExecSQL("SELECT COUNT(*) FROM `quran$quranLanguage[$lang]` WHERE no_sr='$sr'");
  list($nayah) = mysql_fetch_row($res);
  if ($nayah != $nvr) {
    print _INVALIDNUMBEROFVERSE ._SURAH . " ($sr) " . _FOUND . ": $nayah, " . _EXPECTED . ": $nvr<br/>\n";
    $ok = '<b style="color: red;">' . _ERROR . "</b>";
  } 

  print "Surah $sr: $ok; <br/>\n";
  flush();
} 

?>