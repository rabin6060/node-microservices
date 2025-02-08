const logger = require("../utils/logger")


const AuthenticateMiddleware = (req,res,next)=>{
    const userId = req.headers['x-user-id']
    
    if (!userId) {
        logger.warn("UnAuthenticated user")
        res.status(401).json({
            success:false,
            message:"authentication required. please login"
        })
    }

    req.user  = {userId}
    next()
}

module.exports = {AuthenticateMiddleware}