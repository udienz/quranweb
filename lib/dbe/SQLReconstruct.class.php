<?
class SQLReconstruct {
  var $sqlObj = false;
  
  function SQLReconstruct() {
  }
  
  function SetSqlObject(&$selectSQL) {
    $this->sqlObj = &$selectSQL;
    
  }

  function PrimitiveExpr(&$parsed) {
    #if ($parsed['data'] == 'group') print $parsed['type'];
    $data = $parsed['data'];
    
    switch($parsed['type']) {
      case 'alpha_reservedWord':
      case 'alpha_identifier':
        if ($this->sqlObj) {
          if (!is_integer(strpos($data,'`'))) $data = "`$data`";
          $data = $this->sqlObj->GetFieldNameByAlias($data);
        }
        break;
    }
      
    return $data;
  }

  function BinaryExpr(&$parsed) {
    if ($this->IsBinary($parsed[0]['type'])) {
      $op = '(';
      $cp = ')';
    }
    $ret = $op.$this->reconstruct($parsed[0]).$cp.' '.$parsed['data'].' ';
    
    if ($this->IsBinary($parsed[1]['type'])) {
      $op = '(';
      $cp = ')';
    }
    return $ret.$op.$this->reconstruct($parsed[1]).$cp;
  }
  
  function FuncCallExpr(&$parsed) {
    $res = $parsed['ident']['data'].'(';
    $params = $parsed['params'];
    
    $n = count($params);
    for ($it=0;$it<$n;$it++) {
      if ($it) {
        $res .= ', ';
      }
      $res .= $this->reconstruct($params[$it]);
    }
    return $res .= ')';
  }
  
  function ParentExpr(&$parsed) {
    return '('.$this->reconstruct($parsed['expr']).')';
  }

  function IsBinary($type) {
    switch ($type) {
      case 'And':
      case 'Or':
      case 'Mult':
      case 'Add':
      case 'Like':
      case 'Compare':
        return true;
    }
    return false;
  }
  
  function DotField(&$parsed) {
    $type = $parsed['right']['type'];
    if ($type == 'DotField') {
      return $parsed['left']['data'].'.'.$this->DotField($parsed['right']);
    } else {
      return $parsed['left']['data'].'.'.$parsed['right']['data'];
    }
  }

  function reconstruct(&$parsed) {
    switch ($parsed['type']) {
      case 'And':
      case 'Or':
      case 'Mult':
      case 'Add':
      case 'Like':
      case 'Compare':
        return $this->BinaryExpr($parsed);
      case 'Function':
        return $this->FuncCallExpr($parsed);
      case 'Parent':
        return $this->ParentExpr($parsed);
      case 'DotField':
        return $this->DotField($parsed);
      default:
        return $this->PrimitiveExpr($parsed);
    }
  }
}
?>
