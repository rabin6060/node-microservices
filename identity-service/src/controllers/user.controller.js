const logger = require("../utils/logger")
const validateRegistration = require("../utils/user.validation")
const User = require('../models/user.model')
const generateToken = require("../utils/generateToken")

const register = async (req,res)=>{
    logger.info("registering starting...")
    try {
        const {error} = validateRegistration(req.body)
        if (error) {
            logger.warn("validation failed",error.details[0].message)
            return res.status(400).json({
                success:false,
                message:error.details[0].message
            })
        }
        const {username,email,password} = req.body
        const user = await User.findOne({$or:[{email},{username}]})
        if (user) {
            logger.warn('User already exist')
            return res.status(400).json({
                success:false,
                message:'User already exist'
            })
        }
        const newUser = new User({username,email,password})
        await newUser.save()
        logger.info("User created Successfully.",newUser._id)

        const {accessToken,refreshToken} =await generateToken(newUser)
        res.status(201).json({
            success:true,
            message:'User created Successfully.',
            accessToken,
            refreshToken
        })
    } catch (error) {
        logger.error("User Registeration Failed!!",error)
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

module.exports = register