import dotenv from "dotenv";
import mongoose from "mongoose";
import crypto from "crypto";
import { consumer } from "../kafka.js";
import Event from "../models/Event.js";
import { connectDB } from "../db/connect.js";
import EventType from "../models/EventType.js";

dotenv.config();

function safeISO(d) {
  const dt = d ? new Date(d) : new Date();
  if (isNaN(dt.getTime())) return new Date();
  return dt;
}

const runConsumer = async () => {
  await connectDB();
  while (true) {
    try {
      await consumer.connect();
      console.log("✅ Kafka consumer connected");

      await consumer.subscribe({
        topic: process.env.KAFKA_TOPIC,
        fromBeginning: true,
      });
      console.log(`✅ Subscribed to topic: ${process.env.KAFKA_TOPIC}`);

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const value = message.value?.toString();
          let data;

          try {
            data = JSON.parse(value);
          } catch (e) {
            data = value;
          }

          const { event } = data || {};
          if (!event) {
            console.warn("⚠️ Skipping: No 'event' field found");
            return;
          }

          let eventData;
          try {
            eventData =
              typeof event.value === "string"
                ? JSON.parse(event.value)
                : event.value;
          } catch (err) {
            console.error("❌ Failed to parse event.value:", err.message);
            return;
          }

          console.log("event ", eventData);

          const {
            typeKey,
            kind,
            userId = null,
            sessionId = null,
            anonymousId = null,
            tenantId = null,
            source = "backend", // "frontend" | "backend" | "worker" | "webhook"
            status = "info", // "success" | "failure" | "info" | "warn" | "error"
            severity = "low", // "low" | "medium" | "high"
            metadata = {},
            context = {},
            occurredAt = new Date().toISOString(),
            idempotencyKey,
          } = eventData || {};

          if (!typeKey) {
            console.error("❌ Skipping: typeKey required");
            return;
          }

          if (
            !kind ||
            ![
              "system",
              "auth",
              "billing",
              "validation",
              "support",
              "query",
            ].includes(kind)
          ) {
            console.error("❌ Skipping: Invalid kind value");
            return;
          }

          const et = await EventType.findOne({
            key: typeKey,
            isActive: true,
          }).lean();

          if (!et) {
            console.warn(
              `⚠️ Skipping event: Unknown or inactive event type: ${typeKey}`
            );
            return;
          }

          const idem =
            idempotencyKey ||
            crypto
              .createHash("sha256")
              .update(
                JSON.stringify({
                  typeKey,
                  userId,
                  sessionId,
                  anonymousId,
                  occurredAt,
                  sig:
                    metadata?.__sig ||
                    metadata?.id ||
                    JSON.stringify(metadata).slice(0, 200),
                })
              )
              .digest("hex");

          // --- Upsert Event ---
          const doc = await Event.findOneAndUpdate(
            { idempotencyKey: idem },
            {
              $setOnInsert: {
                idempotencyKey: idem,
                typeKey,
                kind,
                userId,
                sessionId,
                anonymousId,
                tenantId,
                source,
                status,
                severity,
                metadata,
                context,
                occurredAt: safeISO(occurredAt),
              },
            },
            { new: true, upsert: true }
          );

          console.log("✅ Event stored:", {
            id: doc._id,
            idempotencyKey: idem,
          });
        },
      });

      break; // exit retry loop if successful
    } catch (err) {
      console.error("❌ Kafka consumer error, retrying in 5s:", err.message);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("⚡ Disconnecting Kafka consumer...");
  await consumer.disconnect();
  await mongoose.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("⚡ Disconnecting Kafka consumer...");
  await consumer.disconnect();
  await mongoose.disconnect();
  process.exit(0);
});

runConsumer();
