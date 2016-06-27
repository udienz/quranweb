#!/bin/sh
echo -e "Uninstal quranweb"
echo -n "Masukkan password root mysql :"
stty -echo
read PASS
stty echo
echo -e "\nUninstal dimulai................"
/opt/lampp/bin/mysql -u root -p$PASS < deletedb.sql
if [ "$?" -eq 0 ]
then
    echo -e "Uninstal berhasil"
else
    echo -e "Uninstal gagal"
fi

