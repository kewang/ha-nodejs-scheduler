const axios = require("axios").default;
const moment = require("moment");
const cheerio = require("cheerio");
const path = require("path");
const { sendToHA } = require("./mqtt_utils");

const URL =
  "https://www.water.gov.tw/ch/WaterQuality/Detail/{detailId}?nodeId=4631";

const DETAIL_ID = process.env.DETAIL_ID || "1991";

const DEVICE_NAME = "水質檢測";

const SENSORS = [
  {
    sensorName: "自由有效餘氯",
    stateName: "自由有效餘氯",
  },
  {
    sensorName: "濁度",
    stateName: "濁度",
  },
  {
    sensorName: "pH值",
    stateName: "pH值",
  },
  {
    sensorName: "總硬度",
    stateName: "總硬度",
  },
  {
    sensorName: "硝酸鹽氮",
    stateName: "硝酸鹽氮",
  },
  {
    sensorName: "總菌落數",
    stateName: "總菌落數",
  },
  {
    sensorName: "大腸桿菌群",
    stateName: "大腸桿菌群",
  },
  {
    sensorName: "發布日期",
    stateName: "發布日期",
  },
];

const BASENAME = path.basename(__filename, ".js");

(async () => {
  try {
    const url = URL.replace("{detailId}", DETAIL_ID);

    const htmlBody = await axios.get(url);

    const $ = cheerio.load(htmlBody.data);

    // 裝置類別：自來水、狀態類別：測量、測量單位：mg/L
    const 自由有效餘氯 = +$(
      "#main_content > div.main_page > div.main_page_content > div.table-responsive > table > tbody > tr:nth-child(1) > td:nth-child(2)"
    ).text();
    // 裝置類別：自來水、狀態類別：測量、測量單位：NTU
    const 濁度 = +$(
      "#main_content > div.main_page > div.main_page_content > div.table-responsive > table > tbody > tr:nth-child(2) > td:nth-child(2)"
    ).text();
    // 裝置類別：自來水、狀態類別：測量、測量單位：無
    const pH值 = +$(
      "#main_content > div.main_page > div.main_page_content > div.table-responsive > table > tbody > tr:nth-child(6) > td:nth-child(2)"
    ).text();
    // 裝置類別：自來水、狀態類別：測量、測量單位：mg/L
    const 總硬度 = +$(
      "#main_content > div.main_page > div.main_page_content > div.table-responsive > table > tbody > tr:nth-child(14) > td:nth-child(2)"
    ).text();
    // 裝置類別：自來水、狀態類別：測量、測量單位：mg/L
    const 硝酸鹽氮 = +$(
      "#main_content > div.main_page > div.main_page_content > div.table-responsive > table > tbody > tr:nth-child(12) > td:nth-child(2)"
    ).text();
    const 總菌落數 = $(
      "#main_content > div.main_page > div.main_page_content > div.table-responsive > table > tbody > tr:nth-child(19) > td:nth-child(2)"
    ).text();
    const 大腸桿菌群 = $(
      "#main_content > div.main_page > div.main_page_content > div.table-responsive > table > tbody > tr:nth-child(20) > td:nth-child(2)"
    ).text();
    const 發布日期 = moment(
      $("#main_content > div.main_page > p")
        .text()
        .replace("發布日期：", "")
        .trim(),
      "YYYY/MM/DD"
    ).format("YYYY-MM-DD");

    const stateObj = {
      自由有效餘氯,
      濁度,
      pH值,
      總硬度,
      硝酸鹽氮,
      總菌落數,
      大腸桿菌群,
      發布日期,
    };

    console.log(`[${BASENAME}] Fetched data:`, stateObj);

    await sendToHA(BASENAME, DEVICE_NAME, stateObj, SENSORS);
  } catch (error) {}
})();
