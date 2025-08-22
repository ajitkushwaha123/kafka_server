import express from "express";
import dotenv from "dotenv";
import { producer } from "./kafka.js";
import eventRouter from "./routes/events.route.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const connectToKafka = async () => {
  try {
    await producer.connect();
    console.log("✅ Successfully connected to Kafka producer.");
  } catch (error) {
    console.error("❌ Error connecting to Kafka:", error);
    process.exit(1);
  }
};

const app = express();
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    kafkaConnection: producer ? "connected" : "disconnected",
  });
});

app.use("/api/events", eventRouter);

(async () => {
  await connectToKafka();
  app.listen(PORT, () => {
    console.log(`🚀 Foodsnap event server running at http://localhost:${PORT}`);
  });
})();

process.on("SIGINT", async () => {
  console.log("🛑 Shutting down gracefully...");
  try {
    await producer.disconnect();
  } catch (err) {
    console.error("Error while disconnecting producer:", err);
  }
  process.exit(0);
});
