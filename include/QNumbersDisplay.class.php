<?
  if (!defined('__QNumbersDisplay_CLASS_PHP')) {
    define('__QNumbersDisplay_CLASS_PHP', 1); 
    require QLIB_DIR.'QDisplay.class.php';

    /**
     * Display Verse Numbers only.
     */
    class QNumbersDisplay extends QDisplay {

      function show() { 

        $qs = &$this->qs;
        $result = $qs->getResult(); //!< needed before calling getNumRows and getNextRow
        if (!$result) {
          print $qs->getSQL();
          print $qs->printErrorLog();
        }

        $nRows = $qs->getNumRowsInPage($result);
        
        print "<br/><b><em>"._FOUNDVERSES.":</em></b><br/>"; 
        
        $new = true;
        $sr = 0;
        
        $navOpts = $qs->getNavOptions().'&amp;istext=on';
        $word = $qs->getSearchWord();;
        
        print "<table>";
        for ($it=0;$it<$nRows;$it++) {
          list ($no_sr, $no_vr) = $qs->getNextRow();
      
          if ($no_sr != $sr) {
            $sr = $no_sr;
            
            if (!$new) print "</td></tr>";
            print "<tr><td>Surah  <a href=\"$navOpts&amp;kata=$word $sr:\">$sr</a>: ".
            "<a href=\"$navOpts&amp;kata=$sr:$no_vr $word\">$no_vr</a>";
            
          } else {
            
            print ", <a href=\"$navOpts&amp;kata=$word $sr:$no_vr\">$no_vr</a>";
          }
          
          $new = false;
        }
        
        print "</table>";
        
        print "<b><em>Total: ".$nRows."</em></b>";
      }
    } // end class QNumbersDisplay
  }
?>
