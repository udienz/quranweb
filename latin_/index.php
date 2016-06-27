<?
function executeSQLs(&$sqlLines)
{
  GLOBAL $sServer, $sUser, $sDB;

  $uSQL = &$sqlLines;
  $SQLs = array();

  $ov = ""; // init.
  foreach ($uSQL as $k => $v) {
    echo ". ";
    $v = trim ($v); // trim 
    if ($v[0] != '#') { // not a comment
      if ($v[strlen($v)-1] == ';') { // check ended by ;
        $v = str_replace('$mDB', $mDB, $v);
        $SQLs[] = $ov . $v; // add to sql list
        $ov = ""; // reset ov.
      } else { // concat with previous sql.
        $ov .= $v;
      } 
    } 
  } 
  echo "\n";
  $it = 0;
  foreach ($SQLs as $k => $SQL) {
    $result = mysql_query ($SQL);
    if (!$result) echo "<br/>\n$k:" . mysql_error() . "<br/>\n$SQL\n";
    if (!(($it++) % 20)) {
      echo ". ";
      flush();
    } 
  } 
  unset($SQLs);
} 

function page1()
{

  ?>
1. Now, make sure that you edit the config.php file and sets the database variables<br/>
&nbsp;&nbsp;&nbsp;into the correct values according to the environment system.  <br/>
<?
} 

function page2()
{
  GLOBAL $sServer, $sUser, $sDB;

  ?>
2. Installation script now is trying to set up required tables into your database.<br/>
<?
  echo "Host: $sServer<br/>\n";
  echo "User: $sUser<br/>\n";
  echo "Database: $sDB<br/>\n";
  $mDBTable = array();
  $SQLs = array();
  @include_once("sqldata.php");

  foreach ($mDBTable as $name => $SQL) {
    echo "Creating table $name..";
    $result = mysql_query ($SQL);
    if (!$result) echo mysql_error() . "\n";
    else echo "<br/>\n";
    flush();
  } 
  // latin and listFeedback.
  $uSQL = array();
  $uSQL = array_merge($uSQL, file("listFeedback.sql"));
  $uSQL = array_merge($uSQL, file("quranLatin.sql"));
  executeSQLs($uSQL);
  unset($uSQL);
  unset($SQLs);
  // arabic quran:
  $uSQL = array();
  $uSQL = array_merge($uSQL, file("quranArabic.sql"));
  executeSQLs($uSQL);
  unset($uSQL);
  unset($SQLs);
  // arabic index:
  $uSQL = array();
  $uSQL = array_merge($uSQL, file("indexArabic.sql"));
  executeSQLs($uSQL);
  unset($uSQL);
} 

function page3()
{

  ?>
3. End of installation. Click next to go to homepage. <br/>
&nbsp;&nbsp;&nbsp;If there were errors during installation, it might be possible that <br/>
&nbsp;&nbsp;&nbsp;the system will not run properly.<br/>
<?
} 

foreach ($_GET as $k => $v) $$k = &$_GET[$k];
foreach ($_POST as $k => $v) $$k = &$_POST[$k];

include "../config.php";
?>
<? if ($page == "") $page = 1;
?>
<? if ($page == "4") header ("Location: ../index.php");
?>
<form method="post">
<p style="font-family: Courier; font-size:9pt;">
quranLatin Installation:<br/>
Click the next button when you are ready.<br/>
---------------------------------------- <br/>
<?
$pagefunc = "page$page";
$pagefunc();

?>
</p>
<input type="submit" name="next" value="Next"/>
<input type="hidden" name="page" value="<?=$page + 1?>"/>
</form>
