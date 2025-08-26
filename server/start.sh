#!/bin/sh
set -e

# Change into this script's directory (server/)
cd "$(dirname "$0")"

# Optional in dev-only containers:
# [ "$NODE_ENV" = "development" ] && npm install

exec node --experimental-modules --es-module-specifier-resolution=node app.js
