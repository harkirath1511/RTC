import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import {createServer} from 'http'
import cors from 'cors'


const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors : true
});

const socketIds = new Map();
const emailIds = new Map();

app.use(bodyParser.json());
app.use(cors({
    origin : ["http://localhost:5173", "http://localhost:5174", "rtc-roan-eight.vercel.app"],
    credentials : true
}));
app.get('/', (req, res)=>{
    return res.json("Server listening!");
})




io.on("connection", (socket) =>{
    console.log(socket.id);
    socket.on('join-room', (data)=>{

        const {email, roomId} = data;

        const room = io.sockets.adapter.rooms.get(roomId);
        if (room && room.size >= 2) {
            console.log(`User ${email} denied join to room ${roomId}: Room full`);
            socket.emit('room-full', { message: 'Room is full' });
            return;
        }
         
        console.log(`User ${email} joined room : ${roomId}`);
        socketIds.set(email, socket.id);
        emailIds.set(socket.id, email);

        socket.join(roomId);
        socket.emit('joined-room', {roomId});
        socket.to(roomId).emit('user-joined', {email})
    });

    socket.on('reqUser', (data)=>{
        const {email, offer} = data;
        const sender = emailIds.get(socket.id);
        const socketId =  socketIds.get(email);
        console.log(`Sending req to ${email} and id: ${socketId} from ${sender}`);
        io.to(socketId).emit('incoming-req', {from : sender, offer});
    });

    socket.on('sendRes', (data)=>{
        const {email, answer} = data;
        const socketId = socketIds.get(email);
        const sender = emailIds.get(socket.id);
        console.log(`Response sending to ${email} by ${sender}`);
        socket.to(socketId).emit('incoming-res', {from : sender, answer});
    })
    
})

server.listen(8000, ()=>{
    console.log("Server running on port 8000");
})
