<?
  class SQLParser {
    
    function SQLParser() {
    }
  
    function parse_(&$lexed, &$pt) {
      $sPt = $pt;
      
      $pt = $sPt;
      return false;
    }

    function parseIsCondition(&$lexed, &$pt) {
      $sPt = $pt;
            
      $pt = $sPt;
      return false;
    }
    
    function parseUnaryOp(&$lexed, &$pt) {
      $sPt = $pt; // start pointer

      switch ($lexed[$pt]['data']) {
        case 'NOT':  // eq
          return $lexed[$pt++];
      }
      
      $pt = $sPt;
      return false;
    }
    
    function parseComma(&$lexed, &$pt) {
      switch ($lexed[$pt]['data']) {
        case ',':
          return $lexed[$pt++];
      }
      return false;
    }
    
    function parseLparent(&$lexed, &$pt) {
      switch ($lexed[$pt]['data']) {
        case '(':
          return $lexed[$pt++];
      }
      return false;
    }
    
    function parseRparent(&$lexed, &$pt) {
      switch ($lexed[$pt]['data']) {
        case ')':
          return $lexed[$pt++];
      }
      return false;
    }
    
    function parseFuncParams (&$lexed, &$pt) {
      $res = array();
      $sPt = $pt;
           
      if ($lexed[$pt]['data'] == ')') return $res;
      
      $a = $this->parseOrExpr($lexed, $pt);
      
      if (!$a) {
        $pt = $sPt;
        return false;
      }
      
      $res[] = $a;
      
      while(1) {
        $b = $this->parseComma($lexed, $pt);
        if (!$b) break;
        
        $c = $this->parseOrExpr($lexed, $pt);
        if (!$c) {
          $this->error($lexed, $pt, 'funcParams', 'Expecting EXPR');
          break;
        }
        $res[] = $c;
      }
      
      if ($b && !$c) {
        $pt = $sPt;
        return false;
      }
      
      return $res;
    }
    
    function parseField(&$lexed, &$pt) {
        $sPt = $pt;
        
        $a = $lexed[$pt++];
        
        switch ($a['type']) {
          case 'alpha_identifier':
          case 'quote_backtick':
            $px = $pt;
            if (($b = $lexed[$pt++]) && ($b['data'] == '.')) {
              if (!($c = $this->parseField($lexed, $pt))) {
                break;
              }
          
              $b['type'] = 'DotField';
              $b['left'] = $a;
              $b['right'] = $c;
              return $b;
            }
            
            $pt = $px;
            return $a;
          default:
            break;
        }
        $this->error ($lexed, $pt, 'field', "Expecting FIELD after a DOT");
        
        $pt = $sPt;
        return false;
    }
    
    function parsePrimExpr(&$lexed, &$pt) {
      $op = '(';
      $cp = ')';

      $sPt = $pt; // start pointer

      if (($a = $lexed[$pt++]) && ($a['data'] == $op)) {
        $b = $this->parseOrExpr($lexed, $pt);
        if (!$b) {
          $this->error($lexed, $pt, 'compound', 'Expecting EXPR');
          $pt = $sPt;
          return false;
        }
        
        $c = $lexed[$pt++];
        if ($c['data'] != $cp) {
          $this->error($lexed, $pt, 'compound', 'Expecting LPARENT');
          $pt = $sPt;
          return false;
        }

        $a['type'] = 'Parent';
        $a['expr'] = $b;
        return $a;
      }

      $pt = $sPt;
      $a = $lexed[$pt++];
      if ($a['type'] == 'quote_backtick') {
        $sx = $pt;

        if (($b = $lexed[$pt++]) && ($b['data'] == '.')) {
          
          if (!($c = $this->parseField($lexed, $pt))) {
            $pt = $sPt;
            return false;
          }
          
          $b['type'] = 'DotField';
          $b['left'] = $a;
          $b['right'] = $c;
          return $b;
        }

        $pt = $sx;        
        return $a;

      } else if (
        $a['type'] == 'alpha_identifier' || 
        $a['type'] == 'alpha_functionName' || 
        $a['type'] == 'alpha_reservedWord') {
        
        $sx = $pt;
        
        if (($b = $lexed[$pt++]) && ($b['data'] == '.')) {
          
          if (!($c = $this->parseField($lexed, $pt))) {
            $pt = $sPt;
            return false;
          }
          
          $b['type'] = 'DotField';
          $b['left'] = $a;
          $b['right'] = $c;
          return $b;
        }
        
        $pt = $sx;

        if (($b = $this->parseLparent($lexed, $pt))) {
          
          if (!($c = $this->parseFuncParams($lexed, $pt))) {
            $pt = $sPt;
            return false;
          }
          
          if (!($d = $this->parseRparent($lexed, $pt))) {
            $pt = $sPt;
            $this->error($lexed, $pt, 'functionCall', 'Expecting RPARENT');
            return false;
          }

          $b['type'] = 'Function';
          $b['ident'] = $a;
          $b['params'] = $c;
          return $b;
  
        }

        return $a;

      } else if ($a['type'] == 'quote_single' || $a['type'] == 'digit_integer') {
        return $a;
      } 
      
      $this->error ($lexed, $pt, 'prim');
      
      $pt = $sPt;
      return false;
    }

    function parseMultOp(&$lexed, &$pt) {
      switch ($lexed[$pt]['data']) {
        case '*':  // eq
        case '/': // neq
          return $lexed[$pt++];
      }
      return false;
    }
    
    function parseMultExpr(&$lexed, &$pt) {
      $sPt = $pt;
      if ($a = $this->parsePrimExpr($lexed, $pt)) {
        $sPt = $pt;
        while (1) {
          $b = $this->parseMultOp($lexed, $pt);
          if (!$b) break;

          $c = $this->parsePrimExpr($lexed, $pt);
          if (!$c) {
            $this->error($lexed, $pt, 'multExpr');
            return false;
          }

          $b['type'] = 'Mult';
          $b[0] = $a;
          $b[1] = $c;
          $a = $b;
          $sPt = $pt;
        }
        
        $pt = $sPt;
        return $a;
      }
      
      
      $pt = $sPt;
      return false;
    }
    
    function parseAddOp(&$lexed, &$pt) {
      switch ($lexed[$pt]['data']) {
        case '+':  // eq
        case '-': // neq
          return $lexed[$pt++];
      }
      return false;
    }
    
    function parseAddExpr(&$lexed, &$pt) {
      $sPt = $pt;
      if ($a = $this->parseMultExpr($lexed, $pt)) {
        $sPt = $pt;
        while (1) {
          $b = $this->parseAddOp($lexed, $pt);
          if (!$b) break;

          $c = $this->parseMultExpr($lexed, $pt);
          if (!$c) {
            $this->error($lexed, $pt, 'addExpr');
            return false;
          }

          $b['type'] = 'Add';
          $b[0] = $a;
          $b[1] = $c;
          $a = $b;
          $sPt = $pt;
        }
        
        $pt = $sPt;
        return $a;
      }
      
      
      $pt = $sPt;
      return false;
    }
    
    function parseLikeOp(&$lexed, &$pt) {
      switch (strtoupper($lexed[$pt]['data'])) {
        case 'LIKE':  // eq
         return $lexed[$pt++];
        default:
          break;
      }
      return false;
    }
    
    function parseLikeExpr(&$lexed, &$pt) {
      $sPt = $pt;
      if (
        ($a = $this->parsePrimExpr($lexed, $pt)) &&
        ($b = $this->parseLikeOp($lexed, $pt)) &&
        ($c = $this->parsePrimExpr($lexed, $pt))) {
          $b['type'] = 'Like';
          $b[0] = $a;
          $b[1] = $c;
          return $b;
      }
      
      $pt = $sPt;
      return false;
    }
    
    function parseBinaryExpr(&$lexed, &$pt) {
      if ($a = $this->parseLikeExpr($lexed, $pt)) return $a;
      if ($a = $this->parseAddExpr($lexed, $pt)) return $a;

      return false;
    }
    
    function parseCompareOp(&$lexed, &$pt) {
      switch ($lexed[$pt]['data']) {
        case '=':  // eq
        case '<>': // neq
        case '>': // gt
        case '<': // lt
        case '>=': // gte
        case '<=': // lte
          return $lexed[$pt++];
      }
      return false;
    }
    
    function parseAndOp(&$lexed, &$pt) {
      switch ($lexed[$pt]['data']) {
        case 'AND':  // eq
          return $lexed[$pt++];
      }
      return false;
    }
    
    function parseOrOp(&$lexed, &$pt) {
      switch ($lexed[$pt]['data']) {
        case 'OR':  // eq
          return $lexed[$pt++];
      }
      return false;
    }
    
    function parseCompareExpr(&$lexed, &$pt) {
      $sPt = $pt;
      if ($a = $this->parseBinaryExpr($lexed, $pt)) {
        $sPt = $pt;
        while (1) {
          $b = $this->parseCompareOp($lexed, $pt);
          if (!$b) break;

          $c = $this->parseBinaryExpr($lexed, $pt);
          if (!$c) {
            $this->error($lexed, $pt, 'compareExpr');
            return false;
          }

          $b['type'] = 'Compare';
          $b[0] = $a;
          $b[1] = $c;
          $a = $b;
          $sPt = $pt;
        }
        
        $pt = $sPt;
        return $a;
      }
      
      
      $pt = $sPt;
      return false;
    }
    
    function error(&$lexed, &$pt, $id, $message = false) {
      if ($message) 
        print "$message\n";
        print "Token $pt, ".$lexed[$pt]['data'].", is unexpected. Detected by $id\n";
    }
    
    function parseAndExpr(&$lexed, &$pt) {
      $sPt = $pt;
      if ($a = $this->parseCompareExpr($lexed, $pt)) {
        $sPt = $pt;
        while (1) {
          $b = $this->parseAndOp($lexed, $pt);
          if (!$b) break;

          $c = $this->parseCompareExpr($lexed, $pt);
          if (!$c) {
            $this->error($lexed, $pt, 'andExpr');
            return false;
          }

          $b['type'] = 'And';
          $b[0] = $a;
          $b[1] = $c;
          $a = $b;
          $sPt = $pt;
        }
        
        $pt = $sPt;
        return $a;
      }
      
      
      $pt = $sPt;
      return false;
    }
    
    function parseOrExpr(&$lexed, &$pt) {
      $sPt = $pt;
      if ($a = $this->parseAndExpr($lexed, $pt)) {
        $sPt = $pt;
        while (1) {
          $b = $this->parseOrOp($lexed, $pt);
          if (!$b) break;

          $c = $this->parseAndExpr($lexed, $pt);
          if (!$c) {
            $this->error($lexed, $pt, 'orExpr');
            return false;
          }

          $b['type'] = 'Or';
          $b[0] = $a;
          $b[1] = $c;
          $a = $b;
          $sPt = $pt;
        }
        
        $pt = $sPt;
        return $a;
      }
      
      
      $pt = $sPt;
      return false;
    }
    
    function getErrors() {
      $errors = $this->errors;
      $this->errors = '';
      return $errors;
    }
    
    function parse(&$lexed, &$pt) {
      
      $sPt = $pt;

      ob_start();
      $a = $this->parseOrExpr($lexed, $pt);

      $this->errors = ob_get_contents();
      ob_end_clean();

      if ($a) {
        return $a;
      } else {            
        $pt = $sPt;
        return false;
      }
    }
  }
?>
