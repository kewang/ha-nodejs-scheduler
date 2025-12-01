const cheerio = require("cheerio");
const axios = require("axios").default;
const moment = require("moment");
const path = require("path");
const { sendToHA } = require("./mqtt_utils");

const URL =
  "https://service.taipower.com.tw/branch/d101/xcnotice?xsmsid=0M242581316312033070";

const OUTAGE_KEYWORD = process.env.OUTAGE_KEYWORD;
const TW_YEAR_OFFSET = 1911;

const STATUS_CODE = {
  STATUS_NO_OUTAGE: 1,
  STATUS_OUTAGE: 2,
  STATUS_ERROR: 3,
};

const STATUS = {
  STATUS_NO_OUTAGE: "最近沒有停電",
  STATUS_OUTAGE: "有停電通知",
  STATUS_ERROR: "發生錯誤",
};

const DEVICE_NAME = "停電通知";

const SENSORS = [
  {
    sensorName: "停電日期",
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
];

const BASENAME = path.basename(__filename, ".js");

(async () => {
  try {
    const htmlBody = await axios.get(URL);

    const $ = cheerio.load(htmlBody.data);

    let foundDate;

    $(".ListTable").each((index, table) => {
      const text = $(table).text();

      const found = text.includes(OUTAGE_KEYWORD);

      if (!found) {
        return;
      }

      const outageDateRaw = $(table).find("caption").text(); // 工作停電日期 ( 非限電 )：114 年 11 月 07 日

      const outageDateParts = outageDateRaw
        .split("：")[1]
        .replace("年", "/")
        .replace("月", "/")
        .replace("日", "/")
        .split("/");

      const outageDate = moment(
        `${
          +outageDateParts[0].trim() + TW_YEAR_OFFSET
        }/${outageDateParts[1].trim()}/${outageDateParts[2].trim()}`,
        "YYYY/MM/DD"
      );

      if (outageDate.isSameOrAfter(moment(), "day")) {
        foundDate = outageDate;

        return false; // break loop
      }
    });

    if (foundDate) {
      await sendToHA(
        BASENAME,
        DEVICE_NAME,
        {
          status: STATUS.STATUS_OUTAGE,
          statusCode: STATUS_CODE.STATUS_OUTAGE,
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

      console.log("最近沒有停電");
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
