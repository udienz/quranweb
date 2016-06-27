<?
  if(!defined('__ContentEditor_class')) {
    define ('__ContentEditor_class', 1);

    require(MDB_DIR.'ui/form.inc.php');
    require(MDB_DIR.'dbe/tableinfo.inc.php');
    require(MDB_DIR.'cnt/FieldDefParser.class.php');

    class ContentEditor {
      var $db; //!< database connection
      var $contentType; //!< active contentType

      var $recordSet; //!< will be set by GetContentFields;
      /**
       *
       */
      function ContentEditor(&$db, $contentType) {
        $this->db = &$db;
        $this->contentType = $contentType;
      }

      var $info;
      var $fields; 
      var $values;
      var $relations;
      function GetContentInfo() {
        GLOBAL $MDBTABLE, $mdbGlobal;
	$tableName = "$MDBTABLE[content]";
	if (!$this->info) {
          $this->info = read_table_info($tableName);
          $this->relations = read_table_relations($tableName);
          $SQL = "SELECT * FROM `$tableName` WHERE rid='$mdbGlobal->rid'";
          $recordSet = $this->db->Execute($SQL); 
          if(!$recordSet) return;
        
          $this->nFields = $recordSet->FieldCount();
          $this->values = $recordSet->FetchRow();
          for ($it=0;$it<$this->nFields;$it++) {
            $this->fields[] = $recordSet->FetchField($it);
          }
          $this->recordSet = &$recordSet;
        }
      } //!< end function GetContentFields

      var $extInfo; 
      var $extFields; 
      var $extValues;
      var $extRelations;
      function &GetExtraInfo() {
        GLOBAL $MDBTABLE, $mDB;

	if(!$this->extInfo) {
       	  $SQL = "SELECT * FROM `$MDBTABLE[contenttype]` WHERE rid='$this->contentType'";
          $recordSet = $this->db->Execute($SQL);
          if($recordSet->RecordCount() < 1) return; //!< no extrainfo.
        
          $contentTypeDef = $recordSet->FetchRow();
          $tableName = "${mDB}_$contentTypeDef[name]";
          $this->extInfo = read_table_info($tableName);
          $this->extRelations = read_table_relations($tableName);
          $SQL = "SELECT * FROM `$tableName` WHERE rid='$mdbGlobal->rid'";
          $recordSet = $this->db->Execute($SQL); 
        
          if(!$recordSet) return; //!< probably there is no such table, e.g: folder.
          $this->nExtFields = $recordSet->FieldCount();
          $this->extValues = $recordSet->FetchRow();
          for ($it=0;$it<$this->nExtFields;$it++) {
            $this->extFields[] = $recordSet->FetchField($it);
          }
          $this->recordSet = &$recordSet;
        }
      } //!< end function GetExtraInfo

      function form_adcedc() {
	GLOBAL $mdbGlobal, $HTTP_REFERER, $TABLERELATIONS;
        echo "
        <form method=\"post\" action=\"\">
        ".inputhidden('w', $mdbGlobal->w)."
        ".inputhidden('op', $mdbGlobal->sw)."
        ".(($mdbGlobal->Debug)? inputhidden('Debug', $mdbGlobal->Debug)."\n" : "")
         .inputhidden('type', $this->contentType)."
        ".inputhidden('ref', stripslashes($HTTP_REFERER))."
        <table border=\"0\">";

        $startField = 3; 
        $this->GetContentInfo();
        for ($it=$startField;$it<$this->nFields;$it++) {
          inputfield($this->fields[$it], $this->recordSet, $this->values[$it], $this->info, $this->relations);
        }
        $startField = 3; 
        $this->GetExtraInfo();
        for ($it=$startField;$it<$this->nExtFields;$it++) {
          inputfield($this->extFields[$it], $this->recordSet, $this->extValues[$it], $this->extInfo, $this->extRelations);
        }
        echo "
        <tr><td><br /></td><td>".
        inputbtn('bt', _KINTUN).
        inputbtn('bt', _BATAL).
        </td></tr>
        </table>
        </form>";
      }

      /**
       * @call this->GetContentField
       * @call this->GetExtraInfo
       * @call this->ParseFieldDefs
       * @call inputfield 
       */
      function form_adc() {
        GLOBAL $mdbGlobal, $mDB, $MDBTABLE;
 
        $this->GetExtraInfo();
        echo "
        <h2>"._ADC."::".$this->extInfo['name']."</h2>"; 
        $this->form_adcedc();

      } //!< end function form_adc

      # --------------------------- Private Functions ---------------------------------
    } //!< end class ContentEditor
  } //!< end define
?>
