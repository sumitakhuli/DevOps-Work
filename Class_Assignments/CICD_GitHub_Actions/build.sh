#!/bin/bash
set -e
echo "Starting application build"
rm -rf build
mkdir -p build
cp -r app requirements.txt build/
cat > build/build-info.txt <<INFO
Application: Session 16 Calculator API
Build Status: SUCCESS
Commit: ${GITHUB_SHA:-local}
Build Date: $(date -u)
INFO
ls -la build
echo "Build completed successfully."
