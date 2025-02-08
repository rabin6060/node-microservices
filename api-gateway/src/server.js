require('dotenv').config()
const express = require('express')
const logger = require('./utils/logger')
const cors = require('cors')
const Redis = require('ioredis')
const helmet = require('helmet')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const proxy = require('express-http-proxy')
const errorHandler = require('./middlewares/errorHandler')
const { validateJwt } = require('./middlewares/validatetoken')

const app = express()

const redisClient = new Redis()

app.use(helmet())
app.use(cors())
app.use(express.json())

//rate limiter
const rateLimiter =  rateLimit({
    windowMs:60*1000*5, //5 min
    limit:200,
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

app.use(rateLimiter)

app.use((req,res,next)=>{
    logger.info(`Request ${req.method} to path ${req.path}`)
    logger.info(`Request Body -- ${req.body}`)
    console.log(req.body)
    next()
})

const proxyOptions = {
    proxyReqPathResolver:(req)=>{
        return req.originalUrl.replace(/^\/v1/,'/api')
    },
    proxyErrorHandler: function(err, res, next) {
        logger.error(`proxy error : ${err.message}`)
        next(err);
      }
}

app.use('/v1/auth',proxy(process.env.IDENTITY_SERVICE_URL,{
    ...proxyOptions,
    //modify the proxy req header
    proxyReqOptDecorator:(proxyReqOpts, srcReq)=>{
        proxyReqOpts.headers["Content-Type"] = 'application/json'
        return proxyReqOpts
    },
    userResDecorator:(proxyRes,proxyResData,userReq,userRes)=>{
        logger.info(`Response received from identity-service : ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

app.use('/v1/posts',validateJwt,proxy(process.env.POST_SERVICE_URL,{
    ...proxyOptions,
    //modify the proxy req header
    proxyReqOptDecorator:(proxyReqOpts, srcReq)=>{
        proxyReqOpts.headers["Content-Type"] = 'application/json'
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
        return proxyReqOpts
    },
    userResDecorator:(proxyRes,proxyResData,userReq,userRes)=>{
        logger.info(`Response received from post-service : ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

app.use('/v1/media',validateJwt,proxy(process.env.MEDIA_SERVICE_URL,{
    ...proxyOptions,
    //modify the proxy req header
    parseReqBody:false,// Prevents express-http-proxy from messing with file uploads

    proxyReqOptDecorator:(proxyReqOpts, srcReq)=>{
        if (srcReq.headers['content-type']?.startsWith('multipart/form-data')) {
            proxyReqOpts.headers['Content-Type'] = srcReq.headers['content-type'];
        } else {
            proxyReqOpts.headers['Content-Type'] = 'application/json';
        }

        // Forward user ID
        proxyReqOpts.headers['x-user-id'] = srcReq.user?.userId || '';

        return proxyReqOpts;
    },
    
    userResDecorator:(proxyRes,proxyResData,userReq,userRes)=>{
        logger.info(`Response received from post-service : ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

app.use('/v1/search',validateJwt,proxy(process.env.SEARCH_SERVICE_URL,{
    ...proxyOptions,
    //modify the proxy req header
    proxyReqOptDecorator:(proxyReqOpts, srcReq)=>{
        proxyReqOpts.headers['x-user-id'] = srcReq.user?.userId || '';
        proxyReqOpts.headers["Content-Type"] = 'application/json'
        return proxyReqOpts
    },
    userResDecorator:(proxyRes,proxyResData,userReq,userRes)=>{
        logger.info(`Response received from identity-service : ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

app.use(errorHandler)

app.listen(process.env.PORT,()=>{
    logger.info(`Api gateway server running on the port ${process.env.PORT}`)
})

//unhandle rejection
process.on('unhandledRejection',(reason,promise)=>{
    logger.error(`Unhandled Rejection due to promise ${promise} and reason ${reason}`)
})