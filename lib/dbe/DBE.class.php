<?
if (!defined('__DBE_class_php')) {
  define('__DBE_class_php', 1);

  if (!defined('_ADODB_LAYER')) {
    require (ADODB_DIR . 'adodb.inc.php');
  } 
  require (MDB_DIR . 'dbe/FieldDefParser.class.php');

  function meta2type($metatype, $len = false)
  {
    switch ($metatype) {
      case 'X': return 'text';
      case 'B': return 'blob';
      case 'I': return 'int' . (($len)?" ($len)":'');
      case 'C': return 'varchar' . (($len)?" ($len)":'');
      case 'N': return 'real' . (($len)?" ($len)":'');
      case 'D': return 'date';
      case 'T': return 'datetime';
      default : return 'unknown';
    } 
  } 

  function type2dbtype($type)
  {
    $field->type = $type;
    $field = &FieldDefParser::ParseType($field);
    if ($field->type == 'real') $type = 'double';
    return $type . ' NOT NULL'; //!< currently for mysql has no problem getting the input.
  } 

  /**
   * DBE
   */
  class DBE {
    var $db; //!< adodb connection
    function DBE(&$adodb)
    {
      $this->db = &$adodb;
    } 

    function RecordCount($table, $whereClause = '')
    {
      $SQL = "SELECT COUNT(*) `NMes` FROM $table";
      if (trim($whereClause) != '') $SQL .= " $whereClause";
      $result = $this->Execute($SQL);
      if (!$result) return -1;
      $row = $result->FetchRow();
      list($dum, $count) = each($row);
      return $count;
    } 

    function &MetaColumns($tableName)
    {
      $SQL = "SELECT * FROM `$tableName` WHERE 0";
      $result = $this->Execute($SQL);
      if (!$result) return false;

      $columns = array();
      $nColumns = $result->FieldCount();
      for($it = 0;$it < $nColumns;$it++) {
        $columns[] = &$result->FetchField($it);
      } 
      return $columns;
    } 

    function &SelectLimit(&$SQL, $limit = 15, $offset)
    {
      log_debug("[DBE.SelectLimit]\n$SQL");
      if ($result = $this->db->SelectLimit($SQL, $limit, $offset)) {
        return $result;
      } 
      log_error("[DBE.SelectLimit]\n" . $this->db->ErrorMsg() . "\n::$SQL");
      return 0;
    } 

    function &Execute(&$SQL)
    {
      log_debug("[DBE.Execute]\n$SQL");
      if ($result = &$this->db->Execute($SQL)) {
        return $result;
      } 
      log_error("[DBE.Execute]\n" . $this->db->ErrorMsg() . "\n::$SQL");
      return 0;
    } 

    function SetAssocMode($mode)
    {
      GLOBAL $ADODB_FETCH_MODE;
      $this->tempMode = $ADODB_FETCH_MODE;
      $ADODB_FETCH_MODE = $mode;
    } 

    function ResetAssocMode()
    {
      if ($this->tempMode)
        $ADODB_FETCH_MODE = $this->tempMode;
    } 

    function AffectedRows()
    {
      return $this->db->Affected_Rows();
    } 
  } 
} 

?>
