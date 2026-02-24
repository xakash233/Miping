import kafka from "./kafka.js";

const producer = kafka.producer();
let isConnected = false;

export const sendKafkaEvent = async (data) => {
  try {
    if (!isConnected) {
      await producer.connect();
      isConnected = true;
    }

    await producer.send({
      topic: "orders",
      messages: [{ value: JSON.stringify(data) }],
    });

    console.log("Kafka message sent");
  } catch (err) {
    console.error("Kafka error:", err);
  }
};
