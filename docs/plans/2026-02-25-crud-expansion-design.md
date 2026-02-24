# CRUD 功能擴展設計

## 日期：2026-02-25

## 概述

為教育課文平台新增兩項 CRUD 功能，擴展現有的檔案管理能力。

## 功能一：連結項目（Link Items）

在組別的檔案列表中，可新增「連結項目」與 HTML 檔案混合排列。

### 資料結構

在 `catalog.json` 的 group 層級新增 `links` 陣列：

```json
{
  "folder": "unit1",
  "displayName": "第一單元",
  "links": [
    {
      "title": "課文朗讀影片",
      "url": "https://youtube.com/...",
      "description": "第一課朗讀示範",
      "icon": "video",
      "order": 3
    }
  ]
}
```

### 圖示類型

預設可選圖示：video（影片）、doc（文件）、quiz（測驗）、web（網頁）、link（一般連結）

### 顯示方式

- 與 HTML 檔案混合排列，依 order 統一排序
- 以不同圖示區分類型
- 點擊後在新分頁開啟外部網址

### 管理模式 CRUD

- **Create**：彈窗填寫 顯示名稱 / 網址 / 描述 / 圖示類型
- **Read**：在檔案列表中顯示
- **Update**：編輯任一欄位
- **Delete**：確認後移除

## 功能二：說明文字區塊（Description Block）

科目/組別可設定一段富文本說明，顯示在檔案列表最上方。

### 資料結構

在 group 層級新增 `description` 欄位：

```json
{
  "folder": "unit1",
  "displayName": "第一單元",
  "description": "<p>本單元重點：<b>閱讀理解</b></p>"
}
```

### 顯示方式

- 組別展開後，檔案列表上方
- 淡色背景框，視覺區隔
- 支援 HTML：粗體、斜體、超連結、清單

### 編輯方式

- 簡易富文本編輯器（contenteditable）
- 工具列：粗體 / 斜體 / 超連結 / 清單
- 零外部依賴

## 技術方案

| 項目 | 做法 |
|------|------|
| 儲存 | 全部存在 catalog.json |
| 富文本編輯器 | 原生 contenteditable + execCommand |
| XSS 防護 | 白名單過濾（b, i, a, ul, ol, li, p, br） |
| 排序整合 | files 和 links 統一用 order 混合排序 |
| build.js | 保留 links 和 description 資料 |
