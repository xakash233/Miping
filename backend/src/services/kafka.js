const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'miping-whatsapp',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    retry: {
        initialRetryTime: 100,
        retries: 5
    }
});

const producer = kafka.producer();
const consumers = [];

async function connectProducer() {
    await producer.connect();
    console.log('Kafka Producer Connected 🚀');
}

/**
 * Sends a message to a topic with a specific key for partitioning
 */
async function sendToQueue(topic, key, payload) {
    try {
        await producer.send({
            topic,
            messages: [
                {
                    key: String(key), // Usually tenant_id
                    value: JSON.stringify(payload)
                }
            ]
        });
    } catch (error) {
        console.error(`Failed to send message to Kafka topic ${topic}:`, error);
        throw error;
    }
}

/**
 * Consumes messages from a topic using a group ID
 */
async function consumeQueue(groupId, topic, handler) {
    const consumer = kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const key = message.key?.toString();
            const value = JSON.parse(message.value.toString());

            try {
                await handler({ key, value, partition });
            } catch (error) {
                console.error(`Error processing message from ${topic}:`, error);
                // Implementation of DLQ or retry logic would go here
                // For now, simple log and continue (at-least-once)
            }
        }
    });

    consumers.push(consumer);
    console.log(`Kafka Consumer Group ${groupId} Connected to ${topic} ✅`);
}

async function disconnectKafka() {
    await producer.disconnect();
    for (const c of consumers) {
        await c.disconnect();
    }
}

module.exports = {
    connectProducer,
    sendToQueue,
    consumeQueue,
    disconnectKafka
};
