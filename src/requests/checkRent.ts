import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const checkRent = async (customer_id: number, botName: string) => {
  try {
    console.log("request /checkRent");
    axiosRetry(axios, { retries: 3 });
    const res = await axios.get(`${config.BACKEND_URL}/checkRent`, {
      data: {  botName  },
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
