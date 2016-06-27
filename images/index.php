<body bgcolor="#eeeeee">
<div align="right">
<?
  chdir ('..');
  
  define ('QSE_BASE_DIR', './');

  require ('config.php');
  require (QSE_BASE_DIR . 'include/surah.inc.php');
  require (QSE_BASE_DIR . 'include/ayah.inc.php');
  
  $surah = $_REQUEST['surah'];
  if ($surah == "") {$surah = 1;}
?>
Tool: <a href="./check.images.php">Check Image Availability</a><br /> 
Jump to surah: <?
  foreach ($surahs as $k => $v) {
    echo "<a href=\"./index.php?surah=$k\">$k</a>\n";
  }
?>
<hr size="1" />
<h2>Surah <?=$surahNames[$surah]?></h2>
<?
  if($surah != 1 && $surah != 9) 
    echo "<img src=\"1/1_1.png\" alt=\"bismillah\" title=\"bismillah\"><br />\n";
  for ($verse=1;$verse<=$surahs[$surah]; $verse++) {
    echo "<img src=\"${surah}/${surah}_${verse}.png\" alt=\"${surah}_${verse}\" title=\"${surah}_${verse}\"><br />\n";
  }
  
  chdir ('images');
?>
</div>
</body>
