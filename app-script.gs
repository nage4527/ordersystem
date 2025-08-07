// 完整版 Google Apps Script 代碼
// 包含 Google Sheets 寫入功能

// 設定 Google Sheets 的 ID（請替換為您的試算表 ID）
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // 請替換為實際的試算表 ID

/**
 * 處理來自網頁表單的訂單資料
 */
function doPost(e) {
  try {
    let data;
    
    // 詳細記錄接收到的資料
    console.log('=== 開始處理 POST 請求 ===');
    console.log('e.parameter:', e.parameter);
    console.log('e.parameters:', e.parameters);
    console.log('e.postData:', e.postData);
    
    // 處理不同的資料格式
    if (e.parameter && e.parameter.data) {
      // FormData 格式 (來自網頁)
      console.log('✅ 使用 FormData 格式解析 (e.parameter.data)');
      console.log('原始 data 內容:', e.parameter.data);
      data = JSON.parse(e.parameter.data);
    } else if (e.parameters && e.parameters.data && e.parameters.data[0]) {
      // 多值參數格式
      console.log('✅ 使用多值參數格式解析');
      data = JSON.parse(e.parameters.data[0]);
    } else if (e.postData && e.postData.contents) {
      // JSON 格式
      console.log('✅ 使用 JSON 格式解析 (e.postData.contents)');
      data = JSON.parse(e.postData.contents);
    } else {
      // 無法解析 - 提供詳細錯誤資訊
      console.error('❌ 無法解析資料格式');
      console.error('e.parameter 存在:', !!e.parameter);
      console.error('e.parameter.data 存在:', !!(e.parameter && e.parameter.data));
      console.error('e.parameters 存在:', !!e.parameters);
      console.error('e.postData 存在:', !!e.postData);
      
      if (e.parameter) {
        console.error('e.parameter keys:', Object.keys(e.parameter));
      }
      if (e.parameters) {
        console.error('e.parameters keys:', Object.keys(e.parameters));
      }
      if (e.postData) {
        console.error('e.postData keys:', Object.keys(e.postData));
        console.error('e.postData.contents 存在:', !!e.postData.contents);
      }
      
      throw new Error('無法解析資料格式，請檢查資料傳送方式');
    }
    
    console.log('成功解析的訂單資料:', JSON.stringify(data));
    
    // 驗證必要欄位
    if (!data.customerName || !data.customerPhone || !data.pickupDate || !data.pickupTime) {
      throw new Error('缺少必要的訂單資訊');
    }
    
    if (!data.items || data.items.length === 0) {
      throw new Error('訂單中沒有選擇任何商品');
    }
    
    // 儲存訂單到 Google Sheets（如果有設定試算表 ID）
    let result = {};
    
    if (SPREADSHEET_ID && SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
      console.log('開始儲存到 Google Sheets...');
      result = saveOrderToSheets(data);
      console.log('✅ 已儲存到 Google Sheets:', result);
    } else {
      console.log('⚠️ 未設定試算表 ID，跳過儲存到 Google Sheets');
      result = {
        orderNumber: generateOrderNumber(),
        sheetName: 'N/A'
      };
    }
    
    // 回傳成功結果
    const output = ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '訂單已成功處理',
      orderNumber: result.orderNumber,
      timestamp: new Date().toISOString()
    }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
      
  } catch (error) {
    console.error('處理訂單時發生錯誤:', error);
    console.error('錯誤堆疊:', error.stack);
    
    // 回傳錯誤結果
    const errorOutput = ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: '訂單處理失敗: ' + error.message,
      timestamp: new Date().toISOString(),
      debug: {
        hasParameter: !!e.parameter,
        hasPostData: !!e.postData,
        hasParameters: !!e.parameters
      }
    }));
    errorOutput.setMimeType(ContentService.MimeType.JSON);
    return errorOutput;
  }
}

/**
 * 處理 OPTIONS 請求 (用於 CORS)
 */
function doOptions() {
  console.log('收到 OPTIONS 請求 (CORS 預檢)');
  const output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.TEXT);
  return output;
}

/**
 * 處理 GET 請求
 */
function doGet() {
  console.log('收到 GET 請求');
  const html = `
    <html>
      <body>
        <h1>杏仁茶訂購系統 API</h1>
        <p>✅ Google Apps Script 部署成功！</p>
        <p>📊 試算表 ID: ${SPREADSHEET_ID}</p>
        <p>⏰ 時間: ${new Date().toISOString()}</p>
        <hr>
        <p>此 API 接受 POST 請求來處理訂單資料。</p>
      </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html);
}

/**
 * 儲存訂單資料到 Google Sheets
 */
function saveOrderToSheets(orderData) {
  console.log('=== 開始 saveOrderToSheets 函數 ===');
  console.log('SPREADSHEET_ID:', SPREADSHEET_ID);
  console.log('接收到的 orderData:', JSON.stringify(orderData));
  
  try {
    console.log('嘗試開啟試算表...');
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('✅ 成功開啟試算表:', spreadsheet.getName());
    
    const pickupDate = orderData.pickupDate;
    console.log('取餐日期:', pickupDate);
    
    const sheetName = formatDateForSheetName(pickupDate);
    console.log('工作表名稱:', sheetName);
    
    // 取得或建立對應日期的工作表
    console.log('取得或建立工作表...');
    let sheet = getOrCreateSheet(spreadsheet, sheetName);
    console.log('✅ 工作表取得成功，名稱:', sheet.getName());

    // 如果是新建立的工作表，需要設定標題行
    console.log('檢查是否需要設定標題行，目前行數:', sheet.getLastRow());
    if (sheet.getLastRow() === 0) {
      console.log('設定標題行...');
      setupSheetHeaders(sheet);
      console.log('✅ 標題行設定完成');
    }
    
    // 產生訂單編號
    console.log('產生訂單編號...');
    const orderNumber = generateOrderNumber();
    console.log('✅ 訂單編號:', orderNumber);
    
    // 準備要寫入的資料
    console.log('準備寫入資料...');
    const rowData = [
      new Date(), // 訂單時間
      orderNumber, // 訂單編號
      orderData.customerName, // 客戶姓名
      "'" + orderData.customerPhone, // 聯絡電話 (加上單引號強制為文字格式)
      orderData.pickupDate, // 取餐日期
      orderData.pickupTime, // 取餐時間
      formatOrderItems(orderData.items), // 訂購品項
      orderData.totalAmount, // 總金額
      orderData.notes || '', // 備註
      '待處理' // 訂單狀態
    ];
    console.log('✅ 資料準備完成，行資料:', JSON.stringify(rowData));
    
    // 寫入資料到工作表
    const targetRow = sheet.getLastRow() + 1;
    console.log('目標行號:', targetRow);
    
    const range = sheet.getRange(targetRow, 1, 1, rowData.length);
    console.log('✅ 取得範圍成功');
    
    // 設定電話號碼欄位為文字格式
    const phoneRange = sheet.getRange(targetRow, 4); // 第4欄是電話號碼
    phoneRange.setNumberFormat('@'); // @ 表示文字格式
    console.log('✅ 電話號碼格式設定完成');
    
    // 寫入資料
    console.log('開始寫入資料...');
    range.setValues([rowData]);
    console.log('✅ 資料寫入完成');
    
    // 套用格式
    console.log('套用格式...');
    formatNewRow(sheet, targetRow);
    console.log('✅ 格式套用完成');
    
    const result = {
      orderNumber: orderNumber,
      sheetName: sheetName
    };
    
    console.log('✅ saveOrderToSheets 執行成功:', JSON.stringify(result));
    return result;
    
  } catch (sheetError) {
    console.error('❌ saveOrderToSheets 執行失敗:', sheetError);
    console.error('❌ 錯誤堆疊:', sheetError.stack);
    throw sheetError;
  }
}

/**
 * 取得或建立工作表
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  console.log('=== getOrCreateSheet 開始 ===');
  console.log('尋找工作表:', sheetName);
  
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    console.log('工作表不存在，建立新工作表...');
    sheet = spreadsheet.insertSheet(sheetName);
    console.log('✅ 新工作表建立成功:', sheet.getName());
  } else {
    console.log('✅ 找到現有工作表:', sheet.getName());
  }
  
  console.log('=== getOrCreateSheet 完成 ===');
  return sheet;
}

/**
 * 設定工作表標題行
 */
function setupSheetHeaders(sheet) {
  console.log('=== setupSheetHeaders 開始 ===');
  const headers = [
    '訂單時間',
    '訂單編號', 
    '客戶姓名',
    '聯絡電話',
    '取餐日期',
    '取餐時間',
    '訂購品項',
    '總金額',
    '備註',
    '狀態'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // 設定標題行格式
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold')
           .setBackground('#4CAF50')
           .setFontColor('white')
           .setHorizontalAlignment('center');
  
  // 設定欄寬
  sheet.setColumnWidth(1, 120); // 訂單時間
  sheet.setColumnWidth(2, 100); // 訂單編號
  sheet.setColumnWidth(3, 80);  // 客戶姓名
  sheet.setColumnWidth(4, 100); // 聯絡電話
  sheet.setColumnWidth(5, 90);  // 取餐日期
  sheet.setColumnWidth(6, 90);  // 取餐時間
  sheet.setColumnWidth(7, 300); // 訂購品項
  sheet.setColumnWidth(8, 80);  // 總金額
  sheet.setColumnWidth(9, 200); // 備註
  sheet.setColumnWidth(10, 80); // 狀態
  
  // 設定電話號碼欄位為文字格式
  const phoneColumn = sheet.getRange('D:D');
  phoneColumn.setNumberFormat('@');
  
  // 設定訂購品項欄位（G欄）預設為自動換行
  const itemsColumn = sheet.getRange('G:G');
  itemsColumn.setWrap(true);
  itemsColumn.setVerticalAlignment('top');
  
  console.log('✅ setupSheetHeaders 完成');
}

/**
 * 格式化新增的資料行
 */
function formatNewRow(sheet, rowNumber) {
  const range = sheet.getRange(rowNumber, 1, 1, 10);
  
  // 設定邊框
  range.setBorder(true, true, true, true, true, true);
  
  // 設定對齊方式
  sheet.getRange(rowNumber, 1, 1, 6).setHorizontalAlignment('center'); // 前6欄置中
  sheet.getRange(rowNumber, 8).setHorizontalAlignment('right'); // 金額右對齊
  
  // 設定訂購品項欄位（G欄）自動換行和垂直對齊
  const itemsCell = sheet.getRange(rowNumber, 7); // 第7欄是訂購品項
  itemsCell.setWrap(true); // 啟用自動換行
  itemsCell.setVerticalAlignment('top'); // 垂直對齊到頂端
  
  // 設定該行的最小高度以容納多行內容
  sheet.setRowHeight(rowNumber, 60); // 設定行高為60像素（可根據需要調整）
  
  // 設定狀態欄的背景色
  const statusCell = sheet.getRange(rowNumber, 10);
  statusCell.setBackground('#FFF3CD').setFontColor('#856404');
}

/**
 * 格式化日期作為工作表名稱
 */
function formatDateForSheetName(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 格式化訂購品項為字串
 */
function formatOrderItems(items) {
  console.log('=== formatOrderItems 開始 ===');
  console.log('收到的 items:', JSON.stringify(items));
  
  const result = items.map(item => {
    let itemStr = `${item.product}`;
    if (item.itemNumber) {
      itemStr += ` (第${item.itemNumber}杯)`;
    } else {
      itemStr += ` x${item.quantity}`;
    }
    
    let options = [];
    if (item.sugar) {
      options.push(item.sugar);
    }
    if (item.temperature) {
      options.push(item.temperature);
    }
    if (options.length > 0) {
      itemStr += ` (${options.join('、')})`;
    }
    itemStr += ` = $${item.subtotal}`;
    console.log('格式化後的項目:', itemStr);
    return itemStr;
  }).join('\n');
  
  console.log('✅ formatOrderItems 完成，結果:', result);
  return result;
}

/**
 * 產生訂單編號
 */
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().substr(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  
  return `ORD${year}${month}${day}${hour}${minute}${second}`;
}

/**
 * 測試函數 - 建立範例訂單
 */
function testCreateOrder() {
  const testOrder = {
    customerName: "測試客戶",
    customerPhone: "0932541123",
    pickupDate: "2025-08-07",
    pickupTime: "10:30",
    notes: "測試訂單",
    items: [
      {
        product: "杏仁茶-750ml",
        quantity: 2,
        price: 130,
        sugar: "三分糖",
        subtotal: 260
      },
      {
        product: "杏仁茶-500ml",
        quantity: 1,
        price: 80,
        sugar: "無糖",
        temperature: "冰",
        subtotal: 80
      },
      {
        product: "杏仁豆腐",
        quantity: 1,
        price: 130,
        subtotal: 130
      }
    ],
    totalAmount: "470"
  };
  
  try {
    const result = saveOrderToSheets(testOrder);
    console.log('測試訂單建立成功:', result);
    return result;
  } catch (error) {
    console.error('測試訂單建立失敗:', error);
    throw error;
  }
}

/**
 * 初始化試算表 - 建立主要設定
 */
function initializeSpreadsheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 重新命名第一個工作表為 "設定"
    const firstSheet = spreadsheet.getSheets()[0];
    firstSheet.setName('設定');
    
    // 在設定工作表中建立基本資訊
    const settingData = [
      ['杏仁茶訂購系統', ''],
      ['建立日期', new Date()],
      ['', ''],
      ['商品資訊', ''],
      ['杏仁茶 750ml', '1瓶$140 / 2瓶$270 / 3瓶$400（超過3瓶每3瓶為一組）'],
      ['杏仁茶 500ml', '$80'],
      ['杏仁豆腐 550g', '$130'],
      ['杏仁粉 360ml', '$150'],
      ['', ''],
      ['甜度選項', ''],
      ['杏仁茶', '無糖、三分糖、五分糖'],
      ['杏仁粉', '無糖、微糖'],
      ['', ''],
      ['溫度選項', ''],
      ['杏仁茶 500ml', '冰、熱']
    ];
    
    firstSheet.getRange(1, 1, settingData.length, 2).setValues(settingData);
    
    // 格式化設定頁
    firstSheet.getRange('A1').setFontSize(16).setFontWeight('bold');
    firstSheet.getRange('A4').setFontWeight('bold').setBackground('#E8F5E8');
    firstSheet.getRange('A9').setFontWeight('bold').setBackground('#E8F5E8');
    
    console.log('試算表初始化完成');
    return true;
    
  } catch (error) {
    console.error('初始化試算表失敗:', error);
    throw error;
  }
}

/**
 * 測試連線功能
 */
function testConnection() {
  console.log('執行連線測試');
  console.log('SPREADSHEET_ID:', SPREADSHEET_ID);
  
  if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
    return '⚠️ 請先設定正確的試算表 ID';
  }
  
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('試算表連線成功:', spreadsheet.getName());
    return `✅ 連線成功！試算表名稱: ${spreadsheet.getName()}`;
  } catch (error) {
    console.error('連線失敗:', error);
    return `❌ 連線失敗: ${error.message}`;
  }
}