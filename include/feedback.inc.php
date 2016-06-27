<?
    //include('../config.php');
    include('captcha_numbersV2.php');
  # blogctxt : Message's text
  # blogcrps : Message's response

  # settings:
  GLOBAL $Global, $BLOCKNAME, $BLOCKCONTENT, $jml;
  $blogc['table'] = "listFeedback";
  if ($NV == "") $NV = 10;
  $blogc['Error'] = array();
  $blogc['Date'] = date('YmdHis');

  $blogc['Name'] = $_POST['blogc']['Name'];
  $blogc['Location'] = $_POST['blogc']['Location'];
  $blogc['Email'] = $_POST['blogc']['Email'];
  $blogc['Message'] = $_POST['blogc']['Message'];

  if ($_GET['st']==1) echo '<p><h5><center>Form isian belum lengkap!</center></h5></p>';
  else if ($_GET['st']==2) echo '<p><h5><center>Tanggapan anda sudah terkirim!</center></h5></p>';
  else if ($_GET['st']==3) echo '<p><h5><center>Kode yg anda masukkan tidak benar!</center></h5></p>';
  else if ($_GET['st']==4) echo 'Tidak bisa terhubung dengan server data!';
  else if ($_GET['st']==5) echo 'Tidak bisa terhubung dengan basis data!';

  if ($_POST['blogc']['Submit']) { BlogComment::SubmitComment(); } 

  # block view:
  $BLOCKNAME = "Kirim Tanggapan";
  $BLOCKCONTENT .= BlogComment::SignInForm();
  //$BLOCKCONTENT .= BlogComment::ViewComments(1);
  //print_r($blogc); echo'<br/>';
  //print_r($_POST);
  unset ($blogc);
  if ($Global->Debug) { $Global->Error[] = "Remote Address = '$REMOTE_ADDR'"; }
?>
<?
  // BlogComment class, all static!
  class BlogComment {
    function &Navigator ($filter) {
      GLOBAL $Global, $NV, $blogc;

      if ($blogc['Ofs'] == "") $blogc['Ofs'] = 0;
      $SQL = " SELECT COUNT(rid) NMes FROM $blogc[table] WHERE '$filter'";
      if ($Global->Debug) $Global->Error[] = $SQL;
      $result = mysql_query ($SQL);
      if (!$result) $Global->Error[] = mysql_error()."::$SQL";
      else {
        list($NMes) = mysql_fetch_row ($result);
        $Nav = "Page:";
        for ($it=0;$it<$NMes;$it+=$NV) {
          $Page = $it/$NV+1;
          $Nav .= ($blogc[Ofs] != $it)?" <a href=\"$Global->MyURL&amp;sid=$Global->sid&amp;blogc[Ofs]=$it\">$Page</a>":" $Page";
        }
      }
      return $Nav;
    }

    function ViewComments($filter) {
      GLOBAL $Global, $NV, $blogc;

      $Nav = &BlogComment::Navigator($filter);

      // query for retrieving comments
      $SQL = "
        SELECT 
        rid,modified,server,name,location,email,
        if(home<>'' and home<>'none', 
	  concat('<a href=\"',home,'\" target=\"blank\"><img align=\"right\" src=\"gambar/home.gif\" alt=\"\" border=\"0\"></a>'),
	  '') home,
        if(private='1','[Private Message]',message) message,
        if(response<>'',concat('&gt; ',response),'') response,yid,icq,msn
        FROM $blogc[table] WHERE $filter 
        ORDER BY modified DESC LIMIT $blogc[Ofs], $NV";

      if ($Global->Debug) $Global->Error[] = $SQL;
      $result = mysql_query ($SQL);
      if (!$result) 
        $Global->Error[] = mysql_error()."::$SQL";
      else {
        $nrow = mysql_num_rows ($result);
        for ($it=0;$it<$nrow;$it++) {
          $blogcr = mysql_fetch_array($result);
          $eml = ($blogcr['email'] != "")?
                  "<a href=\"mailto:$blogcr[email]\"><b class=\"blogctxt\">$blogcr[name]</b></a>":
                  "<b class=\"blogctxt\">$blogcr[name]</b>";
          $cnt .= "<tr><td class=\"textbox\"><img src=\"gambar/bullet.gif\" alt=\"\"/> $blogcr[home] $eml, $blogcr[modified] <br /> ".nl2br($blogcr[message])."<p class=\"blogcrps\">".nl2br($blogcr[response])."</p></td></tr>";
        }
      }
    
      #<tr><td><b><font color=\"green\">Messages:</font></b></td><tr>
      // viewing block:
      $BLOCKCONTENT = "
      <table border=\"0\" width=\"100%\">
      <tr><td>$Nav</td></tr>
      $cnt
      </table>";
     
      return $BLOCKCONTENT;
    }

    function SubmitComment () {
      GLOBAL $blogc, $Global, $REMOTE_ADDR, $jml;
      //die('ini dipanggil kah?');

      # trim:
      foreach ($blogc as $k => $v) { if (is_string($v)) $blogc[$k] = trim ($v); }
      
      # only when name and message are filled:
      if ($blogc['Name'] == "name" 
          || $blogc['Name'] == "" 
	  || $blogc['Message'] == "message" 
	  || $blogc['Message'] == "") {
        $blogc['Error'][] = "Please enter at least name and message.";
        return;
      }
      if ($blogc['Kode'] != $jml)  { $blogc['Error'][] = "kode Penjumlahan salah"; return; }

      # purifying:
      if ($blogc['MSN'] == "msnID") $blogc['MSN'] = "";
      if ($blogc['ICQ'] == "ICQ") $blogc['ICQ'] = "";
      if ($blogc['Home'] == "http://homepage" || $blogc['Home'] == "http://") 
        $blogc['Home'] = "";
      if ($blogc['Email'] == "email") $blogc['Email'] = "";
      if ($blogc['Yahoo'] == "yahooID") $blogc['Yahoo'] = "";
      if ($blogc['Location'] == "city, country") $blogc['Location'] = "";

      # put:
      $SQL = "
        INSERT INTO $blogc[table] 
        SET	sid = '$blogc[Sid]', name = '$blogc[Name]', modified = '$blogc[Date]',
        server ='$REMOTE_ADDR', email = '$blogc[Email]', location = '$blogc[Location]',
        home = '$blogc[Home]', msn = '$blogc[MSN]', yid = '$blogc[Yahoo]',
        icq = '$blogc[ICQ]', private = '$blogc[Private]', message = '$blogc[Message]'
      ";

      # run:
      if (!($result = mysql_query ($SQL))) {
        $Global->Error[] =   mysql_error()."::$SQL";
      } else {
        $blogcSign=0;
        @mail ("admin@localhost", "Quran Feedback", $SQL."\n$Global->mainURL");
      }
    }

    function SignInForm () {
      GLOBAL $blogc, $Global, $jml;
      if (0 == count($blogc['Error'])) {
         $blogc['Name'] = "";
         $blogc['Location'] = "";
         $blogc['Email'] = "";
         $blogc['Home'] = "";
         $blogc['MSN'] = "";
         $blogc['Yahoo'] = "";
         $blogc['ICQ'] = "";
         $blogc['Message'] = "";
         $blogc['Error'] = "";
      } else {
          $blogc['Error'] = "<tr><td style=\"color: red;\">".implode ("<br />", $blogc['Error'])."</td></tr>";
      }
      $charset = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
      for ($i=0; $i<4; $i++)
          $key .= $charset[(mt_rand(0,(strlen($charset)-1)))];
          $jml = 0;
          $bil = array (0,1,2,3,4,5,6,7,8,9);
      for ($j=0; $j<6; $j++)
            if (in_array($key[$j],$bil))
            $jml += (int)$key[$j];
          
          $kode = base64_encode(strrev($key));
          
      // ask for sign:
      return "<br />
      <form method=\"post\" action=\"tanggapan.php\">
      <table width=\"100%\" border=\"0\">
      <tr><td colspan=2><b style=\"color: green;\">Pesan anda:</b></td></tr>$blogc[Error]
      <tr><td width=50>Nama : </td><td><input class=\"textbox\" type=\"text\" name=\"blogc[Name]\" value=\"$blogc[Name]\" /></td></tr>
      <tr><td>Lokasi : </td><td><input class=\"textbox\" type=\"text\" name=\"blogc[Location]\" value=\"$blogc[Location]\" /></td></tr>
      <tr><td>Email : </td><td><input class=\"textbox\" type=\"text\" name=\"blogc[Email]\" value=\"$blogc[Email]\" /></td></tr>
      <!--tr><td>Homepage : <input class=\"textbox\" type=\"text\" name=\"blogc[Home]\" value=\"$blogc[Home]\" /></td></tr>
      <tr><td>MSN : <input class=\"textbox\" type=\"text\" name=\"blogc[MSN]\" value=\"$blogc[MSN]\" /></td></tr>
      <tr><td>Yahoo : <input class=\"textbox\" type=\"text\" name=\"blogc[Yahoo]\" value=\"$blogc[Yahoo]\" /></td></tr>
      <tr><td>ICQ : <input class=\"textbox\" type=\"text\" name=\"blogc[ICQ]\" value=\"$blogc[ICQ]\" /></td></tr>
      <tr><td colspan=2><input class=\"textbox\" type=\"checkbox\" name=\"blogc[Private]\" value=\"1\" /> private message</td></tr-->
      <tr><td colspan=2>Pesan : <br/><textarea class=\"textbox\" name=\"blogc[Message]\" cols=\"40\" rows=\"3\">$blogc[Message]</textarea></td></tr>
      <tr><td colspan=2><img src=\"{$myURL}image.php?s=$kode\"/></td></tr>
      <tr><td colspan=2>Ketikkan kode yang ada pada gambar di atas:</td></tr>
      <tr><td colspan=2><input class=\"textbox\" type=\"text\" name=\"blogc[Kode]\" value=\"\" size=\"4\"/></td></tr>
      <tr><td colspan=2>
      <input type=\"hidden\" name=\"blogc[Sid]\" value=\"$Global->sid\" />
      <input type=\"hidden\" name=\"blogc[Submit]\" value=\"1\" />
      <input type=\"hidden\" name=\"blogc[Img]\" value=\"$kode\" />
      <input type=\"submit\" class=\"button\" name=\"blogc[btnSubmit]\" value=\"Kirim\" /></td></tr>
      </table>
      </form>";
    }
  } //!< end class BlogComment
?>
