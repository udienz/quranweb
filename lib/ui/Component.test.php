<?php
include_once(MDB_DIR."ui/Component.class.php");

class ComponentTests extends TestCase {
  function ComponentTests($name) {  $this->TestCase($name); }

  function setup() { 
  }

  function tearDown() {
  }

  function testAddRemove() {
    $template1 = "<h1>ComponentTest</h1>\n{title}\n{description}";
    $template2 = "<h2>Title</h2>";
    $template3 = "<h2>Description</h2>";

    $id1 = 'myID';
    $url1 = 'myURL';

    $it=1;
    $testClass = new Component($template1);
    $testClass->id = $id1;
    $testClass->url = $url1;
    $this->assert(count($testClass->components) == 0, ($it++).":count <> 0");
    $this->assert($testClass->GetID() == $id1, ($it++).":wrong id ".$testClass->GetID());
    $this->assert($testClass->GetURL() == $url1, ($it++).":wrong url ".$testClass->GetURL());

    $child1 = new Component($template2);
    $testClass->AddComponent('title', $child1);
    $this->assert(count($testClass->components) == 1, ($it++).":count <> 1");
    $this->assert($child1->GetID() == $id1, ($it++).":wrong id ".$child1->GetID());
    $this->assert($child1->GetURL() == $url1, ($it++).":wrong url ".$child1->GetURL());

    $child2 = new Component($template3);
    $testClass->AddComponent('description', $child2);
    $this->assert(count($testClass->components) == 2, ($it++).":count <> 2");
    $child2->Render($a1html);
    $this->assert($a1html == $template3, $a1html);

    # change to template2 should be reflected to parent.
    $child2->template = $template2;
    $testClass->components['description']->Render($a2html);
    $this->assert($a2html == $template2, $a2html);

    $testClass->Remove('description');
    $this->assert(count($testClass->components) == 1, ($it++).":count <> 1");
    $this->assert($child2->GetID() == '', ($it++).":wrong id ".$child2->GetID());
  }

  function testRender() {
    $template1 = "<h1>ComponentTest</h1>\n{title}\n{description}";
    $template2 = "<h2>Title</h2>";
    $template3 = "<h2>Description</h2>";
    
    $testClass = new Component($template1);
    $testClass->Render($rhtml);
    $this->assert($rhtml == $template1, $rhtml);

    $child1 = new Component($template2);
    $child1->Render($c1html);
    $this->assert($c1html == $template2, $c1html);

    $child2 = new Component($template3);
    $child2->Render($c2html);
    $this->assert($c2html == $template3, $c2html);

    $testClass->AddComponent('title', $child1);
    $testClass->AddComponent('description', $child2);
    $rhtml = '';
    $testClass->Render($rhtml);
    $exp = str_replace('{title}', $template2, $template1);
    $exp = str_replace('{description}', $template3, $exp);
    $this->assert($rhtml == $exp, $rhtml);

    $testClass->Remove('description');
    $rhtml = '';
    $testClass->Render($rhtml);
    $exp = str_replace('{title}', $template2, $template1);
    $this->assert($rhtml == $exp, $rhtml);
  }
}

$suite->addTest(new TestSuite("ComponentTests"));
?>


