import axios from "axios";
import { config } from "../config";
import { Customer } from "../../types/types";
import axiosRetry from 'axios-retry';

export const createCustomer = async (telegram_id: string, referrer_code: string, ad_code: string) => {
  try {
    console.log("request /createCustomer");
    axiosRetry(axios, { retries: 3 });
    const res = await axios.post(`${config.BACKEND_URL}/createCustomer`, {
      telegramId: telegram_id,
      referrer_code: referrer_code,
      ad_code: ad_code
    });

    if (res.status == 200) {
      return res.data;
    }else{
      console.log("createCustomer response", res)
    }
  } catch (error) {
    // Handle errors
    console.log(error);
  }
  return null;
};
