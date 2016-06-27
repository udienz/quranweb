<?
if(!defined('_Panel_class_php')) {
  define('_Panel_class_php');

  class Panel {
    var $components = array(); //!< array of sub panels/components which has Render($rhtml) method.
    var $template;

    /**
     * @param template has layout position
     * example:
     * {LEFTBLOCKS}{CENTER}{RIGHTBLOCKS}
     */
    function Panel(&$template) {
      $this->template = $template;
    }

    function Add($position, &$component) {
      $this->components[$position] = $component;
    }

    function Render(&$rhtml) {
      $rhtml .= &$this->PutInto($this->components);
    }    
  };
}
?>
