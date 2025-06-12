import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const getChains = async () => {
  try {
    console.log("request /getChains");
    axiosRetry(axios, { retries: 3 });
    const res = await axios.get(`${config.BACKEND_URL}/getChains`, {
    });
    if (res.status == 200) {
      return res.data.chains;
    } else {
      //should log this to the database
      console.log(res);
    }
  } catch (error) {
    // Handle errors
    console.log(error);
  }
  return [];
};
