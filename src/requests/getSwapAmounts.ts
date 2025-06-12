import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const getSwapAmounts = async (chainId: number, poolTypeId: number) => {
  try {
    console.log("request /getSwapAmounts");
    axiosRetry(axios, { retries: 3 });
    const res = await axios.get(`${config.BACKEND_URL}/getSwapAmounts`, {
      data: { chainId: chainId, poolTypeId: poolTypeId },
    });
    if (res.status == 200) {
      return res.data.swapAmounts;
    } else {
      console.log(res.data.error);
    }
  } catch (error) {
    // Handle errors
    console.log(error);
  }
  return false;
};
