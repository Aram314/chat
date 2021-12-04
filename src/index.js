const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('socket.io');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
  console.log('New websocket connection!');

  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) {
      return callback(error)
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('Admin', 'Welcome'));
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.name} has joined!`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })
  })

  socket.on('sendMessage', (msg, callback) => {
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callback('Not allowed bad word')
    }
    const user = getUser(socket.id);
    io.to(user.room).emit('message', generateMessage(user.name, msg));
    callback?.();
  })

  socket.on('sendLocation', (position, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('locationMessage', generateMessage(user.name, `https://google.com/maps?q=${position.lat},${position.long}`))
    callback();
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (!user) {
      return
    }
    io.to(user.room).emit('message', generateMessage('Admin', `${user.name} left the chat`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })
  })
})

const port = process.env.PORT || 4000;

server.listen(port, () => {
  console.log('Server is running on port ' + port)
})