# Home Assistant Node.js Script Scheduler

這是一個 Home Assistant Add-on，用於定期執行自訂的 Node.js 腳本。支援 cron 排程、環境變數設定，以及透過 MQTT 與 Home Assistant 整合。

## 功能特色

- ✅ 使用 cron 語法排程執行 Node.js 腳本
- ✅ 支援多個腳本同時排程
- ✅ 可為每個腳本設定獨立的環境變數
- ✅ 透過 MQTT Discovery 自動整合 Home Assistant
- ✅ 內建停電、停水通知範例腳本
- ✅ 支援 aarch64、amd64、armv7 等多種架構

## 安裝方式

1. 在 Home Assistant 中新增此 Add-on Repository
2. 安裝 "Node.js Script Scheduler" Add-on
3. 編輯 Add-on 設定檔 (參考下方設定範例)
4. 啟動 Add-on

## 設定範例

在 Add-on 設定頁面中，按照以下格式設定：

```yaml
mqtt_host: "mqtt://core-mosquitto"
mqtt_user: "your_mqtt_username"
mqtt_pass: "your_mqtt_password"
scripts:
  - path: app_scripts/power_outage.js
    cron: "0 8 * * *"
    env_vars: '{"OUTAGE_KEYWORD":"和豐街"}'
  - path: app_scripts/water_outage.js
    cron: "0 9 * * *"
    env_vars: '{"OUTAGE_CITY":"基隆市","OUTAGE_DISTRICT":"中正區","OUTAGE_AREA":"和豐街"}'
```

### 設定參數說明

**全域參數:**
- `mqtt_host`：MQTT broker 位址 (預設: "mqtt://core-mosquitto")
- `mqtt_user`：MQTT 使用者名稱
- `mqtt_pass`：MQTT 密碼

**腳本參數:**
- `path`：腳本檔案路徑 (相對於 `/app` 目錄)
- `cron`：Cron 排程表達式
  - 格式：`秒 分 時 日 月 星期`
  - 範例：`0 8 * * *` 表示每天早上 8:00 執行
- `env_vars`：(選填) 腳本專屬的環境變數，可以是 JSON 字串或物件格式

### Cron 語法參考

```
┌─────────────── 秒 (0-59)
│ ┌───────────── 分 (0-59)
│ │ ┌─────────── 時 (0-23)
│ │ │ ┌───────── 日 (1-31)
│ │ │ │ ┌─────── 月 (1-12)
│ │ │ │ │ ┌───── 星期 (0-7, 0 和 7 都代表星期日)
│ │ │ │ │ │
* * * * * *
```

常用範例:
- `0 0 8 * * *` - 每天早上 8:00
- `0 */30 * * * *` - 每 30 分鐘
- `0 0 12 * * 1-5` - 週一到週五中午 12:00

## 內建範例腳本

### 1. 停電通知 (`power_outage.js`)

監控台電網站的停電公告，當指定區域有停電通知時，自動在 Home Assistant 建立 sensor。

**環境變數:**
- `OUTAGE_KEYWORD`：要監控的街道名稱 (預設："和豐街")

**輸出到 HA:**
- Entity：`sensor.node_scheduler_power_outage`
- 狀態：`1` (無停電) / `2` (有停電) / `3` (錯誤)
- 屬性：停電日期、更新時間等

### 2. 停水通知 (`water_outage.js`)

監控台灣自來水公司的停水公告，當指定區域有停水或降壓通知時，自動在 Home Assistant 建立 sensor。

**環境變數:**
- `OUTAGE_CITY`：要監控的縣市 (預設: "基隆市")
- `OUTAGE_DISTRICT`：要監控的行政區 (預設: "中正區")
- `OUTAGE_AREA`：要監控的區域 (預設: "和豐街")

**輸出到 HA:**
- Entity：`sensor.node_scheduler_water_outage`
- 狀態：`1` (無停水) / `2` (有停水) / `3` (錯誤)
- 屬性：停水原因、停水日期、案件網址、更新時間等

## 開發自己的腳本

### 基本結構

```javascript
const path = require("path");

// 取得腳本檔名 (不含副檔名)
const BASENAME = path.basename(__filename, ".js");

(async () => {
  try {
    // 您的邏輯
    console.log("腳本執行中...");
    
    // 處理結果
    console.log("完成!");
  } catch (error) {
    console.error("發生錯誤:", error);
  }
})();
```

### 使用 MQTT 整合 Home Assistant

使用內建的 `mqtt_utils.js` 工具：

```javascript
const { sendToHA } = require("./mqtt_utils");

// 發送資料到 HA
await sendToHA(
  "my_script",           // deviceId (英文)
  "我的腳本裝置",        // deviceName (顯示名稱)
  {                      // payload (完整的資料物件)
    status: "OK",
    message: "執行成功",
    updatedAt: new Date().toISOString()
  },
  [                      // sensors (定義要建立的 Sensor)
    {
      sensorName: "狀態",        // Sensor 顯示名稱
      stateName: "status",       // 對應 payload 中的欄位
      icon: "mdi:check-circle"   // 圖示
    },
    {
      sensorName: "訊息",
      stateName: "message",
      icon: "mdi:message-text"
    }
  ]
);
```

這會在 HA 中建立 `sensor.node_my_script_status` 和 `sensor.node_my_script_message` 等 entity。

### 環境變數使用

在腳本中讀取環境變數：

```javascript
const MY_CONFIG = process.env.MY_CONFIG || "預設值";
```

在設定檔中傳入：

```yaml
scripts:
  - path: app_scripts/my_script.js
    cron: "0 * * * *"
    env_vars: '{"MY_CONFIG":"自訂值"}'
```

### 新增依賴套件

編輯 `/app_scripts/package.json`，在 `dependencies` 中加入需要的套件：

```json
{
  "dependencies": {
    "axios": "^1.13.2",
    "your-package": "^1.0.0"
  }
}
```

重新建置 Docker image 即可。

## 檔案結構

```
/
├── runner.js              # 主程式 (排程器)
├── package.json           # 主程式依賴
├── config.yaml            # Add-on 設定檔
├── Dockerfile             # Docker 建置設定
└── app_scripts/           # 腳本資料夾
    ├── package.json       # 腳本依賴
    ├── mqtt_utils.js      # MQTT 工具函式
    ├── power_outage.js    # 停電通知範例
    └── water_outage.js    # 停水通知範例
```

## 技術細節

- **Node.js 版本**：20 (Alpine)
- **排程套件**：node-cron
- **MQTT 客戶端**：mqtt v5
- **網頁爬蟲**：axios + cheerio
- **日期處理**：moment

## 除錯

查看 Add-on 日誌可以看到：

- 腳本排程載入狀態
- 各腳本執行時間
- 腳本輸出 (stdout/stderr)
- 執行結束狀態碼

日誌格式範例：
```
[power_outage.js] Scheduled: 0 8 * * *
[power_outage.js] Executing...
[power_outage.js] 最近沒有停電
```

## 注意事項

1. Cron 語法必須正確，否則該腳本會被跳過
2. 腳本路徑必須存在，否則會顯示警告
3. MQTT 設定需與 Home Assistant 的 Mosquitto Add-on 設定一致
4. 環境變數可以使用 JSON 字串或 YAML 物件格式
5. 腳本執行時工作目錄會設定為腳本所在資料夾

## 授權

請參考 LICENSE 檔案。

## 作者

kewang

## 版本歷史

- **1.0.2**：當前版本
- **1.0.1**：新增環境變數支援
- **1.0.0**：初始版本
