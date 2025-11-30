const axios = require("axios").default;
const moment = require("moment");
const path = require("path");
const { sendToHA } = require("./mqtt_utils");

const URL = "https://web.water.gov.tw/wateroffapi/openData/export/json";

const OUTAGE_CITY = process.env.OUTAGE_CITY || "基隆市";
const OUTAGE_DISTRICT = process.env.OUTAGE_DISTRICT || "中正區";
const OUTAGE_AREA = process.env.OUTAGE_AREA || "和豐街";

const STATUS_CODE = {
  STATUS_NO_OUTAGE: 1,
  STATUS_OUTAGE: 2,
  STATUS_ERROR: 3,
};

const STATUS = {
  STATUS_NO_OUTAGE: "最近沒有停水",
  STATUS_OUTAGE: "有停水通知",
  STATUS_ERROR: "發生錯誤",
};

const DEVICE_NAME = "停水通知";

const SENSORS = [
  {
    sensorName: "停水日期",
    stateName: "date",
    icon: "mdi:calendar-alert",
  },
  {
    sensorName: "狀態代碼",
    stateName: "statusCode",
    icon: "mdi:numeric",
  },
  {
    sensorName: "狀態",
    stateName: "status",
    icon: "mdi:information-outline",
  },
  {
    sensorName: "更新時間",
    stateName: "updatedAt",
    icon: "mdi:clock-outline",
  },
  {
    sensorName: "原因",
    stateName: "reason",
    icon: "mdi:alert-circle-outline",
  },
  {
    sensorName: "詳細網址",
    stateName: "url",
    icon: "mdi:web",
  },
];

const BASENAME = path.basename(__filename, ".js");

(async () => {
  try {
    const jsonData = (await axios.get(URL)).data;

    let foundDate;

    const foundRecord = jsonData.find(
      (record) =>
        record.影響縣市 === OUTAGE_CITY &&
        record.影響行政區.includes(OUTAGE_DISTRICT) &&
        (record.停水地區.includes(OUTAGE_AREA) ||
          record.降壓地區.includes(OUTAGE_AREA))
    );

    if (foundRecord) {
      const 停水原因 =
        foundRecord.停水原因 === "[]"
          ? ""
          : foundRecord.停水原因.slice(1, -1).trim();
      const 降壓原因 =
        foundRecord.降壓原因 === "[]"
          ? ""
          : foundRecord.降壓原因.slice(1, -1).trim();
      const caseUrl = `https://web.water.gov.tw/wateroffmap/map/view/${foundRecord.案件編號}`;

      foundDate = moment(foundRecord.案件日期時間, "YYYY-MM-DD HH:mm:ss");

      await sendToHA(
        BASENAME,
        DEVICE_NAME,
        {
          status: STATUS.STATUS_OUTAGE,
          statusCode: STATUS_CODE.STATUS_OUTAGE,
          reason: [停水原因, 降壓原因].filter(Boolean).join("；"),
          url: caseUrl,
          updatedAt: moment().format(),
          date: foundDate.format("YYYY/MM/DD"),
        },
        SENSORS
      );

      console.log(foundDate.format("YYYY/MM/DD"));
    } else {
      await sendToHA(
        BASENAME,
        DEVICE_NAME,
        {
          status: STATUS.STATUS_NO_OUTAGE,
          statusCode: STATUS_CODE.STATUS_NO_OUTAGE,
          updatedAt: moment().format(),
        },
        SENSORS
      );

      console.log("最近沒有停水");
    }
  } catch (error) {
    await sendToHA(
      BASENAME,
      DEVICE_NAME,
      {
        status: STATUS.STATUS_ERROR,
        statusCode: STATUS_CODE.STATUS_ERROR,
        updatedAt: moment().format(),
      },
      SENSORS
    );

    console.error(error);
    console.error("發生錯誤");
  }
})();
