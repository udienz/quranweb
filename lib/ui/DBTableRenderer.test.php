<?php
include_once(MDB_DIR."ui/DBTableRenderer.class.php");

class DBTableRendererTests extends TestCase {
  function DBTableRendererTests($name) {  $this->TestCase($name); }

  function setup() { 
  }

  function tearDown() {
  }

  function testOrdering() {
    GLOBAL $mdbGlobal;
    $db = false;
    $selectSQL = new SelectSQL($db);
    $testClass = new DBTableRenderer($selectSQL);
    $testClass->id = 'bb';
    $testClass->url = 'testurl';

    $mdbGlobal->srbb = '';
    $mdbGlobal->sfbb = '1';
    $testClass->SetOrdering();
    $this->assert($testClass->az == 'az', "a: $testClass->az <> az");
    $this->assert($testClass->sr == 'desc', "b: $testClass->sr <> desc");

    $testClass->selectSQL->InitAll();
    $mdbGlobal->srbb = 'desc';
    $mdbGlobal->sfbb = '1';
    $testClass->SetOrdering();
    $this->assert(count($testClass->selectSQL->orders) == 1);
    $this->assert($testClass->az == 'za', "c: $testClass->az <> za");
    $this->assert($testClass->sr == 'asc', "d: $testClass->sr <> asc");
    $exp = "SELECT  FROM  ORDER BY 1 desc";
    $this->assert($testClass->selectSQL->ToString() == $exp, "f: ".$testClass->selectSQL->ToString()." <> $exp");
  }
}

$suite->addTest(new TestSuite("DBTableRendererTests"));
?>

