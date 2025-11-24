const fs = require("fs");
const cron = require("node-cron");
const { spawn } = require("child_process");
const path = require("path");

const OPTIONS_PATH = "/data/options.json";
const BASE_PATH = __dirname;

console.log("Starting Node.js Script Scheduler (v1.0.3)...");

let options;

try {
  const rawData = fs.readFileSync(OPTIONS_PATH);
  options = JSON.parse(rawData);
} catch (error) {
  console.error("Error reading options.json:", error);
  process.exit(1);
}

// 1. 提取全域 MQTT 設定
const globalMqttEnv = {
  MQTT_HOST: options.mqtt_host || "mqtt://core-mosquitto",
  MQTT_USER: options.mqtt_user || "",
  MQTT_PASS: options.mqtt_pass || "",
};

console.log(`[System] Global MQTT Host: ${globalMqttEnv.MQTT_HOST}`);

if (
  !options.scripts ||
  !Array.isArray(options.scripts) ||
  options.scripts.length === 0
) {
  console.log("No scripts configured.");
} else {
  options.scripts.forEach((scriptConfig, index) => {
    const scriptName = scriptConfig.path;
    const schedule = scriptConfig.cron;

    if (!scriptName || !schedule) {
      return;
    }

    // 2. 解析個別腳本的 env_vars
    let scriptSpecificEnv = {};
    if (scriptConfig.env_vars) {
      try {
        if (typeof scriptConfig.env_vars === "object") {
          scriptSpecificEnv = scriptConfig.env_vars;
        } else if (typeof scriptConfig.env_vars === "string") {
          scriptSpecificEnv = JSON.parse(scriptConfig.env_vars);
        }
      } catch (e) {
        console.error(`[${scriptName}] Failed to parse env_vars:`, e.message);
      }
    }

    // 處理路徑 (優先找內部 app_scripts, 沒有才找外部 config)
    let fullPath = path.isAbsolute(scriptName)
      ? scriptName
      : path.join(BASE_PATH, scriptName);
    if (
      !fs.existsSync(fullPath) &&
      fs.existsSync(path.join("/config", scriptName))
    ) {
      fullPath = path.join("/config", scriptName);
    }

    if (!cron.validate(schedule)) {
      console.error(`[${scriptName}] Invalid cron: ${schedule}`);
      return;
    }

    console.log(`[${scriptName}] Scheduled: ${schedule}`);

    cron.schedule(schedule, () => {
      console.log(`[${scriptName}] Executing...`);

      // 3. 合併環境變數
      // 優先順序：系統變數 < 全域 MQTT 設定 < 個別腳本設定
      // 這樣個別腳本如果想連另一個 Broker，也可以在 env_vars 覆蓋掉全域設定
      const finalEnv = {
        ...process.env,
        ...globalMqttEnv,
        ...scriptSpecificEnv,
      };

      const child = spawn("node", [fullPath], {
        env: finalEnv, // 注入合併後的變數
        cwd: path.dirname(fullPath),
      });

      child.stdout.on("data", (data) =>
        console.log(
          `[${scriptName}:${new Date().toISOString()}] ${data
            .toString()
            .trim()}`
        )
      );

      child.stderr.on("data", (data) =>
        console.error(
          `[${scriptName} ERR:${new Date().toISOString()}] ${data
            .toString()
            .trim()}`
        )
      );
    });
  });
}

// Keep alive
setInterval(() => {}, 1000 * 60 * 60);
