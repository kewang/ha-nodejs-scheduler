# Changelog

All notable changes to this project will be documented in this file.

## [1.0.18] - 2025-12-22

### Added
- 水質檢測腳本的數值型 Sensor 現在支援 `state_class` 和 `unit_of_measurement` 屬性
  - 自由有效餘氯：新增測量單位 `mg/L` 和 `state_class: measurement`
  - 濁度：新增測量單位 `NTU` 和 `state_class: measurement`
  - pH值：新增 `state_class: measurement`
  - 總硬度：新增測量單位 `mg/L` 和 `state_class: measurement`
  - 硝酸鹽氮：新增測量單位 `mg/L` 和 `state_class: measurement`

### Changed
- `mqtt_utils.js` 現在支援傳遞 `unitOfMeasurement`、`stateClass` 和 `deviceClass` 屬性到 Home Assistant MQTT 自動發現配置

### Fixed
- 修正水質檢測數值欄位在 Home Assistant 中顯示為文字而非數值的問題
- 數值型 Sensor 現在可以正確地：
  - 顯示測量單位
  - 在圖表中使用
  - 用於數值比較和自動化規則

### Improved
- 提升水質檢測 Sensor 的可用性，數值欄位現在能被 Home Assistant 正確識別為測量值類型

## [1.0.17] - 2025-12-13

### Changed
- 將 config.yaml schema 改回原本的簡單格式，使用 `env_vars: str?` 而非結構化物件

### Fixed
- 修正 1.0.16 版本中 schema 格式無法在 Home Assistant 中正常運作的問題

## [1.0.16] - 2025-12-13

### Changed
- 改進 config.yaml schema 設定，針對不同的內建腳本使用結構化的環境變數格式
  - `app_scripts/power_outage.js` 的 `env_vars` 現在使用物件格式，包含 `POWER_STATION_NAME`、`POWER_STATION_AREA`、`OUTAGE_KEYWORD` 欄位
  - `app_scripts/water_outage.js` 的 `env_vars` 現在使用物件格式，包含 `OUTAGE_CITY`、`OUTAGE_DISTRICT`、`OUTAGE_AREA` 欄位
  - `app_scripts/water_quality.js` 的 `env_vars` 現在使用物件格式，包含 `STATION_ID` 欄位
  - 其他自訂腳本仍保留彈性的字串格式

### Improved
- 大幅提升設定檔的可讀性，不再需要使用難以閱讀的 JSON 字串格式
- 在 Home Assistant UI 中設定環境變數時，現在會顯示清楚的欄位結構

### Note
- 此版本因 schema 格式問題已在 1.0.17 回退

## [1.0.15] - 2025-12-13

### Added
- 新增台電營業處列表參考資料 (`app_scripts/assets/power_station.json`)
- 停電通知腳本新增兩個環境變數：
  - `POWER_STATION_NAME`：營業處名稱
  - `POWER_STATION_AREA`：營業處地區

### Changed
- 更新停電通知 (`power_outage.js`) 環境變數設定方式，現在需要同時設定營業處名稱、地區和關鍵字
- 改善 README 文件：
  - 將「內建範例腳本」改為「內建腳本」
  - 為三個內建腳本新增完整的 Sensor 列表說明
  - 為停電通知和水質檢測腳本新增參考資料說明
  - 更新設定範例以包含新增的環境變數

### Improved
- 停電通知腳本現在可以更精確地定位營業處，避免同名區域的混淆
- 文件更加詳細，列出所有會建立的 Home Assistant Sensors 及其說明

## [1.0.14] - Previous Release

...
