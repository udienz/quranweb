<?
if(!defined('__DBNavigator_class')) {
  define('__DBNavigator_class', 1);
  include_once(MDB_DIR.'ui/Navigator.class.php');
  
  class DBNavigator extends Navigator {

    var $maxRows = 15;
    
    function DBNavigator() {
      $this->Navigator();
    }
    
    function SetRenderer(&$renderer) {
      
      if ($renderer) {
        
        $this->Update($renderer->selectSQL->RecordCount(), $this->maxRows); //!< set total and limit
        $renderer->selectSQL->offset = $this->offset; //!< set the offset
        $renderer->selectSQL->limit = $this->limit; //!< set the offset

      } else {
        log_error('Null renderer given to DBNavigator');

      } 
    }
    
  }; // end class DBNavigator
} // end define __DBNavigator_class
?>