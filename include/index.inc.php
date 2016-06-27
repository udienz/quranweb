<p><h2>Indeks</h2></p>
<?
require QSE_BASE_DIR . 'include/QTableViewer.class.php';

$qview = new QTableViewer();
$qview->init();
$qview->setBaseUrl(QSE_BASE_URL . "&amp;m=index");

$search = $_REQUEST['search'];
if (isset($search)) {
    $viewerUrl .= '?&amp;m=index&amp;search=' . $search;
}

$selectSQL = &$qview->selectSQL;
$selectSQL->InitAll();

// table(s):
$selectSQL->AddTable('indexIndonesia');
// field(s):
if (0) {
  $selectSQL->AddField('*'); //!< this is for test
} else {
    #$selectSQL->AddField('ID' , _ID);
    #$selectSQL->AddField('Kategori' , _CATEGORY);
  $selectSQL->AddField("concat('URL|',Deskripsi,'|" . QSE_BASE_URL . "&amp;kata=', Query)", _DESCRIPTION);
} 

if (isset($search)) {
  $fs[] = "Kategori like '%$search%'";
  $fs[] = "Deskripsi like '%$search%'";
  $fs = '(' . implode (') OR (', $fs) . ')';
  $selectSQL->AddFilter($fs);
} 

?>
<form method="post" action="<?=$viewerUrl?>">
<table width="100%">
<tr><td align="left">
<em>Cari:</em> 
<input class="textbox" type="text" name="search" value="<?=$search?>"/>
<input type="submit" class="GoBtn" value="OK"/><br/><br/>
</tr>
</table>	
</form>
<?

$qview->update();
$qview->show();

$Global->Error = array_merge($Global->Error, $mdbGlobal->Error);
print implode("<br/>\n", $Global->Error);

?>  
