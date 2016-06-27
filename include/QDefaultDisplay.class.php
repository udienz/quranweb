<?
if (!defined('__QDefaultDisplay_CLASS_PHP')) {
  define('__QDefaultDisplay_CLASS_PHP', 1);
  require QLIB_DIR . 'QDisplay.class.php';

  /**
   * Default Mode Display
   */
  class QDefaultDisplay extends QDisplay {
    function show()
    {
      GLOBAL $reciteURL, $imagesURL, $_SESSION, $myURL;
      GLOBAL $lgSetting;

      $qs = &$this->qs;
      $result = $qs->getResult(); //!< needed before calling getNumRows and getNextRow
      if (!$result) {
        print $qs->getSQL();
        print $qs->printErrorLog();
      } 

      $nRows = $qs->getNumRowsInPage();
      $lang = $qs->getLang();

      print $this->naviBar();
      print "\n<div><!-- Verse Display -->";

      for ($it = 0;$it < $nRows;$it++) {
        list ($no_sr, $no_vr, $teks, $latin, $arabic) = $qs->getNextRow();

        if ($qs->isLatinSearch()) {
          $this->bolding($latin);
        } else {
          $this->bolding($teks);
        } 

        $this->footnoteLink($teks, $lang);

        if ($qs->isShowArabic()) {
          print "\n<p class=\"Script\" style=\"text-align:right;\">" . "<img alt=\"$no_vr:$no_sr\" src=\"" . str_replace('%no_vr', $no_vr, str_replace('%no_sr', $no_sr, $imagesURL)) . "\" /></p>";
        } else {
          if ($no_vr == 1 && $no_sr != 1 && $no_sr != 9) {
            // !< all beginning of surah has bismillah, except surah 9. surah 1 has its own bismillah.
            $arabic = _BISMILLAH . "<br />$arabic";
          } 
          #print "\n<p class=\"AyahArabic\" style=\"" . qs_language_font('ar') . "\">$arabic</p>";
         print "<table width=608 ><tbody><tr><td><img src=\"" . QSE_BASE_DIR . "images/$no_sr/$no_sr"."_"."$no_vr.png\" style=\"border: none; align: right; float: right;\" /></td></tr></tbody></table>";
        } 

        if ($latin) {
          $latin = preg_replace ('/<u>((.(?!\<\/u\>))*.)<\/u>/', '<em>\\1</em>', $latin);
          #print "\n<p class=\"Latin\">$latin</p><img src=\"" . QSE_BASE_DIR . "images/audio.gif\" alt=\"audio\" style=\"border: none; float: right;\" onmouseover=\"document.getElementById('mpl').style.display='block'\" onmouseout=\"document.getElementById('mpl').style.display='none'\"/><a href=\"$reciteURL/$no_sr/$no_sr-$no_vr.mp3\">" . "<img src=\"" . QSE_BASE_DIR . "images/images.jpeg\" title=\"download\" style=\"border: none; float: right;\"/></a>";
          print "\n<p class=\"Latin\">$latin</p>";
        } 
        
        #$reciter = "<a href=\"$reciteURL?s=$no_sr&amp;f=$no_vr&amp;Reciter=1\">" . "<img src=\"" . QSE_BASE_DIR . "images/audio.gif\" alt=\"audio\" style=\"border: none; float: right;\"/></a>";
        #$reciter = "<a href=\"$reciteURL/$no_sr/$no_sr-$no_vr.mp3\">" . "<img src=\"" . QSE_BASE_DIR . "images/audio.gif\" alt=\"audio\" style=\"border: none; float: right;\"/></a>";
        
        $reciter = "<embed type=\"application/x-shockwave-flash\" src=\"{$myURL}mp3player.swf\" id=\"mpl\" name=\"mpl\" quality=\"high\" allowfullscreen=\"true\" flashvars=\"file=$reciteURL/$no_sr/{$no_sr}_{$no_vr}.mp3&amp;height=20&amp;width=100&amp;showdownload=true\" height=\"20\" width=\"100\" style=\"border: none; float: right; display:block;\">";
        #$reciter = "<embed type=\"application/x-shockwave-flash\" src=\"{$myURL}mp3player.swf\" id=\"mpl\" name=\"mpl\" quality=\"high\" allowfullscreen=\"true\" flashvars=\"file=$reciteURL/$no_sr/$no_sr-$no_vr.mp3&amp;height=20&amp;width=70\" height=\"20\" width=\"70\" style=\"border: none; float: right; display:block;\"/>";
        
        print "\n$reciter<p class=\"Teks\"><b>[$no_sr:$no_vr]</b> $teks </p>\n"; 
        #print "<p id=\"player\"><embed type=\"application/x-shockwave-flash\" src=\"$myURL/flash_mp3_player/mp3player.swf\" id=\"mpl\" name=\"mpl\" quality=\"high\" allowfullscreen=\"true\" flashvars=\"file=$reciteURL/$no_sr/$no_sr-$no_vr.mp3&amp;height=20&amp;width=120\" height=\"20\" width=\"120\"></p>";

        // display in other languages:
        $class = "OddLang";
        if (is_array($_SESSION['resultLang']))
          foreach ($_SESSION['resultLang'] as $resultLang) {
          if ($resultLang != $qs->getLang()) {
            print "<p class=\"$class\" style=\"" . qs_language_font($resultLang) . "\"\"><b>" . $qs->languages[$resultLang] . "</b>: " ;

            if ($lgSetting[$resultLang]) {
              print $qs->getVerseText($no_sr, $no_vr, $resultLang);
            } else {
              print $qs->getVerseText($no_sr, $no_vr, $resultLang);
            } 
            print "</p>\n";
            $class = ($class == "OddLang")? "EvenLang":"OddLang";
          } 
        } 
      } 
      print "</div><!-- end: Verse Display -->";
      print "<br/>";
      print $this->naviBar();
    } 
  } 
} 

?>
