#!/bin/sh
set -e

# Fix ownership of /app/data if running as root
# This handles mounted volumes with incorrect permissions
if [ "$(id -u)" = "0" ]; then
    chown -R nextjs:nodejs /app/data
    exec gosu nextjs "$@"
else
    exec "$@"
fi
