#!/bin/sh

# Exit on error
set -e

# Change to the server directory
cd /usr/src/app/server

# Install dependencies if needed
if [ "$NODE_ENV" = "development" ]; then
  npm install
fi

# Start the server
exec node --experimental-modules --es-module-specifier-resolution=node app.js
