require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./middlewares/errorHandler')
const mongoose = require('mongoose')
const mediaRoutes = require('./routes/media.routes')
const logger = require('./utils/logger')
const { connectRabbitMQ, consumeEvent } = require('./utils/rabbitmq.connection')
const { handlePostDeleted } = require('./eventhandlers/mediaEvent')

const app = express()

//mongodb connection
mongoose.connect(process.env.MONGODB_URI)
.then(()=>logger.info("db connected successfully"))
.catch((e)=>logger.error("db connection failed",e))


app.use(helmet())
app.use(cors())
app.use(express.json())
app.use((req,res,next)=>{
    logger.info(`Request ${req.method} to path ${req.path}`)
    logger.info(`Request Body -- ${req.body}`)
    next()
})

app.use('/api/media',mediaRoutes)

app.use(errorHandler)

async function startServer(){
    try {
        await connectRabbitMQ()
        //consume all events
        await consumeEvent('post.deleted',handlePostDeleted)

        app.listen(process.env.PORT,()=>{
            logger.info(`media server running at port ${process.env.PORT} `)
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

