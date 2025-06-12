import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const getTokenInfo = async (contract: string) => {
  try {
    console.log("request /getTokenInfo");
    axiosRetry(axios, { retries: 3 });
    const res = await axios.get(`${config.TOKEN_INFO_URL}/${contract}`);
    
    if (res.status == 200) {
      return res.data;
    } else {
      return null;
    }
  } catch (error) {
    // Handle errors
    console.log(error);
    return null;
  }
}
