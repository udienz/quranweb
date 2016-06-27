<?
if (!defined('__QImport_class_php')) {
  define ('__QImport_class_php', 1);

  /**
   * HISTORY
   * 2003.08.19 03:11:32  DiN Creation
   */

  class QImport {
    // required vars:
    var $translationPath;
    var $numOfVerses;
    var $sLink; 
    // running vars:
    var $language;
    var $ayahs = array();
    var $tenth_ayah = 0;
	
	var $ayahInit = '/^\[(\d+)\.(\d+).*\]/';
	var $surahInit = '/^\@/';

    function QImport(&$numOfVerses, $translationPath, &$DBLink)
    {
      $this->numOfVerses = &$numOfVerses;
      $this->translationPath = $translationPath;
      $this->sLink = &$DBLink;
    } 

    function CheckTranslationFile (&$theFile)
    {
      $numOfVerses = &$this->numOfVerses;
      $language = &$this->language;

      $surahId = 0;
      $verseId = 0;
      $total = 0; //!< initialisation.
      $ayahInit = $this->ayahInit;
      $surahInit = $this->surahInit;

      foreach ($theFile as $line) {
        $line = trim($line); 
        // if ($line[0] == '[' && $line[1] <= '9' && $line[1] > '0') {
        if (preg_match($ayahInit, $line, $matches)) { //!< start of verse is detected.
          $verseId++;
          $verse = $line;
		  $svid = $surahId + 1;
          if ($matches[1] != $svid) {
            print " $svid &lt;&gt; $matches[1]<br/>";
          } else if ($matches[2] != $verseId) {
            print " $svid:$verseId &lt;&gt; $svid:$matches[2]<br/>";
          } 
        } else if (preg_match($surahInit, $line)) {
          if ($verseId) {
            $surahId++;
            if ($numOfVerses[$surahId] < $verseId) {
              print "Surah $surah ($surahId) : $verseId <b><font color=red>&gt;</font></b> expected: $numOfVerses[$surahId]<br>";
            } else if ($numOfVerses[$surahId] > $verseId) {
              print "Surah $surah ($surahId) : $verseId <b><font color=red>&lt;</font></b> expected: $numOfVerses[$surahId]<br>";
            } 
            $total += $verseId;
          } 
          $surah = $line; //!< surah name.
          $verseId = 0;
        } else {
          if ($surahId && trim($line) != '')
            $verse .= " " . $line; // !< concat verse.
        } 

        $pline = $line; //!< previous line.
      } 
      if ($verseId) {
	  	$surahId++;
        if ($numOfVerses[$surahId] < $verseId) {
          print "Surah $surah ($surahId) : $verseId <b><font color=red>&gt;</font></b> expected: $numOfVerses[$surahId]<br>";
        } else if ($numOfVerses[$surahId] > $verseId) {
          print "Surah $surah ($surahId) : $verseId <b><font color=red>&lt;</font></b> expected: $numOfVerses[$surahId]<br>";
        } 
        $total += $verseId;
      } 
      $color = ($total != 6236)? "red":"";
      $ok = ($total != 6236)? "Error":"Ok";
      print "<b>Total Verses [$language] = <font color=\"$color\">$total <br>Checking $language $ok</font></b><br>";
    } //!< end function CheckTranslationFile

    /**
     * Check the completeness of translation.
     */
    function CheckQuran($language, $languageFilename)
    {
      $translationPath = &$this->translationPath;

      if (!file_exists("$translationPath/$languageFilename" . "text.txt")) {
        print "Error opening translation file for $language. Please unzip the translations.zip<br />";
        return ;
      } 

      $contents = file ("$translationPath/$languageFilename" . "text.txt");

      $this->language = &$language;
      $this->CheckTranslationFile ($contents);
      unset($contents);
      return 1;
    } // end CheckQuran

    function ImportTranslationFile (&$theFile)
    {
      $numOfVerses = &$this->numOfVerses;
      $language = &$this->language;
      $sLink = &$this->sLink;
      $tenth_ayah = &$this->tenth_ayah;
      $ayahs = &$this->ayahs;

	  $ayahInit = $this->ayahInit;
	  $surahInit = $this->surahInit;
	  
      $surahId = 0;
      $sno = $surahId + 1;
      $verseId = 0;
      $total = 0; //!< initialisation.
	  $id = 0;
      foreach ($theFile as $line) {
        $line = trim($line);
        #if ($line[0] == '[' && $line[1] <= '9' && $line[1] > '0') {
		if(preg_match($ayahInit, $line, $matches )) {
          if ($verseId > 0) { //!< there was previous verse, write it.
            // print $verseId." $verse<br>\n";
            $total++; $id++;
            $this->AddAyah ("('$id','$sno:$verseId','$sno','$verseId','" . addslashes(substr($verse, strpos($verse, "]") + 2)) . "')");
          } //!< end if
          $verseId++;
          $verse = $line;
		  $svid = $surahId + 1;
          if ($matches[1] != $svid) {
            print " $svid &lt;&gt; $matches[1]<br/>";
          } else if ($matches[2] != $verseId) {
            print " $svid:$verseId &lt;&gt; $svid:$matches[2]<br/>";
          } 
          $verse = $line; //!< new verse.
        } else if (preg_match($surahInit, $line)) {
          if ($verseId) {
            if ($verseId > 0) {
              $total++; $id++;
              $this->AddAyah ("('$id','$sno:$verseId','$sno','$verseId','" . addslashes(substr($verse, strpos($verse, "]") + 2)) . "')");
            } //!< end if
            $surahId++;
            $sno = $surahId + 1;
            if ($numOfVerses[$surahId] < $verseId) {
              print "Surah $surah ($surahId) : $verseId <b><font color=red>&gt;</font></b> $numOfVerses[$surahId]<br>";
            } else if ($numOfVerses[$surahId] > $verseId) {
              print "Surah $surah ($surahId) : $verseId <b><font color=red>&lt;</font></b> $numOfVerses[$surahId]<br>";
			  $id += $numOfVerses[$surahId]-$verseId; // jump.
            } else {
              print "Surah $surah ($surahId) : $verseId of $numOfVerses[$surahId]<br>";
            } //!< end if
            flush();
          } 
          $surah = $line; //!< surah name.
          $verseId = 0;
        } else {
          $verse .= " " . $line;
        } 
      } //!< end foreach 
      if ($verseId) {
        if ($verseId > 0) {
          $total++; $id++;
          $this->AddAyah ("('$id','$sno:$verseId','$sno','$verseId','" . addslashes(substr($verse, strpos($verse, "]") + 2)) . "')");
        } 
        $surahId++;
        $sno = $surahId + 1;
        if ($numOfVerses[$surahId] < $verseId) {
          print "Surah $surah ($surahId) : $verseId <b><font color=red>&gt;</font></b> $numOfVerses[$surahId]<br>";
        } else if ($numOfVerses[$surahId] > $verseId) {
          print "Surah $surah ($surahId) : $verseId <b><font color=red>&lt;</font></b> $numOfVerses[$surahId]<br>";
        } else {
          print "Surah $surah ($surahId) : $verseId of $numOfVerses[$surahId]<br>";
        } 
        flush();
      } //!< if ($verseId)
      if ($tenth_ayah) {
        $tenth_ayah = 0;
        $SQL = "INSERT INTO quran$language VALUES " . implode (",", $ayahs); 
        // print  $SQL."<br>";
        if (!mysql_query ($SQL, $sLink)) die (mysql_error($sLink));
        $ayahs = array();
      } 
      $color = ($total != 6236)? "red":"";
      $ok = ($total != 6236)? "Error":"Ok";
      print "<b>Total Verses [$language] = <font color=\"$color\">$total <br>Importing $language $ok</font></b><br>";
    } // end function ImportTranslationFile


    /**
     * Import Quran in selected language.
     */
    function ImportQuran($language, $languageFilename, $droptable)
    {
      GLOBAL $sLink, $translationPath;
      if (!file_exists("$translationPath/$languageFilename" . "text.txt")) {
        echo "Error opening translation file for $language. Please unzip the translations.zip<br />";
        return 0;
      } 

      if ($droptable) {
        $this->ExecSQL($this->DropSQL($language)) or die();
      } 

      $SQL = $this->CreateSQL ($language); 
      // echo $SQL."<br>";
      if (!mysql_query ($SQL, $sLink)) die (mysql_error($sLink));

      $contents = file ("$translationPath/$languageFilename" . "text.txt");
      $this->language = $language;
      $this->ImportTranslationFile ($contents);
      unset($contents);

      return 1;
    } // end ImportQuran
    /**
     * insert 10 ayah per query into table.
     */
    function AddAyah ($newayah)
    {
      $sLink = &$this->sLink;
      $ayahs = &$this->ayahs;
      $tenth_ayah = &$this->tenth_ayah;
      $language = &$this->language;

      $ayahs[] = $newayah;
      $tenth_ayah++;

      if ($tenth_ayah == 10) {
        $tenth_ayah = 0;
        $SQL = "INSERT INTO quran$language VALUES " . implode (",", $ayahs);
        if (!mysql_query ($SQL, $sLink)) die (mysql_error($sLink));
        $ayahs = array();
      } 
    } // end function AddAyah
    function ExecSQL($SQL)
    {
      if (!($result = mysql_query ($SQL))) {
        echo nl2br("$SQL\n" . mysql_error() . "\n");
        return false;
      } else {
        return $result;
      } 
    } 

    /**
     */
    function DropSQL($language)
    {
      return "DROP TABLE IF EXISTS quran$language";
    } 

    /**
     * SQL for table creation for the given language.
     */
    function CreateSQL($language)
    {
      return "CREATE TABLE `quran$language` (
      `id` int(5) NOT NULL auto_increment,
      `no` varchar(8) NOT NULL default '0',
      `no_sr` int(4) default NULL,
      `no_vr` int(4) default NULL,
      `teks` text,
      PRIMARY KEY (id),
      UNIQUE KEY no (no)
      ) TYPE=MyISAM";
    } // end function CreateSQL
    function WriteConfig() // STATIC
    {
      // see the request form
      $myURL = $_REQUEST['myURL'];
      $sServer = $_REQUEST['sServer'];
      $sDB = $_REQUEST['sDB'];
      $sUser = $_REQUEST['sUser'];
      $sPass = $_REQUEST['sPass'];

      $fileHandle = fopen ("config.php", "w+");
      if (!$fileHandle) {
        die ("Set the permission of config.php to 766.");
      } 
      // write the config.php:
      fwrite ($fileHandle, 
        // ------ start config.php ------
        '<?
    $myURL = "' . $myURL . '";
    $sDB = "' . $sDB . '";
    $sUser = "' . $sUser . '";
    $sServer = "' . $sServer . '";
    $sPass = "' . $sPass . '";
    if (!$sLink) {
      $sLink = @mysql_connect($sServer, $sUser, $sPass);
      if (!mysql_select_db($sDB)) echo ("Could not select database");
    }
    if (!$sLink) echo ("Could not connect to the database");
    ?>'); 
      // ------ end config.php ------
      fclose ($fileHandle); //!< close config.php
      
    } // end function WriteConfig
  } // end class QImport
} // end define __Qimport_class_php

?>
