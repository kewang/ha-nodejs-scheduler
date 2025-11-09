const cheerio = require("cheerio");
const axios = require("axios").default;
const moment = require("moment");

const URL =
  "https://service.taipower.com.tw/branch/d101/xcnotice?xsmsid=0M242581316312033070";

const OUTAGE_KEYWORD = "和豐街";
const TW_YEAR_OFFSET = 1911;

(async () => {
  try {
    const htmlBody = await axios.get(URL);

    const $ = cheerio.load(htmlBody);

    const tables = $(".ListTable");

    let foundDate;

    for (const table of tables) {
      const found = table.includes(OUTAGE_KEYWORD);

      if (!found) {
        continue;
      }

      const outageDateRaw = found.find("caption").innerText; // 工作停電日期 ( 非限電 )：114 年 11 月 07 日

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

      if (outageDate.isAfter(moment())) {
        foundDate = outageDate;

        break;
      }
    }

    if (foundDate) {
      console.log(foundDate.format("YYYY/MM/DD"));
    } else {
      console.log("最近沒有停電");
    }
  } catch (error) {
    console.error("無法取得停電資訊");
  }
})();
