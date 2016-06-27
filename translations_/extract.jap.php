NOTES: DO NOT CHANGE THIS FILE OR PROGRAM COULD BREAK DOWN
@KURUAN
œ"ß‚ ‚Ü‚Ë‚­œˆ¤[‚«ƒAƒbƒ‰[‚ÌŒä–¼‚É‚¨‚¢‚ÄB
 
  Extracted by:  Dian Tresna Nugraha
  Source: http://www.isuramu.net/kuruan/
  
  Notes:
  * @ = surah name (begin of sura)
  * $ = surah introduction
  * [sr.vr] = a verse

<?
/**
* The source was downloaded by wget (http://www.gnu.org/manual/wget/):
* >wget -m --convert-links --no-parent http://www.isuramu.net/kuruan/1.html
* 
* And this script should be put inside the same directory as downloaded 1.html file.
* 
* Run from the console (will overwrite existing japtext.txt):
* >php extract.jap.php > japtext.txt
*/

include 'ayah.inc.php'; //!< required.

$sr = 1;
foreach ($surahs as $sr => $vr) {
  $file = "$sr.html";
  qs_jp_extract_surah($file);
} 
function qs_jp_extract_surah($file)
{
  $contents = file($file);
  $nlines = count($contents);
  $it=0;
  while($it < $nlines) {
    $line = &$contents[$it++];
    if (preg_match('/\<font class\=\"jp_chapter_name\"\>(((.(?!\<))+).)/', $line, $matches)) { // !< surah name.
      $sr_name = $matches[1];
      if (preg_match('/^(\d+)\.\s+(.+)/', $sr_name, $matches)) {
        print "\n";
        $sr_no = $matches[1];
        $sr_name = $matches[2];
      } 
      print "@$sr_name\n";
    } else if (preg_match('/\<p\>\<a name\=\"(\d+)\"\>\d+\.\<\/a\>(.+)\<\/p\>$/', trim($line), $matches)) {
      print '[' . $sr_no . '.' . $matches[1] . ']' . $matches[2] . "\n";
    } else if (preg_match('/^\<p class\=\"jp_intro\"\>(.+)/', $line, $matches)) {
      $intro = $matches[1];
      while (!is_integer(strpos($contents[$it+1], 'a name'))) {
        $intro .= $contents[$it++];
      } 
	  print '$'.$intro;
    } 
  } 
} 

?>