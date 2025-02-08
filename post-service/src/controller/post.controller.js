const Post = require('../model/post.model')
const { invalidateCache } = require('../utils/invalidateRedisCache')
const logger = require('../utils/logger')
const { validatePost } = require('../utils/post.validation')
const { publishEvent } = require('../utils/rabbitmq.connection')

const createPost = async(req,res)=>{
    logger.info("post creation started...")
    try {
        const {error} = validatePost(req.body)
        if (error) {
            logger.warn("validation failed",error.details[0].message)
            return res.status(400).json({
                success:false,
                message:error.details[0].message
            })
        }
        const {content,mediaIds}  = req.body
        
        const post = new Post({userId:req.user.userId,content,mediaIds})
        await post.save()
        logger.info("post created successfully")
        //publish a post creation event so we can use this in our search service
        const message = {
            postId:post._id.toString(),
            userId:post.userId,
            content:post.content
        }
        await publishEvent("post.created",message)

        await invalidateCache(req,post._id)
        res.status(201).json({
            success:true,
            message:"post created successfully",
            post
        })
    } catch (error) {
        logger.error("Post Creation Failed",error)
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}
const getPosts = async(req,res)=>{
    logger.info("posts fetching started...")
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 5
        const startIndex = (page-1)*limit
        const cacheKeys = `posts:${page}:${limit}`
        const cacheData = await req.redisClient.get(cacheKeys)
        
        if (cacheData) {
            return res.status(200).json(JSON.parse(cacheData))
        }
        const posts = await Post.find({}).sort({createdAt:-1}).skip(startIndex).limit(limit)
        const totalPosts = await Post.countDocuments()
        const result = {
            posts,
            totalPages:Math.ceil(totalPosts/limit),
            currentPages:page,
            totalPosts
        }
        //caching the data
        await req.redisClient.setex(cacheKeys,120,JSON.stringify(result))
        res.status(200).json(result)
    } catch (error) {
        logger.error("Post fetching Failed")
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}
const getPost = async(req,res)=>{
    logger.info("post fetching started...")
    try {
        const postId = req.params.id
        const cachedKey = `post:${postId}`
        const cacheData = await req.redisClient.get(cachedKey)
        if (cacheData) {
            return res.status(200).json(JSON.parse(cacheData))
        }
        
        const post = await Post.findById(postId)
        if (!post) {
            logger.warn("no post exist")
            return res.status(404).json({
                success:false,
                message:"no post found"
            })
        }
        await req.redisClient.setex(cachedKey,120,JSON.stringify(post)) //120sec
        logger.info("post found successfully")
        res.status(200).json(post)
    } catch (error) {
        logger.error("Post fetching Failed")
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}
const deletePost = async(req,res)=>{
    logger.info("post deletion started...")
    try {
        const postId  = req.params.id
        const post = await Post.findOneAndDelete({$and:[{_id:postId},{userId:req.user.userId}]})
        if (!post) {
            logger.warn("no post exist")
            return res.status(404).json({
                success:false,
                message:"no post found"
            })
        }
        
        await invalidateCache(req,post._id)
        //publish event
        const message = {
            postId:post._id.toString(),
            userId:req.user.userId,
            mediaIds:post.mediaIds}
            
        await publishEvent('post.deleted',message)

        
        logger.info("post deleted successfully")
        res.status(200).json({
            success:true,
            message:"deleted"
        })
        
    } catch (error) {
        logger.error("Post deletion Failed",error)
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

module.exports = {createPost,getPosts,getPost,deletePost}