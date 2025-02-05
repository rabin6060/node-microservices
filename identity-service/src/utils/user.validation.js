const Joi = require('joi')


const validateRegistration = (data)=>{
    const userSchema = Joi.object({
        username:Joi.string().min(5).max(10).required(),
        email:Joi.string().email().required(),
        password:Joi.string().required(),
    })

    return userSchema.validate(data)
}

const validateLogin = (data)=>{
    const userSchema = Joi.object({
        email:Joi.string().email().required(),
        password:Joi.string().required(),
    })

    return userSchema.validate(data)
}

module.exports = {validateRegistration,validateLogin}