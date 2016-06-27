<pre>
<?
  include ("SQLParser.class.php");
  include ("SQLReconstruct.class.php");

  include ("./pmalib/string.lib.php");
  include ("./pmalib/sqlparser.data.php");
  include ("./pmalib/sqlparser.lib.php");
  #error_reporting(E_ALL);

  $it = 0;

  $condition[$it]['inp'] = "group = 'DiN'";
  $condition[$it++]['out'] = "group = 'DiN'";
  $condition[$it]['inp'] = "Sumber = '%dian%'";
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = '(2 + 3) + A';
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = 'ABC(To.`ab`, 2)';
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = "CONCAT(TO.`Field`, '2', 3)";
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = '`T1`.`T0`.`field` <> 200';
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = '`To`.TO.`myfield`';
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = 'myfield <> 100';
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = 'ABC(`Field`, 3)';
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = 'ABC(2, 3)';
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = "CONCAT(Field, '2', 3)";
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = 'myfield = 100';
  $condition[$it]['out'] = $condition[$it++]['inp'];

  $condition[$it]['inp'] = '1 OR 0 AND 2+1';
  $condition[$it++]['out'] = '1 OR (0 AND (2 + 1))';

  $condition[$it]['inp'] = "CONCAT(`Field`, '2', 3)";
  $condition[$it]['out'] = $condition[$it++]['inp'];
  
  $condition[$it]['inp'] = '100*myfield+100/200';
  $condition[$it++]['out'] = '(100 * myfield) + (100 / 200)';

  $condition[$it]['inp'] = '100 * myfield <> 200 + 1';
  $condition[$it++]['out'] = '(100 * myfield) <> (200 + 1)';

  $condition[$it]['inp'] = 'myfield + 100 + 200';
  $condition[$it++]['out'] = '(myfield + 100) + (200)';

  $condition[$it]['inp'] = "me like 'you'";
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = '\'%dian%\'';
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = '100 * `field`';
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = '\'field\'';
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = '1 AND 0';
  $condition[$it]['out'] = $condition[$it++]['inp'];
  $condition[$it]['inp'] = 'myfield';
  $condition[$it]['out'] = $condition[$it++]['inp'];

  $it=0; // error conditions:
  $econdition[$it]['inp'] = 'ABC(To.Field, 2.)';
  $econdition[$it]['inp'] = '(2'; 
  $econdition[$it]['inp'] = 'myfield <> <'; 
  
  $cfg['SQP']['enable'] = true;

  #$condition = implode (' AND ', $condition);
  #$condition = '('.implode (') AND (', $condition).')';

  $parser = new SQLParser();
  $rec = new SQLReconstruct();

  foreach ($condition as $cond) {
    $pt = 0;
    $parsed_sql = PMA_SQP_parse($cond['inp']);
    $parse_tree = $parser->parse($parsed_sql, $pt); // this actually build into tokens.

    if (($out = $rec->reconstruct($parse_tree)) != $cond['out']) {
      #var_dump($parsed_sql);
      print "Error: $cond[inp] results $out, expected $cond[out]\n";
      print $parser->getErrors();
      var_dump($parse_tree);
    }
  }
    
  foreach ($econdition as $cond) {
    $pt = 0;
    $parsed_sql = PMA_SQP_parse($cond['inp']);
    $parse_tree = $parser->parse($parsed_sql, $pt); // this actually build into tokens.

    if (($out = $rec->reconstruct($parse_tree))) {
      print "Error: $cond[inp] results $out, expected false\n";
      var_dump($parse_tree);
    }
    #print $parser->getErrors();
  }
      
?>
</pre>