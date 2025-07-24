const Redis = require('ioredis');

// 從環境變數或硬編碼配置 Redis 連線資訊
// 強烈建議使用環境變數來管理敏感資訊 (如密碼) 和不同環境 (開發/生產) 的配置
const redisConfig = {
    port:  6379,          // Redis 埠號
    host:  '114.132.75.251',   // Redis 主機位址
    password: 'hez123',  // 如果 Redis 沒有密碼，設定為 null
    db: 1,                 // 選擇 Redis 資料庫 (預設為 0)
    maxRetriesPerRequest: null,                    // 禁用每個請求的重試，讓整個連線處理重試
    // 其他可選配置，例如連線池大小、逾時等，您可以根據需求添加
    // enableOfflineQueue: true, // 當連線斷開時，命令是否排隊等待重連後執行 (預設 true)
    // retryStrategy: times => Math.min(times * 50, 2000), // 自定義重連策略
};

const redis = new Redis(redisConfig);

// 監聽連線成功事件
redis.on('connect', () => {
    console.log('🎉 成功連接到 Redis!');
});

// 監聽連線錯誤事件
redis.on('error', (err) => {
    console.error('❌ Redis 連線錯誤:', err);
});

// 匯出 Redis 實例，以便在其他地方重複使用
module.exports = redis;