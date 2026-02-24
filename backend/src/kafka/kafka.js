import { Kafka } from "kafkajs";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const kafka = new Kafka({
  clientId: "mern-backend",
  brokers: [process.env.KAFKA_BOOTSTRAP],
  ssl: {
    rejectUnauthorized: true,
    ca: [fs.readFileSync("/app/ca.pem", "utf-8")],
  },
  sasl: {
    mechanism: "plain",
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
});

export default kafka;
