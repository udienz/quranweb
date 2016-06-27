<?
function getExt ($filename) {
   $parts = explode (".", $filename);
   return $parts[count($parts)-1];
}

  $filename = "download/$file";

  if (is_integer(strpos($_SERVER['HTTP_USER_AGENT'],'MSIE'))) {
    $useragent = 'IE';
  } else 
  if (is_integer(strpos($_SERVER['HTTP_USER_AGENT'],'Opera'))) {
    $useragent = 'OPERA';
  } 

  if (file_exists($filename)) {
    // Defines filename and extension, and also mime types
    $ext = getExt($filename);
    switch ($ext) {
      case 'bz2':
        $mime_type = 'application/x-bzip';
        break;
      case 'gzip':
        $mime_type = 'application/x-gzip';
        break;
      case 'zip':
        $mime_type = 'application/x-zip';
        break;
      case 'csv':
        $mime_type = 'text/csv';
        break;
      case 'xml':
        $mime_type = 'text/xml';
        break;
      case 'jpeg':
      case 'jpg':
        $mime_type = 'image/jpeg';
        break;
      case 'gif':
        $mime_type = 'image/gif';
        break;
      case 'png':
        $mime_type = 'image/png';
        break;
      case 'pdf':
        $mime_type = 'application/pdf';
        break;
      case 'doc':
        $mime_type = 'application/msword';
        break;
      case 'xls':
        $mime_type = 'application/excel';
        break;
      case 'sql':
      default:
        break;
        $mime_type = 
	  ($useragent == 'IE' || $useragent == 'OPERA')
            ? 'application/octetstream'
            : 'application/octet-stream';
    }

    #echo $HTTP_USER_AGENT.$mime_type; return;
    $now = gmdate('D, d M Y H:i:s') . ' GMT';

    if ($ext != 'html' && $ext != 'htm') {
      // Send headers
      header('Content-Type: '.$mime_type);
      header('Expires: ' . $now);

      // lem9 & loic1: IE need specific headers
      if ($useragent == 'IE') {
        header('Content-Disposition: inline; filename="' . $file. '"');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');
      } else {
        header('Content-Disposition: attachment; filename="' . $file. '"');
        header('Pragma: no-cache');
      }
    }

    readfile($filename);
    exit;
  } else {
    echo "Could not open file: $filename";
  }
?>
