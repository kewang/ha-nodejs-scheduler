FROM node:20-alpine

ENV FORCE_COLOR=1
WORKDIR /app

# 1. 先安裝主程式 (runner.js) 的依賴
COPY package.json /app/
RUN npm install

# 2. 複製主程式
COPY runner.js /app/

# 3. 複製腳本資料夾
COPY app_scripts /app/app_scripts/

# === 關鍵修改 ===
# 4. 進入 app_scripts 資料夾並安裝它的依賴
#    --production flag 可以避免安裝不必要的開發工具
RUN cd /app/app_scripts && npm install --production

CMD [ "node", "runner.js" ]