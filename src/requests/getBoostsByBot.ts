import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const getBoostsByBot = async (botName: string, customer_id: number) => {
  try {
    axiosRetry(axios, { retries: 3 });
    const res = await axios.get(`${config.BACKEND_URL}/getBoostsByBot`, {
      data: { botName, customer_id },
    });
    if (res.status == 200) {
      return res.data.boosts;
    } else {
      console.log(res.data.error);
    }
  } catch (error) {
    // Handle errors
    console.log(error);
  }
  return {};
};
