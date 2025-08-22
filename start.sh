#!/bin/bash

# Exit on error
set -e

# Install the correct Node.js version
NODE_VERSION=20.14.0
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # Load nvm
nvm install $NODE_VERSION
nvm use $NODE_VERSION

# Install dependencies
npm install

# Start the server
node --experimental-modules --es-module-specifier-resolution=node app.js
