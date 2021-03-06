<? 
// languages:
$LANGUAGE["Indonesia"] = 'id';
$LANGUAGE["Albanian" ] = 'al';
$LANGUAGE["Bosnian" ] = 'bo';
$LANGUAGE["Dutch" ] = 'nl';
$LANGUAGE["English" ] = 'en'; //!< this is yusuf ali's translation
$LANGUAGE["EnglishShakir" ] = 'en2'; //!< this is yusuf ali's translation
$LANGUAGE["EnglishQaribullah" ] = 'en3'; //!< this is yusuf ali's translation
$LANGUAGE["German" ] = 'de';
$LANGUAGE["French" ] = 'fr';
$LANGUAGE["Japanese" ] = 'jp';
$LANGUAGE["Spanien" ] = 'sp';
$LANGUAGE["Italian" ] = 'it';
$LANGUAGE["Swahili" ] = 'sw';
$LANGUAGE["Arabic" ] = 'ar';
$LANGUAGE["Latin" ] = 'ltn';

$quranLanguage = qs_fetch_translations();
// spacial language settings:
$lgSetting['ar'] = array ('f' => 'traditional arabic', 'a' => 'right', 's' => '22pt');
$lgSetting['jp'] = array ('f' => 'minchow', 'a' => 'right', 's' => '20pt');

?>
<?
function qs_fetch_languages ()
{
  GLOBAL $LANGUAGE;
  $SQL = "show tables like 'quran%'";
  $result = mysql_query($SQL);
  $nlang = mysql_num_rows($result);
  $quranLanguage = array();
  for ($it = 0;$it < $nlang;$it++) {
    list($language) = mysql_fetch_row($result);
    $language = substr($language, 5);
    $quranLanguage[$LANGUAGE[$language]] = $language;
  } 
  $quranLanguage['id'] = "Indonesia";
  $quranLanguage['en'] = "English";
  $quranLanguage['ar'] = "Arabic";
  $quranLanguage['ltn'] = "Latin";
  return $quranLanguage;
} 

function qs_fetch_translations()
{
  $quranLanguage = qs_fetch_languages();
  unset($quranLanguage['ltn']);
  unset($quranLanguage['ar']);

  return $quranLanguage;
} 

function qs_language_selector($name, $value, $multi = false)
{
  GLOBAL $quranLanguage;

  ?>
<select name="<?=$name?>">
<?
  foreach ($quranLanguage as $code => $language) {
    if ($value == $code) $selected = " selected=\"selected\"";
    else $selected = '';
    print "<option value=\"$code\"$selected>$language</code>\n";
  } 

  ?>
</select>
<?
} 

function qs_language_font($lang)
{
  GLOBAL $lgSetting;

  $lgSet = $lgSetting[$lang];
  if ($lgSet) {
    return "font-size: $lgSet[s]; font-family:$lgSet[f]; text-align: $lgSet[a]; ";
  } else {
    return "";
  } 
} 

?>
