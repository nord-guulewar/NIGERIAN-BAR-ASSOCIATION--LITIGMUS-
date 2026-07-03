#!/bin/sh
# entrypoint.sh  – generates userlist.txt from env vars, then starts PgBouncer.
# This avoids storing passwords in the image or a committed file.

set -e

DB_USER="${POSTGRES_USER:-postgres}"
DB_PASS="${POSTGRES_PASSWORD:-postgres}"
ADMIN_PASS="${PGBOUNCER_ADMIN_PASSWORD:-pgbouncer_admin_secret}"

cat > /etc/pgbouncer/userlist.txt <<EOF
"${DB_USER}" "${DB_PASS}"
"pgbouncer_admin" "${ADMIN_PASS}"
EOF

chmod 600 /etc/pgbouncer/userlist.txt

exec pgbouncer /etc/pgbouncer/pgbouncer.ini
