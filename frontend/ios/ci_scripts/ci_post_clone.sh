#!/bin/sh
set -e

# Install Homebrew dependencies
brew install node cocoapods

# Install JS dependencies
cd "$CI_PRIMARY_REPOSITORY_PATH/frontend"
npm install

# Install iOS pods
cd ios
pod install
