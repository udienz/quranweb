<?
if (!defined('__QDISPLAY_CLASS_PHP')) {
  define('__QDISPLAY_CLASS_PHP', 1);
  
  define ('_BISMILLAH', 'ÈöÓúãö Çááåö ÇáÑøóÍúãäö ÇáÑøóÍöíãö');

  /**
   * Display the QSearch object.
   */
  class QDisplay {
    var $param; //!< parameters array
    var $qs; //!< qsearch object.
    
    /**
     * Default constructor
     */
    function QDisplay()
    {
    } 

    function footnoteLink(&$teks, $lang)
    {
      /* static */
      $teks = preg_replace ('/\ \{(\w+)\}/e',
        //"'<sup onmouseover=\"javascript:showBalloon('\\1')\"><a href=\"javascript:footnote(\'$lang\','.'\\1'.')\">'.'\\1'.'</a></sup>'",
        "'<sup id=\"sup\\1\"><a onmouseover=\"javascript:showBalloon('.'\\1'.')\" href=\"javascript:footnote(\'$lang\','.'\\1'.')\">'.'\\1'.'</a></sup>'",
        $teks);
    } 

    function setQS(&$qs) // similar to that needed by QSearch
    {
      $this->qs = &$qs;
      $this->param = &$qs->param;
    } 

    function bolding (&$teks)
    {
      $ikata = &$this->qs->getPhrases();
      foreach ($ikata as $item) {
        $tempTeks = $teks;
        $teks = "";

        while (1) {
          $spos = strpos (strtoupper(" $tempTeks"), strtoupper($item));

          if (!$spos) {
            $teks .= $tempTeks;
            break;
          } 
          $spos--;

          $teks .=
          substr ($tempTeks, 0, $spos)
           . "<b style=\"color: #aa0000;\">"
           . substr ($tempTeks, $spos, strlen($item)) . "</b>";
          $tempTeks = substr ($tempTeks, $spos + strlen($item));
        } 
      } 
    } // end function
    /**
     * 
     * @return navigation bar, links to result pages.
     */
    function naviBar()
    {
      $qs = &$this->qs;

      $nRes = $qs->recordCount();
      $page = $qs->getPage();
      $nPag = $qs->getPages();
      $navoption = $qs->getNavOptions();

      $nav1 = "<b>Ditemukan $nRes ayat dalam $nPag halaman</b><br />";
      $sit = $page - 5;
      $eit = $page + 5;
      if ($eit > $nPag) {
        $eit = $nPag;
        $sit = $eit - 10;
      } 
      if ($sit < 1) $sit = 1;

      $nav = "";
      for ($it = $sit;$it <= $eit;$it++) {
        $ref = $navoption . "&amp;page=$it";
        if ($it != $page) $nav .= "<a href=\"$ref\">$it</a> ";
        else $nav .= "<b>$it</b> ";
      } 
      if ($page > 1 && $nPag != 1) $prev = "<a href=\"$navoption&amp;page=" . ($page-1) . "\">[&lt;&lt;]</a>";
      if ($page < $nPag) $next = "<a href=\"$navoption&amp;page=" . ($page + 1) . "\">[&gt;&gt;]</a>";
      $nav = "\n<table width=\"100%\" class=\"navbar\"><tr><td><center>$nav1 $prev $nav $next</center></td></tr></table>";
      return $nav;
    } // end function
    function show()
    {
      print "please override this function!";
    } 
  } // end class QDisplay
} 

?>
