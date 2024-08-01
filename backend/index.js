const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const PORT = process.env.PORT || 8000;
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes')
const fileShareRoutes = require('./routes/fileShareRoutes');
const dotenv = require('dotenv');
const { createServer } = require('node:http');

dotenv.config();

require('./db');
require('./models/userModel');
require('./models/verificationModel');

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000"
  }
});

const allowedOrigins = ["http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(cookieParser());
app.use("/public", express.static("public"));

app.use('/auth', authRoutes);
app.use('/file', fileShareRoutes);

app.get('/', (req, res) => {
  res.send('API is running....');
});

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('disconnect', () => {
    console.log('Disconnected', socket.id);
  })

  socket.on('joinself', (data) => {
    console.log('Joined self', data);
  })

  socket.on('uploaded', (data) => {
    console.log('Uploaded', data);
    let sender = data.from;
    let receiver = data.to;

    socket.to(receiver).emit('notify', {
      from: sender,
      message: "File shared with you" 
    })
  })
});

server.listen(PORT, () => {
  console.log('server running at ' + PORT);
});