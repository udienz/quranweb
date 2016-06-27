<?
if(!defined('_input_inc_php')) {
  define('_input_inc_php',1);
  function inputimage($name, $value, $src='images/klikb.gif') {
    return "<input type=\"image\" name=\"$name\" value=\"$value\" src=\"$src\" />";
  }
  
  function inputhidden($name, $value) {
    return "<input type=\"hidden\" name=\"$name\" value=\"$value\" />";
  }
  
  function inputarea($name, $value, $rows=25, $cols=10, $maxlen=0) {
    if ($maxlen) // TODO:  maxlength=\"$maxlen\"
    return "<textarea class=\"textbox\" name=\"$name\" rows=\"$rows\" cols=\"$cols\">$value</textarea>";
    else 
    return "<textarea class=\"textbox\" name=\"$name\" rows=\"$rows\" cols=\"$cols\">$value</textarea>";
  }

  function inputbtn($name, $value) {
    return "<input type=\"submit\" class=\"button\" name=\"$name\" value=\"$value\" />";
  }

  function inputpass($name, $size=25) {
    return "<input type=\"password\" class=\"textbox\" name=\"$name\" size=\"$size\" />";
  }

  function inputtext($name, $value, $size=25, $maxlen=0) {
    if ($maxlen)
    return "<input type=\"text\" class=\"textbox\" name=\"$name\" value=\"$value\" size=\"$size\" maxlength=\"$maxlen\" />";
    else 
    return "<input type=\"text\" class=\"textbox\" name=\"$name\" value=\"$value\" size=\"$size\" />";
  }
  
  function inputchk ($name, $value, $checked=false) {
    return "<input type=\"checkbox\" class=\"textbox\" name=\"$name\" value=\"$value\"".(($checked)?' checked="checked"':'')." />";
  }
  
  #input select
  function inputsel ($name, $value, &$options, $column="0", $maynull = '1') {
    $frm = "<select class=\"textbox\" name=\"$name\">"; 

    if ($maynull) {
      $frm .= "<option value=\"\">-</option>";
    }
    foreach ($options as $k => $d) { // $k will be compared with $value
      if (is_array ($d)) {
      $disp = $d[$column];
    } else {
      $disp = $d;
    }
      $selected = ($k == $value)?' selected="selected"':'';
      $frm .= "<option value=\"$k\"$selected>$disp</option>"; 
    }
    return $frm."</select>";
  }

  # lookup value from a record set:
  function &inputlookup($name, $value, &$recordSet, $list=false, $maynull=true) {
    while($row = $recordSet->FetchRow()) {
      $selected = ($row[1] == $value)?' selected="selected"':'';
      $frm .= "<option value=\"$row[0]\"$selected>$row[1]</option>\n"; 
    }
    if ($maynull) {
      if (is_integer($row[0])) {
        $frm = "<option value=\"0\"></option>\n".$frm;
      } else { // ENHANCE: with default value.
        $frm = "<option value=\"\"></option>\n".$frm;
      }
    }
    return "<select class=\"textbox\" name=\"$name\">\n".$frm."</select>\n";
  }

  function inputfield(&$field, &$result, &$VALUE, &$TABLEINFO, &$TABLERELATIONS, $notrow=true) {
    GLOBAL $mdbGlobal;

    $maxlength = 80;
    $FNAM = $field->name;
    $FTYP = $result->MetaType($field->type);
    $FLEN = $field->max_length;
    if ($field->ltable) { //!< field has lookup reference.
      $SQL = 
        "SELECT T0.rid, T0.`$field->lcolumn` FROM `$field->ltable` T0"; 
        if ($field->lmask) {
          $masks = explode ('|', $field->lmask);
      	  $filter = array();
          foreach($masks as $mask) {
	          $filter[] = "TO.`$field->lcolumn' = '$mask'";
      	  }
          $SQL .= " WHERE ".implode(" OR ",$filter);
          unset($filter);
	        unset($masks);
        }
      if($recordSet = $mdbGlobal->link->Execute($SQL)) {
	      $INPUTTYPE = &inputlookup("ftabel[$FNAM]", $VALUE, $recordSet);
      }
    } else { //!< no lookup.
      switch ($FTYP) {
        case "B" : // 
        case "X" : // 
          $INPUTTYPE = inputarea("ftabel[$FNAM]", $VALUE, 15, 80);
          $FLEN = false;
          break;
        case 'D' :
        case 'T' : 
          if ($VALUE == '') $VALUE = $mdbGlobal->stamp;  
          $INPUTTYPE = inputtext("ftabel[$FNAM]", $VALUE, $FLEN); ;
          $FLEN = false;
          break;
        default : // string
          if ($FLEN > $maxlength) {
            $INPUTTYPE = inputarea("ftabel[$FNAM]", $VALUE, 3, 80, $FLEN);
          } else {
            $INPUTTYPE = inputtext("ftabel[$FNAM]", $VALUE, $FLEN); ;
          }
          break;
      } //!< end switch
    } //!< end if $TABLERELATIONS

    if ($notrow) {
    echo "
    <tr><td style=\"vertical-align:top;\">$FNAM</td>".
    "<td style=\"vertical-align:top; white-space: nowrap;\">$INPUTTYPE <em>".meta2type($FTYP).(($FLEN)?" ($FLEN)":"")."</em></td></tr>";
    } else {
      echo $INPUTTYPE;
    }
  }
  
} //!< define
?>
