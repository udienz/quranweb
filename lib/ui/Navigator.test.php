<?php
include_once(MDB_DIR."ui/Navigator.class.php");

class NavigatorTests extends TestCase {
  function NavigatorTests($name) {  $this->TestCase($name); }

  function setup() { 
  }

  function tearDown() {
  }

  function testOffsetPage() {
    GLOBAL $mdbGlobal;
    $mdbGlobal->pgaa = 10; //!< take precedence
    $mdbGlobal->ofsaa = 10;

    $testClass = new Navigator;
    $testClass->id = 'aa';
    $testClass->url = 'testurl';
    $testClass->Update(1000,15);
    $testClass->SetOffsetPage();
 
    $this->assert($testClass->pages == 67, "pages: ".$testClass->pages);
    $this->assert($testClass->page == 10, "page: ".$testClass->page);
    $this->assert($testClass->offset == (10-1)*15, $testClass->offset." <> a:(10-1)*15");

    $mdbGlobal->pgaa = '1'; //!< take precedence
    $testClass->SetOffsetPage();
    $this->assert($testClass->page == 1, "b: 1 <> ".$testClass->page);

    $mdbGlobal->ofsaa = 13; 
    $mdbGlobal->pgaa = ''; //!< take precedence
    $testClass->SetOffsetPage();
    $this->assert($testClass->offset == 0, "c: 0 <> ".$testClass->offset);
    $this->assert($testClass->page == 1, "d: 1 <> ".$testClass->page);

    $mdbGlobal->ofsaa = '1000'; 
    $mdbGlobal->pgaa = ''; //!< take precedence
    $testClass->SetOffsetPage();
    $this->assert($testClass->page == (floor(1000/15)+1), "e: ".(floor(1000/15)+1)." <> ".$testClass->page);
    $this->assert($testClass->offset == 990, "f: 990 <> ".$testClass->offset);

    $mdbGlobal->ofsaa = '2000'; 
    $mdbGlobal->pgaa = ''; //!< take precedence
    $testClass->SetOffsetPage();
    $this->assert($testClass->page == (floor(1000/15)+1), "e: ".(floor(1000/15)+1)." <> ".$testClass->page);
    $this->assert($testClass->offset == 990, "f: 990 <> ".$testClass->offset);

    $mdbGlobal->ofsaa = ''; 
    $mdbGlobal->pgaa = ''; //!< take precedence
    $testClass->SetOffsetPage();
    $this->assert($testClass->page == 1, "f: 1 <> ".$testClass->page);
    $this->assert($testClass->offset == 0, "h: 0 <> ".$testClass->offset);

    $testClass->total = 0;
    $testClass->SetOffsetPage();
    $this->assert($testClass->page == 1, "i: 1 <> ".$testClass->page);
  }

  function testNavigator() {
    GLOBAL $mdbGlobal;
    $mdbGlobal->pgaa = 4;

    $testClass = new Navigator;
    $testClass->id = 'aa';
    $testClass->Update(1000,15);
    $testClass->url= "./?w=dbe";
    $testClass->SetOffsetPage();
    $this->assert($testClass->page == 4, "$testClass->page <> 4"); 
    
    $testClass->Render($rhtml);
    #$this->assert(0, $rhtml);
    #this->assert(0, $testClass->ToString());
    $this->assert($testClass->prev == 30, "$testClass->prev <> 30");
    $this->assert($testClass->last == 1005, "$testClass->last <> 1005");
    $this->assert($testClass->next == 60, "$testClass->next <> 60");
  }
}

$suite->addTest(new TestSuite("NavigatorTests"));
?>
