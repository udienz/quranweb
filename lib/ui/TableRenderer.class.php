<?
if(!defined('__TableRenderer_class')) {
  define ('__TableRenderer_class',1);

  class TableRenderer extends Component {
    /**
     *
     */
    function Render(&$rhtml) {
      # Build Header:
      $hdRowHtml = '';
      if ($this->showHeader) {
        $this->RenderHeaderRow($hdRowHtml); 
      }
      for ($it=0;$it<$this->maxRows;$it++) {
        $row = $recordSet->FetchRow();
        $this->rid = $row[$this->keyName];
        $this->RenderRow($rowsHtml, $row, $it);
      }
      
      # Process table attributes:
      if ($this->attributes == '') {
        $attributes = " width=\"100%\" cellpadding=\"2\" cellspacing=\"0\" border=\"0\"";
      } else {
        $attributes = ' '.$this->attributes;
      }
       
      # Output:
      $rhtml .= "<table$attributes>\n";
      $rhtml .= $hdRowHtml;
      $rhtml .= $rowsHtml;
      $rhtml .= "</table>";
      return $this->maxRows; 
    }
  };
}
?>
