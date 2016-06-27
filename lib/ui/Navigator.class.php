<?
if (!defined('__Navigator_class')) {
  define('__Navigator_class', 1);
  require (MDB_DIR . 'ui/Component.class.php');
  require (MDB_DIR . 'ui/lang/eng.php');
  require (MDB_DIR . 'ui/input.inc.php');

  /**
   * Navigation element.
   * This class gives capability to navigate through database page.
   */
  class Navigator extends Component {
    var $total = 0; //!< Required. Total data/rows to navigate. 
    var $limit = 15; //!< Required. Number of data/rows displayed per page.
    
    var $page = 0; //!< Current page. Will be set after call to SetOffsetPage.
    var $offset = 0; //!< Current row's offset. Will be set after call to SetOffsetpage.
    var $pages = 0; //!< Total pages. 
    
    var $pgid; //!< page number identifier in _GET variable used by this navigator. 
    var $ofsid; //!< offset identifier in _GET variable used by this navigator. 
    var $first; //!< offset to first page. (Private) 
    var $last; //!< offset to last page. (Private) 
    var $next; //!< offset to next page. (Private) 
    var $prev; //!< offset to prev page. (Private) 
    
    /**
     * Constructor.
     */
    function Navigator()
    {
      $this->Component('');
      $this->template = "<form method=\"post\" action=\"\">\n" . "<table cellspacing=\"0\" cellpadding=\"0\" width=\"100%\">\n" . "<tr><td style=\"text-align:center\"class=\"mdbSearchMessage\">" . _AYA . " {total} " . _EUSIDINA . " " . "{pages} " . _KACA . "<br/>{navigation}</td>\n" . "<!--td class=\"mdbSearchMessage\" style=\"text-align:right\">" . _LONCATKE . ": " . inputtext('{pgid}', '{page}', 4) . "</td--></tr></table></form>\n";
    } 

    /**
     * Calculates the offsets for first, prev, next, and last.
     */
    function SetNavigations()
    {
      $this->navigation = '';
      $ofsid = $this->ofsid; 
      // clear some url params:
      $this->url = uri_clear($ofsid, $this->url); 
      // first:
      $this->navigation .= ($this->offset > 0)?
      " <a href=\"$this->url&amp;$ofsid=0\">" . _FIRST . "</a>" :
      " " . _FIRST; 
      // prev:
      $this->prev = ($this->offset - $this->limit);
      $this->navigation .= ($this->prev >= 0)?
      " <a href=\"$this->url&amp;$ofsid=$this->prev\">" . _PREV . "</a>" :
      " " . _PREV; 
      // up to ten pages:
      $startit = ($this->page-5) * $this->limit;
      $endit = $startit + $this->limit * 10;
      if ($startit < 0) $startit = 0;
      if ($endit > $this->total) $endit = $this->total;

      for ($it = $startit;$it < $endit;$it += $this->limit) {
        $page = floor($it / $this->limit) + 1;
        $this->navigation .= ($this->page != $page)?
        " <a href=\"$this->url&amp;$ofsid=$it\">$page</a>" :
        " <strong class=\"mdbSearch\">$page</strong>";
      } 

      $nextCond = $this->offset < ($this->total - $this->limit); 
      // next:
      $this->next = ($this->offset + $this->limit);
      $this->navigation .= ($nextCond)?
      " <a href=\"$this->url&amp;$ofsid=$this->next\">" . _NEXT . "</a>" :
      " " . _NEXT; 
      // last:
      if (($this->total % $this->limit) == 0) {
        $this->last = ($this->pages-1) * $this->limit;
      } else {
        $this->last = $this->pages * $this->limit;
      } 
      $this->navigation .= ($nextCond)?
      " <a href=\"$this->url&amp;$ofsid=$this->last\">" . _LAST . "</a>" :
      " " . _LAST;
    } 

    /**
     * Set offset page.
     */
    function SetOffsetPage()
    {
      GLOBAL $_REQUEST; 

      // url:
      $this->url = $this->GetURL(); 
      // number of pages
      $this->pages = ceil($this->total / $this->limit); 
      // id:
      $this->pgid = $pgid = 'pg' . $this->GetID();
      $this->ofsid = $ofsid = 'ofs' . $this->GetID(); 
      // page number:
      $this->page = $_REQUEST[$pgid];
      $this->offset = $_REQUEST[$ofsid];

      if ($this->page != "") {
        $this->url = uri_replace($pgid, $this->page, $this->url);
        if ($this->page < 1) $this->page = 1;
        else if ($this->page > $this->pages) $this->page = $this->pages;
        $this->offset = ($this->page-1) * $this->limit;
      } else {
        // echo "$ofsid: ".$this->offset;
        if ($this->offset == '') {
          $this->offset = 0;
        } else {
          $this->url = uri_replace($ofsid, $this->offset, $this->GetURL());
          if ($this->offset < 1) $this->offset = 0;
          else if ($this->offset > $this->total) $this->offset = $this->total;
          $this->offset = $this->limit * floor($this->offset / $this->limit);
        } 

        $this->page = $this->offset / $this->limit + 1;
      } 
    } 

    function ToString()
    {
      return "{offset=$this->offset, prev=$this->prev, next=$this->next, last=$this->last, page=$this->page, pages=$this->pages}";
    } 

    /**
     * Update.
     * Called before Render to update the navigation with new limit and total value
     */
    function Update($total, $limit = false)
    {
      if ($limit) $this->limit = $limit; //!< otherwise use previous limit.
      $this->total = $total;
      $this->SetOffsetPage();
      $this->SetNavigations();
    } 

    /**
     * Navigator rendering.
     * 
     * @param rhtml $ placement for output.
     */
    function Render(&$rhtml)
    {
      $ohtml = str_replace('{pages}', $this->pages, $this->template);
      $ohtml = str_replace('{page}', $this->page, $ohtml);
      $ohtml = str_replace('{total}', $this->total, $ohtml);
      $ohtml = str_replace('{pgid}', $this->pgid, $ohtml);
      $rhtml .= str_replace('{navigation}', $this->navigation, $ohtml);
    } 
  } ;
} 

?>
