<?
if (!(defined('_qse2mdb_inc_php'))) {
  define('_qse2mdb_inc_php', 1);

  /**
  * Some settings required to make QSE run above MDB library.
  */

  define ('MDB_DIR', QSE_BASE_DIR . 'lib/'); //!< MDB library is used.
  if (!defined('_ADODB_LAYER')) {
    define ('ADODB_DIR', 'lib/adodb/'); //!< also ADODB library.
  } 

  require (QSE_BASE_DIR . 'config.php');
  require (QSE_BASE_DIR . 'include/common.inc.php');
  require (MDB_DIR . 'dbe/DBE.class.php');

  if (defined('QSE_PN')) {
    $qseGlobal->ado = &$dbconn; //!< reuse connection from PN.
  } else { // !< ado has not defined.
    $qseGlobal->ado = ADONewConnection('mysql');
    $qseGlobal->ado->connect($sServer, $sUser, $sPass, $sDB);
  } 

  $qseGlobal->dbe = new DBE($qseGlobal->ado);
} 

?>