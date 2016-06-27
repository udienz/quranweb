<? 
session_start();
include ('../config.php');
if ($_SESSION['ISADMIN']) {
include ('header.php');
    ?>
    <p><h2>Administrasi</h2></p>
    <p>
    Ini adalah halaman Administrasi situs quran web. Sebagai admin Anda dapat melakukan:
    <ul>
    <li>Menambahkan ayat pilihan, yang nantinya akan tampil secara acak pada halaman depan situs</li>
    <li>Melihat statistik pencarian ayat al-quran</li>
    <li>Melihat komentar dari para pengunjung situs</li>
    <li>Melakukan perbaikan terhadap kesalahan arti ayat</li>
    <li>Melakukan penggantian file audio, jika ditemukan ketidakvalidan</li>
    </ul>
    </p>
<!--a href="addayat.php">tambah ayat pilihan</a> |
<a href="<?#=$myURL?>?&m=statistic">statistik</a> |
<a href="tanggapan.php">lihat tanggapan</a> |
<a href="editcontent.php">update content</a> |
<a href="audio.php">update audio</a> |
<a href="password.php">ganti password</a> |
<a href="logout.php">Logout</a-->
<?
include ('footer.php');
}

else 
header('location:'.$myURL);
?>
