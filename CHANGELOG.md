# Changelog

All notable changes to this project will be documented in this file.

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
