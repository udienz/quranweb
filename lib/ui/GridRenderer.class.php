<?
if(!defined('__GridRenderer_class')) {
  define ('__GridRenderer_class',1);

  #require (MDB_DIR.'ui/Component.php');

  define ('GO_LRDOWN', 'ToRightThenDown');
  define ('GO_RLDOWN', 'ToLeftThenDown');
  define ('GO_LRUP', 'ToRightThenUp');
  define ('GO_DOWNLR', 'UpThenToRight');

  /**
   * Grid Renderer.
   */
  class GridRenderer {
    # public attributes:
    var $orientation = GO_LRDOWN; //!< Rendering orientation.
    var $rowAttributes = ''; //!< Row attributes. 
    var $gridAttributes = 'width="100%"'; //!< Grid attributes.
    var $cellAttributes = ''; //!< Cell attributes.

    # private attributes:
    var $maxColumns = 3;
    var $maxRows = 3;
    var $columnBased = true;
    var $size = 20;

    # counters during rendering that can be used by derived classes. 
    var $colNo;
    var $rowNo;

    # will be set by PrepareRender 
    var $rowAttrCount; 
    var $cellAttrCount; 

    /**
     * Constructor
     */
    function GridRenderer() { }

    function Init() {
    }

    function RenderNext() {
      if ($this->counter < $this->size) {
        return $this->counter++;  //!< any html data.
      }
      return '';
    }

    /**
     * GetSize
     * @return size of grid's content.
     */
    function GetSize() {
      return $this->size;
    }

    /**
     * This can be overridden to beautify the grid. 
     */
    function GetRowAttributes() {
      if($this->rowAttrCount) {
        return $this->rowAttributes[$this->rowNo%$this->rowAttrCount];
      }
      return $this->rowAttributes;
    }

    /**
     * This can be overridden to beautify the grid. 
     */
    function GetCellAttributes() {
      if($this->cellAttrCount) {
        return $this->cellAttributes[($this->colNo+$this->rowNo)%$this->cellAttrCount];
      }
      return $this->cellAttributes;
    }

    /**
     * This can be overridden to beautify the grid. 
     */
    function GetGridAttributes() {
      return $this->gridAttributes;
    }

    function PrepareRender() {
      $this->size = $this->GetSize();
      $this->counter = 0;
      if($this->columnBased) {
        $this->maxRows = ceil($this->size/$this->maxColumns); 
      } else {
        $this->maxColumns = ceil($this->size/$this->maxRows); 
      }
      if (is_array($this->cellAttributes)) {
        $this->cellAttrCount = count($this->cellAttributes); 
      } else $this->cellAttrCount = false;
      if (is_array($this->rowAttributes)) {
        $this->rowAttrCount = count($this->rowAttributes); 
      } else $this->rowAttrCount = false;
    }

    function ToLeftThenDown(&$rhtml) {
      $rhtml .= "\n<table ".$this->GetGridAttributes().">";
      for($this->rowNo=0;$this->rowNo<$this->maxRows;$this->rowNo++) {
      $chtml = '';
      for($this->colNo=0;$this->colNo<$this->maxColumns;$this->colNo++) {
	$chtml = '<td '.$this->GetCellAttributes().'>'.$this->RenderNext().'</td>'.$chtml;
      }
      $rhtml .= "\n<tr ".$this->GetRowAttributes().">$chtml</tr>";
      }
      $rhtml .= "</table>";
    }

    function ToRightThenDown(&$rhtml) {
      $rhtml .= "\n<table ".$this->GetGridAttributes().">";
      for($this->rowNo=0;$this->rowNo<$this->maxRows;$this->rowNo++) {
      $rhtml .= "\n<tr ".$this->GetRowAttributes().">";
      for($this->colNo=0;$this->colNo<$this->maxColumns;$this->colNo++) {
	$rhtml .= '<td '.$this->GetCellAttributes().'>'.$this->RenderNext().'</td>';
      }
      $rhtml .= "</tr>";
      }
      $rhtml .= "</table>";
    }

    function DownThenToRight(&$rhtml) {
      $rowsHtml = array();
      for($this->colNo=0;$this->colNo<$this->maxColumns;$this->colNo++) {
      for($this->rowNo=0;$this->rowNo<$this->maxRows;$this->rowNo++) {
        $rowsHtml[$this->rowNo] .= "<td ".$this->GetCellAttributes().">".$this->RenderNext()."</td>";
      }
      }
      $rhtml .= "\n<table ".$this->GetGridAttributes().">";
      for($this->rowNo=0; $this->rowNo<$this->maxRows; $this->rowNo++) {
        $rhtml .= "\n<tr ".$this->GetRowAttributes().">".$rowsHtml[$this->rowNo]."</tr>";
      }
      $rhtml .= "</table>";
    }

    function ToRightThenUp(&$rhtml) {
      $rowsHtml = array();
      for($this->rowNo=0;$this->rowNo<$this->maxRows;$this->rowNo++) {
      for($this->colNo=0;$this->colNo<$this->maxColumns;$this->colNo++) {
        $rowsHtml[$this->rowNo] .= "<td ".$this->GetCellAttributes().">".$this->RenderNext()."</td>";
      }
      }
      $rhtml .= "\n<table ".$this->GetGridAttributes().">";
      for($this->rowNo=$this->maxRows-1; $this->rowNo>=0; $this->rowNo--) {
        $rhtml .= "\n<tr ".$this->GetRowAttributes().">".$rowsHtml[$this->rowNo]."</tr>";
      }
      $rhtml .= "</table>";
    }

    function SetMaxColumns($maxColumns) {
      $this->columnBased = true;
      $this->maxColumns = $maxColumns;
    }

    function SetMaxRows($maxRows) {
      $this->columnBased = false;
      $this->maxRows = $maxRows;
    }

    /**
     * Render the grid.
     */
    function Render(&$rhtml) {
      $this->Init();
      $this->PrepareRender();
      $rhtml .= "\n<!-- Grid Start -->";
      switch($this->orientation) {
        case GO_RLDOWN:
	  $this->ToLeftThenDown($rhtml); break;
        case GO_DOWNLR:
	  $this->DownThenToRight($rhtml); break;
        case GO_LRUP:
	  $this->ToRightThenUp($rhtml); break;
        case GO_LRDOWN:
        default: 
	  $this->ToRightThenDown($rhtml); break;
      }
      $rhtml .= "\n<!-- Grid End -->";
    }
  };

  function GridRendererExample() {
    $myGrid = new GridRenderer();
    $myGrid->setMaxColumns(4);
    $rhtml .= 'godown';
    $myGrid->orientation = GO_RLDOWN;
    $myGrid->Render($rhtml);
    $myGrid->setMaxRows(2);
    $rhtml .= 'godown';
    $myGrid->orientation = GO_LRDOWN;
    $myGrid->Render($rhtml);
    $myGrid->setMaxRows(8);
    $rhtml .= 'goup';
    $myGrid->orientation = GO_LRUP;
    $myGrid->Render($rhtml);
    $myGrid->setMaxColumns(11);
    $rhtml .= 'godown'; 
    $myGrid->orientation = GO_DOWNLR;
    $myGrid->Render($rhtml);
    echo $rhtml;
  }

  #GridRendererExample();
}
?>
