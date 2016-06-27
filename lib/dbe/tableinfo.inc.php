<?
  if (!defined('__tableinfo_inc')) {
    define('__tableinfo_inc',1);

    /**
     * @return SelectSQL object which is specified by columnnames: array 
     */
    function &get_select(&$TABLEINFO, &$columnnames) {
      if (is_array($columnnames)) {
        GLOBAL $mdbGlobal;
        $selectSQL = new SelectSQL($mdbGlobal->link);
        $selectSQL->tables[] = "`$TABLEINFO[name]` T0";
      
        $it=1;
        $parents = array();
        foreach($columnnames as $name) {
	        $column = $TABLEINFO['columns'][$name];
          if($column->parent != '') { //!< there is column parent
            if (!$parents[$column->parent]) { //!< there is a new column relation
              $selectSQL->tables[0] .=  //!< put as inner join.
                "\nINNER JOIN `$column->parent` T$it ON T$it.rid = T0.rid";
              $parents[$column->parent] = "T$it"; //!< put the id.
       	      $it++;
            } //!< end if
            $ID = $parents[$column->parent];
            if($column->ltable != '') {
              $selectSQL->AddField("T$it.`$column->lcolumn`", "`$column->name`");
              $selectSQL->AddTable( 
                "LEFT JOIN `$column->ltable` T$it ON $ID.`$column->name` = T$it.`rid`");
              $it++;
            } else {
              $selectSQL->AddField("$ID.`$column->name`", "`$column->name`");
            }
          } else {
            if($column->ltable != '') {
              $selectSQL->AddField("T$it.`$column->lcolumn`", "`$column->name`");
              $selectSQL->AddTable(
                "LEFT JOIN `$column->ltable` T$it ON T0.`$column->name` = T$it.`rid`");
              $it++;
            } else {
              $selectSQL->AddField("T0.`$column->name`", "`$column->name`");
            }
          }
        }
        unset ($parents);
        return $selectSQL;
      }
    }

    /**
        TABLEINFO = array (
        'name' =>
        'columns' => object 
                     ->parent
                     ->
        )
        
     */
    function &get_update_fields(&$TABLEINFO, &$ftabel) {
      $fieldPairs = array();
      $columns = &$TABLEINFO['columns'];
      foreach ($ftabel as $columnName => $value) {
        $column = &$columns[$columnName];
        $tableName = ($column->parent != '')? $column->parent : $TABLEINFO['name'];

        $fieldPairs[$tableName][] = "`$columnName` = '$value'";
      }
      return $fieldPairs;
    }
        
    /**
     * @return SelectSQL object. 
     */
    function &get_full_select(&$TABLEINFO) {
      GLOBAL $mdbGlobal;
      $selectSQL = new SelectSQL($mdbGlobal->link);
      $selectSQL->tables[] = "`$TABLEINFO[name]` T0";

      $it=1;
      $parents = array();
      foreach($TABLEINFO['columns'] as $column) {
        if($column->parent != '') { //!< there is column parent
          if (!$parents[$column->parent]) { //!< there is a new column relation
    	      $selectSQL->tables[0] .=  //!< put as inner join.
    	        "\nINNER JOIN `$column->parent` T$it ON T$it.rid = T0.rid";
            $parents[$column->parent] = "T$it"; //!< put the id.
    	      $it++;
          } //!< end if
          $ID = $parents[$column->parent];
          if($column->ltable != '') {
            $selectSQL->AddField("T$it.`$column->lcolumn`", "`$column->name`");
            $selectSQL->AddTable( 
              "LEFT JOIN `$column->ltable` T$it ON $ID.`$column->name` = T$it.`rid`");
            $it++;
          } else {
            $selectSQL->AddField("$ID.`$column->name`", "`$column->name`");
          }
        } else {
          if($column->ltable != '') {
            $selectSQL->AddField("T$it.`$column->lcolumn`", "`$column->name`");
            $selectSQL->AddTable( 
              "LEFT JOIN `$column->ltable` T$it ON T0.`$column->name` = T$it.`rid`");
            $it++;
          } else {
            $selectSQL->AddField("T0.`$column->name`", "`$column->name`");
          }
        }
      }
      unset ($parents);
      return $selectSQL;
    }

    function strip_prefix($tableName) {
      GLOBAL $mDB;
      return substr($tableName, strlen($mDB)+1);
    }

    function column_exists(&$columnList, &$column) {
       foreach($columnList as $lookup) {
          if ($lookup->name == $column->name) return true;
       }
       return false;
    }

    /**
     * @param name contains prefix.
     * @return array with following keys: 
     */
    function &read_table_info($name=false) {
      GLOBAL $mDB, $MDBTABLE, $mdbGlobal;

      # Tabel Info from listTabel
      if ($name) {//!< by name. 
        $SQL = "SELECT * FROM `$MDBTABLE[table]` WHERE `name`='$name'";
      } else if ($mdbGlobal->tid != "") { //!< by table id.
        $SQL = "SELECT * FROM `$MDBTABLE[table]` WHERE rid='$mdbGlobal->tid'";
      } 
      $result = $mdbGlobal->link->Execute($SQL);
      if (!$result) return false; 

      if ($result->RecordCount() < 1) log_error(_NOSUCHTABLE.": `$name`");
      $tableInfo = $result->FetchRow();

      # before add prefix ;)
      $SQL = 
        "SELECT `referenceColumn`, `lookupTable`, `lookupColumn`, `lookupMask` ".
        "FROM `$MDBTABLE[relation]` WHERE `referenceTable`='$tableInfo[name]'"; 

      # prepare columns array.
      $tableInfo['columns'] = array(); 

      # obtain parent columns:
      $parentTable = trim ($tableInfo['parentTable']);
      if ($parentTable != '') { # table has parent
        $parentInfo = &read_table_info($parentTable); 
        foreach($parentInfo['columns'] as $column) {
          $column->parent = $parentInfo['name']; # put info that a column comes from parent table.
          $tableInfo['columns'][$column->name] = $column; # add the column to current table info
        }
      }

      # obtain self column names:
      if($temp = &$mdbGlobal->link->MetaColumns($tableInfo['name'])) {
  	    foreach($temp as $k => $column) {
      	  $tableInfo['columns'][$column->name] = $column; //!< this will override the parent column
      	}
      }

      # put lookup information:
      $result = $mdbGlobal->link->Execute($SQL);
      if (!$result) return false; 
      $nRelations = $result->RecordCount();
    
      for ($it=0;$it<$nRelations;$it++) {
        list($refColumn, $lookupTable, $lookupColumn, $lookupMask) = $result->FetchRow();
        $column = &$tableInfo['columns'][$refColumn];
        if($column) {
          $column->ltable = $lookupTable;
	        $column->lcolumn = $lookupColumn;
	        $column->lmask = $lookupMask;
	      } else log_error("`$tableInfo[name]`.`$refColumn` "._NOCOLUMNANYMORE);
      }
      return $tableInfo;
    }
  }
?>
