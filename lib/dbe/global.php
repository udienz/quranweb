<?
if (!defined('_MDB_DBE_GLOBAL_PHP')) {
  define (_MDB_DBE_GLOBAL_PHP, 1);
  
  require(MDB_DIR.'dbe/tableinfo.inc.php');

  if (!isset($mdbGlobal->sw)) {
    $mdbGlobal->sw = 'list';
  }

  # Maximum row per page for navigation:
  $maxRows = 15;
  
  # Get previous uri
  $mdbGlobal->dbeRef = str_replace('&', '&amp;', $_SERVER['REQUEST_URI']); 

  if ($mdbGlobal->tid && $mdbGlobal->sw != 'list') {
    $TABLEINFO = read_table_info();
    $mdbGlobal->nw[] = "tid=$mdbGlobal->tid";
    $mdbGlobal->dbeRef = uri_replace("tid", $mdbGlobal->tid, $mdbGlobal->dbeRef);
  } else {
    $mdbGlobal->tid = '';
    $mdbGlobal->dbeRef = uri_clear ('tid', $mdbGlobal->dbeRef);
  }

  # Set up permission: 
  require (MDB_DIR.'dbe/permission.php'); 
  
  # Reference:
  $mdbGlobal->nw = array();
  $mdbGlobal->nw[] = 'dbe';
  if ($mdbGlobal->sw) {
    $mdbGlobal->nw[] = "sw=$mdbGlobal->sw";
    $mdbGlobal->dbeRef = uri_replace("sw", $mdbGlobal->sw, $mdbGlobal->dbeRef);
  }
  
  # Received Filter (WHERE Expression) from Filter Box:
  $mdbGlobal->filter = trim(stripslashes($mdbGlobal->filter));
  if ($mdbGlobal->filter != '') {

    $filterStr = urlencode($mdbGlobal->filter);
    $mdbGlobal->nw[] = "filter=$filterStr";
    $mdbGlobal->dbeRef = uri_replace("filter", $filterStr, $mdbGlobal->dbeRef);
  } else {
    $mdbGlobal->dbeRef = uri_clear("filter", $mdbGlobal->dbeRef);
  }
  
  # pack in one... to be used in login bar!!!
  $mdbGlobal->nwpacked = @implode ("/", $mdbGlobal->nw);
  log_debug("[global.php] $mdbGlobal->nwpacked");
  
 } // end _MDB_DBE_GLOBAL_PHP
?>