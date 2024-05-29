import express from "express";

import cors from "cors";
import { mainRouter } from "./routes/index.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/v1", mainRouter);

app.get("/", (req, res) => {
   res.send("Hello World");
});

app.listen(3000);
