<h2>Quran Image Checker</h2>
<a href="./index.php">back</a>
<hr size="1">
<?
  /**
   * Quran Search Engine Version 1.0
   * February 16, 2003
   * Author: Dian Tresna Nugraha <diantn@yahoo.com>
   * File name: images/check.image.php 
   * Description:
   * - Check existing image files againts expected surah and verse number.
   */
  chdir('..'); 
   
  define ('QSE_BASE_DIR' , './');
   
  require (QSE_BASE_DIR . 'include/ayah.inc.php'); //!< surah to number of verses mapping.
  $ext = 'png'; //!< original images were downloaded as GIFs. 
                //!< after procesed, they became PNGs.
  if ($id == "") {$id=0;}
  $nerr = 0;
  $nok = 0;
  for ($it=1;$it<=count($surahs);$it++) {
    $ok = 1;
    echo "Surah $it:";
    for ($jt=1;$jt<=$surahs[$it]; $jt++) {
      if (!file_exists (QSE_BASE_DIR . "images/$it/".$it."_$jt.$ext")) { 
        echo " $jt"; $ok &= 0; $nerr++;
      } else {
        $nok++;
      }
    }
    if ($ok) echo " Ok<br>";
    else echo " <font color=red>Error</font><br>";
	
	flush();
  }
  echo "<hr size=\"1\">";
  echo "Number of images found: $nok (<font color=blue>".(100*$nok/($nok+$nerr))."</font> %)<br>";
  echo "Number of images not found: $nerr (<font color=red>".(100*$nerr/($nok+$nerr))."</font> %)<br>";
  echo "Total Expected: ".($nok+$nerr)."<br>";
  
  chdir ('images');
?>
