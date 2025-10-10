---
title: "使用組件示例文章"
description: "展示如何在 Markdown 中使用警告提示和展開內容組件"
date: "2023-10-02"
category: "教程"
tags: ["組件", "Markdown", "示例"]
---

# 使用組件示例文章

這篇文章展示了如何在 Markdown 文件中使用自定義組件，包括警告提示和展開內容。

## 警告提示組件

### 信息提示

<alert type="info" title="提示">
這是一個信息提示，用於提供有用的信息給用戶。
</alert>

### 警告提示

<Alert type="warning" title="注意">
這是一個警告提示，用於提醒用戶注意重要事項。
</Alert>

### 錯誤提示

<Alert type="error" title="錯誤">
這是一個錯誤提示，用於顯示錯誤信息。
</Alert>

### 成功提示

<Alert type="success" title="成功">
這是一個成功提示，用於顯示成功的操作結果。
</Alert>

## 展開內容組件

### 基本展開內容

<ExpandableContent title="點擊展開詳細說明">
這是展開內容的詳細說明。你可以放置任何 Markdown 內容在這裡，包括：

- 列表項目
- **粗體文字**
- `代碼片段`
- [鏈接](https://example.com)

這是一個多段落的內容示例。
</ExpandableContent>

### 默認展開的內容

<ExpandableContent title="默認展開的內容" open>
這個內容在頁面加載時就已經展開了。

你可以通過設置 `open` 屬性來控制初始狀態。
</ExpandableContent>

## 組合使用

你可以將警告提示和展開內容組合使用：

<Alert type="info">
展開下面的內容來查看更多信息。
</Alert>

<ExpandableContent title="更多信息">
這裡包含了額外的詳細信息：

1. 第一點信息
2. 第二點信息
3. 第三點信息

```javascript
// 代碼示例
function example() {
  console.log('這是一個代碼示例');
}
```

> 這是一個引用塊
</ExpandableContent>

## 總結

通過使用這些組件，你可以創建更豐富和互動性更強的文檔內容。這些組件支持主題切換，並且適配了暗色和亮色模式。