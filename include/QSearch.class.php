<?
if (!defined('__QSEARCH_CLASS_PHP')) {
  define('__QSEARCH_CLASS_PHP', 1);

  define ('QLIB_DIR', QSE_BASE_DIR . 'include/');
  require (QLIB_DIR . 'QSearchPrivate.class.php');

  /**
  * Quran Search Class
  */
  class QSearch extends QSearchPrivate {
    /**
    * Array of parameters. Could be assigned directly to $_GET or $HTTP_GET_PARAMS;
    * It may contains several keys of:
    * 'kata' => word/phrase/numbers being search 
    * 'search' => 'latin' for latin search, else language search
    * 'surah' => search sura.
    * 'whole' => search whole word
    * 'page' => page number to display, default is 1
    * 'display' => number of maximum verses to display, default is 20
    */
    var $param;

    /**
    * search languages.
    */
    var $languages;

    var $error;

    var $searchId = false;

    /**
    * Constructor
    * 
    * @param  $param array of parameters
    * @param  $languages array of available languages
    */
    function QSearch(&$param, &$languages)
    {
      $this->QSearchPrivate($param, $languages);
    } 

    /**
    * Instance initialization. 
    * Should be called after constructor call.
    */
    function init()
    {
      $this->word = stripslashes($this->param['kata']);
      $this->word = trim ($this->word);

      if ($this->word == '') {
        $this->word = '1-';
      } 

      unset($this->error);
      $this->error = array(); // re-init.
      return $this->initialised = true;
    } 

    /**
    */
    function printErrorLog()
    {
      foreach ($this->error as $error) {
        print "$error<br/>\n";
      } 
      $this->error = array();
    } 

    /**
    * alias for execute.
    */
    function getResult()
    {
      return $this->execute();
    } 

    /**
    * 
    * @return found phrases/words in the input word.
    * Usable for boldings :)
    * Use after getResult().
    */
    function &getPhrases()
    {
      $filterObj = &$this->getFilterObj();
      return $filterObj->getPhrases();
    } 

    function getNumRowsInPage()
    {
      return mysql_num_rows($this->result);
    } 

    function &getNextRow()
    {
      return mysql_fetch_row($this->result);
    } 

    /**
    * Run our QSearch based on given parameters.
    * 
    * @return MySQL result set
    */
    function execute()
    {
      log_debug('QSearch::execute');

      if (!$this->initialised) {
        $this->error[] = 'QS has not initialised yet';
        return false;
      } 

      if (!$this->result) { // not yet a result?
        $this->result = $this->ExecSQL($this->getSQL()); // try the new sql.          
        // echo $this->getSQL(); if you want to look at every requested SQL.
        if (!$this->result) {
          $this->error[] = mysql_error();
          return 0;
        } 
      } 
      return $this->result;
    } 

    /* ------------------------ <<param>> -------------------------- */
    /**
    * 
    * @return navigation options, separated by &amp;
    */
    function getNavOptions()
    {
      if ($this->navoption == '') {
        $this->navoption = QSE_BASE_URL . "&amp;kata=" . stripslashes(htmlentities($this->param['kata']));
        $this->navoption .= ($this->getLang())? "&amp;lang=" . $this->param['lang']:"";
        $this->navoption .= ($this->getSurah())? "&amp;surah=" . $this->param['surah']:"";
        $this->navoption .= ($this->getMaxRows())? "&amp;display=" . $this->param['display']:""; 
        // $this->navoption .= ($this->isORsearch())? "&amp;OR=on":"";
        $this->navoption .= ($this->isShowLatin())? "&amp;latin=on":"";
        $this->navoption .= ($this->isShowArabic())? "&amp;arabic=on":"&amp;arabicFont=off";
        $this->navoption .= ($this->isLiteSearch())? "&amp;lite=on":"";
        $this->navoption .= ($this->isLatinSearch())? "&amp;search=latin":"";
        $this->navoption .= ($this->isWholeWordSearch())? "&amp;whole=on":"";
        $this->navoption .= ($this->isShowFullText())? "&amp;istext=on":"";
        $this->navoption .= "&amp;submit=1";
      } 
      return $this->navoption;
    } 

    /*--------------------------- <<query>> -----------------------------*/
    /**
    * 
    * @return the filter string for the WHERE clause.
    */
    function getFilterStr()
    {
      if (!isset($this->filterStr)) {
        $filter = &$this->getFilterObj();

        if ($filter->analyze($this->word)) {
          $filterStr = $filter->toString();

          if ($this->getSurah() != "all" && $this->getSurah() != '') {
            // $filterStr = $this->getTable() . ".no_sr='" . $this->getSurah() . "' AND ($filterStr)";
            $filterStr = $this->getTable() . ".no like '" . $this->getSurah() . ":%' AND ($filterStr)"; //!< this is faster.
          } 

          $this->filterStr = $filterStr;
        } else {
          $filter->printErrorLogs();
          $this->filterStr = "0";
        } 
      } 

      return $this->filterStr;
    } 

    /**
    * 
    * @return number of pages in the search result.
    */
    function getPages()
    {
      return ceil($this->recordCount() / $this->getMaxRows());
    } 

    /**
    * 
    * @return number of result in search terms
    */
    function recordCount()
    {
      log_debug("QSearch::recordCount()");

      if (!$this->nRes) {
        $this->nRes = 0;

        if ($result = $this->ExecSQL($this->getSQLc())) {
          list($this->nRes) = mysql_fetch_row ($result);
        } 
      } 

      return $this->nRes;
    } 

    /**
    * QSearch::registerRequest()
    * 
    * @return 
    */
    /**
    * QSearch::registerRequest()
    * 
    * @return 
    */
    function registerRequest()
    {
      GLOBAL $user; //!< defined later or from PN.
      if ($this->isLatinSearch()) {
        $latin = '1';
      } else {
        $latin = '0';
      } 
      $word = addslashes($this->word);
      $lang = $this->getLang();
      $SQL = " INSERT INTO `listRequest` ";
      $SQL .= " (rid, user, modified, request, latin, lang, result) ";
      $SQL .= " VALUES ('$rid', '$user', NOW(), '$word', $latin, '$lang', '" . $this->recordCount() . "')";
      return QSearchPrivate::ExecSQL($SQL);
    } 

    /*--------------------------- <<static>> -----------------------------*/
    function getVerseId($no_sr, $no_vr, $lang = 'id')
    {
      GLOBAL $quranLanguage;
      $table = 'quran' . $quranLanguage[$lang];
      $SQL = "SELECT id FROM `$table` WHERE no='$no_sr:$no_vr'";
      if ($result = QSearchPrivate::ExecSQL($SQL)) {
        list($id) = mysql_fetch_row($result);
        return ($id);
      } else {
        return 0;
      } 
    } 

    function getVerseNoById($id, $lang = 'id') // !< static
    {
      GLOBAL $quranLanguage;
      $table = 'quran' . $quranLanguage[$lang];
      $SQL = "SELECT no_sr, no_vr FROM `$table` WHERE id=$id";
      if ($result = QSearchPrivate::ExecSQL($SQL)) {
        return mysql_fetch_row($result);
      } else {
        return array ('no_sr' => 1, 'no_vr' => 1);
      } 
    } 

    /**
    * 
    * @param  $table the table name (without back quotes ``).
    */
    function &getVerseTextFromTable($no_sr, $no_vr, $table) // !< static
    {
      $SQL = "SELECT teks FROM `$table` WHERE no='$no_sr:$no_vr'";
      if ($result = QSearchPrivate::ExecSQL($SQL)) {
        list($teks) = mysql_fetch_row($result);
        return $teks;
      } else {
        return false;
      } 
    } 

    /**
    * lang, e.g. : 'id' for Indonesia
    * id, e.g.: '1:2' for surah 1, verse 2
    */
    function &getVerseText($sr, $vr, $lang) // !< static
    {
      GLOBAL $quranLanguage; //!< from surah.inc
      return QSearch::getVerseTextFromTable($sr, $vr, 'quran' . $quranLanguage[$lang]);
    } 
  } 
} 

?>
