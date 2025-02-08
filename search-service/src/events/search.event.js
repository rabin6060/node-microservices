const searchModel = require("../model/search.model")
const logger = require("../utils/logger")

const handlePostCreateEvent = async(event)=>{
    const {postId,userId,content} = event
    //create a search data based on post
    try {
        const searchData = new searchModel({postId,userId,content})
        await searchData.save()
        logger.info("post added to search db")
    } catch (error) {
        logger.error("post addition failed to search db",error)
    }
    
}

const handlePostDeleteEvent = async(event)=>{
    const {postId,userId} = event
    //create a search data based on post
    try {
        const result = await searchModel.findOne({$and:[{postId:postId},{userId:userId}]}) 
        if (result) {
            await result.deleteOne()
            logger.info("post deletion from search db")
        }
        
    } catch (error) {
        logger.error("post deletion failed from search db",error)
    }
    
}


module.exports = {handlePostCreateEvent,handlePostDeleteEvent}