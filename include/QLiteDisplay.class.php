<?
  if (!defined('__QLiteDisplay_CLASS_PHP')) {
    define('__QLiteDisplay_CLASS_PHP', 1); 
    require QLIB_DIR.'QDisplay.class.php';

    /**
     * Lite Mode Display
     */
    class QLiteDisplay extends QDisplay {

      function show() { 

        $qs = &$this->qs;
        $result = $qs->getResult(); //!< needed before calling getNumRows and getNextRow
        if (!$result) {
          print $qs->getSQL();
          print $qs->printErrorLog();
        }

        $nRows = $qs->getNumRowsInPage($result);
        
        print $this->naviBar();
        print '<table>';
        for ($it=0;$it<$nRows;$it++) {
          list ($no_sr, $no_vr, $teks, $latin) = $qs->getNextRow();
          if ($latin) {
            print "\n<tr><td class=\"Latin\">$latin</td></tr>";
          }
          print "\n<tr><td><b>[$no_sr:$no_vr]</b> $teks</td></tr>";
        }
        print '</table>';
        print $this->naviBar();
      }
    } // end class QLiteDisplay
  }
?>
