#!/usr/bin/env sh
echo "🚀 Node.js Runner Add-on starting..."
if [ -z "$SCRIPT" ]; then
  echo "❌ No SCRIPT specified. Example: SCRIPT=power_outage.js"
  exit 1
fi

cd /usr/src/app/scripts
echo "▶️ Running $SCRIPT ..."
node "$SCRIPT"