require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./middlewares/errorHandler')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const postRoute = require('./routes/post.routes')
const logger = require('./utils/logger')
const { connectRabbitMQ } = require('./utils/rabbitmq.connection')

const app = express()

//mongodb connection
mongoose.connect(process.env.MONGODB_URI)
.then(()=>logger.info("db connected successfully"))
.catch((e)=>logger.error("db connection failed",e))

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

//also pass the redisClient into post controller
app.use('/api/posts',(req,res,next)=>{
    req.redisClient = redisClient
    next()
},postRoute)

app.use(errorHandler)

async function startServer(){
    try {
        await connectRabbitMQ()
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

