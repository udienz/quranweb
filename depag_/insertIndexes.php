<?
  include "../config.php";
  file_exists('indexes.txt') or die ("Couldn't find required file indexes.txt");
  $quran = file("indexes.txt");

  $it=1001;
  
  if (!mysql_query ("DROP TABLE IF EXISTS indexIndonesia")) {
    die(mysql_error()."::DROP"); 
  }

  $SQL = "
    CREATE TABLE indexIndonesia (
    ID int(11) NOT NULL auto_increment,
    Deskripsi char(255) NOT NULL default '',
    Query char(100) NOT NULL default '',
    Kategori enum('Depag','Juz','Surah','Kunci') NOT NULL default 'Depag',
    PRIMARY KEY  (ID)
    ) TYPE=MyISAM";
  
  mysql_select_db ("quran");
  if (!mysql_query($SQL)) {
    echo mysql_error()."<br />";
  }
  echo "Inserting:";
  foreach ($quran as $ayah) {
    $text = explode ('|', $ayah);
    $SQL = "REPLACE INTO indexIndonesia SET Deskripsi= '".addslashes($text[0])."', Query='$text[1]', Kategori='Depag', ID=$it"; 
    if (!mysql_query ($SQL)) { 
         echo mysql_error(); 
         break;
    }
    $it++;
    if (0==($it%100)) {echo ".";flush();}
  }
?>
Done. Please back.
