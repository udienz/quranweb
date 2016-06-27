<?
include MDB_DIR.'dbe/pmalib/string.lib.php';
include MDB_DIR.'dbe/pmalib/sqlparser.data.php';
include MDB_DIR.'dbe/pmalib/sqlparser.lib.php';
include MDB_DIR.'dbe/SQLParser.class.php';
include MDB_DIR.'dbe/SQLReconstruct.class.php';

$cfg['SQP']['enable'] = true;

function filter_reconstruct($filter, &$selectSQL) {

  if ($filter == '') return '';
  
  $parser = new SQLParser();
  $rec = new SQLReconstruct();
  $rec->SetSqlObject($selectSQL);

  $pt = 0;    
  $lexed_sql = PMA_SQP_parse($filter);
  $parsed_sql = $parser->parse($lexed_sql, $pt); // this actually build into tokens.

  #print "<br/>";
  #var_dump($parsed_sql);
  
  if ($parsed_sql) {
    return $rec->reconstruct($parsed_sql);
  } else {
    log_error($parser->getErrors());
    return '';
  }
}    
    
?>