#!/usr/bin/env python3
"""Turn the output of `rclone authorize` into an rclone config section on stdout.

Recent rclone versions print a base64 blob ("Paste the following into your remote machine ---> ... <---End paste"),
older ones print the token JSON. Either is read from stdin; the config is written to stdout and nothing is logged,
because the token is a secret:

    python3 scripts/rclone-conf-from-blob.py [remote-name] < pasted.txt | sudo tee /etc/quranweb/rclone.conf
    sudo chmod 600 /etc/quranweb/rclone.conf
"""
import base64
import json
import sys


def token_from(text: str) -> dict:
    text = text.strip()
    for marker in ("--->", "<---End paste"):
        text = text.replace(marker, "\n")
    candidates = [line.strip() for line in text.splitlines() if line.strip() and not line.lower().startswith("paste ")]
    for line in candidates:
        if line.startswith("{"):
            data = json.loads(line)
        else:
            padded = line + "=" * (-len(line) % 4)
            data = json.loads(base64.urlsafe_b64decode(padded))
        # The blob is {"token": "<token JSON as a string>", ...}; the old output is the token itself.
        inner = data.get("token", data)
        token = json.loads(inner) if isinstance(inner, str) else inner
        if "access_token" in token or "refresh_token" in token:
            return token
    raise ValueError("no rclone token found in the input")


def main() -> int:
    name = sys.argv[1] if len(sys.argv) > 1 else "gdrive"
    try:
        token = token_from(sys.stdin.read())
    except (ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"could not read the rclone token: {type(error).__name__}", file=sys.stderr)
        return 1
    if not token.get("refresh_token"):
        print("the token has no refresh_token: it would stop working within an hour", file=sys.stderr)
        return 1
    sys.stdout.write(f"[{name}]\ntype = drive\nscope = drive.file\ntoken = {json.dumps(token, separators=(',', ':'))}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
