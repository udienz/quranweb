<?

  $a = 1;
  $b = &$a;
  
  print "$a == $b\n";
  
  $a = 2;
  
  print "$a == $b\n";
  
  $b = 3;
  print "$a == $b\n";
  
  $c = 2;
  $b = &$c; // this will unbound b from a, rebound to c.
  
  print "$a <> $b\n";
?>