<?
if (!defined('__DBTableRenderer_class')) {
  define ('__DBTableRenderer_class', 1);

  require MDB_DIR . 'ui/Component.class.php'; 
  // content-types:
  define ('TYPE_PLAIN', 0);
  define ('TYPE_STORY', 1);
  define ('TYPE_IMAGE', 2);

  $CONTENT_TPL[TYPE_PLAIN] = '$id'; //!< plain.  
  $CONTENT_TPL[TYPE_STORY] = '$id|$title|$description|$body'; //!< story.  
  $CONTENT_TPL[TYPE_IMAGE] = '$id|$title|$description|$url'; //!< image.   
  // view modes:
  define ('VIEW_LIST', 0);
  define ('VIEW_INDEX', 1);
  define ('VIEW_DETAIL', 2);

  class DBTableRenderer extends Component {
    var $truncate = true;
    var $headerEdit = '[e]';
    var $headerDelete = '[x]';
    var $headerAdd = '[+]';

    var $editButton = '[e]';
    var $deleteButton = '[x]';
    var $addButton = '[+]';

    var $editAction = 'edd'; //!< if equals '', no action column
    var $deleteAction = 'ded'; //!< if equals '', no action column
    var $addAction = ''; //!< if equals '', no action column
    var $keyNo = 2; //!< primary key field id:
    var $keyName = 'rid'; //!< primary key field name.
    var $showHeader = true; //!< show header
    var $startFieldNo = 0; //!< start field number for displays:
    var $viewMode = VIEW_LIST; //!< view the content in list mode. 
    var $tableTemplate = '';
    var $headerRowTemplate = '';
    var $headerCellTemplate = '';
    var $rowTemplates = array();
    var $cellTemplates = array();

    var $maxRows;
    var $maxColumns;
    var $columns; //!< column/field objects
    var $rid; //!< record ID
    var $recordSet;
    var $selectSQL; 
    // sort info:
    var $sf = '';
    var $sr = '';

    /**
    */
    function DBTableRenderer(&$selectSQL)
    {
      $this->Component();
      if (isset($selectSQL)) {
        $this->selectSQL = &$selectSQL;
      } else {
        log_error('Null selectSQL');
      } 
      // Requests:
    } 

    function ReadRecordSet(&$recordSet)
    {
      $this->recordSet = &$recordSet;
      $this->columns = array(); //!< init fields array
      $this->maxRows = $recordSet->RowCount();
      $this->maxColumns = $recordSet->FieldCount();
      for ($it = 0;$it < $this->maxColumns;$it++) {
        $this->columns[] = &$recordSet->FetchField($it);
      } 
    } 

    /**
    */
    function RenderCell(&$rhtml, &$content, $colNo, $rowNo = 0)
    {
      GLOBAL $LOOKUP;

      $tableName = ''; 
      // get tag:
      $field = $this->columns[$colNo];
      $type = $this->recordSet->MetaType($field->type);
      $tag = substr($content, 0, 4); 
      // check type:
      if ($tag == 'URL|') {
        $url = explode('|', $content);
        $content = $url[1];
      } else if ($type == 'X') {
        $content = htmlentities ($content);
      } else if (count($LOOKUP[$tableName][$field->name])) {
        $content = $LOOKUP[$tableName][$field->name][$content] . ':' . $content;
      } 
      // truncate large text:
      if ($this->truncate) {
        $content = (strlen($content) > 100)?substr($content, 0, 100) . "...":$content;
      } 
      // filter:
      if ($tag == 'URL|') {
        $content = "<a href=\"$url[2]\">$content</a>";
      } 
      // Output:
      $rhtml .= "<td>$content</td>";
    } 
    // Set Ordering Field and Ordering Method:
    function SetOrdering()
    {
      GLOBAL $_REQUEST;

      $sfid = 'sf' . $this->GetID();
      $srid = 'sr' . $this->GetID();
      $this->sf = $_REQUEST[$sfid];
      $this->sr = $_REQUEST[$srid];

      if ($this->sf != '') {
        $this->selectSQL->orders[] = $this->sf . " " . $this->sr;

        if ($this->sr == "desc") {
          $this->sr = "asc";
          $this->az = "za";
        } else {
          $this->sr = "desc"; //!< this is for the future 
          $this->az = "az";
        } 
      } else {
        $this->az = '';
        $this->sr = '';
      } 
    } 

    /**
    */
    function RenderHeaderRow(&$rhtml)
    { 
      // shortcuts:
      $recordSet = &$this->recordSet;
      $sfid = 'sf' . $this->GetID();
      $srid = 'sr' . $this->GetID(); 
      // process url:
      $url = $this->GetURL();
      $url = uri_replace($sfid, $this->sf, $url);
      if ($this->sr != '')
        $url = uri_replace($srid, $this->sr, $url);

      $rhtml .= "<tr>";
      if ($this->editAction != '')
        $rhtml .= "<td><strong class=\"mdbTableHead\">$this->headerEdit</strong></td>";
      if ($this->deleteAction != '')
        $rhtml .= "<td><strong class=\"TableHead\">$this->headerDelete</strong></td>";
      if ($this->addAction != '')
        $rhtml .= "<td><strong class=\"TableHead\">$this->headerAdd</strong></td>";

      for ($it = $this->startFieldNo;$it < $this->maxColumns;$it++) {
        if ($this->sr != "") $url = uri_replace($srid, $this->sr, $url);
        $url = uri_replace($sfid, $it + 1, $url);
        $azview = ((($this->sr != "") && ($this->sf == ($it + 1)))?"[$this->az]":"");
        $fname = $this->columns[$it]->name;
        $rhtml .= "<td><a href=\"$url\"><strong class=\"TableHead\">$fname$azview</strong></a></td>";
      } 
      // Output:
      $rhtml .= "</tr>\n";
    } 

    /**
    */
    function RenderRow(&$rhtml, &$rowObj, $rowNo = 0)
    {
      GLOBAL $mdbGlobal;

      $rowHtml = '';

      if ($this->editAction != '')
        $rowHtml .= "<td><a href=\"$this->editUrl$rowObj[0]\">$this->editButton</a></td>";
      if ($this->deleteAction != '')
        $rowHtml .= "<td><a href=\"$this->deleteUrl$rowObj[0]\">$this->deleteButton</a></td>";
      if ($this->addAction != '')
        $rowHtml .= "<td><a href=\"$this->addUrl$rowObj[0]\">$this->addButton</a></td>";

      for ($jt = $this->startFieldNo;$jt < $this->maxColumns;$jt++) {
        $this->RenderCell($rowHtml, $rowObj[$jt], $jt);
      } 
      // echo $rowNo;
      // if ($rowNo<1) echo $this->editUrl;
      // Output:
      if ($rowNo % 2) {
        $class = 'mdbEven';
		$style = 'background-color: none;';
      } else {
        $class = 'mdbOdd';
		$style = 'background-color: #eeeeee;';
      } 
      $rhtml .= '<tr class="' . $class . '" style="' . $style . '">' . $rowHtml . '</tr>' . "\n";
    } 

    /**
    */
    function Render(&$rhtml)
    {
      $this->SetOrdering();
      $recordSet = &$this->selectSQL->Execute();
      if (!$recordSet) return;
      $this->ReadRecordSet($recordSet); //!< update  
      // Build Header:
      $hdRowHtml = '';
      if ($this->showHeader) {
        $this->RenderHeaderRow($hdRowHtml);
      } 

      $this->editUrl = $this->GetURL() . "&amp;sw=$this->editAction&amp;$this->keyName=";
      $this->deleteUrl = $this->GetURL() . "&amp;sw=$this->deleteAction&amp;$this->keyName=";
      $this->addUrl = $this->GetURL() . "&amp;sw=$this->addAction&amp;$this->keyName="; 
      // Build Table:
      $recordSet = &$this->recordSet; //!< shortcut
      $rowsHtml = '';
      for ($it = 0;$it < $this->maxRows;$it++) {
        $row = $recordSet->FetchRow();
        $this->rid = $row[$this->keyName];
        $this->RenderRow($rowsHtml, $row, $it);
      } 
      // Process table attributes:
      if ($this->attributes == '') {
        $attributes = " width=\"100%\" cellpadding=\"2\" cellspacing=\"0\" border=\"0\"";
      } else {
        $attributes = ' ' . $this->attributes;
      } 
      // Output:
      $rhtml .= "<table$attributes>\n";
      $rhtml .= $hdRowHtml;
      $rhtml .= $rowsHtml;
      $rhtml .= "</table>";
      return $this->maxRows;
    } 
  } ;
} 

?>
