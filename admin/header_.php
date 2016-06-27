<!-- Quran SE -->

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=windows-1256" />
    <meta http-equiv="expires" content="0" />
    <meta name="KEYWORDS" content="quran, qur'an, search engine, multi language" />
    <meta name="DESCRIPTION" content="Search quran qur'an different multi language, cari qur'an quran dalam berbagai bahasa" />
    <meta name="ROBOTS" content="INDEX, FOLLOW" />
    <meta name="author" content="Dian Tresna Nugraha, Portal-Muslim" />
    <meta name="copyright" content="" />
    <meta name="revisit-after" content="1 days" />
    <meta name="resource-type" content="document" />
    <meta name="distribution" content="Global" />
    <meta name="rating" content="General" />
    <link rel="shortcut icon" href="../favicon.ico" type="image/x-icon" />
    <link rel="stylesheet" href="../style.css" type="text/css" />
    <!--link rel="stylesheet" href="./images/style_002.css" type="text/css" /-->
    <link rel="stylesheet" href="../lib/ui/style.css" type="text/css" />
    <script language="JavaScript" src="../balloon.js" type="text/javascript"></script>
    <title>Qur`an Web</title>
  </head>
<body BGCOLOR="#FFFFFF" LEFTMARGIN="0" TOPMARGIN="0" MARGINWIDTH="0" MARGINHEIGHT="0" BACKGROUND="../images/bg.gif">

<? 
#include 'header.php';
if (defined('QSE_PN')) {
  $quranJS = QSE_BASE_URL . '&amp;file=quran.js';
} else {
  $quranJS = './quran.js.php';
} 

?>

<script type="text/javascript" src="<?=$quranJS?>">
</script>

<table align="center" border="1" cellpadding="0" cellspacing="0" width="783">
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
                        <center>
							<a href="<?=QSE_BASE_URL?>&amp;<?=$clang?>"><?=_HOME?></a> | 
							<a href="<?=QSE_BASE_URL?>&amp;m=index<?=$clang?>"><?=_QURANINDEX?></a> | 
							<a href="<?=QSE_BASE_URL?>&amp;m=about<?=$clang?>"><?=_ABOUT?></a> | 
							<a href="<?=QSE_BASE_URL?>&amp;m=feedback<?=$clang?>"><?=_FEEDBACK?></a> |
							<a href="<?=QSE_BASE_URL?>&amp;m=about<?=$clang?>"><?=_ABOUT?></a>
                            
                        </center>
                    </td>
                    <td height="36" width="102"><img src="images/menuright.gif"></td>
                </tr>
                <tr>
                    <td colspan="3">


                    </td>
                </tr>
            </tbody></table>
            <!-- END -->
        </td>
        <td>&nbsp;</td>
        <td background="images/bodyright.gif" height="100" valign="top"><img src="images/bodyright.gif" alt=""></td>
    </tr>
    <tr>

        <td><img src="images/footerleft3.gif" alt="" height="34" width="53"></td>
        <td>&nbsp;</td>
        <td><p></p><center>Copyleft©Depkominfo</center></td>
        <td>&nbsp;</td>
        <td><img src="images/footerright3.gif" alt="" height="34" width="53"></td>
    </tr>
    <tr>
        <td><img src="images/footerleft1.gif" alt="" height="64" width="53"></td>

        <td><img src="images/footerleft2.gif" alt="" height="64" width="34"></td>
        <td background="images/footercenter.gif" width="100%">&nbsp;</td>
        <td><img src="images/footerright2.gif" alt="" height="64" width="34"></td>
        <td><img src="images/footerright1.gif" alt="" height="64" width="53"></td>
    </tr>
</tbody></table>
<? include 'footer.php'; ?>
