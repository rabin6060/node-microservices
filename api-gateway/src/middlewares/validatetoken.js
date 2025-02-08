const jwt = require('jsonwebtoken')
const logger = require('../utils/logger')

const validateJwt = async(req,res,next)=>{
    const authHeader = req.headers['authorization']
    const token = authHeader?.split(" ")[1]

    
    if (!token) {
        logger.warn("jwt verification failed")
        res.status(401).json({
            success:false,
            message:"jwt verification failed"
        })
    }
    await jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{
        if (err) {
            logger.error("invalid token")
            res.status(429).json({
                success:false,
                message:"invalid token"
            })
        }
        req.user = user
        next()
    })
}

module.exports = {validateJwt}