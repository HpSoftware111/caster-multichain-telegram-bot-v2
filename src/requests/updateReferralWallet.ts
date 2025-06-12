import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const updateReferralWallet = async (
  customer_id: number,
  wallet: string,
  chainId: number
) => {
  try {
    console.log("request /updateReferralWallet");
    axiosRetry(axios, { retries: 3 });
    const res = await axios.post(`${config.BACKEND_URL}/updateReferralWallet`, {
      customerId: customer_id,
      wallet,
      chainId
    });
    if (res.status == 200) {
      return res.data;
    } else {
      console.log(res.data.error);
    }
  } catch (error) {
    // Handle errors
    console.log(error);
  }
  return {};
};
