<?
if(!defined('_COMMON_INC_PHP')) {
  define('_COMMON_INC_PHP',1);

  # Seed with microseconds:
  function dbe_make_seed() {
    list($usec, $sec) = explode(' ', microtime());
    return (float) $sec + ((float) $usec * 100000);
  }

  srand(dbe_make_seed());

  # Password maker:
  function dbe_make_pass ($pass) {
    return md5 ("kS".$pass."Sk");
  }

  # Clear the key from original uri
  function uri_clear_obsolete ($key, $original) {
    if(is_integer($spos = strpos($original, "&amp;$key"))) {
      if($value != '') {
        $spos += strlen("&amp;$key=");
      }
      $s_uri = substr($original, 0, $spos); 
      if (is_integer($epos = @strpos($original, "&", $spos+1))) {
        $e_uri = substr($original, $epos);
      } else {
        $e_uri = '';
      }
      $s_uri .= $e_uri;
    } else {
      return $original;
    }
  }

  # Clear the key from original uri
  function uri_clear($key, $original) {

    $spos = strpos($original, '?') + 1;
    $s_uri = substr($original, 0, $spos);
    $original = substr($original, $spos);
    $params = explode ('&amp;', $original);
    $newParams = array();
    foreach ($params as $param) {
      if(preg_match('/^([\w|\[|\]]+)=(.+)$/', $param, $match)) {
        if ($match[1] != $key) {
          $newParams[] = "$match[1]=$match[2]";
        }
      }
    }
    return $s_uri.implode('&amp;', $newParams);
  }

  # Replace the key value pair from original uri 
  function uri_replace ($key, $value, $original) {
    return uri_clear($key, $original)."&amp;$key=$value";
  }

  # test like this:
  #echo uri_replace("asr", "asc", "index.php?w=dbe&amp;Debug=1&amp;sw=tab&amp;tid=4&amp;aofs=15&amp;asr=desc&amp;asf=3");

  # Logger:
  function log_error($message) {
    GLOBAL $mdbGlobal;
    $mdbGlobal->Error[] = 'E|'.$message;
  }
  
  function log_debug($message) {
    GLOBAL $mdbGlobal;
    if ($mdbGlobal->Debug) 
      $mdbGlobal->Error[] = 'D|'.$message;
  }
  
  function log_warning($message) {
    GLOBAL $mdbGlobal;
    $mdbGlobal->Error[] = 'W|'.$message;
  }

  function print_logs() {
    GLOBAL $mdbGlobal;
    ################# ERROR REPORTING ############
    if (count ($mdbGlobal->Error)) {
      $dc = 1; $ec = 1; $wc = 1;
      foreach ($mdbGlobal->Error as $seq => $item) {
        if (strpos(' '.$item, 'E|') == 1) { 
          echo '<p class="mdbError">';
	  echo '<i>'._ERROR.' '.($ec++).'</i>'; $item = substr($item, 2); 
	} else if (strpos(' '.$item, 'D|') == 1) { 
          echo '<p class="mdbDebug">';
	  echo '<i>'._DEBUG.' '.($dc++).'</i>'; $item = substr($item, 2); 
	} else if (strpos(' '.$item, 'W|') == 1) { 
          echo '<p class="mdbWarning">';
	  echo '<i>'._WARNING.' '.($wc++).'</i>'; $item = substr($item, 2); 
	} else {
	  echo '<i>'._ERROR.' '.($ec++).'</i>';
	}
        echo nl2br(": $item")."</p>\n";
      }  
    }
  }
}
?>
