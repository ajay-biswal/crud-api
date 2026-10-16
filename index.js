import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/db.js";
import userRouter from "./routes/user.routes.js";
import repositoryRouter from "./routes/repository.routes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "CodeForge API",
    message: "Source-control platform API is running.",
    version: "0.1.0",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/users", userRouter);
app.use("/api/repositories", repositoryRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, _req, res, _next) => {
  console.error("Unhandled request error:", error);
  res.status(500).json({ message: "Internal server error." });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`CodeForge API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start CodeForge API:", error);
    process.exit(1);
  }
};

startServer();
