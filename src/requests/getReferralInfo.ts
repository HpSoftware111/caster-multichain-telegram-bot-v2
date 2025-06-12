import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const getReferralInfo = async (customerId: number) => {
  try {
    console.log("request /referralInfo");
    axiosRetry(axios, { retries: 3 });
    const res = await axios.get(`${config.BACKEND_URL}/referralInfo`, {
      data: { customerId },
    });
    if (res.status == 200) {
      return res.data.referralInfo;
    } else {
      console.log(res.data.error);
    }
  } catch (error) {
    // Handle errors
    console.log(error);
  }
  return {};
};
