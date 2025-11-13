#!/usr/bin/env sh

echo "🚀 Node.js Runner Add-on starting..."

# 顯示當前環境變數 SCRIPT 的內容
echo "🔍 DEBUG: SCRIPT env var is: '${SCRIPT}'"

# 如果 SCRIPT 為空，顯示錯誤訊息
if [ -z "$SCRIPT" ]; then
  echo "❌ SCRIPT is empty."
  echo "   This usually means your Add-on did NOT receive the config value."
  echo "   Please check:"
  echo "   1. Your add-on's config.yaml or config.json has:"
  echo "        options:"
  echo "          script: hello.js"
  echo "        schema:"
  echo "          script: str"
  echo "   2. You pressed SAVE in the Add-on UI after editing configuration."
  echo "   3. You reloaded add-ons: 'ha addons reload'."
  echo "   4. You restarted the Add-on."
  echo "⚠️  The Add-on will continue, but node will receive an empty script."
  # 若你想停止運行，解除下一行註解即可：
  exit 1
fi

cd /usr/src/app/scripts || exit 1

echo "▶️ Running script: '$SCRIPT' ..."

# 如果 SCRIPT 有內容就執行
if [ -n "$SCRIPT" ]; then
  node "$SCRIPT"
else
  # 沒有 SCRIPT 時，避免 node 報錯
  echo "⚠️ SCRIPT is empty, skipping node execution."
fi
