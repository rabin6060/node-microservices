const amqp = require('amqplib');
const logger = require('./logger');

// RabbitMQ connection details
const exchange_name = 'facebook_event';
const url = process.env.RABBITMQ_URI;

// Declare channel and connection variables in module scope
let channel;
let connection;

const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(url);
        channel = await connection.createChannel();
        await channel.assertExchange(exchange_name, 'topic', { durable: false });
        logger.info("RabbitMQ connection successful");
    } catch (error) {
        logger.error("RabbitMQ connection failed:", error);
    }
};

// **Consumes events based on the provided routing key**
const consumeEvent = async (routingKey, callback) => {
    try {
        // Ensure the channel is initialized
        if (!channel) {
            await connectRabbitMQ();
        }

        const q = await channel.assertQueue("", { exclusive: true }); // Temporary queue
        await channel.bindQueue(q.queue, exchange_name, routingKey);

        logger.info(`Subscribed to event: ${routingKey}`);

        // Start consuming messages
        await channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    callback(content);
                    logger.info(`Received message: ${JSON.stringify(content)}`);
                } catch (err) {
                    logger.error("Error parsing message:", err);
                }
                channel.ack(msg); // Acknowledge the message
            }
            logger.info("no messages")
        });
    } catch (error) {
        logger.error("Error in consumeEvent:", error);
    }
};

// Export functions
module.exports = { connectRabbitMQ, consumeEvent };
