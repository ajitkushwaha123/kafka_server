import dotenv from "dotenv";
import { Kafka, logLevel } from "kafkajs";

dotenv.config();

if (
  !process.env.KAFKA_BROKERS ||
  !process.env.KAFKA_USERNAME ||
  !process.env.KAFKA_PASSWORD
) {
  console.error(
    "❌ Missing Kafka configuration in .env (KAFKA_BROKERS, KAFKA_USERNAME, KAFKA_PASSWORD required)"
  );
  process.exit(1);
}

const KAFKA_BROKERS = process.env.KAFKA_BROKERS.split(",").map((b) => b.trim());
const KAFKA_USERNAME = process.env.KAFKA_USERNAME;
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD;

const kafka = new Kafka({
  clientId: "foodsnap-producer",
  brokers: KAFKA_BROKERS,
  logLevel: logLevel.INFO,
  ssl: {
    rejectUnauthorized: false,
  },
  sasl: {
    mechanism: "scram-sha-256",
    username: KAFKA_USERNAME,
    password: KAFKA_PASSWORD,
  },
});

const producer = kafka.producer();


export { kafka, producer };
