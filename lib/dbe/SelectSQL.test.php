<?php
include_once(MDB_DIR."dbe/SelectSQL.class.php");

class SelectSQLTests extends TestCase {
  function SelectSQLTests($name) {  $this->TestCase($name); }

  function setup() { 
  }

  function tearDown() {
  }

  function testSelectAll() {
    $db = false;
    $testClass = new SelectSQL($db);
    $testClass->fields[] = '*';
    $testClass->tables[] = "diantea";

    $s[0] = "SELECT * FROM diantea";

    $i=0;
    $this->assert($s[$i++] == $testClass->SELECTClause(),$testClass->SELECTClause());
  }

  function testSelectSQL() {
    $db = false;
    $testClass = new SelectSQL($db);
    $testClass->fields['Name'] = 'ContactName';
    $testClass->fields['`0`'] = 'Address';
    $testClass->tables[] = "diantea";
    $testClass->filters[] = "dian = ich";
    $testClass->filters[] = "du = you";
    $testClass->orders[] = "dian asc";

    $s[0] = "SELECT ContactName Name, Address `0` FROM diantea";
    $s[1] = "ContactName Name, Address `0`";
    $s[2] = "diantea";
    $s[3] = "SELECT COUNT(*) FROM diantea WHERE (dian = ich) AND (du = you)";
    $s[4] = " WHERE (dian = ich) AND (du = you)";
    $s[5] = "SELECT ContactName Name, Address `0` FROM diantea WHERE (dian = ich) AND (du = you) ORDER BY dian asc";

    $i=0;
    $this->assert($s[$i++] == $testClass->SELECTClause(),$testClass->SELECTClause());
    $this->assert($s[$i++] == $testClass->FIELDSClause(),$testClass->FIELDSClause());
    $this->assert($s[$i++] == $testClass->TABLESClause(),$testClass->TABLESClause());
    $this->assert($s[$i++] == $testClass->SELECTCount(),$testClass->SELECTCount());
    $this->assert($s[$i++] == $testClass->WHEREClause(),$testClass->WHEREClause());
    $this->assert($s[$i++] == $testClass->ToString(),$testClass->ToString());

    $testClass->InitAll();
    $this->assert("" == $testClass->TABLESClause(), $testClass->TABLESClause());
    $this->assert("" == $testClass->FIELDSClause(), $testClass->FIELDSClause());
    $this->assert("" == $testClass->WHEREClause(), $testClass->WHEREClause());
  }
}

$suite->addTest(new TestSuite("SelectSQLTests"));
?>
