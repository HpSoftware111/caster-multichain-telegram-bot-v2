import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const setPauseBoost = async (boostId: number, customer_id: number) => {
  try {
    console.log("request /setPauseBoost");
    axiosRetry(axios, { retries: 3 });
    const res = await axios.get(`${config.BACKEND_URL}/setPauseBoost`, {
      data: {  boostId, customer_id },
    });
    if (res.status == 200) {
      console.log(res.data);
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
