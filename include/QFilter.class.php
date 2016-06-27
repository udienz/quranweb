<?
if (!defined('_QFilter_class_php')) {
  define('_QFilter_class_php', 1);

  include(QLIB_DIR . 'QFilterParser.class.php');

  class QFilter {
    function QFilter(&$qs, $name = false)
    {
      if ($name) $this->name = $name;
      else $this->name = _QFilter;
      $this->qs = &$qs;
    } 

    function printErrorLogs()
    {
    } 

    function &analyze(&$word)
    { 
      // delegates to parser:
      $parser = &$this->getParser();
      $tokens = &$parser->analyze($word);

      if (!$tokens) {
        $parser->printErrorLogs();
        return false;
      } 
      // var_dump($tokens); print '<br/>';
      $this->parsed_tree = &$parser->getExprTree();

      return $this->parsed_tree;
    } 

    /**
     * 
     * @return all found phrases in the last analyzed input.
     * The phrases were collected while building the filter string.
     * Call analyze then toString before use.
     */
    function getPhrases()
    {
      return $this->foundPhrases;
    } 

    /**
     * 
     * @return filter string for the last analyzed input.
     * Call analyze before use.
     */
    function toString()
    {
      $this->foundPhrases = array(); // initialise.
      return $this->buildExpr($this->parsed_tree);
    } 

    /* ------------------------ <<private>> -------------------------- */
    function &getTable()
    {
      return $this->qs->getTable();
    } 

    function &getParser()
    {
      if (!isset($this->parser)) {
        $this->parser = new QFilterParser();
      } 
      return $this->parser;
    } 

    /* ------------------------ <<builder>> -------------------------- */

    function &buildPrimitiveFilter(&$expr)
    {
      $phrase = $this->shapeInput($expr['data']);
      $this->foundPhrases[] = $phrase;

      $phrase = addslashes($phrase);
      if ($this->qs->isWholeWordSearch()) {
        return '(' . $this->getTable() . '.teks regexp "[[:<:]]' . $phrase . '[[:>:]]")';
      } else {
        return '(' . $this->getTable() . ".teks like '%$phrase%')";
      } 
    } 

    function &buildAndExpr(&$expr)
    {
      return '(' . $this->buildExpr($expr['left']) . ' AND ' . $this->buildExpr($expr['right']) . ')';
    } 

    function &buildOrExpr(&$expr)
    {
      return '(' . $this->buildExpr($expr['left']) . ' OR ' . $this->buildExpr($expr['right']) . ')';
    } 

    function &buildSingleVerseExpr(&$expr)
    {
      return '(' . $this->getTable() . ".no_vr = $expr[data]" . ')';
    } 

    function &buildVerseStartExpr(&$expr)
    {
      return '(' . $this->getTable() . ".no_vr >= " . $expr['verse']['data'] . ')';
    } 

    function &buildVerseRangeExpr(&$expr)
    {
      return
      '(' . $this->getTable() . ".no_vr >= " . $expr['start']['data'] . " AND " . $this->getTable() . ".no_vr <= " . $expr['end']['data'] . ')';
    } 

    function &buildVerseExpr(&$expr)
    {
      return
      '(' . $this->getTable() . ".no_sr = " . $expr['sura']['data'] . " AND " . $this->buildExpr($expr['verse']) . ')';
    } 

    function &buildSuraExpr(&$expr)
    {
      return '(' . $this->getTable() . ".no_sr = " . $expr['sura']['data'] . ')';
    } 

    function &buildExpr(&$expr)
    {
      if (!isset($expr['type'])) {
        return 'invalid expression';
      } 

      switch ($expr['type']) {
        case _WORD:
        case _PHRASE:
          return $this->buildPrimitiveFilter($expr);
        case _AndExpr:
          return $this->buildAndExpr($expr);
        case _OrExpr:
          return $this->buildOrExpr($expr);
        case _SingleVerseExpr:
          return $this->buildSingleVerseExpr($expr);
        case _VerseRangeExpr:
          return $this->buildVerseRangeExpr($expr);
        case _VerseStartExpr:
          return $this->buildVerseStartExpr($expr);
        case _VerseExpr:
          return $this->buildVerseExpr($expr);
        case _SuraExpr:
          return $this->buildSuraExpr($expr);
        default:
          return 'Unknown type ' . $expr['type'];
      } 
    } 

    function shapeInput($word)
    {
      $word = str_replace ('[al]', '<b>al</b>', $word); // alif-lam
      $word = str_replace ('[a]l', '<b>a</b>l', $word); // alif-lam
      $word = str_replace ('[', '<u>', $word); // dz, sh
      $word = str_replace (']', '</u>', $word); // dz, sh
      $word = str_replace ('`', "'", $word); // `ain --> 'ain
      $word = str_replace ('aa</u><u>', 'aa', $word);
      $word = str_replace ('</u><u>aa', 'aa', $word);
      $word = str_replace ('dz</u><u>dz', 'dzdz', $word);
      $word = str_replace ('sh</u><u>sh', 'shsh', $word);
      $word = str_replace ('dh</u><u>dh', 'dhdh', $word);
      $word = str_replace ('th</u><u>th', 'thth', $word);
      $word = str_replace ('zh</u><u>zh', 'zhzh', $word);
      $word = str_replace ('dz</u><u>aa', 'dzdzaa', $word);
      $word = str_replace ('sh</u><u>aa', 'shshaa', $word);
      $word = str_replace ('dh</u><u>aa', 'dhdhaa', $word);
      $word = str_replace ('th</u><u>aa', 'ththaa', $word);
      $word = str_replace ('zh</u><u>aa', 'zhzhaa', $word);
      return $word;
    } 
  } // end class QFilter
} // end define _QFilter_class_php

?>