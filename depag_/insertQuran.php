<?
  /**
   * Quran Search Engine Version 1.0
   * February 16, 2003
   * Author: Dian Tresna Nugraha <diantn@yahoo.com>
   * File name: depag/quranIndonesia.update.php 
   * Prerequisities:
   * - Installation of quranIndonesia. 
   * Description:
   * - Update the quran with footnote text. 
   */
  chdir ("..");
 
  define (QSE_BASE_DIR,'./');
    
  include "include/surah.inc.php";
  include "include/ayah.inc.php";
  include "include/QImport.class.php";
  chdir ("depag");
  
  if(!file_exists('quranIndonesia.txt')) die ("File 'quranIndonesia.txt' is not found.");
  $lines = file("quranIndonesia.txt");
  $srno = 1; $vrno = 0; 
  
  echo "Checking...<br />";
  foreach ($lines as $line) {
    $text = explode ('|', $line);
    $number = explode (':', $text[0]);
    $vrno++;
    if ($srno < $number[0]) {
      echo "$surahNames[$srno]:".(($lastvr==$surahs[$srno])?"OK":"ERROR")."<br />\n";
      $srno++; 
    }
    $lastvr = $number[1];
  }
  echo "$surahNames[$srno]:".(($lastvr==$surahs[$srno])?"OK":"ERROR")."<br />\n";
  
  echo "Inserting...<br />";
  QImport::ExecSQL(QImport::DropSQL('Indonesia')) or die();
  QImport::ExecSQL(QImport::CreateSQL('Indonesia')) or die();
  
  $it=1;
  foreach ($lines as $line) {
    $line = trim($line);
    if ($line == '') {
      print "Warning: empty line after ["."$nt[0]:$nt[1]"."]<br/>\n";
    } else {
      $text = explode ('|', $line);
      $nt = explode (':', $text[0]);
      $SQL = 
      "REPLACE INTO quranIndonesia SET ".
      "id='$it', ".
      "no='$nt[0]:$nt[1]', ".
      "no_sr='$nt[0]', ".
      "no_vr='$nt[1]', ".
      "teks = '".addslashes($text[1])."'";
     
      QImport::ExecSQL ($SQL);
      $it++;
      if (0==($it%100)) {echo ".";flush();}
    }
  }
  
  # final check1: number:
  $result = QImport::ExecSQL("SELECT COUNT(*) FROM quranIndonesia");
  (($nrows = mysql_num_rows($result)) != 6236) 
    or die("Error: inserted = $nrows, expected 6236"); 
?>
Done. Please back.
