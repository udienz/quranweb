<?
if(!defined('_QFilterParser_class_php')) {
  
  define('_QFilterParser_class_php', 1);
  
  class QParser {
    
    function error($origin, $expected = false) {
      $this->stopped = true;
      $this->Error[] = "Error at $origin". (($expected)? ", expecting $expected." : ".");
    }
      
    function &getError() {
      $result = &$this->Error;
      unset($this->Error);
      $this->Error = array();
        
      return $result;
    }
    
    function hasError() {
      return count($this->Error);
    }
      
    function printErrorLogs() {
      $errors = &$this->getError();
      if (count($errors)) 
      foreach ($errors as $log) {
        print "$log<br/>\n";
      }
    }
      
    function &tokenLA($index) {
      return $this->tokens[$this->pt+$index]['type'];
    }
    
    function &nextToken($index = 0) {
      $token = &$this->tokens[$this->pt+$index];
      $this->pt += $index + 1;
      return $token;
    }

    function &analyze(&$word) {
      log_debug("QFilterParser::analyze");
     
      $this->word = $word; 
      
      while ($token = &$this->analyzeElement()) {
        if ($token['type'] != _SKIP) {
          $this->tokens[] = &$token;
        }
      }
      
      $this->word = trim($this->word);
      $residueL = strlen($this->word);
      
      if ($residueL) {
        $index = strlen($word) - $residueL;
        $this->Error[] = "'$word[$index]' is unexpected at column $index ";
      }
      
      return $this->tokens;
    }

  } // end class QParser
  
  class QFilterParser extends QParser {

    function &parseVerseExpr() {
      if ($this->stopped) return false;
      
      if ($this->tokenLA(0) == _DIGIT) {
        $a = $this->nextToken();
        
        if ($this->tokenLA(0) == _MINUS) {
          $b = $this->nextToken();
          
          if ($this->tokenLA(0) == _DIGIT) { // another digit found
            $c = $this->nextToken();
            $b['type'] = _VerseRangeExpr;
            $b['start'] = &$a;
            $b['end'] = &$c;
            
            return $b;
          }
          
          $b['type'] = _VerseStartExpr;
          $b['verse'] = &$a;
          
          return $b;
        }
        
        $a['type'] = _SingleVerseExpr;
        return $a;  
      }
      
      #$this->error('_VerseExpr', '_DIGIT');
      return false;
      
    }
    
    function &parseSuraExpr() {
      if ($this->stopped) return false;
      
      if ($this->tokenLA(0) == _DIGIT) {
        
        if ($this->tokenLA(1) == _COLON) {
          $a = $this->nextToken(); //!< digit
          $b = $this->nextToken(); //!< colon

          if ($c = &$this->parseVerseExpr()) {

            $b['type'] = _VerseExpr;
            $b['sura'] = &$a;
            $b['verse'] = $c;
            
          } else {
            // null, only sura number requested.
            
            $b['type'] = _SuraExpr;
            $b['sura'] = &$a;
            
          }
        
          return $b;
        } else {
          
          $a = &$this->parseVerseExpr();
          return $a;
        }

      }

      return false;
    }
    
    function &parsePrimExpr() {
      if ($this->stopped) return false;
      
      if ($this->tokenLA(0) == _COMMA) {
        return false;
      
      } else if ($a = &$this->parseSuraExpr()) {
        return $a;

      } else if ($this->tokenLA(0) == _WORD || $this->tokenLA(0) == _PHRASE) { 
        $a = $this->nextToken();
        return $a;
      
      } else if ($this->tokenLA(0)){

        $this->error('_PrimExpr unexpected '.$this->tokenLA(0));
      }
      return false;
      
    }
    
    function &parseAndExpr() {
      if ($this->stopped) return false;
      
      if ($a = &$this->parsePrimExpr()) {
        $sPt = $this->pt;
        
        while ($c = &$this->parsePrimExpr()) {
          $b = &$a;
          unset($a);
            
          $a = array (
            'type' => _AndExpr,
            'left' => &$b,
            'right' => &$c,
          );

          $sPt = $this->pt;
        }
          
        return $a;
      }
    
      return false;
    }
    
    function &parseOrExpr() {
      if ($this->stopped) return false;
      
      if ($a = &$this->parseAndExpr()) {
        $sPt = $this->pt; //!< save current position.
        
        // there is a valid operator.
        while ($this->tokenLA(0) == _COMMA) {

          $b = &$a;
          unset($a);
          $a = $this->nextToken();

          // then second expression is needed
          if (!($c = &$this->parseAndExpr())) { 
            
            $this->error('_OrExpr', '_AndExpr');
            $this->pt = $sPt; //!< back due to an error.

            return false;
          }

          $a['type'] = _OrExpr;
          $a['left'] = &$b;
          $a['right'] = &$c;

          $sPt = $this->pt;
        }
      
        return $a;
      }
      #$this->error('_OrExpr');
      
      return false;
    }
      
    function &getExprTree() {
      $this->pt = 0;
      $this->stopped = false;
      
      $tree = &$this->parseOrExpr();

      if (!$tree || $this->stopped) {

        $this->printErrorLogs();
        return false;
      }
      
      return $tree;
    }
      
    function &analyzeElement() {

      $word = &$this->word;

      if ($word[0] == '"') {
        $word = substr($word, 1);
        if (preg_match('/^[\/\`\'\w\s\[\]\-,\.]+/', $word, $matches)) {
          $result = array ('type' => _PHRASE, 'data' => $matches[0]);
          if ($word[$l = strlen($matches[0])] == '"') {
            $word = substr($word, $l+1);
          } else {
            $result['type'] = _INVALIDPHRASE;
          }
        }
  
      } else if (preg_match('/^\d+/', $word, $matches)) {
        $result = array ('type' => _DIGIT, 'data' => $matches[0]);
        $word = substr($word, strlen($matches[0]));
          
      } else if (preg_match('/^\-?\d+/', $word, $matches)) {
        $result = array ('type' => _MINUS, 'data' => '-');
        $word = substr($word, 1);
        
      } else if (preg_match('/^\-?[\/\`\'\w\[\]]+/', $word, $matches)) { 
        $result = array ('type' => _WORD, 'data' => str_replace('`', "'", $matches[0]));
        $word = substr($word, strlen($matches[0]));
        
      } else if (preg_match('/^\s+/', $word, $matches)) {
        $result = array ('type' => _SKIP, 'data' => $matches[0]);
        $word = substr($word, strlen($matches[0]));
  
      } else if ($word[0] == '-') {
        $result = array ('type' => _MINUS, 'data' => '-');
        $word = substr($word, 1);
        
      } else if ($word[0] == ':') {
        $result = array ('type' => _COLON, 'data' => ':');
        $word = substr($word, 1);
        
      } else if ($word[0] == ',') {
        $result = array ('type' => _COMMA, 'data' => ',');
        $word = substr($word, 1);
        
      } else {

        $result = false;
      }
              
      return $result;
    }

  } // end class QFilterParser
  
} // end define
?>
