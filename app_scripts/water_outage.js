const axios = require("axios").default;
const moment = require("moment");
const fs = require("fs").promises;
const path = require("path");

const URL = "https://web.water.gov.tw/wateroffapi/openData/export/json";

const OUTAGE_CITY = process.env.OUTAGE_CITY || "基隆市";
const OUTAGE_DISTRICT = process.env.OUTAGE_DISTRICT || "中正區";
const OUTAGE_AREA = process.env.OUTAGE_AREA || "和豐街";

const STATUS = {
  STATUS_NO_OUTAGE: 1,
  STATUS_OUTAGE: 2,
  STATUS_ERROR: 3,
};

const BASENAME = path.basename(__filename, ".js");
const OUTPUT_PATH = "/config/node_scheduler_outputs";
const OUTPUT_FILE = `${OUTPUT_PATH}/${BASENAME}.json`;

(async () => {
  const fileWrite = async (data) => {
    try {
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(data));
    } catch (error) {
      console.error("寫入檔案失敗，直接顯示原資料", error);

      console.log(`data: ${JSON.stringify(data)}`);
    }
  };

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

      await fileWrite({
        status: STATUS.STATUS_OUTAGE,
        reason: [停水原因, 降壓原因].filter(Boolean).join("；"),
        url: caseUrl,
        updatedAt: moment().format(),
        date: foundDate.format("YYYY/MM/DD"),
      });

      console.log(foundDate.format("YYYY/MM/DD"));
    } else {
      await fileWrite({
        status: STATUS.STATUS_NO_OUTAGE,
        updatedAt: moment().format(),
      });

      console.log("最近沒有停水");
    }
  } catch (error) {
    await fileWrite({
      status: STATUS.STATUS_ERROR,
      updatedAt: moment().format(),
    });

    console.error(error);
    console.error("發生錯誤");
  }
})();
