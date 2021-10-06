"use strict";

// ----------------------------------------------------------
// ----- 初期設定
// ----------------------------------------------------------
const webdriver = require("selenium-webdriver");
const { By } = webdriver;
process.env["NODE_CONFIG_DIR"] = "../config/";
var config = require("config");
const testutil = require("./utils/testutil");
const { exit } = require("process");

// 共通設定
const {
  selectBrowser, // ブラウザの選択(該当のブラウザ設定)chrome, firefox, ie, edge
  domainFront,
} = config.globalSetting;

const globalSetting = config.globalSetting;

// 設定
const {
  userid1,
  userpw1,
} = config.kondate;

// ----------------------------------------------------------
// ----- main実行
// ----------------------------------------------------------
main();

// ----------------------------------------------------------
// ----- main
// ----------------------------------------------------------
async function main() {
  // ログファイル設定
  var ws = testutil.openFileByWriteMode();

  const driver = await testutil.getDriverByBrowser(globalSetting);
  testutil.logWrite("========== " + selectBrowser + " ==========");

  try {
    let returns = [];

    // ----------------------------
    // --- 処理
    // ----------------------------
      let settings = [
        {
          ws: ws,
          parentHandler: "",
          userid: userid1,
          password: userpw1,
        }
      ];

      for (let i = 0; i < settings.length; i++) {
        
         let setting = settings[i];
         testutil.logWrite("=======================================");
         testutil.logWrite("======= 確認開始 "); 
         testutil.logWrite("=======================================");

         await login(driver, setting);
         // --- 献立画面への遷移
         await driver.get(domainFront + "/user_kondates");
         //--- 索確認実行
         testutil.logWrite(" --- 確認開始 " + setting.agencyname);
         returns[i] = await kondateTest1(driver, setting);
         //--- ログアウトする;
         await logout(driver);
      }

  } catch (e) {
    console.log(e);
  } finally {
    // ログ出力クローズ
    ws.close();
    // 閉じる
    await driver.quit();
  }
}

// ----------------------------------------------------------
// ----- ログイン
// ----------------------------------------------------------
async function login(driver, setting) {
  let { userid, password } = setting;

  await driver.get(domainFront + "/identity/session/new");

  // ログイン情報入力
  await testutil.setValueByXpath(
    driver,
    "//input[@name='identifier']",
    userid
  );
  await testutil.setValueByXpath(
    driver,
    "//input[@name='password']",
    password
  );
  // ログインボタン押下
  await testutil.clickByXpath(driver, "//input[@type='submit']");
  // 画面遷移待機
  await testutil.waitForId(driver, "loading_all_params");
}

// ----------------------------------------------------------
// ----- ログアウト
// ----------------------------------------------------------
async function logout(driver) {
  await testutil.clickByXpath(driver, '//*[@id="user_menu_config"]');

  await driver
    .findElement(
      By.xpath('//*[@id="status"]/a')
    )
    .sendKeys(webdriver.Key.ENTER);
}

// ----------------------------------------------------------
// ----- 献立確認実行
// ----------------------------------------------------------
async function kondateTest1(driver, setting) {
  testutil.logWrite("献立確認実行開始");
  let {  } = setting;
  let testItem = "献立";

  // 変数
  let start = Date.now();
  let searchTime = 0;

  // --- 献立 初期画面表示
  testutil.logWrite("献立初期画面表示");
  await testutil.takeScreenShot(
    driver,
    testItem + "_" + "献立_初期画面.png"
  );

  // --- 献立 速度測定
  testutil.logWrite("献立速度測定表示");
  start = Date.now();

  searchTime = Date.now() - start;
  testutil.logWrite(
    testItem + "_" + "献立時間:" + String(searchTime) + " ms"
  );

  // --- 全項目を入力エラーなし確認
  testutil.logWrite("検索確認");

  await inputIteam(driver, setting);

  // 画像取得
  await testutil.takeScreenShot(
    driver,
    testItem + "_" + "検索確認.png"
  );

  return;
}
// -------------------------------
// 献立検索　検索項目に値を設定
// -------------------------------
async function inputIteam(driver, setting) {
  let {
  } = setting;

  await testutil.setValueById(driver, "kondate_search", "a");
  await testutil.clickById(driver, "submit_button");

  await testutil.waitByXpath(driver,'//*[@id="main"]/div[2]/h2/span[2]');

}