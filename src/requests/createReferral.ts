// import axios from "axios";
// import { config } from "../config";

// export const createReferral = async (customer_id: number, refCode: string) => {
//   try {
//     console.log("request /createReferral");
//     const res = await axios.post(`${config.BACKEND_URL}/createReferral`, {
//       customerId: customer_id,
//       refCode,
//     });
//     if (res.status == 200) {
//       return res.data.referral;
//     } else {
//       console.log(res.data.error);
//     }
//   } catch (error) {
//     // Handle errors
//     console.log(error);
//   }
//   return false;
// };
