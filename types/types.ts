export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Chain = {
  id: number;
  name: string;
  nativeToken: string;
};

export type Customer = {
  base_referral_wallet: string | null;
  bnb_referral_wallet: string | null;
  created_at: string;
  has_affiliate: boolean | null;
  id: number;
  is_affiliate: boolean | null;
  referral_code: string | null;
  referrer_customer_id: number | null;
  sol_referral_wallet: string | null;
  telegram_id: string;
};

export type Dex = {
  id: number;
  name: string;
  param_text: string;
  chain_id: number;
  is_active: boolean;
}

export type Package = {
  chain_id: number;
  created_at: string;
  id: number;
  is_pubic: boolean;
  name: string;
  order: number;
  poolType: number;
  product_json: Json;
  is_trending: boolean;
  is_jito: boolean;
  is_custom: boolean;
  is_holders: boolean;
};

export type Boost = {
  ad_code: string | null;
  boost_status: number | null;
  bot_name: string | null;
  chain_id: number | null;
  created_at: string;
  customer_id: number;
  id: number;
  package_id: number;
  payment_status: number | null;
  token: string | null;
  wallet_private_key: string | null;
  wallet_public_key: string | null;
};

export type PoolType = {
  id: number,
  name: string,
  param_text: string
}