<?
    if ($_SERVER['HTTP_HOST'])
    $myURL = "http://$_SERVER[HTTP_HOST]/quranweb/";
    else 
    $myURL = "http://$_SERVER[SERVER_ADDR]:$_SERVER[SERVER_PORT]/quranweb/";

    $sDB = "quran";     // nama database
    $sUser = "quran";   // user database
    $sServer = "localhost";  //isi localhost jika web server dan db server berada pada mesin yg sama, jika tidak gunakan IP
    $sPass = "qur4n";   // password user quran pada mysql
    $mediaPath = dirname(__FILE__)."/media/";

    if (!$sLink) {
      $sLink = @mysql_connect($sServer, $sUser, $sPass);
      if (!mysql_select_db($sDB)) echo ("Could not select database");
    }
    if (!$sLink) echo ("Could not connect to the database");
?>
