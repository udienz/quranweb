<?
if (!defined ('_dbe_form_php')) {
  define('_dbe_form_php', 1);
  require(MDB_DIR.'ui/lang/eng.php');
  require(MDB_DIR.'ui/input.inc.php');
  require(MDB_DIR.'dbe/tableinfo.inc.php');

  ############ Form: tambih/edit data #################
  function form_addedd(&$result) {
    GLOBAL $mdbGlobal, $TABLEINFO, $TABLERELATIONS;

    $selectSQL = get_full_select($TABLEINFO);
    $selectSQL->filters[] = "T0.rid = '$mdbGlobal->rid'";

    $result = $selectSQL->Execute();
    if(!$result) return;

    echo "
    <form method=\"post\" action=\"\">
    <table border=\"0\">";

    if ($mdbGlobal->rid != '') $VALUE = $result->FetchRow();
    $startfield = 3; // the first free field.
    $it=0;
    foreach ($TABLEINFO['columns'] as $field) {
      if ($startfield <= $it++)
      inputfield($field, $result, $VALUE[$field->name], $TABLEINFO, $TABLERELATIONS);
    }
    echo "
    <tr><td><br /></td><td>
    <input type=\"hidden\" name=\"w\" value=\"$mdbGlobal->w\" />
    <input type=\"hidden\" name=\"op\" value=\"$mdbGlobal->sw\" />"
    .(($mdbGlobal->Debug)?"
    <input type=\"hidden\" name=\"Debug\" value=\"$mdbGlobal->Debug\" />":"")."
    <input type=\"hidden\" name=\"rid\" value=\"$mdbGlobal->rid\" />
    <input type=\"hidden\" name=\"tid\" value=\"$mdbGlobal->tid\" />
    <input type=\"hidden\" name=\"ref\" value=\"".htmlentities(stripslashes($_SESSION[dbe_referer]))."\" />".
    "<input type=\"submit\" class=\"button\" name=\"bt\" value=\""._KINTUN."\" /> ".
    "<input type=\"submit\" class=\"button\" name=\"bt\" value=\""._TAMBIHKEUN."\" /> ".
    "<input type=\"submit\" class=\"button\" name=\"bt\" value=\""._BATAL."\" /></td></tr>
    </table>
    </form>
    ";
  }

  ############ Form: tambih data #################
  function form_add () {
    GLOBAL $TABLEINFO;
    echo "
    <h2>"._ADD."::$TABLEINFO[name]</h2>"; 
    form_addedd(&$result);
  }
  
  ############ Form: edit data #################
  function form_edd () {
    GLOBAL $TABLEINFO;
    echo "
    <h2>Form "._EDD."::$TABLEINFO[name]</h2>"; 
    form_addedd(&$result);
  }

  ############ Form: delete data #################
  function form_ded () {
    GLOBAL $mdbGlobal, $TABLEINFO;

    echo "
    <h2>"._DED."??</h2>  
    <form method=\"post\" action=\"\">
    <table border=\"0\">
    <tr>
      <td>
      <input type=\"hidden\" name=\"w\" value=\"$mdbGlobal->w\" />
      <input type=\"hidden\" name=\"op\" value=\"ded\" />".(($mdbGlobal->Debug)?"
      <input type=\"hidden\" name=\"Debug\" value=\"$mdbGlobal->Debug\" />":"")."
      <input type=\"hidden\" name=\"tid\" value=\"$mdbGlobal->tid\" />
      <input type=\"hidden\" name=\"rid\" value=\"$mdbGlobal->rid\" />
      <input type=\"hidden\" name=\"ref\" value=\"".htmlentities(stripslashes($_SESSION[dbe_referer]))."\" />
      <input type=\"submit\" name=\"bt\" class=\"button\" value=\""._MUHUN."\" /></td>
      <td><input type=\"submit\" name=\"bt\" class=\"button\" value=\""._BATAL."\" /></td></tr>
    </table>
    </form>
    ";
  }

  ############ Form: delete tabel #################
  function form_det () {
    GLOBAL $mdbGlobal, $TABLEINFO;

    echo "
    <h2>"._DET."::$TABLEINFO[name]??</h2>  
    <form method=\"post\" action=\"\">
    <table border=\"0\">
    <tr>
      <td>
        <input type=\"hidden\" name=\"w\" value=\"$mdbGlobal->w\" />
        <input type=\"hidden\" name=\"op\" value=\"det\" />
        <input type=\"hidden\" name=\"tid\" value=\"$mdbGlobal->tid\" />
        <input type=\"hidden\" name=\"ref\" value=\"".htmlentities(stripslashes($_SESSION[dbe_referer]))."\" />
        <input type=\"submit\" name=\"bt\" class=\"button\" value=\""._MUHUN."\" /></td>
      <td><input type=\"submit\" name=\"bt\" class=\"button\" value=\""._BATAL."\" /></td></tr>
    </table>
    </form>
    ";
  }

  ############ Form: tambih tabel #################
  function form_adt () {
    GLOBAL $mdbGlobal;
    echo "
    <h2>"._ADT."</h2>  
    <form method=\"post\" action=\"\">
    <table border=\"0\">
    <tr><td>"._NAMITABLE."</td><td><input type=\"text\" class=\"textbox\" size=\"30\" name=\"tname\" /></td></tr>
    <tr>
      <td><br /></td>
      <td>
        ".inputhidden('w', $mdbGlobal->w).(($mdbGlobal->Debug)?"
        ".inputhidden('Debug', $mdbGlobal->Debug) : "")."
        ".inputhidden('op', 'adt')."
        ".inputhidden('ref', htmlentities(stripslashes($_SESSION[dbe_referer])))."
        ".inputbtn('bt', _KINTUN)."
        ".inputbtn('bt', _BATAL)."
      </td></tr>
    </table>
    </form>
    ";
  }

  ############ Form: edit tabel #################
  function form_edt () {
    GLOBAL $mdbGlobal, $TABLEINFO, $MDBTABLE;

    #parentTable:
    $SQL = "SELECT name, name FROM `$MDBTABLE[table]` WHERE name <> '$TABLEINFO[name]'";
    if ($parentRs = $mdbGlobal->link->Execute($SQL)) {
      $inputParent = inputlookup("tparent", $TABLEINFO['parentTable'], $parentRs);
    }

    #info fields:
    $SQL = "SELECT * FROM `$TABLEINFO[name]` WHERE rid='0'";
    if (!($result = $mdbGlobal->link->Execute ($SQL))) return;
    $numfields = $result->FieldCount();

    echo "
    <h2>"._EDT."::$TABLEINFO[name]</h2>  
    <form method=\"post\" action=\"\">
    <table border=\"0\">
    <tr><td valign=\"top\">"._GENTOSNAMTABLEINFO."</td><td>".
      "<input type=\"text\" class=\"textbox\" size=\"30\" name=\"tname\" /></td></tr>
    <tr><td valign=\"top\">"._PARENT."</td><td>".
      $inputParent."</td></tr>
    <tr><td valign=\"top\">"._DESKRIPSI."</td><td>".
      inputarea('tdescription', htmlentities($TABLEINFO['description']), 3, 60, 255, 255)."</td></tr>
    <tr><td valign=\"top\"><br /></td><td>
      <input type=\"hidden\" name=\"w\" value=\"$mdbGlobal->w\" />
      <input type=\"hidden\" name=\"op\" value=\"edt\" />".(($mdbGlobal->Debug)?"
      <input type=\"hidden\" name=\"Debug\" value=\"$mdbGlobal->Debug\" />":"")."
      <input type=\"hidden\" name=\"tid\" value=\"$mdbGlobal->tid\" />
      <input type=\"hidden\" name=\"ref\" value=\"$_SESSION[dbe_referer]\" />
      <input type=\"submit\" name=\"bt\" class=\"button\" value=\""._ROBIH."\" /></td></tr>
    <tr><td colspan=\"2\" valign=\"top\"><hr/></td></tr>
    </table>
    <h3>"._COLUMNS."</h3> 
    <table border=\"0\">";

    $startfield = 3; // the first free field.

    #table info:
    echo "
    <tr><td><br /></td><td><b>"._EDF."</b></td><td><b>"._TYPE."</b></td></tr>";
    for ($it=$startfield;$it<$numfields;$it++) {
      $field = $result->FetchField($it);
      $FNAM = &$field->name;
      if($field->max_length > 0) $FLEN = $field->max_length;
      else $FLEN = false;
      $FTYP = meta2type($result->MetaType($field->type), $FLEN);
      $CHECK = "<input type=\"checkbox\" name=\"fsel[$FNAM]\" value=\"on\" class=\"textbox\" />";
      $INPUTFNAM = "<input type=\"text\" name=\"fnam[$FNAM]\" value=\"$FNAM\" class=\"textbox\" />";
      $INPUTFTYP = inputtext("ftyp[$FNAM]", $FTYP);
      echo "\n<tr><td>$CHECK</td><td>$INPUTFNAM</td><td>$INPUTFTYP</td></tr>";
    }
    
    echo "
    <tr><td><br /></td></tr>
    <tr><td><br /></td><td><b>"._ADF."</b></td><td><b>"._TYPE."</b></td></tr>";

    for ($it=0;$it<3;$it++) {
      $CHECK = "<input type=\"checkbox\" name=\"afsel[$it]\" value=\"on\" class=\"textbox\" />";
      $INPUTFLAG = inputtext("aflag[$it]", "");
      $INPUTFTYP = inputtext("aftyp[$it]", "");
      $INPUTFNAM = inputtext("afnam[$it]", "");
      echo "\n<tr><td>$CHECK</td><td>$INPUTFNAM</td><td>$INPUTFTYP</td></tr>";
    }

    echo "
    <tr><td><br /></td><td colspan=\"3\">".
    "<input type=\"submit\" class=\"button\" name=\"bt\" value=\""._KINTUN."\" /> ".
    "<input type=\"submit\" class=\"button\" name=\"bt\" value=\""._HAPUS."\" /> ".
    "<input type=\"submit\" class=\"button\" name=\"bt\" value=\""._BATAL."\" /> </td></tr>
    </table>
    </form>
    ";

    echo _KETERANGANTIPE;
  }


#filter form:
function filter_form($filter, $leftMenu=false, $midMenu=false, $midRef='', $midVal=''){
  GLOBAL $mdbGlobal;
?>
<form method="post" action="">
<table width="100%">
<tr><td><?
  if (is_array($leftMenu)) echo implode (" ", $leftMenu);
  else if ($leftMenu) echo $leftMenu;
?></td>
<? if ($midMenu) { ?>
<td align="center">: <? 
  if (is_array($midMenu)) 
    foreach ($midMenu as $k => $disp) { 
      $mRef = uri_replace('sw', $k, $midRef);
      if ($k != $midVal) { ?>
  <a href="<?="$mRef"?>"><?=$disp?></a> : <?  
      } 
    } 
?></td>
<? } ?>
<td align="right"><?//=_FILTER?>: 
<input type="hidden" name="filter_form" value="1"/>
<input class="textbox" type="text" name="filter" size="30" value="<?=htmlentities($filter)?>" />
</td></tr>
</table>
</form>
<?
} //!< end function filter_form

}
?>
