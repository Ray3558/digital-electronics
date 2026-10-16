# 數位電子乙級考試小幫手 (Digital Electronics Level B Exam Helper)

這是一個協助準備數位電子乙級檢定的輔助工具，提供試題練習與相關資訊。

## 🚀 專案設置 (Project Setup)

### 系統需求 (Prerequisites)
- **Node.js**: 建議使用 v18 或更高版本 (Recommended v18+ for Vite 6)
- **npm** or **yarn** or **pnpm**

### 安裝依賴 (Install Dependencies)
```bash
npm install
```

### 開發模式 (Development)
啟動本地開發伺服器：
```bash
npm run dev
```

### 建置專案 (Build)
產生正式環境用的靜態檔案 (位於 `dist/` 資料夾)：
```bash
npm run build
```

## 🛠 技術堆疊 (Tech Stack)
- **React 19**: UI 框架
- **Vite**: 建置工具
- **TypeScript**: 靜態型別
- **Lucide React**: 圖示庫

## 📦 部署 (Deployment)

本專案已設定 **GitHub Actions** 自動部署至 **GitHub Pages**。

### 設定步驟
1. 進入 GitHub Repository 的 **Settings**。
2. 點擊左側選單的 **Pages**。
3. 在 **Build and deployment** 區塊：
    - **Source**: 選擇 `GitHub Actions`。
4. 之後每次推送到 `main` 分支時，將會自動觸發部署流程。

## 📂 專案結構 (Project Structure)
```
.
├── src/                # 原始碼
├── public/             # 靜態資源
├── .github/workflows/  # CI/CD 設定
├── dist/               # 建置產出 (Build Output)
├── package.json        # 專案設定與依賴
└── vite.config.ts      # Vite 設定
```
