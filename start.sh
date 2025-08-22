#!/bin/sh
set -e

# Ensure we're in the right directory
cd /usr/src/app

# Start the server
node server/app.js
