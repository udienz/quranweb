<!-- Quran SE -->
<?
if (defined('QSE_PN')) {
  $quranJS = QSE_BASE_URL . '&amp;file=quran.js';
} else {
  $quranJS = './quran.js.php';
} 

?>
<script type="text/javascript" src="<?=$quranJS?>">
</script>
<table align="center" border="0" cellpadding="0" cellspacing="0" width="783">
    <tbody><tr>
        <td><img src="images/headerleft1.gif" alt="" height="64" width="53"></td>
        <td><img src="images/headerleft2.gif" alt="" height="64" width="34"></td>
        <td background="images/headercenter.gif" width="100%">&nbsp;</td>
        <td><img src="images/headerright2.gif" alt="" height="64" width="34"></td>
        <td><img src="images/headerright1.gif" alt="" height="64" width="53"></td>
    </tr>
    <tr>
        <td height="34" width="53"><img src="images/headerleft3.gif" alt="" height="34" width="53"></td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td height="34" width="53"><img src="images/headerright3.gif" alt="" height="34" width="53"></td>
    </tr>
    <tr>
        <td background="images/bodyleft.gif" height="100" valign="top"><img src="images/bodyleft.gif" alt=""></td>
        <td>&nbsp;</td>
        <td>
            <!-- START -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody><tr>
                    <td colspan="3">
                        <table align="center" border="0" cellpadding="0" cellspacing="0">
                        <tbody><tr>
                            <td>&nbsp;<img src="images/logo.gif"></td>
                        </tr>
                        </tbody></table>
                    </td>
                </tr>
                <tr>
                    <td height="36" width="102"><img src="images/menuleft.gif"></td>
                    <td background="images/menucenter.gif" width="100%">
                        <? if ($m=="statistic") { ?>
                        <center>
                            <a href="admin/addayat.php">Ayat Pilihan</a> |
                            <a href=".?&m=statistic">Statistik</a> |
                            <a href="admin/tanggapan.php">Tanggapan</a> |
                            <a href="admin/editcontent.php">Arti</a> |
                            <a href="admin/audio.php">Audio</a> |
                            <a href="admin/password.php">Password</a> |
                            <a href="admin/logout.php">Logout</a>
                        </center>
                        <? } else { ?>
                        <center>
							<a href="<?=QSE_BASE_URL?>&amp;<?=$clang?>"><?=_HOME?></a> | 
							<a href="<?=QSE_BASE_URL?>&amp;m=index<?=$clang?>"><?=_QURANINDEX?></a> | 
							<a href="<?=QSE_BASE_URL?>&amp;m=manual<?=$clang?>"><?="Petunjuk"?></a> | 
							<a href="<?=QSE_BASE_URL?>&amp;m=feedback<?=$clang?>"><?=_FEEDBACK?></a> |
							<a href="<?=QSE_BASE_URL?>&amp;m=about<?=$clang?>"><?=_ABOUT?></a>
                        </center>
                        <? } ?>
                    </td>
                    <td height="36" width="102"><img src="images/menuright.gif"></td>
                </tr>
                <tr>
                    <td colspan="3">
<?
switch ($m) { //!<
  case 'index':
  case 'checker':
    break;
  default : // require.
  #require_once (QSE_BASE_DIR . "include/querybox.inc.php");
    break;
}
?>
<?
ob_start();
$BLOCKCONTENT = '';

switch ($m) {
  case "checker":
  case "index" :
  case "about" :
      case "statistic" :
    require_once (QSE_BASE_DIR . "include/$m.inc.php");
    break;
  case "feedback" :
    require_once (QSE_BASE_DIR . "include/feedback.inc.php");
    print "<p><h2>$BLOCKNAME</h2></p>";
    print $BLOCKCONTENT;
    break;
  case "random" : ?><h2>Random Ayah</h2><?
    $fromQuranPhp = 1;
    require_once(QSE_BASE_DIR . "random.php");
    break;
  case "help" :
  case "main" :
    require_once (QSE_BASE_DIR . "include/querybox.inc.php");
    require_once (QSE_BASE_DIR . "include/search.inc.php");
    qs_search();
    break;
  case "manual" :
    require_once (QSE_BASE_DIR . "include/search.inc.php");
    qs_search();
    break;
  default : // nothing
    break;
} 
$MOUTPUT .= ob_get_contents();
ob_end_clean();
print $MOUTPUT;

if (count ($Error)) {
  print "\n<pre>\n";
  foreach ($Error as $v) {
    print htmlentities($v) . "\n";
  } 
  print "</pre>\n";
} 

?>

<!--
<div class="CenterPanel">
<table width="700">
<tr><td class="qseMenubar">
<img src="/images/icon-bismillah-01.gif" alt=""/>
<b class="qseTitle">Qur`an Search Engine SE</b><br /> 
<a href="&amp;"></a> |
<a href="&amp;m=random"></a> |
<a href="http://mitglied.lycos.de/diantn/?m=download"></a> |
<a href="&amp;m=feedback"></a> |
<a href="&amp;m=about"></a>
<p class="Phrase" style="text-align: right;"> </p>
</td></tr>
<tr><td class="qseMain">
</td></tr></table>
</div-->
<br/>

                    </td>
                </tr>
            </tbody></table>
            <!-- END -->
        </td>
        <td>&nbsp;</td>
        <td background="images/bodyright.gif" height="100" valign="top"><img src="images/bodyright.gif" alt=""></td>
    </tr>
    <!--tr>
        <td><img src="images/bodyleft.gif" alt="" height="34" width="53"></td>
        <td>&nbsp;</td>
        <td style="text-align:bottom"><p><center>Depkominfo &copy; 2007</center></p></td>
        <td>&nbsp;</td>
        <td><img src="images/bodyright.gif" alt="" height="34" width="53"></td>
    </tr-->
    <tr>
        <td><img src="images/footerleft3.gif" alt="" height="40" width="53"></td>
        <td>&nbsp;</td>
        <td style="text-align:bottom"><p><center><b>Departemen Komunikasi dan Informatika <br/> Republik Indonesia</b></center></p></td>
        <td>&nbsp;</td>
        <td><img src="images/footerright3.gif" alt="" height="40" width="53"></td>
    </tr>
    <tr>
        <td><img src="images/footerleft1.gif" alt="" height="64" width="53"></td>

        <td><img src="images/footerleft2.gif" alt="" height="64" width="34"></td>
        <td background="images/footercenter.gif" width="100%">&nbsp;</td>
        <td><img src="images/footerright2.gif" alt="" height="64" width="34"></td>
        <td><img src="images/footerright1.gif" alt="" height="64" width="53"></td>
    </tr>
</tbody></table>
