<?
define('_WINDOWTITLE', "My Database ;)");

GLOBAL $LISTMENU, $TABELMENU, $VIEWM, $LISTT;

$LISTMENU['adt']  = "[New Table]";
$TABELMENU['add']  = "[New Record]";

$VIEWM['dsp'] = "SingleView";
$VIEWM['tab'] = "TabelView";
$VIEWM['she'] = "SheetEdit";
$VIEWM['sgl'] = "SingleEdit";

$LISTT['table'] = 'Table';
$LISTT['open'] = 'open';
$LISTT['edit'] = '[e]';
$LISTT['delete'] = '[x]';
$LISTT['name'] = 'name';
$LISTT['permission'] = 'permission';
$LISTT['created'] = 'created';
$LISTT['email'] = 'author';
$LISTT['owner'] = 'owner';
$LISTT['group'] = 'group';
$LISTT['parent'] = 'parent';
$LISTT['description'] = 'description';

define ('_TYPE', "Type");
define ('_V', "V");
define ('_PARENT', "Parent Table");

# Error Messages:
define ("_NOCOLUMNANYMORE", "column requested by a relation could not be found. Please create the column or delete relation.");
define ("_CANTEDITDATA", "For security reason, all Editor(s) should be registered.");
define ("_CANTADDDATA", "Could not add data. Please try to login first.");
define ("_CANTDELETEDATA", "Could not delete data, need access more than a member. Please try to send an email to Administrator(s).");
define ("_CANTVIEWDATA", "Could not view requested data. Please try to login first.");
define ("_CANTEDITTABLE", "Could not edit table. Only table's author(s) or Administrator(s) can edit tables.");
define ("_CANTADDTABLE", "Could not add a new table. Pleas try to login first.");
define ("_CANTDELETETABLE", "Could not delete the requested table. You need access more than just a member. Please try to send an email to Administrator(s).");
define ("_CANTVIEWTABLE", "Could not view the requested table. Please try to login first.");
define ("_TEUAYADATA", "Requested data is not fould or the table is empty.");
define ("_NAMIKEDAHDIEUSI", "Table name is required.");
?>
