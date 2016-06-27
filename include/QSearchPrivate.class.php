<?
if (!defined('QSearchPrivate_class_php')) {
  define('QSearchPrivate_class_php', 1);

  require (QLIB_DIR . 'common.inc.php');
  require (QLIB_DIR . 'QFilter.class.php');

  /**
   * This class contains protected functions of QSearch.
   */
  class QSearchPrivate {
    /**
     * Constructor
     */
    function QSearchPrivate(&$param, &$languages)
    {
      $this->param = &$param;

      $this->languages = &$languages;
      $this->error = array();
      $this->error[] = "QSearch hasn't been initialised yet.";
    } 

    /* ------------------------ <<param>> -------------------------- */
    /**
     * 
     * @return language code of current search
     */
    function getLang()
    {
      log_debug ("Language code '" . $this->param['lang'] . "'");
      if ($this->param['lang'] == '') {
        return 'id';
      } else {
        return $this->lang = $this->param['lang'];
      } 
    } 

    /**
     * 
     * @return maximum rows/result per page
     */
    function getMaxRows()
    {
      if ($this->param['display'] == '') {
        return 20; // default;
      } else {
        return $this->param['display'];
      } 
    } 

    /**
     * 
     * @return expected page number
     */
    function getPage()
    {
      if ($this->param['page'] == '') {
        return 1;
      } else {
        return $this->param['page'];
      } 
    } 

    /**
     * 
     * @return search term
     * @deprecated use getPhrases instead.
     */
    function getSearchWord()
    {
      log_debug('QSearchPrivate::getSearchWord() = ' . $this->param['kata']);
      if ($this->param['kata'] != '') {
        return $this->param['kata'];
      } 
      if ($this->param['submit']) {
        return $this->word; //!< shaped by init
      } 
      return '';
    } 

    /**
     * 
     * @return expected surah number
     */
    function getSurah()
    {
      if ($this->surah == '') {
        $this->surah = $this->param['surah'];
      } 

      return $this->surah;
    } 

    /**
     * Determine search modes
     */
    function isLatinSearch()
    {
      return $this->param['search'] == "latin";
    } 

    function isLiteSearch()
    {
      return $this->param['lite'] == 'on';
    } 

    /*
      function isORsearch() {
        return $this->param['OR'] == 'on';
      }*/

    function isSearchByWords()
    {
      return $this->searchByWords;
    } 

    function isShowLatin()
    {
      return $this->param['latin'] == 'on';
      //return true;
    } 

    function isShowArabic()
    {
      return $this->param['arabic'] == 'on';
    } 

    function isWholeWordSearch()
    {
      return $this->param['whole'] == 'on';
    } 

    function isShowFullText()
    {
      if ($this->param['istext'] != 'off') return 1;
      return 0;
    } 

    function isVerseNumbersOnly()
    {
      return !$this->isShowFullText();
    } 

    /*--------------------------- <<query>> -----------------------------*/

    function &getFilterObj()
    {
      if (!isset($this->filterObj)) {
        $this->filterObj = new QFilter($this);
      } 

      return $this->filterObj;
    } 

    /**
     * 
     * @return comma -separated field names for the SQL of current search
     */
    function getFields()
    {
      $table = $this->getTable();
      $langTable = $this->getLangTable(); 
      // display arabic font
      if (!$this->isLiteSearch()) {
        $fieldArabic = ", quranArabic.teks";
      } else {
        $fieldArabic = ", null";
      } 

      $fields = "$table.no_sr, $table.no_vr";
      if ($this->isShowFullText()) {
        if ($this->isLatinSearch()) {
          $fields .= ", $langTable.teks, $table.teks$fieldArabic";
        } else if ($this->isShowLatin() && !$this->isLatinSearch()) {
          $fields .= ", $table.teks, $langTable.teks$fieldArabic";
        } else {
          $fields .= ", $table.teks, null$fieldArabic";
        } 
      } 

      return $fields;
    } 

    /**
     * 
     * @return name of language table
     */
    function getLangTable()
    {
      if ($this->langTable == '') {
        if ($this->isLatinSearch()) {
          $this->langTable = 'quran' . $this->languages[$this->getLang()];
        } else {
          $this->langTable = 'quranLatin';
        } 
      } 
      return $this->langTable;
    } 

    /**
     * 
     * @return name of search table
     */
    function getTable()
    { 
      // search table:
      if ($this->table == '') {
        if ($this->isLatinSearch()) {
          $this->table = 'quranLatin';
        } else {
          $this->table = 'quran' . $this->languages[$this->getLang()];
        } 
      } 
      return $this->table;
    } 

    /**
     * 
     * @return SQL statement for current search
     */
    function getSQL()
    { 
      // tables
      $table = $this->getTable();
      if ($this->isShowFullText()) {
        $maxRows = $this->getMaxRows();
        $nRecs = $this->recordCount();
        $offset = ($this->getPage()-1) * $maxRows;
        if ($offset >= $nRecs) $offset = floor($nRecs / $maxRows) * $maxRows;
        $limit = ", " . $maxRows;
        $LIMIT = "LIMIT $offset$limit";
      } 

      $this->SQL = "
          SELECT " . $this->getFields() . "
          FROM " . $this->getFromTables() . "
          WHERE " . $this->getFilterStr() . "
          $GROUP
          ORDER BY $table.no_sr, $table.no_vr
          $LIMIT";
      log_debug("QSearchPrivate::getSQL()");
      return $this->SQL;
    } 

    /**
     * 
     * @return SQL statement for counting record in the current search
     */
    function getSQLc()
    {
      if ($this->SQLc == '') {
        $this->SQLc = "SELECT COUNT(*) FROM " . $this->getTable() . " WHERE " . $this->getFilterStr();
      } 
      log_debug("QSearchPrivate::getSQLc()");
      return $this->SQLc;
    } 

    function ExecSQL($SQL) // !< static
    {
      log_debug("QSearchPrivate::ExecSQL()\n$SQL\n");
      if ($result = mysql_query($SQL)) {
        return $result;
      } else {
        log_error("$SQL::" . mysql_error());
        return 0;
      } 
    } 

    /**
     * 
     * @return string for FROM clause.
     */
    function getFromTables()
    {
      $table = $this->getTable();
      $langTable = $this->getLangTable();
      if (!$this->isLiteSearch() && $this->isShowFullText()) {
        $joinArabic = " LEFT JOIN quranArabic on $table.no=quranArabic.no";
      } else {
        $joinArabic = "";
      } 

      if ($this->isLatinSearch() || $this->isShowLatin()) {
        $fromTable = "$table LEFT JOIN $langTable ON $table.no=$langTable.no$joinArabic";
      } else {
        $fromTable = "$table$joinArabic";
      } 
      return $fromTable;
    } 
  } // end class QSearchPrivate
} 

?>
