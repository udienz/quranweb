#!/bin/sh
files=`ls -1 *.mp3`
for file in $files ; do
    mv $file $newfilename
done
