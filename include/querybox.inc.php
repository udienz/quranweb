<div class="qseQuerybox">
<?
  require_once (QSE_BASE_DIR."include/surah.inc.php");
  require_once (QSE_BASE_DIR."lang/eng.php");
  qs_querybox();
?>
</div>
<?
function qs_querybox() {
  GLOBAL $_REQUEST;
  GLOBAL $quranLanguage;  //!< from surah.inc.php
  GLOBAL $surahNames; //!< from surah.inc.php
  
  $submit = $_REQUEST['submit'];
  $kata = $_REQUEST['kata'];
  $lang = $_REQUEST['lang'];
  $arabic = $_REQUEST['arabic'];
  $whole = $_REQUEST['whole'];
  $latin = $_REQUEST['latin'];
  $latin = "on";
  $lite = $_REQUEST['lite'];
  $istext = $_REQUEST['istext'];
  //$istext = "on";
  $search = $_REQUEST['search'];
  //$search = "latin";
  $surah = $_REQUEST['surah'];
  $page = $_REQUEST['page'];
  $display = $_REQUEST['display'];
  $Debug = $_REQUEST['Debug'];
  $advance = $_REQUEST['advance'];

  # ------------ query options -------------------- 

  $advanceChecked = ($advance == "on") ? ' checked="checked"':"";
  
  if ($submit && $kata == "") $kata = "1-";
  
  if ($lang=="") { //!< indonesian as default language ;)
    $lang = 'id';
  } 
  if ($lang=="jp") { #exception for japanese:
    $arabic = "on";
  } else if ($arabic != "on") {
    $arabic = "off"; //!< off image by default.
  }
  $arabicFont = ($arabic == "on")? "off":"on";

  if (!isset($whole)) $whole == "on";
  $wholeWordChecked  = ($whole == "on")? ' checked="checked"':"";
  $arabicChecked     = ($arabic == "on")? ' checked="checked"':"";  
  $arabicFontChecked = ($arabicFont == "on")? ' checked="checked"':"";  
  $latinChecked      = ($latin == "on")? ' checked="checked"':"";  
  $liteModeChecked   = ($lite == "on")? ' checked="checked"':"";
  
  if ($display == "") $display = "10";
  $display5Checked = ($display == "5") ? ' checked="checked"':"";
  $display10Checked = ($display == "10") ? ' checked="checked"':"";
  $display20Checked = ($display == "20") ? ' checked="checked"':"";

  
  $isNumberChecked   = ($istext == "off")? ' checked="checked"':"";  
  $isTextChecked     = ($istext == "off")? '':' checked="checked"';  

  //$search = "latin";
  if ($search == "latin") {
    $searchLatinChecked  = ' checked="checked"'; 
    $searchLanguageChecked = ""; 
  } else {
    $searchLatinChecked = ""; 
    $searchLanguageChecked  = ' checked="checked"'; 
  }
  
  
  if (isset($_REQUEST['resultLang'])) {
    $_SESSION['resultLang'] = $_REQUEST['resultLang'];
  } else {
    $_REQUEST['resultLang'] = $_SESSION['resultLang'];
  }
  
  # ------------ end query options -------------------- 
?>
<!-- start of our query box -->
<form name="querybox" id="querybox" method="post" action="<?=QSE_BASE_URL?>">
<table border="0" width="100%">
<tr><td colspan="2"><center>
Cari : <input class="textbox" type="text" name="kata" size="30" value="<?=htmlentities(stripslashes($kata))?>" />
di 
<select class="textbox" name="surah" size="1">
<?php
  $allselected = (($surah == "all") || ($surah == ""))? ' selected="selected"':"";
  echo "<option value=\"all\"$allselected>Semua Surah</option>";
  foreach ($surahNames as $surahKey => $surahName) {
     $surahselected = ($surahKey == $surah)? ' selected="selected"':"";
     echo "<option value=\"$surahKey\"$surahselected>$surahKey. $surahName</option>";
  }
?>
</select>
<!--input id="chkbox1" type="checkbox" name="advance" value="on" <?#=$advanceChecked?> onclick="javascript:showHide()"/>Mahir!-->
<br/>
<br/>
<input class="button" type="submit" name="submit" value="<?=_SEARCH?>" /></center>
</td></tr>


<script language="javascript">
    function showHide() {
    var adv = document.getElementById('chkbox1');
    if (adv.checked == true)
    {
        showAdvance();
    }
        else 
        showSimple();
    }
    
    function showSimple() {
        //var x = document.getElementById('simple');
        var y = document.getElementById('advance');
        //x.style.display = 'block';
        y.style.display = 'none';
    }

    function showAdvance() {
        //var x = document.getElementById('simple');
        var y = document.getElementById('advance');
        //x.style.display = 'none';
        y.style.display = 'block';
        }
</script>



<!--  SIMPLE / DEFAULT  OPTIONS BLOCK -->
<tr id="simple" style="display:<?= $_GET['adv']=='on'?'block':'none';?>;" valign="top"><td class="optionbox">
<? if ($Debug) echo "<input type=hidden name=\"Debug\" value=\"1\" />"; ?>
<? if ($page) echo "<input type=hidden name=\"page\" value=\"$page\" />"; ?>
<!--td class="optionbox" style="vertical-align: top;"-->

<?=_DISPLAYOPTIONS?><br/>

&nbsp;<?=_VERSESPAGE?>: <!--input class="textbox" type="text" name="display" value="<?//=(($display != "")?$display:10)?>" size="3" /--><br/>
<input type="radio" name="display" value="5" <?=$display5Checked?> />5
<input type="radio" name="display" value="10" <?=$display10Checked?> />10
<input type="radio" name="display" value="20" <?=$display20Checked?> />20<br/>
<input type="radio" name="search" value="latin" <?=$searchLatinChecked?> /><?=_ARABICLATIN?><br/>
</td>
</tr>
<!-- END OF SIMPLE / DEFAULT OPTIONS -->

<!--  FULL OPTIONS BLOCK -->

<tr id="advance" style="display:none;" valign="top"><td class="optionbox">
<?=_SEARCHOPTIONS?><br/>
<? if ($Debug) echo "<input type=hidden name=\"Debug\" value=\"1\" />"; ?>
<? if ($page) echo "<input type=hidden name=\"page\" value=\"$page\" />"; ?>
<input type="radio" name="search" value="latin"<?=$searchLatinChecked?> /><?=_ARABICLATIN?><br/>
<input type="radio" name="search" value="language"<?=$searchLanguageChecked?> /><?=_SELECTEDLANGUAGE?><br/>
<input type="checkbox" name="whole" value="on"<?=$wholeWordChecked?> /><?=_WHOLEWORD?><br/>
<br/></td>
<td class="optionbox" style="vertical-align: top;">

<?=_DISPLAYOPTIONS?><br/>

<table><tr><td>
&nbsp;<?=_VERSESPAGE?>: <!--input class="textbox" type="text" name="display" value="<?//=(($display != "")?$display:10)?>" size="3" /--><br/>
<input type="radio" name="display" value="5" <?=$display5Checked?> />5
<input type="radio" name="display" value="10" <?=$display10Checked?> />10
<input type="radio" name="display" value="20" <?=$display20Checked?> />20<br/>

<input type="checkbox" name="latin" value="on" <?=$latinChecked?> /><?=_ARABICLATIN?><br/>
</td>
</tr>

</table>
<!-- END OF FULL OPTIONS -->
</td>
</tr>
</table>
</form>
<!-- end of our query box -->
<? $table = "quran".$quranLanguage[$lang]; ?>
<?

} // end function qs_querybox

?>
