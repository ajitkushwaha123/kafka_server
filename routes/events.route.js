import { Router } from "express";
import { producer } from "../kafka.js";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const eventRouter = Router();

const KAFKA_TOPIC = process.env.KAFKA_TOPIC;

eventRouter.get("/", (req, res) => {
  res.status(200).json({ message: "Event router is working!" });
});

eventRouter.post("/foodsnap", async (req, res) => {
  const event = req.body;
  if (!event || Object.keys(event).length === 0) {
    return res.status(400).json({ error: "Request body cannot be empty." });
  }

  const messageKey = crypto.randomUUID();

  try {
    await producer.send({
      topic: KAFKA_TOPIC,
      messages: [{ key: messageKey, value: JSON.stringify(event) }],
    });

    console.log(
      `✅ Message produced to topic '${KAFKA_TOPIC}' with key: ${messageKey}`
    );
    return res
      .status(200)
      .json({ message: "Event queued successfully.", eventId: messageKey });
  } catch (error) {
    console.error("❌ Error sending message to Kafka:", error);
    return res
      .status(500)
      .json({ error: "Failed to queue event.", details: error.message });
  }
});

export default eventRouter;
