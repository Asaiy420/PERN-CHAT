import { Request, Response } from "express";
import bcryptjs from "bcryptjs";
import prisma from "../db/prisma.js";
import generateToken from "../utils/generateToken.js";

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, username, password, confirmPassword, gender } = req.body;

    // Validate all required fields
    if (!fullName || !username || !password || !confirmPassword || !gender) {
      res
        .status(400)
        .json({ error: "Please fill all the fields provided above" });
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match" });
      return;
    }

    // Check if username already exists
    const user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      res.status(400).json({ error: "Username already exists" });
      return;
    }

    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Set profile picture based on gender
    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

    const newUser = await prisma.user.create({
      data: {
        fullName,
        username,
        password: hashedPassword,
        gender,
        profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
      },
    });
    if (newUser) {
      //generate token
      generateToken(newUser.id, res);
      res.status(201).json({
        id: newUser.id,
        fullName: newUser.fullName,
        username: newUser.username,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ error: "Invalid User Data" });
    }
  } catch (error: any) {
    console.log("Error when creating a user", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      res.status(400).json({ error: "Invalid Credentials!" });
      return;
    }

    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (!isPasswordCorrect) {
      res.status(400).json({ error: "Invalid Credentials!" });
      return;
    }
    //generate the token
    generateToken(user.id, res);

    res.status(200).json({
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic,
    });

  } catch (error: any) {
    console.log("Error when logging the user", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.cookie("jwt", "", {maxAge: 0});
    res.status(200).json({message: "Logged out sucessfully!"})
  } catch (error:any) {
    console.log("Error when logging out", error.message);
    res.status(500).json({error: "Internal Server Error"})
  }
};
