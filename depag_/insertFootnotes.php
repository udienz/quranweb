<?
  include "../config.php";
  file_exists('footnote.txt') or die ("Couldn't find required file footnote.txt");
  $quran = file("footnote.txt");
  
  if (!mysql_query ("DROP TABLE IF EXISTS noteIndonesia")) {
    die(mysql_error()."::DROP"); 
  }

  $SQL = "
    CREATE TABLE noteIndonesia (
    id int(11) NOT NULL auto_increment,
    no int(11) default NULL,
    teks text,
    PRIMARY KEY  (id)
  ) TYPE=MyISAM";
  
  if (!mysql_query ($SQL)) {
    die(mysql_error()."::CREATE"); 
  }
  
  $it=0; //!< flushing the 'dots' 
  echo "Inserting:";
  foreach ($quran as $ayah) {
    $text = explode ('|', $ayah);
    $SQL = "INSERT INTO noteIndonesia SET teks = '".addslashes($text[1])."', no='$text[0]'"; 
    if (!mysql_query ($SQL)) { 
      echo mysql_error()."::$SQL::$ayah"; 
      break;
    }
    $it++;
    if (0==($it%100)) {echo ".";flush();}
  }
?>
Done. Please back.
