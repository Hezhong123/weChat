const router = require('koa-router')()
const {PassThrough} = require("stream");
const WebSocket = require('ws');
const eventBus = require('../utils/event_bus'); // 引入事件总线

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

// 联系人列表see服务
router.get('/event/:user', async (ctx, next) => {
  let {user} = ctx.params
  console.log(user)
  ctx.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache', // 防止缓存流
    'Connection': 'keep-alive'   // 保持连接开放
  });
  const stream = new PassThrough();
  ctx.body = stream;
  ctx.status = 200;
  eventBus.on(user,msg=>{
    console.log(msg)
    ctx.res.write(`data: ${msg}\n\n`);
  })
})

router.get('/im/:user', async (ctx, next) => {
  await ctx.render('ims', {
    title: '联系人列表',
    user:ctx.params.user
  })
})

router.get('/im/:user/:room', async (ctx, next) => {
  let {room,user} = ctx.params
  await ctx.render('im', {
    title: '会话',
    user:user,
    room:room
  })
})

router.get('/string', async (ctx, next) => {
  ctx.body = 'koa2 string'
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})

module.exports = router
