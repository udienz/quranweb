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

## Off-server copy: a private GitHub repository (in use)

`scripts/upload-git.sh` pushes the whole local backup folder (`/srv/quranweb-backups/<env>/`, the last 30 days, all
age-encrypted) to the private repository `udienz/quranweb-backups` after every backup. Each run is one commit with no
parent that replaces the branch, so files the server dropped also leave the repository's history (GitHub may keep
unreachable data for a while before it collects it). Only new files are uploaded, because the clone in
`/var/lib/quranweb/backup-git` remembers what the remote has. It refuses to push an empty folder, or fewer than 3 files
while the remote has more, so a mistake on the server cannot wipe the off-server copy. A failed push fails the run (the
local copy stays).

The server writes with a **deploy key** (`/root/.ssh/quranweb-backup`) that can only write to that one repository, not to
any other repository or the account. Settings in `/etc/quranweb/backup.env`:

```
UPLOAD_CMD=/usr/local/lib/quranweb/upload-git.sh
BACKUP_GIT_REMOTE=git@github.com:udienz/quranweb-backups.git
BACKUP_GIT_KEY=/root/.ssh/quranweb-backup
```

**Restore from GitHub** (on any machine with access to the repository and the age private key):

```bash
git clone git@github.com:udienz/quranweb-backups.git && cd quranweb-backups
scripts/restore-db.sh qa/<file>.db.age <age-private-key-file> /path/to/restored.db   # from the quranweb repository
```

**New server:** create a new deploy key (`ssh-keygen -t ed25519 -f /root/.ssh/quranweb-backup -N ""`), add its public key
to the repository with write access (Settings > Deploy keys), and remove the old one.

## Alternative: Google Drive with rclone (not in use)

The backups are encrypted before they leave the server, so the remote only ever holds files nobody can read without the
age private key. `scripts/upload-rclone.sh` copies each new backup to `<remote>/<qa|prod>/`, checks that the size arrived
intact, and deletes copies older than `RETENTION_DAYS` (30). It never deletes when fewer than 3 files would remain, so a
wrong clock or a long outage cannot wipe every copy. A failed upload fails the run (the local copy stays).

**One-time setup**

1. Use a Google account made for backups, if you can, not your main one: the token on the server can then only reach this
   account. The `drive.file` scope below limits it to files rclone created itself.
2. On a machine with a browser (a recent rclone prints a base64 blob; the second argument of `authorize` is the JSON
   `{"scope":"drive.file"}` in base64 **without** `=` padding):

   ```bash
   rclone authorize "drive" "eyJzY29wZSI6ImRyaXZlLmZpbGUifQ" --auth-no-open-browser
   ```

   Log in and approve. Copy what rclone prints between `--->` and `<---End paste` (never paste it into a chat or git).
3. On the server, turn it into a config file (works for the blob of a new rclone and for the token JSON of an old one):

   ```bash
   python3 scripts/rclone-conf-from-blob.py gdrive | sudo tee /etc/quranweb/rclone.conf >/dev/null   # paste, then Ctrl-D
   sudo chown root:root /etc/quranweb/rclone.conf && sudo chmod 600 /etc/quranweb/rclone.conf
   sudo apt install rclone
   ```
4. Tell the timer to use it, in `/etc/quranweb/backup.env` (one `NAME=value` per line):

   ```
   UPLOAD_CMD=/usr/local/lib/quranweb/upload-rclone.sh
   RCLONE_CONFIG=/etc/quranweb/rclone.conf
   RCLONE_REMOTE=gdrive:quranweb-backups
   ```

   and install the script: `sudo install -m 755 scripts/upload-rclone.sh /usr/local/lib/quranweb/`.
5. Try it: `sudo systemctl start quranweb-backup@qa.service`, then `sudo rclone --config /etc/quranweb/rclone.conf lsl gdrive:quranweb-backups/qa`.

The refresh token does not expire while it is used every night. If it is revoked (a password change with "sign out of
all devices", or an app removed in the Google account), uploads fail with an error in `journalctl -u quranweb-backup@qa`:
repeat step 2 and 3. Do not use your own OAuth client in "Testing" mode: its tokens expire after 7 days; rclone's built-in
client does not have that limit.

**Restore from the remote**

```bash
sudo rclone --config /etc/quranweb/rclone.conf copy gdrive:quranweb-backups/qa/<file>.db.age .
scripts/restore-db.sh <file>.db.age <age-private-key-file> /path/to/restored.db
```

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
