<?
if(!defined('__Component_class')) {
  define('__Component_class', 1);

  define('TAGOPEN', '{');
  define('TAGCLOSE', '}');

  /**
   * Component is a class that renders it's content, based on given template.
   * When there is no child component, it will simply render the template. 
   * Child-components are stored inside an associative-array. 
   * The Render function will call Render function of each child-component and put the result inside 
   * the template which tag is the same as array-index.
   * ex.: 
   * <pre>
   * $template1 = "Component{title}{description}";
   * $parent = new Component($template1);
   *
   * $template2 = "Title";
   * $child1 = new Component($template2);
   *
   * $template3 = "Description";
   * $child2 = new Component($template3);
   *
   * $parent->AddComponent('title', $child1);
   * $parent->AddComponent('description', $child2);
   * $parent->Render($rhtml);
   * print $rhtml; // this will return "ComponentTitleDescription"
   * </pre>
   */
  class Component {
    var $id = ''; //!< Component's id. This is normally used as prefix for _GET parameters passed to this component.
    var $url = ''; //!< id and url can be set directly. GetID/GetURL should be used obtain the value.
    var $parent = false; //!< parent's component. When false, this component is a root. 
                         //!< Otherwise this should points to parent's component 
    var $components = array(); //!< list of owned components.
    var $_template = '';  //!< template for producing output.

    /**
     * @param template text template for this component 
     */
    function Component($template = '') {
      $this->template = $template;
    } 
    
    /**
     * ToString. Gives information about the component. 
     */
    function ToString() {
      return "$this->id: $this->url";
    }

    /**
     * Get component's id. The id of parent component will be returned if the 
     * component's id is empty. 
     */
    function GetID() {
      if ($this->id == '') {
        if ($this->parent) {
          return $this->parent->GetID(); // same id as parent.
        } 
	return ''; //!< blank
      }  
      return $this->id; 
    }

    /**
     * GetURL
     */
    function GetURL() {
      if ($this->url == '') {
        if ($this->parent) {
          return $this->parent->GetURL(); // same url as parent.
        }
        return ''; //!< blank
      } 
      return $this->url;
    }

    /*
     * Add new owned component
     * @param name is useful during layout.
     */
    function AddComponent($name, &$component) {
      $component->parent = &$this;
      $this->components[$name] = &$component; 
    }

    /**
     * Remove
     */
    function RemoveParent() {
      unset($this->parent);
      $this->parent = false;
    }

    /**
     * Remove owned components identified by it's name
     */
    function Remove($name) {
      if ($this->components[$name]) {
	$this->components[$name]->RemoveParent();
	unset($this->components[$name]);
      }
    }

    /**
     * Render
     */
    function Render(&$rhtml) {
      #$rhtml .= PutInto($this->components, $this->template);
      // replace:
      $result = $this->template;
      foreach ($this->components as $k => $v) {
        $chtml = '';
        $v->Render($chtml);
        $result = str_replace('{'.$k.'}', $chtml, $result);
      }
      $rhtml .= $result;
    }
  };

  function &PutInto(&$components, &$template) { //!< static.
    // locate tags:
    $pos = array();
    foreach ($components as $k => $v) {
      $pos[$k] = strpos($template, TAGOPEN.$k.TAGCLOSE);
    }
    asort ($pos); //!< sort the position.
    reset ($pos); 

    // replace:
    $lastPosition = 0; $result = '';
    foreach ($pos as $k => $v) {
      if (is_integer($v) && $components[$k]) { //!< found positions:
        $result .= substr($template, $lastPosition, $v-$lastPosition); //!< copy until tag position.
	$components[$k]->Render($result);
        $lastPosition = $v + strlen (TAGOPEN.$k.TAGCLOSE); //!< forward.
      }
    }
    $result .= substr($template, $lastPosition); //!< copy the rest of template.
    unset ($pos);
    return $result;
  }
}
?>
