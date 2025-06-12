import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const getPoolTypes = async (chainId: number) => {
  try {
    console.log("request /getPoolTypes");
    axiosRetry(axios, { retries: 3 });
    const res = await axios.get(`${config.BACKEND_URL}/getPoolTypes`, {
      data: { chainId: chainId }, 
    });
    if (res.status == 200) {
      return res.data.dexes;
    } else {
      //should log this to the database
      console.log(res.data.error);
    }
  } catch (error) {
    // Handle errors
    console.log(error);
  }
  return [];
};
