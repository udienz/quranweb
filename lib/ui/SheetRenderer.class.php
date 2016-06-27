<?
if(!defined('__SheetRenderer_class')) {
  define ('__SheetRenderer_class',1);

  include_once (MDB_DIR.'ui/DBTableRenderer.class.php');

  class SheetRenderer extends DBTableRenderer {
    function SheetRenderer(&$selectSQL) {
      $this->DBTableRenderer($selectSQL);
      $this->startfid = 3; //!< start column number for displays:
      $this->keyfid = 0; //!< primary key column id:
    }

    /**
     *
     */
    function RenderCell(&$rhtml, &$content, $colNo, $rowNo=0) {
      GLOBAL $LOOKUP, $TABLEINFO, $TABLERELATIONS;

      $tableName = '';

      # get tag:
      $column = $this->columns[$colNo];
      $tag = substr($content,0,4); //!< what is it for?

      # check type:
      $maxlength = 40;
      $maxheight = 3;
      
      if ($column->name == 'modified' || $column->name == 'user') {
        $INPUTTYPE = $content; 
      } else {
        ob_start();
        inputfield($TABLEINFO['columns'][$column->name], $this->recordSet, $content, $TABLEINFO, $TABLERELATIONS, false);
        $INPUTTYPE = ob_get_contents();
        ob_end_clean();
      }

      # Output:
      $rhtml .= "<td>$INPUTTYPE</td>";
    }
    
    /**
     *
     */
    function RenderRow(&$rhtml, &$rowObj, $rowNo=0) {
      $rowHtml = '';
      if ($this->showEditing) {
         $rowHtml .= "<td>".inputchk("edd[$rowNo]", $this->rid)."</td>";  
         $rowHtml .= "<td>".inputchk("ded[$rowNo]", $this->rid)."</td>";  
      }
      for ($jt=$this->startFieldNo;$jt<$this->maxColumns;$jt++) {
        $this->RenderCell($rowHtml, $rowObj[$jt], $jt, $rowNo);
      }

      # Output:
      if ($rowNo%2) $class='mdbEven';
      else $class='mdbOdd';
      $rhtml .= "<tr class=\"$class\">$rowHtml</tr>\n";
    }

    function Render(&$rhtml) {
      GLOBAL $REQUEST_URI;
      DBTableRenderer::Render($sheet).
      $rhtml .= 
      "<form method=\"post\" action=\"\">\n".
      inputhidden('op', 'she')."\n".
      inputhidden('ref', $_SERVER['REQUEST_URI'])."\n".
      $sheet.
      "<p>".inputbtn('bt', _KINTUN)."</p>\n".
      "</form>";
      return $this->numrows;
    }
  };
}
?>
