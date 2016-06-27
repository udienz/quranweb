<?
if(!defined('__ContentPanel_class_')){
  define ('__ContentPanel_class_', 1);
  include_once (MDB_DIR.'ui/Component.class.php');
  include_once (MDB_DIR.'dbe/SelectSQL.class.php');

  class ContentPanel extends Component {#extends Panel {
    var $selectSQL; //!< SelectSQL 

    # Sort Info:
    var $az;
    var $sr;
    var $sf;

    function ContentPanel(&$selectSQL) {
      $this->selectSQL = &$selectSQL;
    }

    function Render(&$rhtml) {
      # Navigation Bar: 
      $this->components['navigator']->Render($navHtml); 
      $this->selectSQL->offset = $this->offset;
      $this->selectSQL->limit = $this->limit;
      $result = $this->selectSQL->Execute();
      if (!$result) return;

      # Table Render:
      $this->components['renderer']->SetSortInfo($this);
      $this->components['renderer']->SetRecordSet($result);
      $numrows = $this->components['renderer']->Render($content); 

      # Output:
      $rhtml .= $navHtml;
      if ($numrows) {
        $rhtml .= $content."<br />";
      } else {
        $rhtml .= "<p class=\"mdbSpecial\">"._TEUAYADATA."</p>";
      }
      $rhtml .= $navHtml;
    }
  };
}
?>
