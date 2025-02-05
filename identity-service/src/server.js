require('dotenv').config()
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require('ioredis')
const {rateLimit} = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')
const identityRoute  = require('./routes/user.route')

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

app.use((req,res,next)=>{
    logger.info(`Request ${req.method} to path ${req.path}`)
    logger.info(`Request Body -- ${req.body}`)
    console.log(req.body)
    next()
})

//prevent DDos attack and rate limiting.

redisClient.once('ready', () => {
    logger.info("Redis client ready!");

    const rateLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'middleware',
        points: 6,
        duration: 2 // per sec
    });

    app.use((req, res, next) => {
        rateLimiter.consume(req.ip)
            .then(() => next())
            .catch(() => {
                logger.warn("Too many requests from your device", req.ip);
                res.status(429).send('Too Many Requests');
            });
    });
});


//limiting rate for sensitive endpoints.
const sensitiveEndpointsLimiter = rateLimit({
    windowMs:60*1000*5, //5 min
    limit:100,
    legacyHeaders:false,
    standardHeaders:true,
    handler:(req,res)=>{
        logger.warn(`Sensitive rate limit exceeded for this ip ${req.ip}`)
        res.status(429).send('Too Many Requests');
    },
    store: new RedisStore({
		sendCommand: (...args) => redisClient.call(...args),
	}),
})

app.use('/api/auth/register',sensitiveEndpointsLimiter)
app.use('/api/auth',identityRoute)

app.listen(process.env.PORT,()=>{
    logger.info("server running at port 3001 ")
})

//unhandle rejection
process.on('unhandledRejection',(reason,promise)=>{
    logger.error(`Unhandled Rejection due to promise ${promise} and reason ${reason}`)
})