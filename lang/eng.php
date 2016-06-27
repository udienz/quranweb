<?
if (!defined ('_QuranSE_lang_eng')) {

$charHelpLink =
QSE_BASE_URL . "&amp;submit=Search" . "&amp;surah=all" . "&amp;search=latin" . "&amp;display=20" . "&amp;arabic=off" . '' ;

  define ('_QuranSE_lang_eng', 1); 
  // Menubar:
  define ('_HOME', 'Cari Ayat');
  define ('_RANDOM', 'Random');
  define ('_ABOUT', 'Profil');
  define ('_FEEDBACK', 'Kirim Tanggapan');
  define ('_STATISTICS', 'Statistik');
  define ('_DOWNLOAD', 'Download');
  define ('_QURANINDEX', 'Indeks Topik');
  define ('_AVAILABLETRANS', '%s translated languages available'); 
  // Search Options:
  define ("_SEARCHOPTIONS", "<b><em>Search Options</em></b>");
  define ('_SEARCH' , "CARI");
  define ("_ARABICLATIN", "Teks arab latin (<a href=\"./" . QSE_BASE_URL . "&amp;m=manual\">Help</a>)");
  define ("_SELECTEDLANGUAGE", "Selected Language");
  define ("_WHOLEWORD", "Whole Word");
  define ("_LANGUAGE", "Bahasa"); 
  // Display Options:
  define ("_DISPLAYOPTIONS", "<b>Opsi tampilan</b>");
  define ('_VERSESPAGE' , "Ayat per halaman");
  define ('_ARABICIMAGE', "Arabic Script Image");
  define ('_ARABICLATIN', "Teks arab latin");
  define ('_ARABICFONT' , "Arabic Script Font (>IE 5.0;>NS 6.0)");
  define ('_RESET' , "Reset");
  define ('_LITEMODE' , "Lite Mode (only selected language)");
  define ('_FULLTEXT', "FULL text");
  define ('_VERSENUMBERS', "Verse numbers ONLY!");

  define ("_FILTER", "Filter");
  define ("_INSURAH", "In surah");
  define ('_FOUNDVERSES', "Found verses"); 
  // Result Message:
  define ('_MATCHKEY' , "Match keywords");
  define ('_RESULT' , "Hasil");
  define ('_NOMATCH' , "Tidak ditemukan"); 
  // Statistics:
  define ('_HITS', '`Dicari`'); //!< back quotes are needed for the utilizations in SQL
  define ('_REQUEST', '`Kata`');
  define ('_LASTACCESS', '`Kata terakhir`');
  define ('_LINK', '`Link`');
  // Quran index:
  define ('_ID', 'Id');
  define ('_CATEGORY', 'Kategori');
  define ('_DESCRIPTION', 'Topik');
  // Help page:
  $arabicChars = "-a ba ta tsa ja [h]a kha da [dz]a ra za sa sya [sh]a [dh]a [th]a [zh]a 'a `a gha fa ka la ma na wa ha ya";
  $madChars = "[aa] ii uu";
  define ('_DIRECTION' , " 

  <table style=\"border: none; width: 100%;\"><tr><td>
  
	<p><H2>Petunjuk</H2></p>
    <p>Untuk menampilkan tulisan Arab, pastikan web browser anda menggunakan character encoding Arabic (Windows - 1256) </p>
	<b>Pencarian Berdasarkan Arti</b>
	<ul>
      <li>
      Masukkan arti ayat yang hendak dicari, misal: <b>tidak ada keraguan</b>, maka hasil pencarian adalah semua ayat yang mengandung kata <b>tidak</b>, <b>ada</b>, atau <b>keraguan</b> . </li>
      <li>
      Pilih nama surat, misal: <b>AL FATIHAH</b>, ketik <b>\"hari pembalasan\"</b> (tanda kutip), maka hasil pencarian adalah ayat yang mengandung kata <b>hari pembalasan</b> dari surat Al Fatihah. </li>
	</ul>
	<b>Pencarian Berdasarkan Nomor Surat : Ayat</b>
	<ul>
      <li>
      Pilih nama surat, misal:  <b>Semua</b>, ketikkan <b>1, 3, 5- </b>, hasil pencariannya adalah ayat <b>1</b>, <b>3</b>, and <b>5 sampai akhir ayat surat</b> </li>
      <li>
      Pilih nama surat, misal: <b>Semua</b>, ketikkan <b>4:100-, 5:13-19, 114:10</b>, maka hasil pencariannya adalah <b>surat 4 ayat 100 sampai ayat terakhir</b>, <b>surat 5 ayat ke- 13 hingga 19</b>, dan <b>surat 114 ayat 10</b></li>
      <li>
      Pilih surat <b>AL FATIHAH</b>, ketikkan <b>1-</b>, maka hasil pencariannya adalah <b>semua</b> ayat dari surat Al Fatihah. </li>
      <li>
      PIlih <b>AL BAQARAH</b>, ketikkan <b>3, 30-31</b>, maka hasil pencariannya adalah ayat <b>3</b> dan ayat <b>30 hingga 39</b> dari surat AL BAQARAH.</li>
      </ul>
	<b>Pencarian Teks Arab-Latin</b>
	<ul>
		<li><b>Huruf dasar</b>: (klik huruf untuk melihat contoh)
		<br /> " . buildArLinks($arabicChars) . " </li>
		<li><b>Mad</b>: " . buildArLinks($madChars) . " </li>
		<li><b>alif-lam (qamariyah)</b>: <a href=\"" . QSE_BASE_URL . "&amp;kata=%5Ba%5Dlkit%5Baa%5Db&amp;submit=Search&amp;surah=all&amp;search=latin&amp;arabic=on&amp;latin=on&amp;display=20&amp;lang=id\">[a]lkit[aa]b</a></li>
		<li><b>alif-lam bertanda tasydid (syamsiyah)</b>: <a href=\"" . QSE_BASE_URL . "&amp;kata=%5Bal%5Dnnabiyyiina&amp;submit=Search&amp;surah=all&amp;search=latin&amp;arabic=on&amp;latin=on&amp;display=20&amp;lang=id\">[al]nnabiyyiina</a></li>
		<li><b>'ain</b> bisa juga ditulis dengan <b>`ain</b> (`a sama dengan 'a) </li>
		<li><b>Tasdid</b>: ketikkan dua huruf untuk huruf yang bertanda tasydid: [dz][dz], nn</li>
	</ul>
	<b>Penjelasan teks arab latin</b>
	<ul>
      <li><em>aa</em> : fathah yang dipanjangkan </li>
      <li>ii : kasrah yang dipanjangkan</li>
      <li>uu : dhommah yang dipanjangkan</li>
      <li><em>h</em> : huruf ke-6, sesudah huruf ja </li>
      <li><em>dz</em> : huruf ke-9, sesudah huruf da </li>
      <li><em>sh</em> : huruf ke-14, sesudah huruf sya </li>
      <li><em>dh</em> : huruf ke-15 </li>
      <li><em>th</em> : huruf ke-16 </li>
      <li><em>zh</em> : huruf ke-17 </li>
      <li>/ : huruf hamzah, seperti dalam kata mu/min, yu/minuun</li>
      <li>' : huruf 'ain, sepert dalam kata a'udzubillahi</li>
	</ul>
  </td></tr></table>
  
  ");

  define ('_RANDOMDIRECTION', 'Copy html code below to your webpage:<br /><br />');
  define ('_LITEDIRECTION', "
  <table style=\"border: none; width: 100%;\"><tr><td>
  
	<b><font color=\"293C9C\">Petunjuk pencarian</font></b>
    
	<ul>
    <font color=\"293C9C\">
      <li> Cari <b>\"hari akhir\"</b> di Semua Surat (mencari frasa <b>\"hari akhir\"</b> di semua surat)</li>
      <li>Cari <b>1-5, 20</b> di AL-BAQARAH (mencari ayat <b>1 s/d 5</b> dan ayat <b>20</b> di Surat Al-Baqarah)</li>
      <li>Cari <b>5:1-3, 14:5</b> di Semua Surat (mencari surat <b>5</b> ayat <b>1 s/d 3</b> dan surat <b>14</b> ayat <b>5)</b></li>
    </font>
    </ul>
  </td></tr></table>
  ");
} // end QuranSE_lang_eng

?>
<?

function buildArLinks($charSet)
{
  GLOBAL $charHelpLink;

  $arLinks = '';
  $charSet = explode(' ', $charSet);
  foreach ($charSet as $aChar) {
    $arLinks .= "\n<a href=\"$charHelpLink&amp;kata=$aChar\">$aChar</a>";
  } 
  return $arLinks;
} 

?>  
