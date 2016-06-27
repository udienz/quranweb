<?
  require_once QSE_BASE_DIR . 'download/input.inc.php';

    function downloadcomment () {
      GLOBAL $REMOTE_ADDR, $blogc, $MOUTPUT;

      # trim:
      foreach ($blogc as $k => $v) { if (is_string($v)) $blogc[$k] = trim ($v); }

      # only when name and message are filled:
      if ($blogc['Name'] == "name" 
          || $blogc['Name'] == "" 
	  || $blogc['Message'] == "message" 
	  || $blogc['Message'] == "") {
        $MOUTPUT .= "Please enter at least name and message.";
        return;
      }

      # purifying:
      if ($blogc['Home'] == "http://homepage" || $blogc['Home'] == "http://") 
        $blogc['Home'] = "";
      if ($blogc['Email'] == "email") $blogc['Email'] = "";
      if ($blogc['Location'] == "city, country") $blogc['Location'] = "";

      # put:
      $SQL = "
        INSERT INTO $blogc[table] 
        SET	item= '$blogc[item]', name = '$blogc[Name]', modified = NOW(),
        server ='$REMOTE_ADDR', 
        location = '$blogc[Location]',
		email='$blogc[Email]',
        home = '$blogc[Home]', 
        message = '$blogc[Message]'
      ";

      # run:
      if (!($result = mysql_query ($SQL))) {
        $MOUTPUT .=  mysql_error()."::$SQL";
      } else {
        $blogcSign=0;
        @mail ("diantn@yahoo.com", "Quran Feedback", $SQL."\n$_SERVER[REQUEST_URI]");
      }
      
      return 1;
    }
   
  function downloadform() {
    GLOBAL $MOUTPUT;
    $MOUTPUT .= '
<h2>Download</h2>
Please fill in this form before downloading:
<form action="" method="post"><table>
' . inputhidden('item', $_SESSION['item']) . ' 
<tr><td>Your Name: </td><td>' . inputtext('pform[Name]', $_SESSION['name']) . ' </td></tr>
<tr><td>Location: </td><td>' . inputtext('pform[Location]', $_SESSION['location']) . ' </td></tr>
<tr><td>Email: </td><td>' . inputtext('pform[Email]', $_SESSION['email']) . ' </td></tr>
<tr><td>Homepage: </td><td>' . inputtext('pform[Home]', $_SESSION['home']) . ' </td></tr>
<tr><td>Comment: </td><td>' . inputarea('pform[Message]', '', 5, 25) . ' </td></tr>
<tr><td><br/></td><td>' . inputbtn('submit', 'Submit') . '</td></tr>
</table>
</form>';

  }
?>
<?
  function downloaditems($dir) {
    
    $ddir = $dir;
    
    $handle = opendir($dir);
    $items = array();
    while ($file = readdir($handle)) {
      if (preg_match('/^quran\-(.+)\.zip$/', $file, $match)) {
        $items["$match[1]"] = filemtime("$dir/$file");
      }
    }
    asort ($items);
    reset ($items);
    
    return $items;
  }

  GLOBAL $MOUTPUT;
  if ($_REQUEST['item']) {
    $_SESSION['item'] = $_REQUEST['item'];
    if ($_REQUEST['pform']) $blogc = $_REQUEST['pform'];
    else $blogc = $_SESSION;
    
    if ($_REQUEST['submit'] || ($blogc['Name'] && $blogc['Message'])) {
      $blogc['table'] = 'listDownload';
      $_SESSION = array_merge($_SESSION, $_REQUEST['pform']);
    
      if (downloadcomment()) {
        #echo 
        $file = 'quran-'.$item.'.zip';
        require_once ('download/getof.php');
      }
      
    } else {
      downloadform();
    }
  } else {

/*
    $items['1.2'] = "Quran Search Engine 1.2";
    $items['translations'] = "Quran Translation Basic";
    $items['japanese'] = "Quran Translation Japanese";
    $items['images1'] = "Quran Arabic Script Images Pack 1";
    $items['images2'] = "Quran Arabic Script Images Pack 2";
    $items['images3'] = "Quran Arabic Script Images Pack 3";
    $items['images4'] = "Quran Arabic Script Images Pack 4";
    $items['images5'] = "Quran Arabic Script Images Pack 5";
    $items['images6'] = "Quran Arabic Script Images Pack 6";
*/
/*
    $olditems['1.1'] = "Quran Search Engine 1.1";
    $olditems['1.0'] = "Quran Search Engine 1.0";
*/


    $MOUTPUT .= "<h2>Download</h2>\n";
    $MOUTPUT .= "<ul>";
    $items = &downloaditems('download');
    foreach ($items as $k => $v) {
      $MOUTPUT .= "<li><a href=\"?m=download&amp;item=$k\">Quran-$k</a></li>\n";
    }
    $MOUTPUT .= "</ul>";


/*    
    $MOUTPUT .= "<h2>Old Items:</h2>\n";
    $MOUTPUT .= "<ul>";
    foreach ($olditems as $k => $v) {
        $MOUTPUT .= "<li><a href=\"?m=download&amp;item=$k\">$v</a></li>\n";
    }
    $MOUTPUT .= "</ul>";
*/

  } // else.
?>