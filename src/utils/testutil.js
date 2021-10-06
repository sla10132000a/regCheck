const fs = require("fs");
const { promisify } = require("util");
const webdriver = require("selenium-webdriver");
const { Builder, By } = webdriver;
const timeoutMSec = 500000;
var ws;
var pictureDir = "";
var util = require("selenium-webdriver/http/util");

// ----------------------------------------------------------
// ----- 関数定義
// ----------------------------------------------------------

// ------------------------
// driver取得
// ------------------------
exports.getDriverByBrowser = async function getDriverByBrowser(globalSetting) {
  let driver;
  const { selectBrowser, enableHeadless } = globalSetting;
  try {
    // ブラウザごとにdriverの設定
    if (selectBrowser === "chrome") {
      // chrome

      // option設定
      const chromeCapabilities = webdriver.Capabilities.chrome();
      const chrome = require("selenium-webdriver/chrome");
      let chromeOptions = new chrome.Options();
      if (enableHeadless === true) {
        chromeOptions.addArguments("--headless");
      }
      chromeOptions.addArguments("--disable-gpu");
      chromeOptions.addArguments("--window-size=2000,2000");

      chromeOptions.addArguments("--download.prompt_for_downloa=false");
      chromeOptions.addArguments("--download.default_directory=./download");
      chromeCapabilities.set("chromeOptions", {
        prefs: {
          "download.prompt_for_download": "false",
          "download.directory_upgrade": "true",
          "Page.set_download_behavior": {
            behavior: "allow",
            downloadPath: "./download"
          }
        }
      });

      driver = await new Builder()
        .forBrowser("chrome")
        .withCapabilities(chromeCapabilities)
        .setChromeOptions(chromeOptions)
        .build();

      driver.set;
    } else if (selectBrowser === "firefox") {
      // firefox

      //option設定
      const firefox = require("selenium-webdriver/firefox");
      let options = new firefox.Options();
      options.setPreference("-browser.download.dir", "../download");
      if (enableHeadless === true) {
        options.addArguments("-headless");
      }

      driver = await new Builder()
        .forBrowser("firefox")
        .setFirefoxOptions(options)
        .withCapabilities(new firefox.Options({ acceptInsecureCerts: true }))
        .build();
    } else if (selectBrowser === "ie") {
      // IE
      // 画面サイズは未対応
      driver = await new Builder().forBrowser("internet explorer").build();
    } else if (selectBrowser === "edge") {
      // edgeはdriverエラーのため動作確認できておらず。
      driver = await new Builder().forBrowser("MicrosoftEdge").build();
    }
  } catch (error) {
    console.log(error);
  }

  return driver;
};

// ------------------------
// 画像を取得する
// ------------------------
exports.takeScreenShot = async function takeScreenShot(driver, filename) {
  let base64 = await driver.takeScreenshot();
  let buffer = Buffer.from(base64, "base64");

  if (pictureDir === "") {
    pictureDir = "../picture/" + toDateString(new Date());
    fs.mkdirSync(pictureDir);
  }

  let pictureFile = pictureDir + "/" + filename;

  await promisify(fs.writeFile)(pictureFile, buffer);
};
// ------------------------
// 特定の項目が表示されるのを待つ
// ------------------------
exports.waitForId = async function(driver, Id) {
  await driver.wait(webdriver.until.elementLocated(By.id(Id)), timeoutMSec);
};
// ------------------------
// 待機処理の終了待機
// ------------------------
async function waitForRequestFinish(driver) {
  await driver.wait(
    webdriver.until.elementIsNotVisible(driver.findElement(By.id("loader"))),
    timeoutMSec
  );
}
exports.waitForRequestFinish = waitForRequestFinish;

// ------------------------
// 特定時間を待つ(未実装)
// ------------------------
exports.sleep = function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

// ------------------------
// 特定時間を待つ(未実装)
// ------------------------
exports.waitForUrl = async function(driver, url) {
  // await driver.waitForUrl(url);
  await util.waitForUrl(url, 20000);
};
// ------------------------
// 待機処理の終了待機(時間指定)
// ------------------------
exports.waitTimeForRequestFinish = async function(driver, waitTime) {
  await driver.wait(
    webdriver.until.elementIsNotVisible(driver.findElement(By.id("loader"))),
    waitTime
  );
};

// ------------------------
// 待機処理の終了待機(時間指定)
// ------------------------
exports.waitByCount = async function(driver, countLimit) {
  let count = 1;
  do {
    count++;
  } while (count < countLimit);
};

// ------------------------
// 詳細画面から親画面に戻ってくる際の待機処理(処理中が非表示状態 -> 表示状態->非表示状態)
// ------------------------
exports.waitForBacktoParent = async function(driver) {
  // 最初loaderの状態確認用
  let firstConfirmFlag = false;
  // loaderのnone-> blockの状態確認用
  let secondConfirmFlag = false;
  // 確認階数
  let confirmCount = 0;

  do {
    let loaderStyle = await driver
      .findElement(webdriver.By.id("loader"))
      .getAttribute("style");

    // 最初は処理中が表示されていない。最初の確認
    if (!firstConfirmFlag && loaderStyle.includes("none")) {
      // 最初処理中が表示されていない場合(パターン：none -> block -> none)
      firstConfirmFlag = true;
    } else if (!firstConfirmFlag && loaderStyle.includes("block")) {
      // 最初処理中が表示されている場合(パターン：block -> none)
      firstConfirmFlag = true;
      secondConfirmFlag = true;
    } else if (firstConfirmFlag && loaderStyle.includes("block")) {
      // 処理中が表示されている場合(パターン：none -> block -> none)
      secondConfirmFlag = true;
    } else if (secondConfirmFlag && loaderStyle.includes("none")) {
      //(パターン：none -> block -> none)
      //(パターン：block -> none)
      break;
    }

    // 最初から処理が終了(none)していた場合を考慮
    confirmCount++;
    if (confirmCount > 500 && !secondConfirmFlag) {
      break;
    }
  } while (true);
};
// ------------------------
// 項目表示待機処理
// ------------------------
exports.waitForVisibleByXpath = async function(driver, xpathValue) {
  await driver.wait(
    webdriver.until.elementIsVisible(driver.findElement(By.xpath(xpathValue))),
    timeoutMSec
  );
};

// ------------------------
// 項目表示待機処理
// ------------------------
exports.waitByXpath = async function(driver, xpathValue) {
  await driver.wait(
    webdriver.until.elementIsVisible(driver.findElement(By.xpath(xpathValue))),
    timeoutMSec
  );
};
// ------------------------
// 検索を行う
// ------------------------
exports.searchAction = async function(driver) {
  await driver.findElement(By.className("global_search_submit_btn")).click();
  await waitForRequestFinish(driver);
};

// ------------------------
// 検索を行う(submit)
// ------------------------
exports.searchActionSubmit = async function(driver) {
  await driver.findElement(By.className("btn-search")).click();
  await waitForRequestFinish(driver);
};

// ------------------------
// 検索項目を隠す押下
// ------------------------
exports.hideSearchItemsClick = async function(driver) {
  await driver
    .findElement(
      By.xpath("//button[@class='btn btn-default btn-detail-search']")
    )
    .click();
};
// ------------------------
// クリアボタン押下
// ------------------------
exports.clearClick = async function(driver) {
  await driver.findElement(By.id("clear-filter")).click();
};

// ------------------------
// --- idを指定してelementを取得する
// ------------------------
exports.getElementById = async function(driver, idValue) {
  return await driver.findElement(By.id(idValue));
};

// ------------------------
// --- nameを指定してelementを取得する
// ------------------------
exports.getElementByName = async function(driver, nameValue) {
  return await driver.findElement(By.name(nameValue));
};

// ------------------------
// --- xpathを指定してelementを取得する
// ------------------------
exports.getElementByXpath = async function(driver, xpathValue) {
  return await driver.findElement(By.xpath(xpathValue));
};
// ------------------------
// --- idを指定して値の設定
// ------------------------
exports.setValueById = async function(driver, id, value) {
  await driver.findElement(By.id(id)).sendKeys(value);
};
// ------------------------
// --- nameを指定して値の設定
// ------------------------
exports.setValueByName = async function(driver, name, value) {
  await driver.findElement(By.name(name)).sendKeys(value);
};
// ------------------------
// --- xpathを指定して値の設定
// ------------------------
exports.setValueByXpath = async function(driver, xpathValue, value) {
  await driver.findElement(By.xpath(xpathValue)).sendKeys(value);
};

// ------------------------
// --- xpathを指定してtextの値を取得する
// ------------------------
exports.getTextByXpath = async function(driver, xpathValue) {
  return await driver
    .findElement(By.xpath(xpathValue))
    .getAttribute("innerHTML");
};

// ------------------------
// --- idを指定してtextの値を取得する
// ------------------------
exports.getTextById = async function(driver, idValue) {
  return await driver.findElement(By.id(idValue)).getAttribute("innerHTML");
};

// ------------------------
// --- idを指定してtextの値を取得する
// ------------------------
exports.getStyleById = async function(driver, idValue, attrValue) {
  return await driver
    .findElement(webdriver.By.id(idValue))
    .getAttribute(attrValue);
};

// ------------------------
// --- xpathを指定してclick処理を行う
// ------------------------
exports.clickByXpath = async function(driver, xpathValue) {
  await driver.findElement(By.xpath(xpathValue)).click();
};
// ------------------------
// --- xpathを指定してclick処理を行う
// ------------------------
exports.clickById = async function(driver, idValue) {
  await driver.findElement(By.id(idValue)).click();
};
// ------------------------
// --- nameを指定してclick処理を行う
// ------------------------
exports.clickByName = async function(driver, nameValue) {
  await driver.findElement(By.name(nameValue)).click();
};
// ------------------------
// --- 子画面へ制御を移す。
// ------------------------
exports.movetToChild = async function(driver, windowList) {
  await driver.switchTo().window(windowList[1]);
  await driver.wait(
    webdriver.until.elementLocated(By.id("liquid_form")),
    timeoutMSec
  );
};
// ------------------------
// --- 制御を親画面に戻す
// ------------------------
exports.movetToParent = async function(driver, parentHandler) {
  await driver.switchTo().window(parentHandler);
};

// ------------------------
// --- 強制終了
// ------------------------
exports.exitProcess = async function(driver) {
  process.exit(11);
};

// ------------------------
// --- ファイルopen(書き込みモード)
// ------------------------
exports.openFileByWriteMode = function() {
  try {
    let filename = "../log/" + "testlog_" + toDateString(new Date()) + ".txt";

    ws = fs.createWriteStream(filename, "utf-8");
    ws.on("error", function(err) {
      console.error(err);
      process.exit(1);
    });

    return ws;
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// ------------------------
// --- ファイルwrite
// ------------------------
exports.logWrite = function(writeData) {
  ws.write(writeData);
  ws.write("\n");

  console.log(writeData);
};

// ------------------------
// --- 日付(文字列)取得
// ------------------------
function toDateString(date) {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  ].join("");
}
