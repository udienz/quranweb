<?
if(!defined('__DBGridRenderer_class')) {
  define('__DBGridRenderer_class', 1);
  include_once(MDB_DIR.'ui/GridRenderer.class.php');

  define ('TAGOPEN', '{');
  define ('TAGCLOSE', '}');

  class DBGridRenderer extends GridRenderer {
    var $selectSQL;
    var $startFieldNo = 0;
    var $contentRenderer;

    # optionals:
    var $keyValTemplate = '';
    var $template; // complex template
   
    function DBGridRenderer(&$selectSQL) {
      $this->GridRenderer();
      $this->selectSQL = &$selectSQL;
    }

    function &PutInto(&$data, &$template) { //!< can be static.
      // locate tags:
      $pos = array();
      foreach ($data as $k => $v) {
        $pos[$k] = strpos($template, TAGOPEN.$k.TAGCLOSE);
      }
      asort ($pos); //!< sort the position.
      reset ($pos); 

      // replace:
      $lastPosition = 0; $result = '';
      foreach ($pos as $k => $v) {
        if (is_integer($v) && $data[$k]) { //!< found positions:
          $result .= substr($template, $lastPosition, $v-$lastPosition); //!< copy until tag position.
      	  $result .= $data[$k];
          $lastPosition = $v + strlen (TAGOPEN.$k.TAGCLOSE); //!< forward.
        }
      }
      $result .= substr($template, $lastPosition); //!< copy the rest of template.
      unset ($pos);
      return $result;
    }

    # please override!
    function Init() {
      $this->rs = $this->selectSQL->Execute(); 
    }

    # please override!
    function RenderNext() {
      $row = $this->rs->FetchRow();
      $html = '';
      if ($row) {
      	if ($this->template == '') {
      	  $html .= "<table>";
        	$it=0;
      	  foreach ($row as $k => $v) {
      	    if(!is_integer($k)) {
      	      if ($it >= $this->startFieldNo) {
        	      $html .= "\n<tr><td class=\"mdbTableHead\">$k</td><td>$v</td>";
        	    }
        	    $it++;
      	    }
          }
	        $html .= "</table>";
          return $html;
	      } else { 
         return $this->PutInto($row, $this->template);
        }
      }
      return '';
    } 

    # please override!
    function GetSize() { 
      if ($this->rs)
      return $this->rs->RecordCount();
    }
  };
}
?>
