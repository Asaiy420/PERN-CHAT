import jwt from "jsonwebtoken";
import { Response } from "express";
// import dotenv from "dotenv"

// dotenv.config();

const generateToken = (userId: string, res: Response) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: "15d",
  });
  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // In milliseconds
    httpOnly: true, // prevents XSS
    sameSite: "strict", // prevents CSRF Attacks
    secure: process.env.NODE_ENV !== "development", //currenty in HTTP but when in prod should be HTTPS
  });
  return token;
};
export default generateToken;
