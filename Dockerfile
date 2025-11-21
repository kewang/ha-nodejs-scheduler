ARG BUILD_FROM
FROM $BUILD_FROM

# 1. 安裝 Node.js
RUN apk add --no-cache nodejs npm

# 2. 設定工作目錄
WORKDIR /app

# 3. 複製 package.json 並安裝依賴
COPY package.json /app/
RUN npm install

# 4. 複製主程式
COPY runner.js /app/

# 5. 【關鍵修正】直接由 Dockerfile 產生 S6 啟動腳本
#    這可以避開所有檔案格式與權限問題
RUN mkdir -p /etc/services.d/scheduler && \
    printf "#!/usr/bin/with-contenv bashio\ncd /app\nexec node runner.js\n" > /etc/services.d/scheduler/run && \
    chmod +x /etc/services.d/scheduler/run

# 6. 確保沒有 CMD 指令干擾 S6
# (不需要寫 CMD，因為 Base Image 會自動執行 S6)