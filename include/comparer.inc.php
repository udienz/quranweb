<?
require QSE_BASE_DIR . 'config.php';
require QSE_BASE_DIR . 'include/ayah.inc.php';
require QSE_BASE_DIR . 'include/surah.inc.php';
require QSE_BASE_DIR . 'include/QImport.class.php';

GLOBAL $quranLanguage;

$quranLanguage = qs_fetch_languages();

?>
<h2>Quran Comparer</h2>
Select two different quran language:<br/>
<form action="" method="post">
<?qs_language_selector('lang1', $_REQUEST['lang1']);

?>
<?qs_language_selector('lang2', $_REQUEST['lang2']);

?>
<input type="submit" name="submit" value="Compare!" />
</form>
Tips: Quran on the right is compared to the left. Left side should be the most perfect one.

<?

if ($_REQUEST['submit']) {
  qs_compare($_REQUEST['lang1'], $_REQUEST['lang2']);
} 

/**
 * qs_compare()
 * 
 * @param  $lang1 
 * @param  $lang2 
 * @return 
 */
function qs_compare ($lang1, $lang2)
{
  GLOBAL $quranLanguage;

  $lang1 or $lang2 or die ('Unspecified language.');

  $T1 = 'quran' . $quranLanguage[$lang1];
  $T2 = 'quran' . $quranLanguage[$lang2];
  print "<hr/>Comparing between $T1 and $T2<br/>\n";

  $fields['id1'] = "$T1.id";
  $fields['sr1'] = "$T1.no_sr";
  $fields['vr1'] = "$T1.no_vr";
  $fields['tx1'] = "substring($T1.teks, 1, 10)";

  $fields['id2'] = "$T2.id";
  $fields['sr2'] = "$T2.no_sr";
  $fields['vr2'] = "$T2.no_vr";
  $fields['tx2'] = "substring($T2.teks, 1, 10)";
  foreach ($fields as $k => $v) {
    $fields[$k] = "$v `$k`";
  } 

  $result = QImport::ExecSQL("SELECT " . implode(', ', $fields) . "FROM  $T1 LEFT JOIN $T2 ON $T1.no = $T2.no " . "WHERE $T1.id <> $T2.id OR $T2.id IS NULL");

  if (!$result) {
  	return;
  }
  
  print "Total differences: " . mysql_num_rows($result) . "<br/><br/>\n";
  print "Compared fields:<br/>";
  print "| id | no_sr | no_vr<br/>";

  $nfields = mysql_num_fields($result);
  $nfhalf = $nfields / 2 ;
  $rowid=0;

  while ($row = mysql_fetch_row($result)) {
    for($it = 0;$it < $nfhalf - 1;$it ++) {
      if ($row[$it] == $row[$it + $nfhalf]) {
        print " | " . strip_tags($row[$it]) . ' = ' . strip_tags($row[$it + $nfhalf]);
      } else {
        print " | <b style=\"color: red;\">" . strip_tags($row[$it]) . '  &lt;&gt; ' . strip_tags($row[$it + $nfhalf]) . '</b>';
      } 
    } 
    print " | [" . strip_tags($row[$it]) . ' &lt;==&gt; ' . strip_tags($row[$it + $nfhalf]) . "]<br/>";
	
	if ($rowid%50) {
	    flush();
	}
	$rowid++;
  } 
} 

?>