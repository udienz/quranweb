# Database backup and restore

The account database (SQLite, WAL mode) is the one place with data that exists nowhere else, so it
is backed up every night and the restore is rehearsed.

## How it works

`scripts/backup-db.sh <qa|prod>`:

1. takes a consistent snapshot inside the running container (`VACUUM INTO`, no downtime) and runs
   `PRAGMA integrity_check` on it (`scripts/db-tool.mjs`, using the Node of the container);
2. encrypts it with [age](https://github.com/FiloSottile/age) to the **public** key(s) in
   `/etc/quranweb/backup-recipients.txt`. The private key is not on the server, so a stolen server
   or a stolen backup cannot be read;
3. writes `quranweb-<env>-<UTC time>.db.age` to `/srv/quranweb-backups/<env>/` (mode 700). This copy
   protects against mistakes, not against losing the disk;
4. runs `$UPLOAD_CMD <file>` when set, to copy it **off the server** (for example a wrapper around
   `rclone` or `aws s3 cp` for a bucket such as Cloudflare R2, or `scp` to another machine). A failing
   upload fails the run;
5. deletes local backups older than `RETENTION_DAYS` (30).

The plaintext snapshot only exists inside the database volume until it is encrypted, and is removed
even when the run fails.

## Installing on a server (once, needs root)

```bash
sudo apt install age
age-keygen -o backup-key.txt          # run this on the OWNER's machine, not the server
# copy only the public key (the line "age1...") to the server:
sudo install -d /etc/quranweb /usr/local/lib/quranweb
echo 'age1...' | sudo tee /etc/quranweb/backup-recipients.txt
sudo install -m 755 scripts/backup-db.sh /usr/local/lib/quranweb/
sudo install -m 644 scripts/db-tool.mjs /usr/local/lib/quranweb/
sudo install -m 644 deploy/systemd/quranweb-backup@.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now quranweb-backup@qa.timer     # and @prod
sudo systemctl start quranweb-backup@qa.service          # first run now; check journalctl -u 'quranweb-backup@qa'
```

Keep `backup-key.txt` (the private key) somewhere safe and **not on the server**: without it the
backups cannot be restored. Optional settings go in `/etc/quranweb/backup.env`.

## Restore (and the rehearsal)

```bash
scripts/restore-db.sh <backup.db.age> backup-key.txt /path/to/restored.db
```

It decrypts, runs the integrity check, prints the schema version and row counts, and refuses to
overwrite an existing file. To rehearse, restore to a scratch path and compare the counts with the
live database. For a real restore: stop the container, move the old `quranweb.db`, `-wal` and `-shm`
away, restore to `/srv/quranweb-db/<env>/quranweb.db`, `chown 1001:1001` it and start the container.

`scripts/backup-db.test.sh` checks the whole round trip (backup, encryption, restore, retention,
upload hook) with a real SQLite file; CI runs it.
