const router = require('koa-router')()


router.get('/', async (ctx, next) => {
    await ctx.redis.hset('user:123', 'username', 'Alice', 'avatar', 'url_to_avatar');
    ctx.body = "朋友圈"
})


//注册用户
router.post('/user', async (ctx, next) => {
    let {id} = ctx.request.body
    await ctx.redis.hset(`user:${id}`, 'username', `${id}`, 'avatar', `/images/0.jpeg`);
    ctx.body = await ctx.redis.hgetall(`user:${id}`)
})

//查看用户
router.get('/user/:id', async (ctx, next) => {
    let {id} = ctx.params
    ctx.body = await ctx.redis.hgetall(`user:${id}`)
})

//关注别人
router.post('/following/:id/:ofId', async (ctx, next) => {
    let {id,ofId} = ctx.params
    await ctx.redis.sadd(`following:${id}`, ofId);      //关注
    await ctx.redis.sadd(`followers:${ofId}`, id);   //被关注
    ctx.body = await ctx.redis.smembers(`following:${id}`)
})


//关系
router.get('/relation/:id', async (ctx, next) => {
    let {id} = ctx.params
    ctx.body ={
        followers:await ctx.redis.smembers(`following:${id}`), //关注
        following:await ctx.redis.smembers(`followers:${id}`),  //被关注
    }
})


//发动态
router.post('/moment', async (ctx, next) => {
    let obj = ctx.request.body
    const momentId = 'moment:' + Date.now().toString() + Math.random().toString(36).substring(2, 8);  //动态id
    const timestamp = Date.now();   //动态时间
    obj.timestamp = timestamp
    await ctx.redis.hset(momentId,obj)      //写入动态

    // 查看粉丝
    const followers = await ctx.redis.smembers(`followers:${obj.id}`);

    //使用管道推送活动给粉丝
    const pipeline = ctx.redis.pipeline();  //时间线管道
    for (const followerId of followers) {
        pipeline.zadd(`timeline:${followerId}`, timestamp, momentId);
        // 為了避免時間線無限增長，可以設定一個上限，例如只保留最新的1000條
        pipeline.zremrangebyrank(`timeline:${followerId}`, 0, -1001); // 移除最舊的
    }

    // 推送给自己
    pipeline.zadd(`timeline:${obj.id}`, timestamp, momentId);   //推送道管道
    await pipeline.exec();  //关闭管道
    console.log("obj", obj,momentId)
    ctx.body = await ctx.redis.hgetall(momentId);
})

//查看动态
router.get('/moment/:id', async (ctx, next) => {
    let {id} = ctx.params
    const momentIds = await ctx.redis.zrevrange(`timeline:${id}`, 0, 10);
    console.log(momentIds)
    // 使用 Pipeline 批量獲取每條動態的詳細內容
    const pipeline = ctx.redis.pipeline();
    for (const id of momentIds) {
        pipeline.hgetall(id);
        console.log('动态',id)
        const commentIds = await ctx.redis.lrange(`${id}:comments`, 0, -1);
    }
    const results = await pipeline.exec();
    let data = results.map(result =>result[1]);
    ctx.body = data
})

//创建评论
router.post('/comment/:momentId', async (ctx, next) => {
    let {momentId} = ctx.params
    let {id,content} = ctx.request.body
    // 添加評論
    const commentId = 'comment:' + Date.now(); // 簡單的評論ID
    await ctx.redis.hset(commentId, 'authorId', id, 'content', content, 'timestamp', Date.now());
    await ctx.redis.rpush(`moment:${momentId}:comments`, commentId); // 將評論ID添加到動態的評論列表末尾
    ctx.body = '添加评论'
})

router.get('/comment/:momentId', async (ctx, next) => {
    let {momentId} = ctx.params
     let commentIds = await ctx.redis.lrange(`moment:${momentId}:comments`, 0, -1);
    const pipeline = ctx.redis.pipeline();
    for (const id of commentIds) {
        pipeline.hgetall(id);
    }
    const results = await pipeline.exec();
    ctx.body = results.map(result => result[1])
})



module.exports = router