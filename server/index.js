import express from "express";
import mongoose from "mongoose";
import { router } from "./routes/user.js";
import morgan from "morgan";
import dotenv from "dotenv";

// app config
dotenv.config();
const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use("/api", router);

app.use(async (err, req, res, next) => {
  console.log("err: ", err);
  res.status(500).json({ error: err });
});

/* app.post(
  "/sign-in",
  (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ error: "email/password missing!" });
    }
    next();
  },
  (req, res) => {
    res.send("<h1>Hello</h1>");
  }
);
 */

// DB Config
const PORT = process.env.PORT || 8000;
const CONNECTION_URL =
  "mongodb+srv://jackgumpel:price777@user.kfi9y.mongodb.net/?retryWrites=true&w=majority";

// Listener

mongoose
  .connect(CONNECTION_URL)
  .then(() =>
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`))
  )
  .catch((error) => console.log(error.message));
