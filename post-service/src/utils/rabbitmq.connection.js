const amqp = require('amqplib');
const logger = require('./logger')
//rabbitmq connection

const exchange_name = 'facebook_event'
const url = process.env.RABBITMQ_URI
let channel

const connectRabbitMQ = async ()=>{
    try {
        let retries = 5;
        while (retries--) {
          try {
            const connection = await amqp.connect(url);
            channel = await connection.createChannel()
        
            await channel.assertExchange(exchange_name,'topic',{durable:false})
            logger.info("rabbitmq connection successfull")
            return channel
        
          } catch (err) {
            console.log('RabbitMQ connection failed, retrying...');
            await new Promise(res => setTimeout(res, 5000));
          }
        }
        throw new Error('Failed to connect to RabbitMQ');
        
    } catch (error) {
        logger.error("rabbit mq connection failed",error)
    }
} 
const publishEvent = async (routingKey,message)=>{
    try {
        
        if (!channel) {
            await connectRabbitMQ()
        }
        
        channel && await channel.publish(exchange_name,routingKey,Buffer.from(JSON.stringify(message)))
        logger.info(`event published ${routingKey}`)
    } catch (error) {
        logger.error("message publish failed!",error)
    }
}

module.exports = {connectRabbitMQ,publishEvent}