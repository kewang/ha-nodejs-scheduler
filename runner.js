const fs = require("fs");
const cron = require("node-cron");
const { spawn } = require("child_process");
const path = require("path");

const OPTIONS_PATH = "/data/options.json";
const BASE_PATH = __dirname;
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
const SUPERVISOR_URL = "http://supervisor";
const { version } = require("./package.json");

console.log(`Starting Node.js Script Scheduler (v${version})...`);

const getMqttConfig = async (manualOptions) => {
  // 1. 如果使用者有手動設定，優先使用手動設定
  if (manualOptions.mqtt_host && manualOptions.mqtt_host.trim() !== "") {
    console.log("[System] Using manual MQTT configuration.");

    return {
      MQTT_HOST: manualOptions.mqtt_host,
      MQTT_USER: manualOptions.mqtt_user || "",
      MQTT_PASS: manualOptions.mqtt_pass || "",
    };
  }

  // 2. 如果沒手動設定，嘗試從 Supervisor API 取得
  if (!SUPERVISOR_TOKEN) {
    console.warn(
      "[System] No Supervisor Token found. Cannot fetch MQTT config automatically."
    );

    return {};
  }

  try {
    console.log("[System] Fetching MQTT config from Supervisor Service...");

    const response = await fetch(`${SUPERVISOR_URL}/services/mqtt`, {
      headers: {
        Authorization: `Bearer ${SUPERVISOR_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Supervisor API Error: ${response.status} ${response.statusText}`
      );
    }

    const json = await response.json();

    if (json.result === "ok" && json.data) {
      console.log("[System] Automatically configured MQTT from Supervisor.");

      return {
        // API 回傳的 host 通常是 "core-mosquitto"，我們加上 mqtt:// 前綴
        MQTT_HOST: `mqtt://${json.data.host}`,
        MQTT_USER: json.data.username,
        MQTT_PASS: json.data.password,
      };
    }
  } catch (error) {
    console.error("[System] Failed to fetch MQTT config:", error.message);

    console.log(
      '[System] Please ensure "Mosquitto broker" add-on is installed and running.'
    );
  }

  return {}; // 如果都失敗，回傳空物件
};

(async () => {
  let options;

  try {
    const rawData = fs.readFileSync(OPTIONS_PATH);
    options = JSON.parse(rawData);
  } catch (error) {
    console.error("Error reading options.json:", error);
    process.exit(1);
  }

  const autoMqttEnv = await getMqttConfig(options);

  // 1. 提取全域 MQTT 設定
  const globalMqttEnv = {
    MQTT_HOST: autoMqttEnv.MQTT_HOST || "mqtt://core-mosquitto",
    MQTT_USER: autoMqttEnv.MQTT_USER || "",
    MQTT_PASS: autoMqttEnv.MQTT_PASS || "",
  };

  console.log(`[System] MQTT Host: ${globalMqttEnv.MQTT_HOST}`);

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
            `[${scriptName} ${new Date().toISOString()}] ${data
              .toString()
              .trim()}`
          )
        );

        child.stderr.on("data", (data) =>
          console.error(
            `[${scriptName} ERR ${new Date().toISOString()}] ${data
              .toString()
              .trim()}`
          )
        );
      });
    });
  }

  // Keep alive
  setInterval(() => {}, 1000 * 60 * 60);
})();
