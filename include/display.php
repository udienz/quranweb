<? 
    //if (isset($_GET["s"]) && $_GET["s"]!="") {

    /*
    include_once("../../../lib/class.hash_crypt.php");
    $key    = "b4dk3y3ncrypt0r";
    $s      = ($_GET["s"]);
    //echo $s;
    $crypt  = new hash_encryption($key);
    $decrypt = $crypt->decrypt($s);
    unset($crypt);
    */
   // $_GET["s"] = 'WITa29kZXI=';
   $encode = strrev("52SZ0O");
   $encode = base64_encode($encode);
   $encode = strrev($encode);
   $encode = base64_encode($encode);
   
    $test = base64_decode($encode);
    $test = strrev($test);
    $test = base64_decode($test);
    $test = strrev($test);

    include("captcha_numbersV2.php");
    $captcha = new CaptchaNumbersV2(5,20,'png',$test,15);
    $captcha->display();

    unset($captcha);
//}
?>
