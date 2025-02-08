const logger = require("./logger")

const invalidateCache = async (req,input)=>{
   try {
     const Key = await req.redisClient.keys(`post:${input}`)
     if(Key.length>0){
         await req.redisClient.del(Key)
     }
     const keys = await req.redisClient.keys('posts:*')
    
     if(keys.length > 0){
         await req.redisClient.del(keys)
     }
     const keysearch = await req.redisClient.keys('search:*')
    
     if(keysearch.length > 0){
         await req.redisClient.del(keysearch)
     }
     
   } catch (error) {
    logger.error("key is undefined, skipping clear cache /deleting keys")
   }
}
module.exports = {invalidateCache};