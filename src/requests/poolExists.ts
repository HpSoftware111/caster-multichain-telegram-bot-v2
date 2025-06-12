import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const poolExists = async (token: string, chainId: number, poolTypeId: number, poolAddress: string, quoteToken?: string) => {
  try {
    console.log("request /poolExists");
    axiosRetry(axios, { retries: 3 });
    const res = await axios.get(`${config.BACKEND_URL}/poolExists`, {
      data: { tokenAddress: token, chainId: chainId, poolTypeId: poolTypeId, poolAddress, quoteToken: quoteToken },
    });
    if (res.status == 200) {
      return res.data.poolExists;
    } else {
      console.log(res.data.error);
    }
  } catch (error) {
    // Handle errors
    console.log(error);
  }
  return false;
};
