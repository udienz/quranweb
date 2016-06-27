<?
define ('_NEXT', '[>>]');
define ('_LAST', '[>|]');
define ('_PREV', '[<<]');
define ('_FIRST', '[|<]');
define ('_KACA', 'halaman');
define ('_AYA', 'Ditemukan');
define ('_EUSIDINA', 'topik dalam');
define ("_FILTER", "Filter");
define ("_LONCATKE", "Ke halaman");
define ("_JUMLAH", "Jumlah");

define ('_HAPUS', 'Delete');
define ("_MUHUN", "Yes");
define ("_BATAL", "Cancel");
define ("_ROBIH", "Change");
define ("_TAMBIHKEUN", "Insert as New");
define ("_KINTUN","Submit");
define ("_NAMITABLE","Table Name");
define ("_GENTOSNAMTABLEINFO", "Rename Table To: ");
define ('_DESKRIPSI', 'Description');

define ('_ADD', "Add Data");
define ('_EDD', "Edit Data");
define ('_DED', "Delete Data");

define ('_ADT', "Add Table");
define ('_EDT', "Edit Table");
define ('_DET', "Delete Table");

define ('_ADF', "Add Column(s)");
define ('_EDF', "Edit Column(s)");

define ("_KETERANGANTIPE", "
<h3>How to use:</h3>
<table border=\"0\">
<tr><td><p>1.&nbsp;</p></td><td><p><b>Rename table</b><br /> 
    Type new name in 'Rename Table To' textbox and/or new 'Description' then click '"._ROBIH."'</p></td></tr>
<tr><td><p>2.&nbsp;</p></td><td><p><b>Edit columns</b><br />
    Mark the checkbox at the left of column name in the 'Edit Column(s)' area, type new column name and/or new column type, 
    and then click '"._KINTUN."'.</p></td></tr>
<tr><td><p>3.&nbsp;</p></td><td><p><b>Add columns</b><br />
    Mark the checkbox at the left of column name in the 'Add Column(s)' area, type new column name and/or new column type, 
    and then click '"._KINTUN."'.</p></td></tr>
<tr><td><p>4.&nbsp;</p></td><td><p><b>Delete columns</b><br />
    Mark the checkbox at the left of column name in the 'Add Column(s)' area, type new column name and/or new column type, 
    and then click '"._KINTUN."'.</p></td></tr></table>
Column's <b>type</b> can be filled with:
<ul>
<li>int (lb)</li>
<li>char (lb)</li>
<li>text</li>
<li>date</li>
<li>datetime</li>
</ul>
<b>(lb)</b> can be used to limit column's width, example: 
'char (10)': ten characters column's width, 'int (2)': two digit column's width.<br />
When left empty, default widths are: 
<ul>
<li>11 for <b>int</b></li>
<li>1 for <b>char</b></li>
</ul>
");

?>
