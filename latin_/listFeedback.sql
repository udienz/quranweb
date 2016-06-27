# phpMyAdmin MySQL-Dump
# version 2.2.1-dev
# http://phpwizard.net/phpMyAdmin/
# http://phpmyadmin.sourceforge.net/ (download page)
#
# Host: members-free-php08.de.db.lyceu.net:3307
# Erstellungszeit: 22. Mai 2003 um 10:42
# Server Version: 3.23.33
# PHP Version: 4.0.6
# Datenbank : `diantn_de_db`
# --------------------------------------------------------

#
# Tabellenstruktur für Tabelle `listFeedback`
#

#DROP TABLE IF EXISTS listFeedback;

CREATE TABLE listFeedback (
  rid int(11) NOT NULL auto_increment,
  user int(11) default NULL,
  modified datetime default NULL,
  sid int(11) default NULL,
  name varchar(30) NOT NULL default '',
  location varchar(30) default NULL,
  email varchar(60) NOT NULL default '',
  home varchar(80) NOT NULL default '',
  server varchar(20) NOT NULL default '',
  message text,
  response text,
  private char(1) NOT NULL default '0',
  yid varchar(20) NOT NULL default '',
  icq varchar(20) NOT NULL default '',
  msn varchar(20) NOT NULL default '',
  PRIMARY KEY  (rid)
) TYPE=MyISAM;

#DROP TABLE IF EXISTS listDownload;

CREATE TABLE listDownload (
  rid int(11) NOT NULL auto_increment,
  user int(11) default NULL,
  modified datetime default NULL,
  item varchar(50) default NULL,
  name varchar(30) NOT NULL default '',
  location varchar(30) default NULL,
  email varchar(60) NOT NULL default '',
  home varchar(80) NOT NULL default '',
  server varchar(20) NOT NULL default '',
  message text,
  PRIMARY KEY  (rid)
) TYPE=MyISAM;

#
# Table structure for table `listRequest`
#

#DROP TABLE IF EXISTS listRequest;
CREATE TABLE listRequest (
  rid int(11) NOT NULL auto_increment,
  user int(11) NOT NULL default '0',
  modified datetime NOT NULL default '0000-00-00 00:00:00',
  request varchar(255) NOT NULL default '',
  latin char(1) NOT NULL default '',
  lang char(3) NOT NULL default '0',
  result int(11) NOT NULL default '0',
  PRIMARY KEY  (rid),
  KEY request (request(4))
) TYPE=MyISAM; 