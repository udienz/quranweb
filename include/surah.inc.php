<?
if (!defined ('_surah_inc_php')) {
  define ('_surah_inc_php', 1);

  require_once (QSE_BASE_DIR . 'config.php');
  require_once (QSE_BASE_DIR . 'include/language.inc.php');

  define ('_TOTALVERSES', 6236);

  $imagesURL = QSE_BASE_DIR . '/images/%no_sr/%no_sr_%no_vr.png'; 
  // $imagesURL = 'http://www.unn.ac.uk/societies/islamic/quran/arabic/%no_sr_%no_vr.gif';
  #$reciteURL = "http://quran.al-islam.com/Recite/CRecite_g2.asp"; 
  $reciteURL = $myURL."media"; 
  

  $surahNames = array("1" => "AL FATIHAH",
    "2" => "AL BAQARAH",
    "3" => "ALI IMRAN",
    "4" => "AN NISAA'",
    "5" => "AL MAA-IDAH",
    "6" => "AL AN'AAM",
    "7" => "AL A'RAAF",
    "8" => "AL ANFAAL",
    "9" => "AT TAUBAH",
    "10" => "YUNUS",
    "11" => "HUD",
    "12" => "YUSUF",
    "13" => "AR RA'D",
    "14" => "IBRAHIM",
    "15" => "AL HIJR",
    "16" => "AN NAHL",
    "17" => "AL ISRA",
    "18" => "AL KAHFI",
    "19" => "MARYAM",
    "20" => "THAHA",
    "21" => "AL ANBIYAA'",
    "22" => "AL HAJJ",
    "23" => "AL MU'MINUN",
    "24" => "AN NUUR",
    "25" => "AL FURQAAN",
    "26" => "ASY SYU'ARA'",
    "27" => "AN NAML",
    "28" => "AL QASHASH",
    "29" => "AL ANKABUT",
    "30" => "AR RUUM",
    "31" => "LUQMAN",
    "32" => "AS SAJADAH",
    "33" => "AL AHZAB",
    "34" => "SABA'",
    "35" => "FAATHIR",
    "36" => "YAASIIN",
    "37" => "ASH-SHAFFAAT",
    "38" => "SHAAD",
    "39" => "AZ-ZUMAR",
    "40" => "AL MU'MIN",
    "41" => "FUSH SHILAT",
    "42" => "ASY SYUURA",
    "43" => "AZ ZUKHRUF",
    "44" => "AD DUKHAAN",
    "45" => "AL JAATSIYAH",
    "46" => "AL AHQAAF",
    "47" => "MUHAMMAD",
    "48" => "AL FAT-H",
    "49" => "AL HUJURAT",
    "50" => "QAAF",
    "51" => "ADZ-DZAARIYAAT",
    "52" => "ATH-THUUR",
    "53" => "AN-NAJM",
    "54" => "AL-QAMAR",
    "55" => "AR RAHMAAN",
    "56" => "AL WAAQIAH",
    "57" => "AL HADID",
    "58" => "AL MUJAADILAH",
    "59" => "AL HASYR",
    "60" => "AL MUMTAHANAH",
    "61" => "ASH-SHAFF",
    "62" => "AL JUMU'AH",
    "63" => "AL MUNAAFIQUUN",
    "64" => "AT-TAGHAABUN",
    "65" => "ATH THALAQ",
    "66" => "AT TAHRIM",
    "67" => "AL MULK",
    "68" => "AL QALAM",
    "69" => "AL HAAQQAH",
    "70" => "AL MA'AARIJ",
    "71" => "NUH",
    "72" => "AL JIN",
    "73" => "AL MUZZAMMIL",
    "74" => "AL MUDDATSTSIR",
    "75" => "AL QIYAAMAH",
    "76" => "AL INSAAN",
    "77" => "AL MURSALAAT",
    "78" => "AN-NABA'",
    "79" => "AN-NAAZI'AAT",
    "80" => "'ABASA",
    "81" => "AT-TAKWIIR",
    "82" => "AL INFITHAR",
    "83" => "AL MUTHAFFIFIIN",
    "84" => "AL INSYIQAAQ",
    "85" => "AL BURUUJ",
    "86" => "ATH-THAARIQ",
    "87" => "AL A'LAA",
    "88" => "AL GHAASYIYAH",
    "89" => "AL FAJR",
    "90" => "AL BALAD",
    "91" => "ASY-SYAMS",
    "92" => "AL LAIL",
    "93" => "ADH DHUHAA",
    "94" => "ALAM NASYRAH",
    "95" => "AT TIIN",
    "96" => "AL 'ALAQ",
    "97" => "AL QADAR",
    "98" => "AL BAYYINAH",
    "99" => "AL ZALZALAH",
    "100" => "AL 'AADIYAAT",
    "101" => "AL QAARI'AH",
    "102" => "AL-TAKAATSUR",
    "103" => "AL 'ASHR",
    "104" => "AL HUMAZAH",
    "105" => "AL FIIL",
    "106" => "AL QURAISY",
    "107" => "AL MAA'UN",
    "108" => "AL KAUTSAR",
    "109" => "AL KAAFIRUUN",
    "110" => "AN-NASHR",
    "111" => "AL-LAHAB",
    "112" => "AL IKHLASH",
    "113" => "AL FALAQ",
    "114" => "AN-NAAS"
    );
} // end _surah_inc_php

?>