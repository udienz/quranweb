<?
  require_once (QSE_BASE_DIR.'include/surah.inc.php');
  require_once (QSE_BASE_DIR.'include/common.inc.php');
  require_once (QSE_BASE_DIR.'include/QSearch.class.php');
  require_once (QSE_BASE_DIR.'include/QDefaultDisplay.class.php');
  require_once (QSE_BASE_DIR.'include/QDisplay.class.php');
  require_once (QSE_BASE_DIR.'include/QLiteDisplay.class.php');
  require_once (QSE_BASE_DIR.'include/QNumbersDisplay.class.php');

  function do_search() { qs_search(); } //!< for backward compatibility.  

  function qs_search() {

    GLOBAL $quranLanguage; //!< in surah.inc
    $param = &$_REQUEST; 
    
    log_debug("qs_search()\n");
        

    $qs = new QSearch($param, $quranLanguage);
    $qs->init();

    if ($qs->getSearchWord() == '') {
        if ($_REQUEST['m']=='manual') {
                print _DIRECTION;
            }
            else {
                print _LITEDIRECTION;
                random();
            }
    } else {
	
      //print "Filter: <em style=\"color: blue;\">".$qs->getFilterStr()."</em><br/>";
      if ($qs->recordCount() == 0) {
         print "<p><br/><center><em style=\"color: red;\">"._NOMATCH."</em></center><br/></p>";      
         //print _DIRECTION;
         random();

      } else { // go to display.

        if ($qs->isVerseNumbersOnly()) {
          $qdisp = new QNumbersDisplay();
        } else if ($qs->isLiteSearch()) {
          $qdisp = new QLiteDisplay();
        } else {
          $qdisp = new QDefaultDisplay();
        }

        $qdisp->setQS($qs);        
        $qdisp->show();
		
		$qs->registerRequest(); 
		//!< put the request into database for statistical purpose.
      }
    }
    
    print print_logs();
  }

  function random() {
      //$sServer = 'localhost';
      //$sUser = 'waddh';
      //$sPass = 'w4ddh';
      // $sDB = 'quran';
      include ('config.php');

$link = mysql_connect($sServer, $sUser, $sPass);

if (!$link)
    die ('tidak bisa terhubung dengan server data ' . mysql_error());

if (!mysql_select_db($sDB))
    die ('tidak bisa terhubung dengan basis data' . mysql_error());
$q = <<<SQLrandom
SELECT no, teks, no_sr, no_vr, teks_arab FROM ayatPilihan order by rand() limit 1
SQLrandom;
$result = mysql_query($q);
if(!$result)
    die("query error : $q " . mysql_error());
if(mysql_num_rows($result) == 0)
    die("tidak ditemukan catatan kaki $bid");

$row=mysql_fetch_assoc($result);

mysql_free_result($result);
mysql_close($link);

$teks = $row['teks'];
QDisplay::footnoteLink($teks, $lang);
#print "\n<p class=\"AyahArabic\" >$row[teks_arab]</p>";

print "<div style=\"border:1px #73c27b solid; backgraound-color:#b6e6c6;\"><b><center>-ayat pilihan-</center></b>";
#print "\n<p style=\"font-size:22pt; text-align:center; font-weight:normal; background-color:#ccb76d; border-top:0px #999999 solid\">$row[teks_arab]</p>";
print "<table width=608 bgcolor=#ccb76d><tbody><tr><td><center><img src=\"" . QSE_BASE_DIR . "images/$row[no_sr]/$row[no_sr]"."_"."$row[no_vr].png\" style=\"border: none; align: center; \" /></center></td></tr></tbody></table>";
print "\n<p class=\"Teks\"><center>$reciter<b>[$row[no]]</b> $teks</center></p>\n";
print "</div>";

  }
?>
