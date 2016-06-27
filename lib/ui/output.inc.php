<?
# =============
# OUTPUT SECTION
# =============

require (MDB_DIR."ui/Component.class.php"); // required by DBTableRenderer
require (MDB_DIR."ui/DBTableRenderer.class.php");
require (MDB_DIR."ui/DBNavigator.class.php");

// create ui objects:
$viewer = new Component($template);
$navigator = new DBNavigator();
$renderer = new DBTableRenderer($selectSQL);

// configure renderer:
$renderer->editAction = ''; // no editing
$renderer->deleteAction = ''; // no delete

if(isset($truncate)) $renderer->truncate = $truncate;

// give ids:
$viewer->id = 'tb';
$viewer->url = $viewerUrl;
$navigator->url = $viewerUrl; //!< due to unknown bug :(

// link each others:
$navigator->SetRenderer($renderer);
$viewer->AddComponent('navigator', $navigator);
$viewer->AddComponent('renderer', $renderer);

// render output:
$viewer->template = "{navigator}\n{renderer}<br />\n{navigator}";
$viewer->Render($rhtml);

print $rhtml;

?> 