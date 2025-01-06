SPEC: Raydium Trading Bot - Market Data Monitoring Module
1. 概述
本文件規劃了針對 Raydium Trading Bot 的「市場數據監控模組」的功能需求與技術方案。此模組將：

監控 Raydium 上的新幣上市或新增的流動性池。
實時獲取並計算新幣的 FDV (Fully Diluted Valuation)。
依據環境變數設定的條件（買入/賣出觸發），在日誌中顯示觸發結果，包括代幣地址、當前價格，以及模擬的「持倉」資訊。
2. 功能需求
2.1 監控 Raydium 新幣上市
監測新增的流動性池（Liquidity Pools）

透過定期輪詢（polling）或其他事件機制，偵測 Raydium 上新出現的池子。
獲取新池子的基本資訊：池子 ID、代幣名稱、合約地址等。
獲取新幣資訊

包含：代幣名稱、合約地址、流通供應量（Circulating Supply）、單價（Price）等。
可能需要整合 Raydium 官方 API、Solana RPC 或第三方提供的數據來源。
2.2 計算並更新 FDV
FDV 計算

FDV
=
Circulating Supply
×
Price
FDV=Circulating Supply×Price
實時更新

監控價格與流通供應量的變化，定時重新計算 FDV。
有需要時，可使用事件訂閱（WebSocket）或較短時間間隔的輪詢。
2.3 依據環境變數觸發日誌輸出
買入觸發 (TARGET_FDV)
當 FDV 超過 TARGET_FDV，在日誌中顯示「Buy Trigger」相關訊息。
第一次賣出觸發 (TAKE_PROFIT_FDV)
當 FDV 超過 TAKE_PROFIT_FDV，在日誌中顯示「First Sell Trigger」相關訊息。
第二次賣出觸發 (TAKE_PROFIT_FDV_2)
當 FDV 超過 TAKE_PROFIT_FDV_2，在日誌中顯示「Second Sell Trigger」相關訊息。
注意：本 PoC 只會記錄觸發日誌，不會執行真正的買賣交易行為。

3. 技術細節
3.1 新增環境變數
在 .env 文件中可新增以下參數：

makefile
Copy code
# Solana RPC 節點
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Raydium API
RAYDIUM_API_URL=https://api.raydium.io

# 觸發買入的 FDV 閾值
TARGET_FDV=1000000

# 第一次賣出的 FDV 閾值
TAKE_PROFIT_FDV=3000000

# 第二次賣出的 FDV 閾值
TAKE_PROFIT_FDV_2=5000000
這些數字可根據實際策略需求自行調整。

3.2 FDV 監控流程
取得代幣資訊：
從 Raydium 或 Solana 鏈上獲取代幣的流通供應量（Circulating Supply）與當前價格（Price）。
計算 FDV：
FDV
=
Circulating Supply
×
Price
FDV=Circulating Supply×Price
比對觸發條件：
如果 FDV >= TARGET_FDV，觸發「買入訊號」的日誌紀錄。
如果 FDV >= TAKE_PROFIT_FDV，觸發「第一次賣出訊號」的日誌紀錄。
如果 FDV >= TAKE_PROFIT_FDV_2，觸發「第二次賣出訊號」的日誌紀錄。
3.3 日誌與觸發訊息
在日誌中顯示符合條件的 Token Address、觸發價（FDV）、以及模擬的 持倉 變動（若需要）。

範例：

less
Copy code
[INFO] New Pool Detected: ABC/USDC
[INFO] Token: ABC
[INFO] Mint Address: <代幣地址>
[INFO] Pool Address: <流動性池地址>
[INFO] Circulating Supply: 10,000,000
[INFO] Price: 0.5
[INFO] FDV: 5,000,000
[INFO] Trigger Buy! Token Address: <代幣地址>, FDV: 5,000,000, Holding: 100 (simulated)
Holding 可自行模擬，如「買入 100 代幣」；真實情況下可根據策略或資金量去決定。

4. PoC（概念驗證）規範
4.1 目標
週期性監控 Raydium 新增流動性池。
獲取代幣資訊與計算 FDV。
根據 .env 中的參數判斷是否觸發「買入 / 第一次賣出 / 第二次賣出」。
在日誌中輸出符合條件的代幣地址與簡易持倉模擬資訊。
4.2 核心流程
初始化
載入 .env，設置日誌工具。
監控新池子
每隔一定時間（如 1 分鐘）呼叫 Raydium API，對比「已知池子集合」是否有新池子出現。
處理池子
一旦發現新池子，拉取代幣資訊（名稱、Mint Address、價格、流通供應量）。
計算 FDV，寫入日誌。
檢查觸發條件
若 FDV >= TARGET_FDV：日誌中顯示「Buy Trigger」。
若 FDV >= TAKE_PROFIT_FDV：日誌中顯示「First Sell Trigger」。
若 FDV >= TAKE_PROFIT_FDV_2：日誌中顯示「Second Sell Trigger」。
模擬「持倉」資訊，即在日誌中顯示「已持有 n 代幣」或「持倉變動」等。
4.3 預期交付
PoC 應用，可以在終端或日誌檔中看到：
新池子被發現的訊息。
新代幣的 FDV 計算結果。
若 FDV 符合條件，顯示對應的買入或賣出觸發訊息。
注意：不會進行真實交易，僅做日誌記錄。

5. 測試流程
環境測試
確認能從 Raydium API 成功獲取 Pools 資訊。
確認 .env 中的參數載入正常。
新池子檢測
模擬或等待 Raydium 出現新池子，看是否能立刻記錄到日誌中。
FDV 計算
檢查計算結果是否與預期相符（以小測試數據做比對）。
觸發條件
測試將 TARGET_FDV / TAKE_PROFIT_FDV / TAKE_PROFIT_FDV_2 設為較小的數字，看日誌是否會顯示觸發訊息。
日誌顯示
確認代幣地址、FDV 值、模擬持倉資訊等是否正常記錄。
6. 進一步優化
多層觸發邏輯
可根據 FDV 變化率或價格漲幅，增加更多買入/賣出條件。
彈性持倉管理
若日後要實現真實交易，可將「買入數量」或「賣出比率」納入更多策略參數。
事件訂閱
可改用 Solana 或 Raydium 的即時事件通知，減少輪詢延遲。
紀錄數據至資料庫
方便後續統計分析或回測策略。
結論
通過以上 SPEC，可以快速搭建一個 Raydium Trading Bot - Market Data Monitoring 的 PoC，利用 .env 中的 3 組 FDV 閾值，控制買入 / 賣出（第一次、第二次）的日誌觸發。此 PoC 用於驗證概念與流程，不會執行真實的交易，但能夠提供一個完整的架構與日誌顯示，後續可再擴充至真實交易功能或更複雜的策略管理。