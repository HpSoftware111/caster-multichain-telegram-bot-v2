import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const validateToken = async (token: string, chainId: number, poolTypeId: number) => {
  try {
    console.log("request /validateToken");
    axiosRetry(axios, { retries: 3 });
    const res = await axios.get(`${config.BACKEND_URL}/validateToken`, {
      data: { tokenAddress: token, chainId: chainId, poolTypeId: poolTypeId },
    });
    if (res.status == 200) {
      return res.data.isValidateToken;
    } else {
      console.log(res.data.error);
    }
  } catch (error) {
    // Handle errors
    console.log(error);
  }
  return false;
};
