<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=ISO-8859-1">
  <meta name="KEYWORDS" content="diantn, din, dtn, diten, dian tresna nugraha" />
  <meta name="DESCRIPTION" content="diantn, din, dtn, diten, dian tresna nugraha" />
  <meta name="ROBOTS" content="INDEX,FOLLOW" />
  <meta name="resource-type" content="document" />
  <meta http-equiv="expires" content="0" />
  <meta name="author" content="Dian Tresna Nugraha" />
  <meta name="copyright" content="<?=$COPYRIGHT?>" />
  <meta name="revisit-after" content="1 days" />
  <meta name="distribution" content="Global" />
  <meta name="rating" content="General" />
  <title><?=$TITLE?></title>
  <style type="text/css">
    body{ 
      font-family: Tahoma, Arial, Verdana; font-size: 8pt;
      background: #eeeeee;
    }
    .rLatin { 
      text-decoration: none;
      color: green;
    }
    .rOddLang {  
      text-decoration: none; 
      color: navy;
      border: 1px #CCCCCC solid; 
      background-color: white
    }
    .rEvenLang {  
      text-decoration: none; 
      color: black;
      border: 1px #CCCCCC solid; 
      background-color: white
    }
    .textbox { border: 1px #cccccc solid; background-color: #f5f5f5;} 
  </style>

  <?
    if (defined('QSE_PN')) {
      $quranJS = QSE_BASE_URL . '&amp;file=quran.js';
    } else {
      $quranJS = './quran.js.php';
    } 
  ?>
  <script type="text/javascript" src="<?=$quranJS?>">
  </script> 
</head>
<body>
<?=$QURAN?>
</body>
</html>
