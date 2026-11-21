# Mnemonica 牌序記憶練習室

純靜態、手機優先的 Mnemonica 牌序記憶訓練網站。無建置步驟、無 CDN 與第三方執行時依賴。牌序只從 `data/stack.js` 讀取，陣列索引 0 對應位置 1。

## 本機使用

可直接以瀏覽器打開 `index.html`。Service Worker 需要 HTTP(S)；本機可用 Node.js 啟動內建預覽伺服器：

```sh
node dev-server.mjs
```

預設網址為 `http://127.0.0.1:8765`。單元測試：

```sh
node --test
```

## 功能

- 52 張牌以每行 13 張、共四行排列；手機可橫向捲動。
- 搜尋位置、牌碼（例如 `6S`）與中文花色（例如「黑桃6」）；循環鄰居明確標出 52→1。
- 段落回想、記憶宮殿地點與錨點；十種練習模式；每張牌的間隔複習盒與統計。
- 助記、設定與學習資料存在瀏覽器 `localStorage`；可匯出、匯入 JSON 或重設。
- 絨布夜、象牙日、高對比三種主題，支援鍵盤查詢快捷鍵 `/`、Escape 關閉及減少動態效果偏好。
- PWA Service Worker 快取主要頁面資產；第一次載入需連線。

## 專案檔案

```text
index.html
css/                 設計 token、主題、基礎、元件與花色樣式
js/                  儲存、SRS、互動與練習題
data/                固定牌序與可編輯助記建議
tests/               node:test 單元測試
sw.js                離線快取
manifest.webmanifest  PWA 設定
.github/workflows/   GitHub Pages 測試與部署
```

## 牌序規律與助記聲明

位置、牌面、鄰居、同點數牌與循環距離皆由 `data/stack.js` 的固定陣列計算。內建助記是建議畫面，可編輯，不是 Tamariz 的官方口訣。本站不會將未找到可靠來源的記憶法或歷史敘述說成官方事實。

《Sinfonía en Mnemónica Mayor》的書目資料列出 Editorial Frakson、Madrid、1988。網站的出版年標示以此書目資料為準。

## GitHub Pages

`.github/workflows/pages.yml` 在 `main` 推送後先執行 `node --test`，成功才會上傳並部署。建立公開儲存庫後，將 Pages 發佈來源設為 GitHub Actions。工作流程使用 GitHub 官方 Pages actions；部署 job 需 `pages: write` 與 `id-token: write` 權限。

## 參考資料

- [Juan Tamariz 書目搜尋（AbeBooks）](https://www.abebooks.com/book-search/author/JUAN-TAMARIZ/)
- [魔術書目拍賣目錄（Potter & Potter）](https://potterauctions.com/pdf/016_Charles_Reynolds_Catalog_WEB.pdf)
- [The method of loci in the context of psychological research: A systematic review and meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC12514325/)
- [The science of effective learning with spacing and retrieval practice](https://doi.org/10.1038/s44159-022-00089-1)
- [Augmented memory: a survey of the approaches to remembering more](https://pmc.ncbi.nlm.nih.gov/articles/PMC3939671/)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
