const cheerio = require("cheerio");
const axios = require("axios").default;
const moment = require("moment");
const path = require("path");
const { sendToHA } = require("./mqtt_utils");

const URL =
  "https://service.taipower.com.tw/branch/d101/xcnotice?xsmsid=0M242581316312033070";

const OUTAGE_KEYWORD = process.env.OUTAGE_KEYWORD || "和豐街";
const TW_YEAR_OFFSET = 1911;

const STATUS = {
  STATUS_NO_OUTAGE: 1,
  STATUS_OUTAGE: 2,
  STATUS_ERROR: 3,
};

const BASENAME = path.basename(__filename, ".js");

(async () => {
  const sendMqtt = async (data) => {
    try {
      await sendToHA(BASENAME, "停電通知", data);
    } catch (error) {
      console.error("MQTT 發送失敗", error);
    }
  };

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
      await sendMqtt({
        status: STATUS.STATUS_OUTAGE,
        updatedAt: moment().format(),
        date: foundDate.format("YYYY/MM/DD"),
      });

      console.log(foundDate.format("YYYY/MM/DD"));
    } else {
      await sendMqtt({
        status: STATUS.STATUS_NO_OUTAGE,
        updatedAt: moment().format(),
      });

      console.log("最近沒有停電");
    }
  } catch (error) {
    await sendMqtt({
      status: STATUS.STATUS_ERROR,
      updatedAt: moment().format(),
    });

    console.error(error);
    console.error("發生錯誤");
  }
})();
