<?

require_once (QSE_BASE_DIR . 'include/surah.inc.php');
require_once (QSE_BASE_DIR . 'include/common.inc.php');
require_once (QSE_BASE_DIR . 'include/QSearch.class.php');
require_once (QSE_BASE_DIR . 'include/QDisplay.class.php');

/**
 * 
 * @return a random integer value, 1 <= value <= $max
 */
function qs_random_id($max = _TOTALVERSES)
{
  list($usec, $sec) = explode(' ', microtime());
  srand((float) $sec + ((float) $usec * 100000));

  $random_id = 1 + rand() % $max;

  return $random_id;
} 

/**
 * 
 * @param  $resultLang array of language codes, specifying which translations are expected.
 */
function qs_random($resultLang, $base_url = '')
{
  GLOBAL $imagesURL; //!< in surah.inc
  GLOBAL $myURL; //!< in index.php
  GLOBAL $quranLanguage; //!< in surah.inc
  GLOBAL $_SERVER;

  $param = &$_REQUEST;
  $param['search'] = 'latin';

  $qs = new QSearch($param, $quranLanguage);
  $qs->init();

  log_debug ("qs_random()\n");

  if ($param['get']) { // !< request for random code direction
    if (!is_integer(strpos($base_url, 'http://'))) {
      $base_url = 'http://' . $_SERVER['SERVER_NAME'] . $_SERVER['PHP_SELF'] .
      substr($base_url, strpos($base_url, '?'));
    } 
	$base_url = str_replace('index', 'random', $base_url);

    print "
      <table border=\"0\" width=\"100%\"><tr><td>";
    print _RANDOMDIRECTION;
    $out = htmlentities('<iframe class="textbox" src="') . 
	uri_clear('m', $base_url) .
    htmlentities('" name="RandomQuran" width="100%" height="300">' . "\n" . '</iframe>'
      );
    print '<textarea name="getcode" rows="5" cols="55">' . $out . '</textarea>';
    print "</td></tr></table>";

    return; //!< stop
  } 
  // start random contents:
  ob_start();
  if ($param['qv']) { // !< request for specific surah/ayah
    list($no_sr, $no_vr) = explode (':', $param['qv']);
    if (!$no_sr) $no_sr = 1;
    if (!$no_vr) $no_vr = 1;

    $vid = $qs->getVerseId($no_sr, $no_vr);
  } else {
    // the $id is given by next/prev button in URL.
    if ($param['vid']) { // no defined id, define one.
      $vid = $param['vid'];
    } else {
      $vid = qs_random_id();
    } 
    list($no_sr, $no_vr) = $qs->getVerseNoById($vid);
  } 

  $pid = $vid-1;
  if ($pid < 1) $pid = 1;
  $nid = $vid + 1;
  if ($nid > _TOTALVERSES) $nid = _TOTALVERSES;

  print "
      <tr><td style=\"text-align: right;\">
      <img 
        src=\"" . str_replace('%no_vr', $no_vr, str_replace('%no_sr', $no_sr, $imagesURL)) . "\"
        alt=\"[$no_sr:$no_vr]\" />
      </td></tr>";

  print "
      <tr><td class=\"rLatin\">" . $qs->getVerseTextFromTable($no_sr, $no_vr, 'quranLatin') . "</td></tr>"; 
  // now foreach requested languages:
  $lid = 0;
  foreach ($resultLang as $lang) {
    $OddEven = ($lid % 2)?'Odd':'Even';
    $text = $qs->getVerseText($no_sr, $no_vr, $lang);
    QDisplay::footnoteLink($text, $lang);
    print "
      <tr><td class=\"r${OddEven}Lang\">$text</td></tr>";
    $base_url .= "&amp;resultLang[]=$lang";
    $lid++;
  } // end foreach.
  $contents = ob_get_contents();
  ob_end_clean();

  print "
      <form method=\"post\" action=\"\">
      <table border=\"0\" width=\"100%\">
      $contents
      <tr><td>Q.S $srtname[$no_sr] ($no_sr) : $no_vr 
      | <a href=\"$base_url\">Random</a> 
      | <a href=\"$base_url&amp;vid=$pid\">Prev</a> 
      | <a href=\"$base_url&amp;vid=$nid\">Next</a> 
      | <a href=\"$base_url&amp;get=1\">Get Your Own!!</a>
      </td></tr>
      </table>
      <table border=\"0\"><tr><td>
      <input type=\"hidden\" name=\"vid\" value=\"$vid\" />
      Quick ayah: 
      <input class=\"textbox\" type=\"text\" name=\"qv\" size=\"10\" value=\"$no_sr:$no_vr\" />
      <input type=\"submit\" value=\"Submit\" /></td></tr></table>
      </form>
    ";
} 

?>
