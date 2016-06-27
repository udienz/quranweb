<?
if (!defined('_QTableViewer_class_php')) {
  define ('_QTableViewer_class_php', 1);
  require (QSE_BASE_DIR . "include/qse2mdb.inc.php");
  require (MDB_DIR . "ui/DBTableRenderer.class.php");
  require (MDB_DIR . "ui/DBNavigator.class.php");
  require (MDB_DIR . "dbe/SelectSQL.class.php");

  class QTableViewer {
    var $selectSQL; //!< call init first. 
    function init()
    {
      GLOBAL $qseGlobal; //!< see qse2mdb.inc.php 
      $this->selectSQL = new SelectSQL($qseGlobal->dbe);
      $this->initComponent();
    } 

    function update()
    { 
      // changes in selectSQL must be reflected in renderer:
      $this->renderer->selectSQL = &$this->selectSQL; 
      // also in navigator:
      $this->navigator->SetRenderer($this->renderer); //!< 
    } 

    function setBaseUrl($url)
    {
      $this->base_url = $url;
	  $this->viewer->url = $this->base_url;
      $this->navigator->url = $this->base_url;
      $this->renderer->url = $this->base_url;
    } 

    function initComponent()
    {
      $viewer = new Component($template);
      $navigator = new DBNavigator();
      $renderer = new DBTableRenderer($this->selectSQL); 
      // configure renderer:
      $renderer->editAction = ''; // no editing
      $renderer->deleteAction = ''; // no delete
      if (isset($truncate)) $renderer->truncate = $truncate; 
      // give ids:
      $viewer->id = 'tb';
      // link each others:
      // $navigator->SetRenderer($renderer); //!< don't do it here.
      $viewer->AddComponent('navigator', $navigator);
      $viewer->AddComponent('renderer', $renderer);

      $viewer->template = "{navigator}\n{renderer}<br />\n{navigator}"; 
      // assign as properties:
      $this->viewer = &$viewer;
      $this->renderer = &$renderer;
      $this->navigator = &$navigator;
    } 

    function show()
    {
      $this->viewer->Render($rhtml);
      print $rhtml;
    } 
  } 
} // end define _QTableViewer_class_php

?>