# 杏仁茶訂購系統 - 程式部署手冊

## 🚀 系統概述

這是一個完整的杏仁茶線上訂購系統，包含：
- 客戶端網頁訂單表單
- Google Apps Script 後端處理
- Google Sheets 自動訂單記錄
- 支援多種商品與個別客製化選項

## 📁 檔案結構

```
杏仁茶訂購系統/
├── order-form.html              # 🌐 客戶訂單表單（前端）
├── gas-complete-with-sheets.gs   # ⚙️ Google Apps Script 後端代碼
├── DEPLOYMENT_GUIDE.md          # 📖 程式部署手冊（本檔案）
├── CUSTOMER_MANUAL.md           # 👤 顧客使用手冊
├── SHOP_OWNER_MANUAL.md         # 🏪 店家操作手冊
├── README.md                    # 📋 專案說明
├── 杏仁茶.png                   # 🖼️ 商品圖示
└── 杏仁豆腐.png                 # 🖼️ 商品圖示
```

## 🛠️ 部署步驟

### 第一階段：建立 Google Sheets

1. **建立新的 Google Sheets**
   - 前往 [Google Sheets](https://sheets.google.com)
   - 點選「建立空白試算表」
   - 命名為「杏仁茶訂購系統」

2. **複製試算表 ID**
   - 從網址複製試算表 ID
   - 網址格式：`https://docs.google.com/spreadsheets/d/[THIS_IS_THE_ID]/edit`
   - 例如：`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 第二階段：設定 Google Apps Script

1. **建立新的 GAS 專案**
   - 前往 [Google Apps Script](https://script.google.com)
   - 點選「新增專案」
   - 專案命名為「杏仁茶訂購系統API」

2. **貼上後端代碼**
   - 刪除預設的 `function myFunction()`
   - 複製 `gas-complete-with-sheets.gs` 的所有內容
   - 貼到 GAS 編輯器中

3. **設定試算表 ID**
   - 找到第 6 行：`const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';`
   - 將 `YOUR_SPREADSHEET_ID_HERE` 替換為第一階段複製的試算表 ID

4. **授權權限**
   - 點選「執行」→ 選擇 `testConnection` 函數
   - 點選「執行」按鈕
   - 授權存取 Google Sheets 權限

5. **初始化試算表**
   - 執行 `initializeSpreadsheet` 函數
   - 檢查 Google Sheets 是否建立了「設定」工作表

### 第三階段：部署 Web 應用程式

1. **部署設定**
   - 點選右上角「部署」→「新增部署」
   - 選擇類型：「網頁應用程式」
   - 設定如下：
     - **執行身分**：我
     - **存取權限**：任何人
   - 點選「部署」

2. **取得 Web 應用程式 URL**
   - 複製產生的 URL（格式類似：`https://script.google.com/.../exec`）
   - ⚠️ **重要**：一定要用 `/exec` 結尾的 URL，不是 `/dev`

### 第四階段：設定前端頁面

1. **更新 GAS URL**
   - 開啟 `order-form.html`
   - 找到第 752 行：`const GAS_URL = "...";`
   - 將 URL 替換為第三階段取得的 Web 應用程式 URL

2. **上傳商品圖片**（選擇性）
   - 將 `杏仁茶.png`、`杏仁豆腐.png` 上傳到你的網站空間
   - 或使用雲端圖床服務

3. **部署網頁**
   - 將 `order-form.html` 上傳到你的網站主機
   - 或使用 GitHub Pages 等免費託管服務

## ✅ 測試系統

### 基本連線測試
1. 直接在瀏覽器訪問 GAS URL，應該看到系統狀態頁面
2. 開啟訂單表單，填寫測試訂單
3. 檢查 Google Sheets 是否自動建立了對應日期的工作表
4. 確認訂單資料正確寫入

### 功能測試項目
- ✅ 不同商品的價格計算
- ✅ 杏仁茶 750ml 的階級定價（1瓶$130 / 2瓶$270 / 3瓶$400）
- ✅ 甜度選項（杏仁茶：無糖/三分糖/五分糖，杏仁粉：無糖/微糖）
- ✅ 溫度選項（杏仁茶 500ml：冰/熱）
- ✅ 多杯個別客製化功能
- ✅ 聯絡電話前導零保持
- ✅ 訂單編號自動產生

## 🔧 常見問題排解

### 問題1：「Failed to fetch」錯誤
**原因**：GAS 部署配置問題
**解決方案**：
1. 確認使用 `/exec` URL 而非 `/dev`
2. 檢查 GAS 部署權限設為「任何人」
3. 重新部署 GAS 應用程式

### 問題2：訂單無法寫入 Google Sheets
**原因**：試算表權限或 ID 錯誤
**解決方案**：
1. 檢查 GAS 代碼中的 `SPREADSHEET_ID` 設定
2. 確認 GAS 已授權存取 Google Sheets
3. 執行 `testConnection` 函數檢查連線

### 問題3：價格計算錯誤
**原因**：前端計算邏輯問題
**解決方案**：
1. 檢查瀏覽器開發者工具的 Console
2. 確認 `calculate750mlPrice` 函數正確運作
3. 測試不同商品組合的價格

### 問題4：甜度/溫度選項不顯示
**原因**：JavaScript 選項生成錯誤
**解決方案**：
1. 檢查瀏覽器 Console 是否有 JavaScript 錯誤
2. 確認商品 ID 與選項生成邏輯一致
3. 測試不同數量的選項顯示

## 📞 技術支援

如需技術支援，請提供以下資訊：
1. GAS 執行記錄截圖
2. 瀏覽器 Console 錯誤訊息
3. 具體的操作步驟和錯誤現象

## 🔄 系統更新

如需更新菜單或功能：
1. 修改 `order-form.html` 中的商品設定
2. 更新 GAS 代碼中的相關邏輯
3. 重新部署 GAS 應用程式
4. 測試所有功能正常運作

---

📅 **最後更新**：2025年8月7日
🔧 **版本**：v2.0 - 支援杏仁粉、階級定價、個別客製化