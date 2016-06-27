<?
if(!defined('__SelectSQL_class')) {
  define('__SelectSQL_class', 1);

  /**
   * SelectSQL
   */
  class SelectSQL {
    var $_db;
    var $fields = array();  //!< should be associative array.
    var $filters = array();
    var $tables = array();
    var $groups = array();
    var $orders = array();
    var $joins = array(); //!< inner join table.

    var $offset;
    var $limit;

    function SelectSQL(&$db) {
      if($db) $this->_db = &$db;
    }
    
    function GetFieldNameByAlias($alias) {
      return $this->fields[$alias];
    }
    
    function AddField($field, $alias = false) {
      if ($alias) {
        $this->fields[$alias] = $field;
      } else {
        $this->fields[] = $field;
      }
    }
    function AddFilter($filter) {
      $this->filters[] = $filter;
    }
    function AddTable($table) {
      $this->tables[] = $table;
    }
    function AddGroup($group) {
      $this->groups[] = $group;
    }
    function AddOrder($order) {
      $this->orders[] = $order;
    }


    function InitAll() {
      $this->fields = array();  //!< should be associative array.
      $this->filters = array();
      $this->tables = array();
      $this->groups = array();
      $this->orders = array();
      $this->joins = array();
      $this->offset = '';
      $this->limit = '';
    }

    function Execute() {
      log_debug("[SelectSQL.Execute].{offset=$this->offset, limit=$this->limit}"); 
      if ($this->limit != '') {
        return $this->_db->SelectLimit($this->ToString(), $this->limit, $this->offset);
      }
      log_debug("[SelectSQL.Execute] No limit."); 
      return $this->_db->Execute($this->ToString());
    }

    function RecordCount() {
      if (isset($this->_db))
      return $this->_db->RecordCount($this->TABLESClause(), $this->WHEREClause());
    }

    function Reshape($filter) {
      
      return $filter;
    }
    
    function &WHEREClause() {
      if (count($this->filters) == 0) return $filters = '';
      
      $filters = array();
      foreach ($this->filters as $filter) {
        $filters[] = $this->Reshape($filter);
      }

      $filters = '('.trim(implode(') AND (', $filters)).')';
      $filters = "\nWHERE $filters";
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
      $fields = implode(",\n\t", $fields);
      return $fields;
    }

    function &TABLESClause() {
      if (count($this->joins)) $this->tables[0] .= "\n".implode("\n", $this->joins);
      $table = implode("\n", $this->tables);
      return $table;
    }

    function &SELECTCount() {
      $SQL = "SELECT COUNT(*)\n FROM ".$this->TABLESClause().$this->WHEREClause();
      return $SQL;
    }

    function &SELECTClause() {
      $SQL = "SELECT ".$this->FIELDSClause()."\n FROM ".$this->TABLESClause();
      return $SQL;
    }

    function &ToString() {
      $SQL = $this->SELECTClause().$this->WHEREClause();
      $groups = trim(implode(', ', $this->groups));
      if ($groups != '') $SQL .= "\n GROUP BY $groups";

      $orders = trim(implode(', ', $this->orders));
      if ($orders != '') $SQL .= "\n ORDER BY $orders";

      return $SQL;
    }
  };
}
?>
