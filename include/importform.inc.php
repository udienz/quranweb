<html>
<head>
<title>Qur'an Search Engine Installer</title>
</head>
<body bgcolor="#ddeeee">
<?=$DBINFO?>
<form method=post>
<h3>MySQL Settings</h3>
  <table border="0">
  <tr><td>URL: </td><td><input type=text name="myURL" size="40" value="<? 
  print ($myURL != '')?$myURL:'http://' . $_SERVER['SERVER_NAME'] . substr($_SERVER['PHP_SELF'], 0, strpos($_SERVER['PHP_SELF'], 'import.php'));
?>"><br></td></tr>
  <tr><td>Database Host: </td><td><input type=text size="40" name="sServer" value="<? echo $sServer?>"><br></td></tr>
  <tr><td>Database Name: </td><td><input type=text size="40" name="sDB" value="<? echo $sDB?>"><br></td></tr>
  <tr><td>Database User: </td><td><input type=text size="40" name="sUser" value="<? echo $sUser?>"><br></td></tr>
  <tr><td>Database Pass: </td><td><input type=text size="40" name="sPass" value="<? echo $sPass?>"><br></td></tr>
  </table>
<h2>Select Quran From <? echo count($importable) ?> Languages</h2>
<?
print '<em style="color: blue;">Please select language</em><br/>';
require_once ('include/translations.inc.php');
foreach ($importable as $key => $thelang) {
  echo "\n<input type=checkbox name=\"checklang[$key]\" value=\"$thelang\">$thelang<br>";
} 

preg_match('/(.+)\/import\.php$/', $_SERVER['PHP_SELF'], $match);

$myURL = "http://" . $_SERVER['SERVER_NAME'] . $match[1];

?>
<h3>Options</h3>
  <input type=radio  name="option" value="check">Check Integrity Only<br>
  <input type=radio  name="option" value="import" checked>Check and Import<br>
  <input type=checkbox  name="droptable" value="on" checked>Drop Table If Exists<br>
<hr size="1">
<input type=submit name="import" value="submit">
</form>

