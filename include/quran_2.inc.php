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

<TABLE ALIGN="center" WIDTH="783" BORDER="0" CELLPADDING="0" CELLSPACING="0">
	<TR>
		<TD><IMG SRC="images/headerleft1.gif" WIDTH=53 HEIGHT=64 ALT=""></TD>
		<TD><IMG SRC="images/headerleft2.gif" WIDTH=34 HEIGHT=64 ALT=""></TD>
		<TD BACKGROUND="images/headercenter.gif"WIDTH=100%>&nbsp;</TD>
		<TD><IMG SRC="images/headerright2.gif" WIDTH=34 HEIGHT=64 ALT=""></TD>
		<TD><IMG SRC="images/headerright1.gif" WIDTH=53 HEIGHT=64 ALT=""></TD>
	</TR>
	<TR>
		<TD WIDTH=53 HEIGHT=34 ><IMG SRC="images/headerleft3.gif" WIDTH=53 HEIGHT=34 ALT=""></TD>
		<TD>&nbsp;</TD>
		<TD>&nbsp;</TD>
		<TD>&nbsp;</TD>
		<TD WIDTH=53 HEIGHT=34 ><IMG SRC="images/headerright3.gif" WIDTH=53 HEIGHT=34 ALT=""></TD>
	</TR>
	<TR>
		<TD BACKGROUND="images/bodyleft.gif" HEIGHT=100 VALIGN="TOP"><IMG SRC="images/bodyleft.gif"  ALT=""></TD>
		<TD>&nbsp;</TD>
		<TD>
			<!-- START -->
			<TABLE WIDTH=100% BORDER=0 CELLPADDING=0 CELLSPACING=0 >
				<TR>
					<TD COLSPAN=3>
						<TABLE ALIGN="CENTER" BORDER=0 CELLPADDING=0 CELLSPACING=0 >
						<TR>
							<TD>&nbsp;<IMG SRC="images/logo.gif"></TD>
						</TR>
						</TABLE>
					</TD>
				</TR>
				<TR>
					<TD WIDTH=102 HEIGHT=36><IMG SRC="images/menuleft.gif"></TD>
					<TD WIDTH=100% BACKGROUND="images/menucenter.gif">
						<CENTER>
							<a href=""><?/*=QSE_BASE_URL?>&amp;<?=$clang?>"><?=_HOME?></a> | 
							<a href="<?=QSE_BASE_URL?>&amp;m=index<?=$clang?>"><?=_QURANINDEX?></a> | 
							<a href="<?=QSE_BASE_URL?>&amp;m=about<?=$clang?>"><?=_ABOUT?></a> | 
							<a href="<?=QSE_BASE_URL?>&amp;m=feedback<?=$clang?>"><?=_FEEDBACK?></a> |
							<a href="<?=QSE_BASE_URL?>&amp;m=about<?=$clang?>"><?=_ABOUT*/?></a>
						</CENTER>
					</TD>
					<TD WIDTH=102 HEIGHT=36><IMG SRC="images/menuright.gif"></TD>
				</TR>
				<TR>
					<TD COLSPAN=3>


<!--
<div class="CenterPanel">
<table width="700">
<tr><td class="qseMenubar">
<img src="<?#=QSE_BASE_DIR?>/images/icon-bismillah-01.gif" alt=""/>
<b class="qseTitle">Qur`an Search Engine SE</b><br /> 
<a href="<?#=QSE_BASE_URL?>&amp;<?#=$clang?>"><?#=_HOME?></a> |
<a href="<?#=QSE_BASE_URL?>&amp;m=random<?#=$clang?>"><?#=_QURANINDEX?></a> |
<a href="http://mitglied.lycos.de/diantn/?m=download"><?#=_DOWNLOAD?></a> |
<a href="<?#=QSE_BASE_URL?>&amp;m=feedback<?#=$clang?>"><?#=_STATISTICS?></a> |
<a href="<?#=QSE_BASE_URL?>&amp;m=about<?#=$clang?>"><?#=_ABOUT?></a>
<p class="Phrase" style="text-align: right;"><?#=sprintf(_AVAILABLETRANS, count($quranLanguage))?> </p>
</td></tr>
<tr><td class="qseMain"> -->
<? /*
switch ($m) { //!<
  case 'index':
  case 'checker':
    break;
  default : // require.
    require_once (QSE_BASE_DIR . "include/querybox.inc.php");
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
    print "<h2>$BLOCKNAME</h2>";
    print $BLOCKCONTENT;
    break;
  case "random" : ?><h2>Random Ayah</h2><?
    $fromQuranPhp = 1;
    require_once(QSE_BASE_DIR . "random.php");
    break;
  case "help" :
  case "main" :
    require_once(QSE_BASE_DIR . "include/search.inc.php");
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
 */
?>
<!--/td></tr></table>
</div-->

					</TD>
				</TR>
			</TABLE>
			<!-- END -->
		</TD>
		<TD>&nbsp;</TD>
		<TD BACKGROUND="images/bodyright.gif" HEIGHT=100 VALIGN="TOP"><IMG SRC="images/bodyright.gif" ALT=""></TD>
	</TR>
	<TR>
		<TD><IMG SRC="images/footerleft3.gif" WIDTH=53 HEIGHT=34 ALT=""></TD>
		<TD>&nbsp;</TD>
		<TD><p><center>Copyleft&copy;Depkominfo</center></p></TD>
		<TD>&nbsp;</TD>
		<TD><IMG SRC="images/footerright3.gif" WIDTH=53 HEIGHT=34 ALT=""></TD>
	</TR>
	<TR>
		<TD><IMG SRC="images/footerleft1.gif" WIDTH=53 HEIGHT=64 ALT=""></TD>
		<TD><IMG SRC="images/footerleft2.gif" WIDTH=34 HEIGHT=64 ALT=""></TD>
		<TD BACKGROUND="images/footercenter.gif"WIDTH=100%>&nbsp;</TD>
		<TD><IMG SRC="images/footerright2.gif" WIDTH=34 HEIGHT=64 ALT=""></TD>
		<TD><IMG SRC="images/footerright1.gif" WIDTH=53 HEIGHT=64 ALT=""></TD>
	</TR>
</TABLE>

<!-- end QuranSE -->
