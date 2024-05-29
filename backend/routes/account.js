// backend/routes/account.js
import express from "express";

import { PrismaClient } from "../db/node_modules/@prisma/client/index.js";
import { authMiddleware } from "../middleware.js";

const prisma = new PrismaClient();

const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
   try {
      const account = await prisma.account.findUnique({
         where: {
            userId: req.userId,
         },
      });

      res.json({
         balance: account.balance,
      });
   } catch (error) {
      console.error("Error fetching account balance:", error);
      res.status(500).json({ message: "Internal Server Error" });
   }
});

async function transfer(req) {
   try {
      const { amount, to } = req.body;

      // Fetch the accounts
      const account = await prisma.account.findUnique({
         where: {
            userId: req.userId,
         },
      });

      if (!account || account.balance < amount) {
         console.log("Insufficient balance");
         return;
      }

      const toAccount = await prisma.account.findUnique({
         where: {
            userId: to,
         },
      });

      if (!toAccount) {
         console.log("Invalid account");
         return;
      }

      // Perform the transfer
      await prisma.$transaction([
         prisma.account.update({
            where: { userId: req.userId },
            data: { balance: { decrement: amount } },
         }),
         prisma.account.update({
            where: { userId: to },
            data: { balance: { increment: amount } },
         }),
      ]);

      console.log("Transfer successful");
   } catch (error) {
      console.error("Error performing transfer:", error);
   }
}

// Usage example:
transfer({
   userId: "65ac44e10ab2ec750ca666a5",
   body: {
      to: "65ac44e40ab2ec750ca666aa",
      amount: 100,
   },
});

transfer({
   userId: "65ac44e10ab2ec750ca666a5",
   body: {
      to: "65ac44e40ab2ec750ca666aa",
      amount: 100,
   },
});

export { router as accountRouter };
