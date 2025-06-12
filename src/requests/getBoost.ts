import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const getBoost = async (boostId: number) => {
  try {
    axiosRetry(axios, { retries: 3 });
    const res = await axios.get(`${config.BACKEND_URL}/boost`, {
      data: { boostId },
    });
    if (res.status == 200) {
      return res.data.boost;
    } else {
      console.log(res.data.error);
    }
  } catch (error) {
    // Handle errors
    console.log(error);
  }
  return {};
};
