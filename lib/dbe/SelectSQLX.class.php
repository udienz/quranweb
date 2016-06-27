<?
if(!defined('__SelectSQLX_class')) {
  define('__SelectSQLX_class', 1);

  require(MDB_DIR.'dbe/SelectSQL.class.php'); 

  /**
   * SelectSQLX
   */
  class SelectSQLX extends SelectSQL{
    var $_db; //!< dbe.
    var $fields = array();  //!< should be associative array.
    var $filters = array();
    var $tables = array();
    var $groups = array();
    var $orders = array();

    var $offset;
    var $limit;

    function SelectSQLX(&$db) {
      $this->SelectSQL($db);
    }
    
    function RecordCount() {
      if (isset($this->_db))
      return $this->_db->RecordCount($this->TABLESClause(), $this->WHEREClause());
    }

    function &WHEREClause() {
      if (count($this->filters) == 0) return $filters = '';
      $filters = '('.trim(implode(') AND (', $this->filters)).')';
      $filters = " WHERE $filters"; 
      return $filters;
    }

    function &FIELDSClause() {
      $fields = array();
      foreach ($this->fields as $k => $v) {
        $v = trim($v);
        if (is_integer($k) && $v != '') {
          $fields[] = "$v"; 
	} else {
          $k = trim($k);
	  $fields[] = "$v $k";
	}
      }
      $fields = implode(', ', $fields);
      return $fields;
    }

    function &TABLESClause() {
      $table = implode(" ", $this->tables);
      return $table;
    }
  };
}
?>
