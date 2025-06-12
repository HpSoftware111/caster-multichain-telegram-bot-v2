import axios from "axios";
import { config } from "../config";
import axiosRetry from 'axios-retry';

export const createBoost = async (
  customer_id: number,
  package_id: number,
  token: string,
  refCode: string,
  chainId: number,
  botName: string,
  poolTypeId: number,
  swapAmount: number,
  poolAddress: string
) => {
  try {
    console.log(`Creating boost with refcode ${refCode} for token ${token}`);
    axiosRetry(axios, { retries: 3 });
    const res = await axios.post(`${config.BACKEND_URL}/createBoost`, {
      customerId: customer_id,
      packageId: package_id,
      token,
      refCode,
      chainId,
      botName,
      poolTypeId,
      swapAmount,
      poolAddress
    });
    if (res.status == 200) {
      return res.data;
    } else {
      console.log(res.data.error);
    }
  } catch (error) {
    // Handle errors
    console.log(error);
  }
  return false;
};
