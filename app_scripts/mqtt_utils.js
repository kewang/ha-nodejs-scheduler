const mqtt = require("mqtt");

// 從環境變數讀取設定，若無則使用預設值
const MQTT_HOST = process.env.MQTT_HOST || "mqtt://core-mosquitto";
const MQTT_USER = process.env.MQTT_USER || "";
const MQTT_PASS = process.env.MQTT_PASS || "";

/**
 * @param {string} deviceId - 裝置唯一 ID (如 power_outage)
 * @param {string} deviceName - 裝置名稱 (如 台電監控)
 * @param {object} payload - 完整的資料 JSON { status: 1, date: '...', ... }
 * @param {Array} sensors - 定義要建立哪些 Sensor
 */
const sendToHA = async (deviceId, deviceName, payload, sensors) => {
  let client;

  try {
    client = await mqtt.connectAsync(MQTT_HOST, {
      username: MQTT_USER,
      password: MQTT_PASS,
    });

    const baseTopic = `homeassistant/sensor/nodejs_scheduler_${deviceId}`;
    const stateTopic = `${baseTopic}/state`;

    // 1. 迴圈：為每一個定義好的 Sensor 發送一張「身分證」
    for (const sensor of sensors) {
      // 每個 Sensor 都要有自己的 unique_id 和 config topic
      const uniqueId = `node_${deviceId}_${sensor.stateName}`;
      const configTopic = `${baseTopic}/${sensor.stateName}/config`;

      const discoveryPayload = {
        unique_id: uniqueId,
        name: sensor.sensorName, // 日期
        state_topic: stateTopic, // ★ 大家聽同一個頻道
        value_template: `{{ value_json.${sensor.stateName} }}`, // ★ 抓取 JSON 裡不同的欄位
        icon: sensor.icon,
        device: {
          identifiers: [`nodejs_scheduler_${deviceId}`], // 綁定同一個 Device
          name: deviceName,
          manufacturer: "nodejs scheduler",
          model: "v1.0.0",
        },
      };

      console.log(`[Discovery] Registering ${sensor.stateName}...`);

      await client.publishAsync(configTopic, JSON.stringify(discoveryPayload), {
        retain: true,
      });
    }

    // 2. 發送一次數據，所有 Sensor 會同時更新
    console.log(`[State] Sending data...`);

    await client.publishAsync(stateTopic, JSON.stringify(payload), {
      retain: true,
    });
  } catch (error) {
    console.error("[MQTT] Error:", error);
  } finally {
    if (client && client.connected) {
      await client.endAsync();
    }
  }
};

module.exports = { sendToHA };
