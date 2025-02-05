const logger = require("../utils/logger")
const {validateRegistration,validateLogin} = require("../utils/user.validation")
const User = require('../models/user.model')
const RefreshToken = require('../models/refreshToken')
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

const login = async(req,res)=>{
    logger.info("login starting..")
    try {
        const {error} = validateLogin(req.body)
        if (error) {
            logger.warn("validation failed",error.details[0].message)
            return res.status(400).json({
                success:false,
                message:error.details[0].message
            })
        }
        //find user
        const {email,password} = req.body
        const user = await User.findOne({email})
        if (!user) {
            logger.warn("User credential invalid")
            return res.status(400).json({
                success:false,
                message:"User credential invalid"
            })
        }
        //verify password
        const isVerified = await user.comparePassword(password)
        if (!isVerified) {
            logger.warn("User credential invalid")
            return res.status(400).json({
                success:false,
                message:"User credential invalid"
            })
        }
        const {accessToken,refreshToken} = await generateToken(user)
        logger.info("Login successFully")
        res.status(200).json({
            user:user._id,
            accessToken,
            refreshToken
        })
    } catch (error) {
        logger.error('Login Failed',error.message)
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

const logout = async(req,res)=>{
    logger.info("logout starting...")
    try {
        const {refreshToken} = req.body
        const token = await RefreshToken.findOne({token:refreshToken})
        if (!token) {
            logger.warn("Refresh token invalid")
            return res.status(400).json({
                success:false,
                message:"Refresh token invalid"
            })
        }
        await RefreshToken.deleteOne({id:token._id})
        logger.info("logout successfully")
        res.status(200).json({
            success:true,
            message:'logout successfully'
        })
        
    } catch (error) {
        logger.error('Login Failed',error.message)
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

module.exports = {register,login,logout}