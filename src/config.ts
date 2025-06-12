import "dotenv/config";

export const config = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  BACKEND_URL: process.env.BACKEND_URL,
  BOT_NAME: process.env.BOT_NAME,
  BOT_DISPLAY_NAME: process.env.BOT_DISPLAY_NAME,
  BOT_VIDEO_URL: process.env.BOT_VIDEO_URL,
  depositWaitTimeMs: 60 * 1000,
  TOKEN_INFO_URL: process.env.TOKEN_INFO_URL,
  SUPPORT_TG: process.env.SUPPORT_TG,
  TWITTER_URL: process.env.TWITTER_URL,
  ENABLE_SPY_AD: process.env.ENABLE_SPY_AD,
  DEFAULT_TEAM_REF_CODE: process.env.DEFAULT_TEAM_REF_CODE,
  IS_PRODUCTION: process.env.IS_PRODUCTION,
  ALERT_CHAT_ID: process.env.ALERT_CHAT_ID,
  IS_RENT: process.env.IS_RENT === "1" ? true : false,
  RENT_CA: process.env.RENT_CA,
  RENT_POOL_ID: process.env.RENT_POOL_ID,
  RENT_CHAIN_NAME: process.env.RENT_CHAIN_NAME,
  GITBOOK_URL: process.env.GITBOOK_URL,
  RENT_CHAIN_SYMBOL: process.env.RENT_CHAIN_SYMBOL === undefined ? "" : process.env.RENT_CHAIN_SYMBOL
};
