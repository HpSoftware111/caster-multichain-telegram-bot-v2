import axios from "axios";
import { config } from "../config";
import { Customer } from "../../types/types";
import axiosRetry from 'axios-retry';

export const getCustomerById = async (customerId: number) => {
  try {
    axiosRetry(axios, { retries: 3 });
    console.log("request /getCustomerById");
    const res = await axios.get<any>(`${config.BACKEND_URL}/getCustomerById`, {
      data: { customerId },
    });
    if (res.status == 200) {
      return res.data.customer;
    }
  } catch (error) {
    // Handle errors
    console.log(error);
    return null;
  }
};