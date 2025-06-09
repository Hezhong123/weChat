const eventBus = require('../utils/event_bus'); // 引入事件总线
module.exports = function IM(io){
    io.on('connection', function(socket){
        socket.emit('connection',"链接成功")

        // 更新联系人列表
        socket.on('im', (data) => {
            console.log('im',data)
            // 查询对方是否在线
            // socket.broadcast.emit(data.to, data);
            socket.emit(data.to,data.msg)
            eventBus.emit(data.to,data.msg)
        });

        // 房间对话
        socket.on('joinRoom', (room) => {
            console.log('加入房间',room)
            socket.join(room.room);
        });

        //接收新的消息
        socket.on('sendMessage', async (data) => {
            //传输消息
            console.log('房间消息',data)
            eventBus.emit(data.to,JSON.stringify(data))  //不在线see事件总线
            io.to(data.room).emit('newMessage',data );
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    })
}