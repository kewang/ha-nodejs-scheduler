const mqtt = require("mqtt");

// 從環境變數讀取設定，若無則使用預設值
const MQTT_HOST = process.env.MQTT_HOST || "mqtt://core-mosquitto";
const MQTT_USER = process.env.MQTT_USER || "";
const MQTT_PASS = process.env.MQTT_PASS || "";

/**
 * 發送數據到 Home Assistant (MQTT Discovery)
 *
 * @param {string} id - 唯一的 ID (英文)，例如 'power_outage'
 * @param {string} name - 在 HA 顯示的名字，例如 '停電通知'
 * @param {object} stateData - 資料物件，例如 { status: 'OK', date: '...' }
 * @param {string} icon - 圖示，例如 'mdi:flash'
 */
const sendToHA = async (id, name, stateData, icon = "mdi:information") => {
  return new Promise(async (resolve, reject) => {
    const client = await mqtt.connectAsync(MQTT_HOST, {
      username: MQTT_USER,
      password: MQTT_PASS,
    });

    console.log(`[Debug] 連線成功！ Client ID: ${client.options.clientId}`);

    // 定義 Topic
    const deviceId = `node_scheduler_${id}`;
    const configTopic = `homeassistant/sensor/${deviceId}/config`;
    const stateTopic = `homeassistant/sensor/${deviceId}/state`;

    client.on("connect", async () => {
      // 1. 準備 Discovery 設定
      // 這裡設定 "value_template" 讀取 json 中的 state 欄位作為主狀態
      // "json_attributes_topic" 則會把整包 json 變成屬性
      const discoveryPayload = {
        unique_id: deviceId,
        name: name,
        state_topic: stateTopic,
        icon: icon,
        value_template: "{{ value_json.state }}",
        json_attributes_topic: stateTopic,
        device: {
          identifiers: [deviceId],
          name: `${name} Monitor`,
          manufacturer: "NodeJS Addon",
          model: "v1.0",
        },
      };

      // 2. 發送 Discovery (Retain=true 讓 HA 重啟後記得這個裝置)
      console.log(`[Debug] 正在發送 Discovery Config 到: ${configTopic}`);
      await client.publishAsync(configTopic, JSON.stringify(discoveryPayload), {
        retain: true,
      });
      console.log(`[Debug] Discovery 發送完畢`);

      // 3. 發送狀態
      console.log(`[Debug] 正在發送 State 到: ${stateTopic}`);
      console.log(`[Debug] 內容: ${JSON.stringify(stateData)}`);
      await client.publishAsync(stateTopic, JSON.stringify(stateData), {
        retain: true,
      });
      console.log(`[Debug] State 發送完畢`);

      // 4. 結束連線
      await client.endAsync();

      return resolve();
    });

    client.on("error", async (err) => {
      console.error("[MQTT] Connection Error:", err);

      await client.endAsync();

      return reject(err);
    });
  });
};

module.exports = { sendToHA };
