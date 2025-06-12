import "dotenv/config";

require("dotenv").config();

import {
  Bot,
  InlineKeyboard,
  InputFile,
  Context,
  session,
  SessionFlavor,
  BotError,
  NextFunction,
  GrammyError,
  HttpError,
} from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { poolExists } from "./src/requests/poolExists";
import { getPackages } from "./src/requests/getPackages";
import { createCustomer } from "./src/requests/createCustomer";
import { Boost, Chain, Customer, Dex, Package, PoolType } from "./types/types";
import { createBoost } from "./src/requests/createBoost";
import { config } from "./src/config";
import { getBoost } from "./src/requests/getBoost";
import { getReferralInfo } from "./src/requests/getReferralInfo";
import { updateReferralWallet } from "./src/requests/updateReferralWallet";
import { getTokenInfo } from "./src/requests/getTokenInfo";
import { getCustomerById } from "./src/requests/getCustomerById";
import { getChains } from "./src/requests/getChains";
import { getPoolTypes } from "./src/requests/getPoolTypes";
import { getBoostsByBot } from "./src/requests/getBoostsByBot";
import { getSwapAmounts } from "./src/requests/getSwapAmounts";
import { setPauseBoost } from "./src/requests/setPauseBoost";
import { validateToken } from "./src/requests/validateToken";
import { checkRent } from "./src/requests/checkRent";

// Define the shape of our session.
interface SessionData {
  package: Package | undefined;
  token: string | undefined;
  customer: Customer | undefined;
  boost: Boost | undefined;
  refCode: string | undefined;
  allPackages: Package[] | undefined;
  chainIndex: number | undefined;
  adCode: string | undefined;
  poolType: number | undefined;
  chains: Chain[];
  changeRefWalletChainIndex: number;
  swapAmounts: number[];
  swapAmount: number;
  volumeMode: number;
  dexes: Dex[];
  selectedDex: string | undefined;
  selectedDexVersion: string | undefined;
  ticker: string;
  tokenInfo: any | undefined;
  paymentIntervalTimer: any | undefined;
  paymentTime: number;
  selectedBoost: number | undefined;
  pairAddress: string | undefined;
  quoteToken: string | undefined;
}

// Flavor the context type to include sessions.
//type MyContext = Context & SessionFlavor<SessionData>;
type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;
type MyConversation = Conversation<MyContext>;
// Install session middleware, and define the initial session value.
function initial(): SessionData {
  return {
    package: undefined,
    token: "",
    customer: undefined,
    boost: undefined,
    refCode: "",
    allPackages: [],
    chainIndex: 2,
    adCode: "",
    poolType: 0,
    chains: [],
    changeRefWalletChainIndex: 0,
    swapAmounts: [],
    swapAmount: 0,
    volumeMode: 0,
    dexes: [],
    selectedDex: "",
    selectedDexVersion: "",
    ticker: "",
    tokenInfo: undefined,
    paymentIntervalTimer: undefined,
    paymentTime: 1800,
    selectedBoost: undefined,
    pairAddress: "",
    quoteToken: "",
  };
}

const bot = new Bot<MyContext>(config.BOT_TOKEN);

bot.use(
  session({
    initial: initial,
  })
);

bot.use(conversations());
bot.use(createConversation(startBot));
bot.use(createConversation(askForTokenJito));
bot.use(createConversation(askForToken));
bot.use(createConversation(referral));
bot.use(createConversation(rental));
bot.use(createConversation(acquireProduct));
bot.use(createConversation(askForSwapAmount));
bot.use(createConversation(askForPackages));
bot.use(createConversation(changeRefWallet));
bot.use(createConversation(askForPoolType));
bot.use(createConversation(askBoostList));
bot.use(createConversation(updateBoostPause));
bot.use(createConversation(validateTokenFunction));

// Send a keyboard along with a message.
bot.command("start", async (ctx) => {
  const param = ctx.match;
  console.log("/start", param);
  ctx.session = initial();
  clearInterval(ctx.session.paymentIntervalTimer);
  ctx.session.chains = await getChains();
  await replyWithMain(ctx, param);
});

async function replyWithMain(ctx: MyContext, param: string) {
  const params = param.split("_");
  const refCode = params[0] || "";
  const adCode = params[1] || "";

  ctx.session.adCode = adCode;

  const customer = await createCustomer(`${ctx.from.id}`, refCode, adCode);
  ctx.session.customer = customer;

  let defaultRefCode = "titanbotteam";
  if (config.DEFAULT_TEAM_REF_CODE !== undefined) {
    defaultRefCode = config.DEFAULT_TEAM_REF_CODE;
  }

  console.log(`default ref code: ${defaultRefCode}`);

  if (!refCode && customer?.has_affiliate) {
    //sticky referral
    const affiliate = await getCustomerById(customer.referrer_customer_id);

    if (affiliate && affiliate.is_affiliate) {
      ctx.session.refCode = affiliate.referral_code;
    } else {
      ctx.session.refCode = defaultRefCode;
    }
  } else if (refCode && refCode != "") {
    // New ref code came through this can break the tie between customer and their affiliate referrer
    ctx.session.refCode = refCode;
  } else {
    ctx.session.refCode = defaultRefCode;
  }

  console.log("ctx.session.refCode:", ctx.session.refCode, "ctx.session.adCode:", ctx.session.adCode);

  await ctx.conversation.enter("startBot");
}


const rentalText = `<b>Welcome to the ${config.BOT_DISPLAY_NAME} volume bot!</b>`

const get = `<b>Welcome to the ${config.BOT_DISPLAY_NAME} volume bot!</b>`

const gorillaMainText = `Welcome to the Gorilla Amps Volume Bot!

Designed to pump up the volume, attract new holders & get your project trending! 

Brought to you by <a href="https://x.com/g0rillaTools">Gorilla Tools</a>! 

Here's How:

<tg-emoji emoji-id="5368324170671202286">🔊</tg-emoji> Volume: Generates up to 2.5 Million in trading volume 
<tg-emoji emoji-id="5368324170671202286">📓</tg-emoji> Plans: From 1 hour to 3 days in custom plan options for all budgets
<tg-emoji emoji-id="5368324170671202286">📊</tg-emoji> Transactions: Fresh wallets (up to 4k+)  buys/sells on every transaction
<tg-emoji emoji-id="5368324170671202286">📈</tg-emoji> Trending: Custom trending & booster hourly & plans available
<tg-emoji emoji-id="5368324170671202286">💻</tg-emoji> Marketing: Increase visibility via custom ads on our bots & channels`

const mainText = `<b>Welcome to the ${config.BOT_DISPLAY_NAME} volume bot!</b>

Experience the power of our volume bot.  We offer tools to boost your tokens metrics!

🔊 Volume: Organic and Performance volume options
📈 Trending: Boost your Dexscreener metrics
📊 Fresh wallets generated for buys/sells on every transaction
💰 Get started for as low as 1 SOL, .05 ETH or 30 SUI

<a href="${config.TWITTER_URL}">Twitter</a>
<a href="${config.GITBOOK_URL}">Gitbook</a>

Select a chain below to get started 🚀`

function getMainText() {
  if (config.IS_RENT) {
    return rentalText;
  } else if (config.BOT_DISPLAY_NAME == "Gorilla Amps") {
    return gorillaMainText;
  } else {
    return mainText;
  }
}

async function getKeyBoard(ctx: MyContext): Promise<InlineKeyboard> {
  const chainsKeyboard = new InlineKeyboard();
  const chains = ctx.session.chains;
  ctx.session.chains = await getChains();
  if (config.IS_RENT) {
    const chainIndex = ctx.session.chains.findIndex((i: any) => i.name.toLowerCase() === config.RENT_CHAIN_NAME.toLowerCase());
    ctx.session.chainIndex = chainIndex;

    chainsKeyboard.text("Get Started", JSON.stringify({ type: "click-chaintype", data: chainIndex }))
    chainsKeyboard.row()
    chainsKeyboard.text("My Boosts", JSON.stringify({ type: "click-boosts" }))
    return chainsKeyboard;
  }

  for (let index = 0; index < chains.length; index++) {
    chainsKeyboard
      .text(
        chains[index].name,
        JSON.stringify({ type: "click-chaintype", data: index })
      )
      .row();
  }
  chainsKeyboard.text("Pump.fun", JSON.stringify({ type: "click-chaintype", data: 100 }))
  chainsKeyboard.row()

  if (config.BOT_DISPLAY_NAME == "Gorilla Amps") {
    chainsKeyboard
      .text(" 💸 Referrals ", JSON.stringify({ type: "click-refer" }))
      .url(" 🌐 Bridge ", `https://t.me/GorillaChainsBot`)
      .row()
      .url(" 🌐 Website ", `https://gorillatools.tech/amps`)
      .url(" 🌎 Support ", `${config.SUPPORT_TG}`)
      .row()
      .url("Gorilla Tools! The tools you need to #ApeHard", `${config.TWITTER_URL}`);
  } else {
    chainsKeyboard
      .text(" ♾️ Rental ", JSON.stringify({ type: "click-choose-rental" }))
      .row()
      .text(" 💸 Referrals ", JSON.stringify({ type: "click-refer" }))
      .row()
      .url(" 🌎 Support ", `${config.SUPPORT_TG}`);
  }
  return chainsKeyboard;
}

async function startBot(conversation: MyConversation, ctx: MyContext) {

  await ctx.replyWithVideo(
    new InputFile({
      url: `${config.BOT_VIDEO_URL}`,
    }),
    {
      caption: getMainText(),
      parse_mode: "HTML",
      reply_markup: await getKeyBoard(ctx),
    }
  );
}

async function changeRefWallet(conversation: MyConversation, ctx: MyContext) {
  try {
    await ctx.reply(
      `➡️ Please provide your ${ctx.session.chains[ctx.session.changeRefWalletChainIndex].name
      } wallet address where you'll receive ${ctx.session.chains[ctx.session.changeRefWalletChainIndex].nativeToken
      } straight from purchases made through your link.`
    );
    ctx = await conversation.wait();
    if (ctx.message?.text.startsWith("/start")) {
      return startBot(conversation, ctx);
    }
    if (ctx.callbackQuery?.data) {
      console.log("callbackquery");
      return startBot(conversation, ctx);
    }
    const refWallet = ctx.message?.text;
    await updateReferralWallet(
      ctx.session.customer.id,
      refWallet,
      ctx.session.chains[ctx.session.changeRefWalletChainIndex].id
    );
    await ctx.reply("Thank you! Your wallet is now connected to your referral💰");
    await ctx.conversation.enter("referral");
  } catch (error) {
    console.log(error);
    await startMenu(ctx);
  }



}

async function referral(conversation: MyConversation, ctx: MyContext) {
  try {
    let refInfo = await getReferralInfo(ctx.session.customer.id);
    await reportReferral(ctx, refInfo);
    // }
  } catch (error) {
    console.log(error);
    await startMenu(ctx);
  }
}


async function rental(conversation: MyConversation, ctx: MyContext) {
  const rentalKb = new InlineKeyboard();
    rentalKb.text(
      `Main Menu`,
      JSON.stringify({ type: "click-return-main", data: true })
      
    ).row()
    .url(" 🌎 Support ", `${config.SUPPORT_TG}`)

  await ctx.reply(
`Interested in using the bot more often and saving fees?\n\nWe now offer rentals on SUI and SOL chains.\n
⭐Enjoy a convenient pause feature, allowing you to start and stop the bot whenever needed. 
⭐Service fees returned to your wallet to be reused as needed
⭐Your own custom telegram branded bot
⭐Activate the bot during peak opportunities and deactivate it when it's not needed, maximizing cost-effectiveness.\n
For more information inquire in the support TG and review our gitbook for pricing and more details.\n
💲Pricing 

SUI
-300 SUI weekly
-1000 SUI monthly

Solana
-3 sol daily
-9 sol weekly
-20 sol monthly

<a href="${config.GITBOOK_URL}">Gitbook</a>
<a href="${config.SUPPORT_TG}">Support</a>`,
    {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: rentalKb,
    }
  );
}

async function reportReferral(ctx: MyContext, refInfo: any) {
  const date = new Date();
  const changeRefWalletKeyboard = new InlineKeyboard();
  const chains = ctx.session.chains;
  for (let index = 0; index < chains.length; index++) {
    const chain = chains[index];

    changeRefWalletKeyboard.text(
      `Change ${chain.name} Wallet`,
      JSON.stringify({ type: "change-ref-wallet", data: index })
    );
  }
  await ctx.reply(
    `📊 Referral System Report for a date: ${date.getMonth() + 1
    }/${date.getDate()}/${date.getFullYear()}

🔗 Your referral link: https://t.me/${config.BOT_NAME}?start=${refInfo.refCode}

Lifetime SOL earned: ${refInfo.fundEarnedSolana} 

Lifetime ETH earned: ${refInfo.fundEarnedBase} 

Lifetime SUI earned: ${refInfo.fundEarnedSui} 

Referred till now: ${refInfo.count}

Solana Wallet: ${refInfo.solanaWallet}

Base Eth Wallet: ${refInfo.baseWallet}

Sui Wallet: ${refInfo.suiWallet}
`,
    {
      parse_mode: "HTML",
      reply_markup: changeRefWalletKeyboard,
    }
  );
}

async function askForPoolType(conversation: MyConversation, ctx: MyContext) {
  try {
    const poolsKeyboard = new InlineKeyboard();

    const poolTypes = await getPoolTypes(
      ctx.session.chains[ctx.session.chainIndex].id
    );

    ctx.session.dexes = poolTypes;


    for (let index = 0; index < poolTypes.length; index++) {
      const poolType: PoolType = poolTypes[index];
      poolsKeyboard
        .text(
          poolType.name,
          JSON.stringify({ type: "click-pooltype", data: poolType.id })
        )
        .row();
    }
    poolsKeyboard.text(
      `Main Menu`,
      JSON.stringify({ type: "click-return-main", data: true })
    )

    if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'bsc') {
      await ctx.reply(
        "Disclaimer: BSC has higher transactions fees and will use funds quicker than low fee chains.  Tax tokens are not recommended for optimal performance of the bot."
      );
    }

    await ctx.reply(`Choose which pool to boost on ${ctx.session.chains[ctx.session.chainIndex].name}:`, {
      parse_mode: "HTML",
      reply_markup: poolsKeyboard,
    });

  } catch (error) {
    console.log(error);
    await startMenu(ctx);
  }
}

async function askForSwapAmount(conversation: MyConversation, ctx: MyContext) {
  try {
    const amounts = await getSwapAmounts(
      ctx.session.chains[ctx.session.chainIndex].id,
      ctx.session.poolType
    );

    ctx.session.swapAmounts = amounts;
    const swapKeyboard = new InlineKeyboard();

    for (let index = 0; index < amounts.length - 1; index++) {
      let name = amounts[index] + ` ${ctx.session.chains[ctx.session.chainIndex].nativeToken}`;
      swapKeyboard
        .text(
          name,
          JSON.stringify({ type: "swap-amounts", data: index })
        )
        .row()
    }
    swapKeyboard
      .text(
        `Main Menu`,
        JSON.stringify({ type: "click-return-main", data: true })
      )

    await ctx.reply(
      `Select the max ${ctx.session.chains[ctx.session.chainIndex].nativeToken} amount per swap bundle from the options below:\n\n<b>You can also input a custom amount between ${amounts[0]} and ${amounts[amounts.length - 1]}</b>\n\nThe bot will trade +-25% of this value.`,
      {
        parse_mode: "HTML",
        reply_markup: swapKeyboard,
      }
    );
    ctx = await conversation.waitFor(":text");
    if (ctx.message?.text.startsWith("/start")) {
      return await startBot(conversation, ctx);
    }
    if (ctx.callbackQuery?.data) {
      console.log("callbackquery");
      return await startBot(conversation, ctx);
    }
    let swapAmount = parseFloat(ctx.message?.text);
    console.log(swapAmount, amounts[0], amounts[amounts.length - 1], 'swapAmount');
    if (Number.isNaN(Number(swapAmount)) || swapAmount < amounts[0] || swapAmount > amounts[amounts.length - 1]) {
      await ctx.reply(`Please input a valid amount (between ${amounts[0]} and ${amounts[amounts.length - 1]})`, {
        parse_mode: "HTML",
      });
      await ctx.conversation.enter("askForSwapAmount");
    } else {
      ctx.session.swapAmount = parseFloat(Number(ctx.message?.text).toFixed(2));
      await ctx.conversation.enter("acquireProduct");
    }
  } catch (error) {
    console.log(error);
    await startMenu(ctx);
  }


}

async function askForPackages(conversation: MyConversation, ctx: MyContext) {
  try {
    const packages = await getPackages(
      ctx.session.chains[ctx.session.chainIndex].id,
      ctx.session.poolType,
      ctx.session.volumeMode
    );

    ctx.session.allPackages = packages;
    const productsKeyboard = new InlineKeyboard();
    for (let index = 0; index < packages.length; index++) {
      productsKeyboard
        .text(
          packages[index].name,
          JSON.stringify({ type: "click-package", data: index })
        )
        .row()
    }
    productsKeyboard
      .text(
        `Main Menu`,
        JSON.stringify({ type: "click-return-main", data: true })
      )

    if (ctx.session.volumeMode !== 0 && ctx.session.volumeMode == 1 || ctx.session.volumeMode == 3) {
      const chooseText = 'transaction speed';
      await ctx.reply(
        `Choose ${chooseText} for: <b>${ctx.session.ticker}</b>\n\n${ctx.session.token}`,
        {
          parse_mode: "HTML",
          reply_markup: productsKeyboard,
        }
      );
    } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === 'sui' && ctx.session.volumeMode === 5){
      await ctx.reply(
        `Holder boost will add ~1000 new holders for 100 SUI.\n\nSelect the package below.`,
        {
          parse_mode: "HTML",
          reply_markup: productsKeyboard,
        }
      );
    } else if (ctx.session.volumeMode === 0) {
      const chooseText = 'a package';
      await ctx.reply(
        `Choose ${chooseText} for: <b>${ctx.session.ticker}</b>\n\n${ctx.session.token}`,
        {
          parse_mode: "HTML",
          reply_markup: productsKeyboard,
        }
      );
    } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === 'avax' && (ctx.session.volumeMode === 2 || ctx.session.volumeMode === 4)) {
      await ctx.reply(
        `Choose a level for: <b>${ctx.session.ticker}</b>\n\n${ctx.session.token}\n\n➡️ Levels: The higher the level the more transactions per minute.`,
        {
          parse_mode: "HTML",
          reply_markup: productsKeyboard,
        }
      );
    } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === 'bsc' || ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === 'base' && (ctx.session.volumeMode === 2 || ctx.session.volumeMode === 4)) {
      await ctx.reply(
        `Choose a level for: <b>${ctx.session.ticker}</b>\n\n${ctx.session.token}\n\n➡️ Levels: The higher the level the more transactions per minute.`,
        {
          parse_mode: "HTML",
          reply_markup: productsKeyboard,
        }
      );
    } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === 'sui' && (ctx.session.volumeMode === 2 || ctx.session.volumeMode === 4)) {
      await ctx.reply(
        `Choose an option for: <b>${ctx.session.ticker}</b>\n\n${ctx.session.token}

➡️ Standard - Moderate transactions
➡️ Turbo - Highest transaction rate
➡️ Steady - Longest lasting`,
        {
          parse_mode: "HTML",
          reply_markup: productsKeyboard,
        }
      );
    } else if (
      ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() ===
        "bera" &&
      (ctx.session.volumeMode === 2 || ctx.session.volumeMode === 4)
    ) {
      await ctx.reply(
        `Choose a level for: <b>${ctx.session.ticker}</b>\n\n${ctx.session.token}\n\n➡️ Levels: The higher the level the more transactions per minute.`,
        {
          parse_mode: "HTML",
          reply_markup: productsKeyboard,
        }
      );
    } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === 'solana' && ctx.session.volumeMode === 2 || ctx.session.volumeMode === 4) {
      await ctx.reply(
        `Rank bot packages boost unique makers.  For optimal ranking performance,  your token will have volume and Dexscreener boosts and/or ads.\n\nNOTE: This package will do upwards of 1000 micro buys per minute.\n\nSelect the package below.`,
        {
          parse_mode: "HTML",
          reply_markup: productsKeyboard,
        }
      );
    } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === 'solana' && ctx.session.volumeMode === 5) {
      await ctx.reply(
        `Holder boost will add ~500 new holders for 1 SOL.\n\nSelect the package below.`,
        {
          parse_mode: "HTML",
          reply_markup: productsKeyboard,
        }
      );
    } else {
      const chooseText = 'a package';
      await ctx.reply(
        `Choose ${chooseText} for: <b>${ctx.session.ticker}</b>\n\n${ctx.session.token}`,
        {
          parse_mode: "HTML",
          reply_markup: productsKeyboard,
        }
      );
    }

  } catch (error) {
    console.log(error);
    await startMenu(ctx);
  }



}

async function askForTokenJito(conversation: MyConversation, ctx: MyContext) {
  try {

    if (!config.IS_RENT) {
      await ctx.reply(
        `Enter the contract address of your token on ${ctx.session.selectedDex}.`
      );
      ctx = await conversation.wait();
      if (ctx.message?.text.startsWith("/start")) {
        return await startBot(conversation, ctx);
      }
      if (ctx.callbackQuery?.data) {
        console.log("callbackquery");
        return await startBot(conversation, ctx);
      }
      ctx.session.token = ctx.message?.text;
    } else {
      ctx.session.token = config.RENT_CA;
      ctx.session.poolType = Number(config.RENT_POOL_ID);
    }

    let isValidateToken = true;
    if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'solana') {
      isValidateToken = await validateToken(
        ctx.session.token,
        ctx.session.chains[ctx.session.chainIndex].id,
        ctx.session.poolType
      );
    }
    if (isValidateToken) {

      let tokenInfo = await getTokenInfo(ctx.session.token);
      ctx.session.tokenInfo = tokenInfo;

      let dex = ctx.session.selectedDex.toLowerCase();
      if (dex === "turbos") {
        dex = "turbos-finance";
      }

      if (dex === "lfj") {
        dex = "traderjoe";
      }


      console.log("Dex", dex);
      console.log("Version", ctx.session.selectedDexVersion);

      if (dex === "kodiak finance v2") {
        dex = "kodiak";
        ctx.session.tokenInfo.pairs = tokenInfo.pairs.filter(
          (element: any) => element.dexId.toLowerCase() === dex
           && element.labels[0] === "v2"
           && element.quoteToken.symbol === "WBERA");
      } else if(ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'bsc' && ctx.session.selectedDexVersion === "v2" || ctx.session.selectedDexVersion === "v3") {
        
        const firstWordSubstr = dex.substring(0, dex.indexOf(" "));
        dex = firstWordSubstr;
        console.log(dex);

        ctx.session.tokenInfo.pairs = tokenInfo.pairs.filter(
          (element: any) => element.dexId.toLowerCase() === dex
          && element.labels[0] === ctx.session.selectedDexVersion
          && element.quoteToken.symbol === "WBNB");
      } else {
        ctx.session.tokenInfo.pairs = tokenInfo.pairs.filter(
          (element: any) => element.dexId.toLowerCase() === dex
        );
      }

    if((ctx.session.tokenInfo && ctx.session.tokenInfo.pairs.length > 1 && ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'bsc') ||
    (ctx.session.tokenInfo && ctx.session.tokenInfo.pairs.length > 1 && ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'sui') ||
    (!ctx.session.tokenInfo && ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'sui')) {

     await askForPair(ctx);

    } else if(ctx.session.tokenInfo === undefined || ctx.session.tokenInfo.pairs === undefined || (ctx.session.tokenInfo && ctx.session.tokenInfo.pairs && ctx.session.tokenInfo.pairs.length === 0)) {
      await ctx.reply("Token not found.");
      await ctx.conversation.enter("askForTokenJito");
    } else  {
      ctx.session.pairAddress = ctx.session.tokenInfo.pairs[0].pairAddress;
      await validateTokenFunction(conversation, ctx);
    }

    } else {
      await ctx.reply(`We do not support token-2022 tokens as they can have extra fees that degrade the bot's performance.\n\n ${ctx.session.token}`, {
        parse_mode: "HTML",
      });

      await ctx.conversation.enter("askForTokenJito");
    }
  } catch (error) {
    console.log(error);
    await startMenu(ctx);
  }

}

async function askForPair(ctx: MyContext) {
  let pairsKeyboard  = new InlineKeyboard();

  if(ctx.session.token === "0xaa228b0e90f6e7748795bf2e2c0f219aafe95af7b0ce55e9c5bbff0f6e1bfb11::beth::BETH") {
    if(ctx.session.tokenInfo.pairs.length > 1) {
      for (let index = 0; index < ctx.session.tokenInfo.pairs.length; index++) {
        if(ctx.session.tokenInfo.pairs[index].liquidity.usd > 200) {
          pairsKeyboard
              .text(
                'Liq: $'+ctx.session.tokenInfo.pairs[index].liquidity.usd.toFixed(2).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") + ' / Pair: ' +ctx.session.tokenInfo.pairs[index].pairAddress, JSON.stringify({ type: "click-pairAddress", data: index }))
              .row()
          }
        }
    } else {
      pairsKeyboard
      .text(
        'Liq: $'+ctx.session.tokenInfo.pairs[0].liquidity.usd.toFixed(2).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") + ' Pair: ' +ctx.session.tokenInfo.pairs.pairAddress, JSON.stringify({ type: "click-pairAddress", data: 0 }))
      .row()
    }
  } else {
    if(ctx.session.tokenInfo.pairs.length > 1) {
      for (let index = 0; index < ctx.session.tokenInfo.pairs.length; index++) {
        if((ctx.session.tokenInfo.pairs[index].quoteToken.symbol === "SUI" || ctx.session.tokenInfo.pairs[index].quoteToken.symbol === "WBNB") && ctx.session.tokenInfo.pairs[index].liquidity.usd > 200) {
          pairsKeyboard
              .text(
                'Liq: $'+ctx.session.tokenInfo.pairs[index].liquidity.usd.toFixed(2).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") + ' / Pair: ' +ctx.session.tokenInfo.pairs[index].pairAddress, JSON.stringify({ type: "click-pairAddress", data: index }))
              .row()
          }
        }
    } else {
      pairsKeyboard
      .text(
        'Liq: $'+ctx.session.tokenInfo.pairs[0].liquidity.usd.toFixed(2).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") + ' Pair: ' +ctx.session.tokenInfo.pairs.pairAddress, JSON.stringify({ type: "click-pairAddress", data: 0 }))
      .row()
  }
  }
  pairsKeyboard
  .text(
    `Main Menu`,
    JSON.stringify({ type: "click-return-main", data: true })
  )

await ctx.reply(
  `Select the ${ctx.session.selectedDex} pair you want to boost.`,
  {
    parse_mode: "HTML",
    reply_markup: pairsKeyboard,
  }
);
}

async function askForToken(conversation: MyConversation, ctx: MyContext) {
  try {
    const chainName = ctx.session.selectedDex == "Pump.fun" ? "Pump fun" : ctx.session.chains[ctx.session.chainIndex].name;

    if (!config.IS_RENT) {
      await ctx.reply(
        `Enter the ${chainName} address of your token.`
      );
      ctx = await conversation.wait();
      if (ctx.message?.text.startsWith("/start")) {
        return await startBot(conversation, ctx);
      }
      if (ctx.callbackQuery?.data) {
        console.log("callbackquery");
        return await startBot(conversation, ctx);
      }
      ctx.session.token = ctx.message?.text;
    } else {
      ctx.session.token = config.RENT_CA;
    }

    await ctx.reply(
      `We are validating this token on ${ctx.session.chains[ctx.session.chainIndex].name
      }.`
    );

    let tokenInfo = await getTokenInfo(ctx.session.token);
    ctx.session.tokenInfo = tokenInfo;
    ctx.session.tokenInfo.pairs = tokenInfo.pairs.find((element: any) => element.dexId.toLowerCase() === ctx.session.selectedDex.toLowerCase());

    const exists = await poolExists(
      ctx.session.token,
      ctx.session.chains[ctx.session.chainIndex].id,
      ctx.session.poolType,
      ctx.session.pairAddress
    );
    if (exists) {
      await ctx.reply("Validation complete.");

      try {
        await dexscreenerTokenInfo(ctx);
      } catch (error) {
        //need to log to database
        console.log(error);
      }

      const packages = await getPackages(
        ctx.session.chains[ctx.session.chainIndex].id,
        ctx.session.poolType,
        0
      );

      ctx.session.allPackages = packages;
      const productsKeyboard = new InlineKeyboard();
      for (let index = 0; index < packages.length; index++) {
        productsKeyboard
          .text(
            packages[index].name,
            JSON.stringify({ type: "click-package", data: index })
          )
          .row()
      }

      productsKeyboard
        .text(
          `Main Menu`,
          JSON.stringify({ type: "click-return-main", data: true })
        )

      await ctx.reply(
        `Choose a package for: <b>${ctx.session.ticker}</b>\n\n${ctx.session.token}`,
        {
          parse_mode: "HTML",
          reply_markup: productsKeyboard,
        }
      );
    } else {
      await ctx.reply(`No pair found for:\n\n${ctx.session.token}`, {
        parse_mode: "HTML",
      });

      await ctx.conversation.enter("askForToken");
    }
  } catch (error) {
    console.log(error);
    await startMenu(ctx);
  }
}

function roundToHundredth(number: number) {
  return Math.round(number * 100) / 100;
}

async function acquireProduct(conversation: MyConversation, ctx: MyContext) {
  try {

    if (ctx.session.refCode === undefined || ctx.session.refCode === "") {
      let defaultRefCode = "titanbotteam";
      if (config.DEFAULT_TEAM_REF_CODE !== undefined) {
        defaultRefCode = config.DEFAULT_TEAM_REF_CODE;
      }
      ctx.session.refCode = defaultRefCode;
    }

    const boost = await createBoost(
      ctx.session.customer.id,
      ctx.session.package.id,
      ctx.session.token,
      ctx.session.refCode,
      ctx.session.chains[ctx.session.chainIndex].id,
      config.BOT_NAME,
      ctx.session.poolType,
      ctx.session.swapAmount,
      ctx.session.pairAddress
    );

    ctx.session.boost = boost;
    const product_json: any = ctx.session.package.product_json;

    console.log(ctx.session.chains[ctx.session.chainIndex].name.toLowerCase());

    let totalFund = product_json.totalFund;
    if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'solana' && ctx.session.package.is_jito && !ctx.session.package.is_trending && ctx.session.poolType != 2) {
      totalFund = ctx.session.swapAmount * (Math.floor(parseInt(product_json.txCountPerMin) / 15) || 1)
      totalFund = Math.ceil(totalFund * 10 / 9);

      if (parseInt(product_json.txCountPerMin) / 6 == 1) {
        totalFund = totalFund > 2 ? totalFund : 2;
      }

      if (parseInt(product_json.txCountPerMin) / 15 == 1) {
        totalFund = totalFund > 3 ? totalFund : 3;
      }
      if (parseInt(product_json.txCountPerMin) / 15 >= 2) {
        totalFund = totalFund > 4 ? totalFund : 4;
      }
    } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === 'sui' && ctx.session.package.is_custom) {
      totalFund = ctx.session.swapAmount * (3 * Math.floor(parseInt(product_json.txCountPerMin) / 3) || 3)
      totalFund = Math.ceil(totalFund * 10 / 70) * 10;
    } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === 'base' && ctx.session.package.is_custom) {
      totalFund = ctx.session.swapAmount * (3 * Math.floor(parseInt(product_json.txCountPerMin) / 3) || 3)
      totalFund = Math.ceil((totalFund * 10 / 7) * 100) / 100;
    } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === 'bsc' && ctx.session.package.is_custom) {
      totalFund = ctx.session.swapAmount * (3 * Math.floor(parseInt(product_json.txCountPerMin) / 3) || 3)
      totalFund = totalFund * 1.3; //add 30% on BNB because transactions fees are high
      totalFund = Math.ceil((totalFund * 10 / 8) * 100) / 100;
      if(product_json.txCountPerMin === 3) {
        totalFund = (totalFund * 1.60) * 100 / 100;
      }
    } else if (
      ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == "bera" &&
      ctx.session.package.is_custom
    ) {
      totalFund =
        ctx.session.swapAmount *
        (3 * Math.floor(parseInt(product_json.txCountPerMin) / 3) || 3);
      totalFund = Math.ceil((totalFund * 10) / 70) * 10;

      if(product_json.txCountPerMin === 3) {
        totalFund = totalFund * 1.4;
      }
    }

    //console.log(totalFund);

    if ((ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() =='solana' && ctx.session.poolType != 2 && !ctx.session.package.is_jito) ||
      (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'solana' && ctx.session.package.is_holders) ||
      (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'solana' && ctx.session.poolType == 2) ||
      (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'base' && !ctx.session.package.is_custom && !ctx.session.package.is_trending) ||
      (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'sui' && !ctx.session.package.is_custom && !ctx.session.package.is_trending) ||
      (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() ==
        "bera" &&
        !ctx.session.package.is_custom &&
        !ctx.session.package.is_trending)) {

      await ctx.reply(
`In order to get started with the boost, send ${product_json.totalFund} ${ctx.session.chains[ctx.session.chainIndex].nativeToken} to wallet address:
      
<code>${ctx.session.boost.wallet_public_key}</code>
      
Then standby, while we validate payment.`,
        {
          parse_mode: "HTML",
        }
      );
    } else {
      await ctx.reply(
        `🔥 Send a <b><u>minimum of ${totalFund} ${ctx.session.chains[ctx.session.chainIndex].nativeToken}</u></b> to this deposit wallet address:\n\n<code>${ctx.session.boost.wallet_public_key}</code>\n\n<b>🚀 There is no limit on the amount of ${ctx.session.chains[ctx.session.chainIndex].nativeToken} you deposit, the more you add, the longer the bot will run. 🚀</b>\n\nAfter sending funds, standby while we validate payment and start the bot.`,
        {
          parse_mode: "HTML",
        }
      );
    }

    
    // ctx.session.paymentIntervalTimer = setInterval(async function () {
    //   ctx.session.paymentTime--;
    //   await paymentTimer(ctx, ctx.session.paymentTime);
    // }, 1000)


    waitForPayment(conversation, ctx, product_json);
  } catch (error) {
    console.log(error);
    await startMenu(ctx);
  }

}

async function askBoostList(conversation: MyConversation, ctx: MyContext) {
  try {
    const boostsKeyboard = new InlineKeyboard();

    const boosts = await getBoostsByBot(
      config.BOT_NAME, ctx.session.customer.id
    );

    if (boosts.length > 0) {
      for (let index = 0; index < boosts.length; index++) {
        const boost: any = boosts[index];
        boostsKeyboard
          .text(
            `Id: ${boost.id} (${boost.Packages.name} - ${boost.deposit_amount} ${config.RENT_CHAIN_SYMBOL}) ` + (boost?.pause == 0 ? '🟢 (Running)' : '🔴 (Paused)'),
            JSON.stringify({ type: "click-control-boost", data: boost.id })
          )
          .row();
      }
      await ctx.reply(`Resume/Pause boosts:`, {
        parse_mode: "HTML",
        reply_markup: boostsKeyboard,
      });
    } else {
      await ctx.reply(`You have no active boosts.`, {
        parse_mode: "HTML"
      });
    }
  } catch (error) {
    console.log(error);
    await startMenu(ctx);
  }
}

async function updateBoostPause(conversation: MyConversation, ctx: MyContext) {
  try {
    const boostsKeyboard = new InlineKeyboard();

    const res = await setPauseBoost(
      ctx.session.selectedBoost, ctx.session.customer.id
    );

    if (res.updateStatus == 1) {
      const boosts = await getBoostsByBot(
        config.BOT_NAME, ctx.session.customer.id
      );
      if (boosts.length > 0) {
        for (let index = 0; index < boosts.length; index++) {
          const boost: any = boosts[index];
          boostsKeyboard
            .text(
              `Boost Id: ${boost.id} ` + (boost?.pause == 0 ? '🟢 (Running)' : '🔴 (Paused)'),
              JSON.stringify({ type: "click-control-boost", data: boost.id })
            )
            .row();
        }
        await ctx.editMessageText(`Resume/Pause boosts:`, {
          parse_mode: "HTML",
          reply_markup: boostsKeyboard,
        });
      } else {
        await ctx.editMessageText(`You have no active boosts.`, {
          parse_mode: "HTML"
        });
      }
    }

  } catch (error) {
    console.log(error);
    await startMenu(ctx);
  }
}

const waitForPayment = async (
  conversation: MyConversation,
  ctx: MyContext,
  product_json: any
) => {


  let payment_received: boolean;
  while (true) {
    if (!ctx.session.boost) {
      console.log("session initialized");
      return;
    }
    const boost = await getBoost(ctx.session.boost.id);
    if (boost.payment_status != 0) {
      payment_received = boost.payment_status == 1 ? true : false;
      break;
    }
    await conversation.sleep(30 * 1000);
  }

  if (payment_received) {
    await ctx.reply("Payment received.");
    console.log("Payment received.");
    clearInterval(ctx.session.paymentIntervalTimer);
    try {
      await sendTitanChannelBuyAlert(ctx);
    } catch (e) {
      console.log("failed to send alert " + e);
    }

    await ctx.reply(
      `Starting bot for token:\n\n<code>${ctx.session.token}</code>\n\nID: ${ctx.session.boost.id}`,
      {
        parse_mode: "HTML",
      }
    );

    /*
    await conversation.sleep(product_json.totalDay * 24 * 60 * 60 * 1000);

    let boost_status = 0;
    while (true) {
      if (!ctx.session.boost) {
        console.log("session initialized");
        return;
      }

      const boost = await getBoost(ctx.session.boost.id);

      if (boost.boost_status != 0) {
        boost_status = boost.boost_status;
        break;
      }
      await conversation.sleep(60 * 1000);
    }
    await ctx.reply(`Boost ${ctx.session.boost.id} successfully finished`);
    */
  }
  // else {
  //     await ctx.reply(
  //       `Session Expired for your ${ctx.session.package.name} package bot for ${ctx.session.token}!

  // Please start the bot again. Do not send SOL before starting the bot again.`
  //     );
  //   }
};


async function validateTokenFunction(conversation: MyConversation, ctx: MyContext) {
  try {

    await ctx.reply(
      `We are validating this token on ${ctx.session.selectedDex}.`
    );
    console.log("ctx.session.quoteToken");
    console.log(ctx.session.quoteToken);
    const exists = await poolExists(
      ctx.session.token,
      ctx.session.chains[ctx.session.chainIndex].id,
      ctx.session.poolType,
      ctx.session.pairAddress,
      ctx.session.quoteToken
    );

    if (exists) {
      await ctx.reply("Validation complete.");

      try {
        await dexscreenerTokenInfo(ctx);
      } catch (error) {
        //need to log to database
        console.log(error);
      }

      const modesKeyboard = new InlineKeyboard();

      if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'solana') {
        modesKeyboard
          .text(
            `Organic`,
            JSON.stringify({ type: "click-volume-mode", data: 0 })
          )
          .text(
            `Performance`,
            JSON.stringify({ type: "click-volume-mode", data: 1 })
          )
          .row()
          .text(
            `Rank bot`,
            JSON.stringify({ type: "click-volume-mode", data: 2 })
          )
          .text(
            `Holder boost`,
            JSON.stringify({ type: "click-volume-mode", data: 5 })
          )
          .row()
      } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'sui') {
        modesKeyboard
          .text(
            `Volume`,
            JSON.stringify({ type: "click-volume-mode", data: 3 })
          )
          .row()
          .text(
            `Rank bot`,
            JSON.stringify({ type: "click-volume-mode", data: 4 })
          )
          .row()
          .text(
            `Holder boost`,
            JSON.stringify({ type: "click-volume-mode", data: 5 })
          )
          .row()
      } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'bsc') {
        modesKeyboard
          .text(
            `Volume`,
            JSON.stringify({ type: "click-volume-mode", data: 3 })
          )
          .row()
          .text(
            `Rank bot`,
            JSON.stringify({ type: "click-volume-mode", data: 4 })
          )
          .row()
          // .text(
          //   `Holder boost`,
          //   JSON.stringify({ type: "click-volume-mode", data: 5 })
          // )
          // .row()
      } else if (
        ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == "bera"
      ) {
        modesKeyboard
          .text(
            `Organic`,
            JSON.stringify({ type: "click-volume-mode", data: 0 })
          )
          .text(
            `Volume`,
            JSON.stringify({ type: "click-volume-mode", data: 3 })
          )
          .row()
          // .text(
          //   `Rank bot`,
          //   JSON.stringify({ type: "click-volume-mode", data: 4 })
          // )
          // .row()
          // .text(
          //   `Holder boost`,
          //   JSON.stringify({ type: "click-volume-mode", data: 5 })
          // )
          // .row()
          // .row();
      } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'avax') {
        modesKeyboard
          // .text(
          //   `Volume`,
          //   JSON.stringify({ type: "click-volume-mode", data: 3 })
          // )
          // .row()
          .text(
            `Rank bot`,
            JSON.stringify({ type: "click-volume-mode", data: 4 })
          )
          .row()
          // .text(
          //   `Holder boost`,
          //   JSON.stringify({ type: "click-volume-mode", data: 5 })
          // )
          // .row()
      } else {
        modesKeyboard
          .text(
            `Volume`,
            JSON.stringify({ type: "click-volume-mode", data: 0 })
          )
          .text(
            `Custom Volume`,
            JSON.stringify({ type: "click-volume-mode", data: 3 })
          )
          .row()
          .text(
            `Rank bot`,
            JSON.stringify({ type: "click-volume-mode", data: 4 })
          )
          .row()
      }

      modesKeyboard.text(
        `Main Menu`,
        JSON.stringify({ type: "click-return-main", data: true })
      )

      if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === "solana") {
        await ctx.reply(
          `Select mode from the options below:\n\n➡️ Organic: Preset package configurations without Jito bundles\n\n➡️ Performance: Dynamic package configurations you choose.  Transactions occur in a Jito bundle of 3. 2 varying buys and 1 sell equaling the buys.  These are executed as Jito bundles which help preserve fuel by lessening price impact.\n\n➡️ Rank bot: Boost your metrics to help improve your Dexscreener ranking.\n\n➡️ Holder bot: Generates ~500 new holders for 1 SOL.\n\nKeep in mind some key elements that influence the effectiveness of your boost:\n\n💧 Liquidity: The availability of assets for trading affects how well your boost can perform.\n\n📈 Token Price Movement: Both the starting and ending prices of the token play a role in the outcome of your boost.`,
          {
            parse_mode: "HTML",
            reply_markup: modesKeyboard,
          }
        );
      } else if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === "bera") {
        await ctx.reply(
          `Select mode from the options below:\n\n➡️ Organic: Preset package configurations for natural trading patterns and volume.\n\n➡️ Custom Volume: Tailor your boost by selecting your preferred input, and the bot will provide you with the minimum deposit amount required to begin. This initial deposit will fuel your boost for the minimum time. For extended operation, simply increase your deposit beyond the minimum. The more funds you add, the longer the package will operate.\n\n➡️ Rank Bot: Boost your metrics to help improve your Dexscreener ranking with automated buy and sell transactions.\n\nKeep in mind some key elements that influence the effectiveness of your boost:\n\n💧 Liquidity: The availability of assets for trading affects how well your boost can perform.\n\n📈 Token Price Movement: Both the starting and ending prices of the token play a role in the outcome of your boost.`,
          {
            parse_mode: "HTML",
            reply_markup: modesKeyboard,
          }
        );
      } else {
        await ctx.reply(
          `➡️ Volume: Preset package configurations\n\n➡️ Custom Volume: Tailor your boost by selecting your preferred input, and the bot will provide you with the minimum deposit amount required to begin. This initial deposit will fuel your boost for the minimum time. For extended operation, simply increase your deposit beyond the minimum. The more funds you add, the longer the package will operate.\n\n➡️ Rank bot: Boost your metrics to help improve your Dexscreener ranking.  Buy only rank bot increases your holder account.\n\nKeep in mind some key elements that influence the effectiveness of your boost:\n\n💧 Liquidity: The availability of assets for trading affects how well your boost can perform.\n\n📈 Token Price Movement: Both the starting and ending prices of the token play a role in the outcome of your boost.`,
          {
            parse_mode: "HTML",
            reply_markup: modesKeyboard,
          }
        );
      }
    } else {
      await ctx.reply(`No pair found for:\n\n${ctx.session.token}`, {
        parse_mode: "HTML",
      });

      // Did not find anything, we can try another CA
      await ctx.conversation.exit("askForTokenJito");
      await ctx.conversation.enter("askForTokenJito");
    }

  } catch (error) {
    console.log(error);
    await startMenu(ctx);
  }
}

bot.on("callback_query:data", async (ctx) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data);
  switch (callbackData.type) {
    case "click-refer":
      await ctx.conversation.exit("startBot");
      await ctx.conversation.enter("referral");
      break;
  case "click-choose-rental":
        await ctx.conversation.exit("startBot");
        await ctx.conversation.enter("rental");
        break;
    case "change-ref-wallet":
      ctx.session.changeRefWalletChainIndex = callbackData.data;
      await ctx.conversation.enter("changeRefWallet");
      break;
    case "click-package":
      ctx.session.package = ctx.session.allPackages[callbackData.data];
      if (ctx.session.poolType == 2) {
        await ctx.conversation.enter("acquireProduct");
      } else {
        if (
          (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'bsc' && ctx.session.package.is_custom) ||
          (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'sui' && ctx.session.package.is_custom) ||
          (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'base' && ctx.session.package.is_custom) ||
          (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'solana' && ctx.session.package.is_jito && !ctx.session.package.is_trending && !ctx.session.package.is_holders) || 
          (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == "bera" && ctx.session.package.is_custom)
        ) {
          await ctx.conversation.enter("askForSwapAmount");
        } else {
          await ctx.conversation.enter("acquireProduct");
        }
      }


      break;
    case "swap-amounts":
      ctx.session.swapAmount = ctx.session.swapAmounts[callbackData.data];
      await ctx.conversation.enter("acquireProduct");
      break;
    case "click-return-main":
      const customer = ctx.session.customer;
      ctx.session = initial();
      ctx.session.chains = await getChains();
      await ctx.conversation.exit("startBot");
      await ctx.conversation.enter("startBot");
      ctx.session.customer = customer;
      break;
    case "click-volume-mode":
      ctx.session.volumeMode = callbackData.data;
      await ctx.conversation.enter("askForPackages");
      break;
    case "click-pairAddress":
      console.log("click-pairAddress")
      ctx.session.pairAddress = ctx.session.tokenInfo.pairs[callbackData.data].pairAddress;
      ctx.session.quoteToken = ctx.session.tokenInfo.pairs[callbackData.data].quoteToken.address;
      await ctx.conversation.enter("validateTokenFunction");
        break;
    case "click-chaintype":
      console.log("click-chaintype");
      if (config.IS_RENT) {
        const checkResData = await checkRent(ctx.session.customer.id, config.BOT_NAME);
        if (checkResData.status == 1) {
          await ctx.replyWithVideo(
            new InputFile({
              url: `${config.BOT_VIDEO_URL}`,
            }),
            {
              caption: 'This bot is not currently active, please reach out to your support contacts.',
              parse_mode: "HTML"
            });
          return;
        }
      }

      ctx.session.chainIndex = callbackData.data;
      if (ctx.session.chainIndex === 100) {
        ctx.session.chainIndex = 0; //change to Solana.  100 is pumpfun
        ctx.session.poolType = 2;
        ctx.session.selectedDex = "Pump.fun";
        await ctx.conversation.enter("askForToken");
    } else if (!config.IS_RENT && (ctx.session.chains[ctx.session.chainIndex] !== undefined) &&
      (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'solana' ||
        ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'bsc' ||
        ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'base' ||
        ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'sui' ||
        ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'bera' ||
        ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'avax')
    ) {
      await ctx.conversation.enter("askForPoolType");
    } else if (config.IS_RENT) {
      ctx.session.poolType = Number(config.RENT_POOL_ID);

      const poolTypes = await getPoolTypes(
        ctx.session.chains[ctx.session.chainIndex].id
      );

      ctx.session.dexes = poolTypes;
      const selectedDex = ctx.session.dexes.find((dex: Dex) => dex.id === ctx.session.poolType);

      if (selectedDex) {
        ctx.session.selectedDex = selectedDex.name;
        ctx.session.selectedDexVersion = selectedDex.param_text;
      }

      if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'solana' && ctx.session.poolType == 2) {
        await ctx.conversation.enter("askForToken");
      } else {
        await ctx.conversation.enter("askForTokenJito");
      }
    } else {
      await ctx.conversation.enter("askForToken");
    }

      break;
    case "click-pooltype":
      ctx.session.poolType = callbackData.data;

      const selectedDex = ctx.session.dexes.find((dex: Dex) => dex.id === ctx.session.poolType);

      if (selectedDex) {
        ctx.session.selectedDex = selectedDex.name;
        ctx.session.selectedDexVersion = selectedDex.param_text;
      }

      if (ctx.session.poolType == 3) {
        await ctx.reply(
          "Please be aware of Meteora pools that contain LP rewards that have added fees as these can reduce the bots performance substantially."
        );
      }
      await ctx.conversation.exit("askForPoolType");
      if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() == 'solana' && ctx.session.poolType == 2) {
        await ctx.conversation.enter("askForToken");
      } else {
        await ctx.conversation.enter("askForTokenJito");
      }

      break;
    case "click-boosts":
      await ctx.conversation.enter("askBoostList");
      break;
    case "click-control-boost":
      ctx.session.selectedBoost = callbackData.data;
      await ctx.conversation.enter("updateBoostPause");
      break;
    default:
      await ctx.answerCallbackQuery("Unknown option");
      await ctx.reply("This option is not recognized.");
      break;
  }
});

// Wait for click events with specific callback data.
bot.command("click-cancel", async (ctx) => {
  await replyWithMain(ctx, undefined);
});

bot.catch(async (err) => {
  console.log(err);
  const ctx = err.ctx;

  console.error(`Error while handling update ${ctx.update.update_id}:`);

  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram: or Backend", e);
  } else {
    console.error("Unknown error:", e);
  }

  try {
    await ctx.reply(`Please /start a new session.`, {
      parse_mode: "HTML"
    });
  } catch (e) {
    console.error("New session error:", e);
  }
});

bot.api.setMyCommands([{ command: "start", description: "Start the bot" }]);

// Start the bot.
bot.start();

export const asyncTimeout = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

async function dexscreenerTokenInfo(ctx: MyContext) {
  if (ctx.session.tokenInfo) {

    if (ctx.session.selectedDex.toLowerCase() === "turbos") {
      ctx.session.selectedDex = "turbos-finance";
    }

    let tokenInfo;
    if(ctx.session.pairAddress) {
      tokenInfo = ctx.session.tokenInfo.pairs.find((element: any) => element.pairAddress === ctx.session.pairAddress);
    } else {
      tokenInfo = ctx.session.tokenInfo.pairs[0];
    }

    ctx.session.tokenInfo = tokenInfo;
    ctx.session.ticker = tokenInfo.baseToken.symbol;

    await ctx.reply(
      `Token information:\n\n` +
      `✅ Ticker: ` +
      tokenInfo.baseToken.symbol +
      "\n" +
      `✅ Name: ` +
      tokenInfo.baseToken.name +
      "\n" +
      `✅ Dex: ` +
      ctx.session.selectedDex.toUpperCase() +
      "\n" +
      `✅ Market cap: $` +
      tokenInfo.marketCap.toFixed(2).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") +
      "\n" +
      `✅ Price: $` +
      tokenInfo.priceNative +
      "\n" +
      `✅ Volume 24hr: $` +
      tokenInfo.volume.h24.toFixed(2).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") +
      "\n" +
      `✅ Liquidity: $` +
      tokenInfo.liquidity.usd.toFixed(2).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") +
      "\n" +
      `✅ Pair: ` +
      tokenInfo.pairAddress + "\n",
      {
        parse_mode: "HTML",
      }
    );
  }
}

async function sendTitanChannelBuyAlert(ctx: MyContext) {
  const chatId = config.ALERT_CHAT_ID;

  // Id of the alert channe -1002263292789
  let url = "";
  let dexscreenerUrl = "https://dexscreener.com/";
  if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === "solana") {
    url = dexscreenerUrl + "solana/" + ctx.session.token;
  }

  if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === "sui") {
    url = dexscreenerUrl + "sui/" + ctx.session.token;
  }

  if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === "base") {
    url = dexscreenerUrl + "base/" + ctx.session.token;
  }

  if (ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === "avax") {
    url = dexscreenerUrl + "avax/" + ctx.session.token;
  }

  if (
    ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === "bera"
  ) {
    url = dexscreenerUrl + "berachain/" + ctx.session.token;
  }

  if (
    ctx.session.chains[ctx.session.chainIndex].name.toLowerCase() === "bsc"
  ) {
    url = dexscreenerUrl + "bsc/" + ctx.session.token;
  }


  if (ctx.session.selectedDex === "Pump.fun") {
    url = "\n\nhttps://pump.fun/coin/" + ctx.session.token;

    url = url + "\n\nhttps://photon-sol.tinyastro.io/en/lp/" + ctx.session.token;
  }

  let text = `🚀 New Buy 🚀\n\n<code>${ctx.session.token}</code>\n\nBoost information:\n` +
    `🧪 Bot name: ${config.BOT_DISPLAY_NAME}\n` +
    `🧪 Boost Id: ${ctx.session.boost.id}\n` +
    `🧪 Chain: ${ctx.session.chains[ctx.session.chainIndex].name}\n` +
    `🧪 Dex: ${ctx.session.selectedDex}\n` +
    `🧪 Package: ${ctx.session.package.name}\n`;

  if (ctx.session.tokenInfo !== undefined && ctx.session.tokenInfo.baseToken !== undefined) {
    text = text + `\n\nToken information:\n` +
      `🧪 Ticker: ` +
      ctx.session.tokenInfo.baseToken.symbol +
      "\n" +
      `🧪 Name: ` +
      ctx.session.tokenInfo.baseToken.name +
      "\n" +
      `🧪 Dex: ` +
      ctx.session.selectedDex.toUpperCase() +
      "\n" +
      `🧪 Market cap: $` +
      ctx.session.tokenInfo.marketCap +
      "\n" +
      `🧪 Price: $` +
      ctx.session.tokenInfo.priceNative +
      "\n" +
      `🧪 Volume 24hr: $` +
      ctx.session.tokenInfo.volume.h24.toFixed(2) +
      "\n" +
      `🧪 Liquidity: $` +
      ctx.session.tokenInfo.liquidity.usd.toFixed(2).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") + "\n\n";
  }

  text = text + `${url}\n\n`;

  const payload = {
    "chat_id": chatId, //Production -1002263292789,
    "text": `${text}`,
    "parse_mode": "HTML",
    "disable_notification": false
  }

  const response = await fetch(`https://api.telegram.org/bot${config.BOT_TOKEN}/sendMessage`, {
    // learn more about this API here: https://graphql-pokemon2.vercel.app/
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const res = await response.json()
}

async function startMenu(ctx: MyContext) {
  const customer = ctx.session.customer;
  ctx.session = initial();
  clearInterval(ctx.session.paymentIntervalTimer);
  ctx.session.chains = await getChains();

  console.log("startMenu");
  console.log(ctx.conversation);

  await ctx.conversation.exit("startBot");
  await ctx.conversation.enter("startBot");
  ctx.session.customer = customer;
}

// async function paymentTimer(ctx: MyContext, seconds: number) {
//   if(seconds == 0) {
//      await ctx.reply(`Session expired.`);
//     clearInterval(ctx.session.paymentIntervalTimer);
//     startMenu(ctx);
//   }
// }

function formatTime(seconds: number) {
  // Ensure input is a valid number
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  // Calculate minutes and remaining seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Format minutes and seconds as two digits
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}