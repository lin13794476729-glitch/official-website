#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="deploy"
WEB_ROOT="/home/www/htdocs"
BACKUP_ROOT="/home/www/backups"
DEPLOY_PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJurjBmw1T3WBj8jcuL/lFTRKJY0v4eoyTrSpJA0oy04 github-actions-deploy"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run this script as root."
  exit 1
fi

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
passwd -l "$DEPLOY_USER" >/dev/null 2>&1 || true

WEB_USER="$(ps -eo user,comm | awk '/apache|httpd|nginx/ {print $1; exit}')"
if [ -z "$WEB_USER" ]; then
  WEB_USER="www-data"
fi

usermod -aG "$WEB_USER" "$DEPLOY_USER" || true

mkdir -p "$WEB_ROOT" "$BACKUP_ROOT"
chown -R "root:$WEB_USER" "$WEB_ROOT"
chmod -R g+rwX "$WEB_ROOT"
find "$WEB_ROOT" -type d -exec chmod 2775 {} \;
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$BACKUP_ROOT"

apt update
apt install -y acl rsync

setfacl -R -m "u:$DEPLOY_USER:rwx" "$WEB_ROOT"
setfacl -R -d -m "u:$DEPLOY_USER:rwx" "$WEB_ROOT"

if [ -d "$WEB_ROOT/uploads/goods" ]; then
  setfacl -R -m "u:$DEPLOY_USER:rx" "$WEB_ROOT/uploads/goods"
  setfacl -R -d -m "u:$DEPLOY_USER:rx" "$WEB_ROOT/uploads/goods"
fi

install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
AUTHORIZED_KEYS="/home/$DEPLOY_USER/.ssh/authorized_keys"
touch "$AUTHORIZED_KEYS"
grep -qxF "$DEPLOY_PUBLIC_KEY" "$AUTHORIZED_KEYS" || echo "$DEPLOY_PUBLIC_KEY" >> "$AUTHORIZED_KEYS"
chown "$DEPLOY_USER:$DEPLOY_USER" "$AUTHORIZED_KEYS"
chmod 600 "$AUTHORIZED_KEYS"

echo "Deploy user is ready."
echo "Detected web user: $WEB_USER"
echo "Test from your computer:"
echo "ssh -i ~/.ssh/lighthouse_github_actions deploy@82.156.97.56"
