#!/bin/sh
echo -e "Install aplikasi quran web"
echo -n "Masukkan password root mysql :"
stty -echo
read PASS
stty echo
echo -e "\nInstalasi dimulai................ "
mysql -u root -p$PASS < initdb.sql
if [ "$?" -eq 0 ]
then
    echo -e "Instalasi berhasil "
else
    echo -e "Instalasi gagal "
fi
