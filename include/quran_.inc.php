<!-- Quran SE -->
<?
if (defined('QSE_PN')) {
  $quranJS = QSE_BASE_URL . '&amp;file=quran.js';
} else {
  $quranJS = './quran.js.php';
} 

?>
<script type="text/javascript" src="<?=$quranJS?>">
</script>
<div class="CenterPanel">
<table width="700">
<tr><td class="qseMenubar">
<span> <?echo date('D, d M Y') . '<br/>'; ?> </span>
<?#php include('http://yse-uk.com/hijridate/hijridate.php'); ?><br />
<img src="<?=QSE_BASE_DIR?>/images/icon-bismillah-01.gif" alt=""/>
<b class="qseTitle">Web-based-Qur`an</b><br /> <center>
<a href="<?=QSE_BASE_URL?>&amp;<?=$clang?>"><?=_HOME?></a> |
<!--a href="<?//=QSE_BASE_URL?>&amp;m=random<?//=$clang?>"><?//=_RANDOM?></a> | -->
<a href="<?=QSE_BASE_URL?>&amp;m=index<?=$clang?>"><?=_QURANINDEX?></a> |
<!--a href="http://mitglied.lycos.de/diantn/?m=download"><?//=_DOWNLOAD?></a> | -->
<a href="<?=QSE_BASE_URL?>&amp;m=manual"><?="Petunjuk"?></a> |
<a href="<?=QSE_BASE_URL?>&amp;m=feedback<?=$clang?>"><?=_FEEDBACK?></a> |
<!--a href="<?=QSE_BASE_URL?>&amp;m=statistic<?=$clang?>"><?=_STATISTICS?></a> | -->
<a href="<?=QSE_BASE_URL?>&amp;m=about<?=$clang?>"><?=_ABOUT?></a></center> 
<!--a href="<?=QSE_BASE_URL?>&amp;m=admin<?=$clang?>">Admin </a> -->
<!--p class="Phrase" style="text-align: right;"><//?=sprintf(_AVAILABLETRANS, count($quranLanguage))?> </p-->
</td></tr>
<tr><td class="qseMain">
<?
switch ($m) { //!<
  case 'index':
  case 'checker':
    break;
  default : // require.
  #require_once (QSE_BASE_DIR . "include/querybox.inc.php");
    break;
}
?>
<?
ob_start();
$BLOCKCONTENT = '';

switch ($m) {
  case "checker":
  case "index" :
  case "about" :
  case "statistic" :
    require_once (QSE_BASE_DIR . "include/$m.inc.php");
    break;
  case "feedback" :
    require_once (QSE_BASE_DIR . "include/feedback.inc.php");
    print "<h2>$BLOCKNAME</h2>";
    print $BLOCKCONTENT;
    break;
  case "random" : ?><h2>Random Ayah</h2><?
    $fromQuranPhp = 1;
    require_once(QSE_BASE_DIR . "random.php");
    break;
  case "help" :
  case "main" :
    require_once (QSE_BASE_DIR . "include/querybox.inc.php");
    require_once (QSE_BASE_DIR . "include/search.inc.php");
    qs_search();
    break;
  case "manual" :
    require_once (QSE_BASE_DIR . "include/search.inc.php");
    qs_search();
    break;
  default : // nothing
    break;
} 
$MOUTPUT .= ob_get_contents();
ob_end_clean();
print $MOUTPUT;

if (count ($Error)) {
  print "\n<pre>\n";
  foreach ($Error as $v) {
    print htmlentities($v) . "\n";
  } 
  print "</pre>\n";
} 

?>
</td></tr></table>
</div>
<!-- end QuranSE -->
