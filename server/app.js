import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes.js";
import requestIp from "request-ip";
import taskRoutes from "./routes/task.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();
const port = 3030;

const MONGO_URL = `mongodb://mongodb-service:27017/taskmanager`;

//const MONGO_URL = `mongodb+srv://rehan985:Earthandworld.985@cluster0.pjusbnc.mongodb.net/taskmanager`;

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true); // Allow requests with no origin (like mobile apps or Postman)
    }
    callback(null, origin); // Allow the requesting origin
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};


app.use(cors(corsOptions));
app.use(express.json());
app.use(requestIp.mw());

app.use(taskRoutes);
app.use(userRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode;
  const message = error.messsage;
  const data = error.data;
  res
    .status(status || 500)
    .json({ message: message, data: data, error: "yes", errors: error });
});

mongoose
  .connect(MONGO_URL)
  .then(() => {
    app.listen(process.env.PORT || port, () => {
      console.log(`Server is running on port ${process.env.PORT || port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
