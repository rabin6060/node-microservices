require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./middlewares/errorHandler')
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const searchRoute = require('./routes/search.routes')
const { consumeEvent, connectRabbitMQ } = require('./utils/rabbitmq.connection')
const { handleEvent, handlePostCreateEvent, handlePostDeleteEvent } = require('./events/search.event')
const Redis = require("ioredis")

const app = express()


//mongodb connection
mongoose.connect(process.env.MONGODB_URI)
.then(()=>logger.info("connected to mongodb"))
.catch((e)=>logger.error("mongodb connection failed",e))

//redis client connection
const redisClient = new Redis(process.env.REDIS_URL)

redisClient.on('connect', () => {
    logger.info("redis connection success")
  });

redisClient.on('error',()=>{
    logger.error("redis connection failed")
})

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use((req,res,next)=>{
    logger.info(`Request ${req.method} to path ${req.path}`)
    logger.info(`Request Body -- ${req.body}`)
    next()
})

app.use('/api/search',(req,res,next)=>{
    req.redisClient = redisClient
    next()
},searchRoute)

app.use(errorHandler)

async function startServer(){
    try {
        await connectRabbitMQ()
        await consumeEvent("post.created",handlePostCreateEvent)
        await consumeEvent("post.deleted",handlePostDeleteEvent)
        app.listen(process.env.PORT,()=>{
            logger.info(`server running at port ${process.env.PORT} `)
        })
    } catch (error) {
        logger.error("failed to connect to server")
        process.exit(1)
    }
}

startServer()

//unhandle rejection
process.on('unhandledRejection',(reason,promise)=>{
    logger.error(`Unhandled Rejection due to promise ${promise} and reason ${reason}`)
})

