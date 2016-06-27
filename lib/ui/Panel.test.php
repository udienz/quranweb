<?php
include_once(MDB_DIR."ui/Panel.class.php");

class PanelTests extends TestCase {
  function PanelTests($name) {  $this->TestCase($name); }

  function setup() { 
  }

  function tearDown() {
  }

  function testOffsetPage() {
    GLOBAL $mdbGlobal;
    $db = false;
    $template1 = '<h1>PanelTest</h1>';
    $testClass = new Panel($template1);
  }

}

$suite->addTest(new TestSuite("PanelTests"));
?>

