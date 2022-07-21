import nodemailer from "nodemailer";

export const generateOTP = (otp_length = 6) => {
  // generate 6 digit otp
  let OTP = "";
  for (let index = 0; index < otp_length; index++) {
    const randomVal = Math.round(Math.random() * 9);
    OTP += randomVal;
  }

  return OTP;
};

export const generateMailTransporter = () => {
  nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "b61f69d375146e",
      pass: "6cff3def014db8",
    },
  });
};
