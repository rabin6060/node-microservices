const Joi = require('joi')


const validateRegistration = (data)=>{
    const userSchema = Joi.object({
        username:Joi.string().min(5).max(10).required(),
        email:Joi.string().email().required(),
        password:Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
    })

    return userSchema.validate(data)
}

module.exports = validateRegistration