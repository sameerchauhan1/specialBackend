import express from "express";
import zod from "zod";
import { PrismaClient } from "../db/node_modules/@prisma/client/index.js";

import { JWT_SECRET } from "../config.js";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware.js";

const prisma = new PrismaClient();
const router = express.Router();

const signupSchema = zod.object({
   username: zod.string(),
   firstName: zod.string(),
   lastName: zod.string(),
   password: zod.string(),
});
router.post("/signup", async (req, res) => {
   const { success } = signupSchema.safeParse(req.body);

   if (!success) {
      res.status(400).json({ message: "Invalid data" });
   }

   const existingUser = await prisma.user.findUnique({
      where: {
         username: req.body.username,
      },
   });

   if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return; // Exit early to avoid proceeding with user creation
   }

   const { username, firstName, lastName, password } = req.body; // Destructure variables from req.body

   const user = await prisma.user.create({
      data: {
         username,
         firstName,
         lastName,
         password,
      },
   });

   const userId = user.id;

   await prisma.account.create({
      data: {
         userId, // Assuming userId is the correct field name in the Account model
         balance: 1 + Math.random() * 10000,
      },
   });

   const token = jwt.sign(userId, JWT_SECRET);

   res.json({
      message: "User created successfully",
      token: token,
   });
});

const signinSchema = zod.object({
   username: zod.string(),
   password: zod.string(),
});

router.post("/signin", async (req, res) => {
   const { success } = signinSchema.safeParse(req.body);

   if (!success) {
      res.json({
         message: "Incorrect Inputs",
      });
   }

   const user = await prisma.user.findUnique({
      where: {
         username: req.body.username,
         password: req.body.password,
      },
   });

   if (!user) {
      res.status(411).json({
         message: "User does not exist, Signup to create one",
      });
   }

   const token = jwt.sign(user.id, JWT_SECRET);
   res.json({
      message: "User logged in successfully",
      token: token,
   });
});

const updateBody = zod.object({
   password: zod.string(),
   firstName: zod.string(),
   lastName: zod.string(),
});

router.put("/", authMiddleware, async (req, res) => {
   const { success } = updateBody.safeParse(req.body);

   if (!success) {
      res.json({
         message: "Invalid Inputs",
      });
   }

   await prisma.user.update({
      where: {
         id,
      },
      data: {
         password,
         firstName,
         lastName,
      },
   });

   res.json({
      message: "User updated successfully",
   });
});

router.get("/bulk", async (req, res) => {
   try {
      const filter = req.query.filter || "";

      // Assuming you have a Prisma model named User
      const users = await prisma.user.findMany({
         where: {
            OR: [
               { firstName: { contains: filter } },
               { lastName: { contains: filter } },
            ],
         },
      });

      // Map the retrieved users to the desired format
      const mappedUsers = users.map((user) => ({
         username: user.username,
         firstName: user.firstName,
         lastName: user.lastName,
         _id: user.id, // Assuming your user ID field is named 'id'
      }));

      res.json({ users: mappedUsers });
   } catch (error) {
      console.error("Error retrieving users:", error);
      res.status(500).json({ message: "Internal Server Error" });
   }
});

export { router as userRouter };
