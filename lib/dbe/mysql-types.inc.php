<?

  function MetaType($t,$len=-1,$fieldobj=false)
  {
    $len = -1; // mysql max_length is not accurate
    switch (strtoupper($t)) {
      case 'C': return 'CHAR';
      case 'X': return 'TEXT';
      case 'B': return 'BLOB';
      case 'D': return 'DATE';
      case 'T': return 'DATETIME';
      case 'R': return ' 

      case 'TIME':
      case 'DATETIME':
      case 'TIMESTAMP': return 'T';
      
      case 'INT': 
      case 'INTEGER':
      case 'BIGINT':
      case 'TINYINT':
      case 'MEDIUMINT':
      case 'SMALLINT': 

        if (!empty($fieldobj->primary_key)) return 'R';
        else return 'I';
      default: return 'N';
    }
  }
?>
