const logger = require("../utils/logger")
const Search = require('../model/search.model')

const searchPosts = async(req,res)=>{
    logger.info("search api hit...")

    try {
        const {query} = req.query
        //check if redis cache available
        const cacheKey = `search:${query}`
        const data = await req.redisClient.get(cacheKey)
        
        if (data) {
            return res.status(200).json(JSON.parse(data))
        }
        const result = await Search.find(
            {
                $text: {$search:query}
            },
            {
                score:{$meta : 'textScore'}
            }
        ).sort({score:{$meta : 'textScore'}}).limit(10)

        if (!result.length>0) {
            return res.status(404).json({
                success:false,
                message:"Post not found"
            })
        }
        
        await req.redisClient.setex(cacheKey,120,JSON.stringify(result))

        res.status(200).json(result)

    } catch (error) {
        logger.error("searching post Failed",error)
        res.status(500).json({
            success:false,
            message:"searching post Failed"
        })
    }
}

module.exports = {searchPosts}