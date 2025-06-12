import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const getPackages = async (chainId: number, poolTypeId: number, volumeMode: number) => {
  try {
    console.log("request /packages");
    axiosRetry(axios, { retries: 3 });
    const res = await axios.get(`${config.BACKEND_URL}/packages`, {
      data: { chainId: chainId, poolTypeId: poolTypeId, volumeMode: volumeMode }, 
    });
    if (res.status == 200) {
      return res.data.packages;
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
