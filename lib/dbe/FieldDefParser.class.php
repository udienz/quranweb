<?
  if(!defined('__FieldDefParser_class')) {
    define ('__FieldDefParser_class', 1);
    
    class FieldDefParser {

      /** 
       * @param field, an object that has member 'type' 
       * @return length
       */
      function &ParseType($field) {
        list($field->type, $field->max_length) = explode('(', trim($field->type));
	$field->type = strtolower(trim($field->type));
        switch($field->type) {
          case 'int':
          case 'char':
            # check if it has length:
            $len = trim($field->max_length);
            if($len != '') { //!<it has length
              if (!is_integer(strpos($len,')'))) {
                log_error(_EXPECTEDRPARENT.'::'.$fieldDefs);
                return false;
              }
              $field->max_length = substr($len, 0, strlen($len)-1);
            } else { // default:
              if ($field->type == 'int') {
                $field->max_length = '11';
              } else {
                $field->max_length = '1';
              }
            }
            break;
          default: 
             $field->max_length = -1;
            break;
        } //!< end switch 
        return $field;
      } //!< end function ParseType

      /**
       * @param fields
       * @param fieldDefs
       * @calls this->ParseType
       */
      function &Parse(&$fields, &$fieldDefs) {
        $tempCols = explode(',',trim($fieldDefs)); 
        log_debug('[FieldDefParser.Parse] the input : '.$fieldDefs);
	$n = 0;
        foreach($tempCols as $v) {
          if (($v = trim($v))!= '') { 
            list($field->name, $field->type) = explode(':', trim($v)); 
            $field = $this->ParseType($field);
            $fields[] = $field;
            $n++;
            # log a little bit:
            log_debug("[FieldDefParser.Parse] Parsed = $field->name: $field->type ($field->max_length)");
          } //!< end if $v
        } //!< end foreach
        return $n;
      } //!< end function
    } //!< end class FieldDefParser
  } //!< end define
?>
