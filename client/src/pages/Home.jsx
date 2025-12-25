import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSocket } from '../context/Socket'
import { useNavigate } from 'react-router-dom';

function Home() {
    const [email, setEmail] = useState('');
    const [room, setRoom] = useState('');
    const navigate = useNavigate();

    const socket = useSocket();

    const handleJoinRoom = (e)=>{
        e.preventDefault();
        const data = {
            email,
            roomId : room
        }
        socket.emit('join-room', data);
    }

    const handleRoomJoined = useCallback(({roomId})=>{
        navigate(`/room/${roomId}`);
    }, [socket])

    const handleRoomFull = useCallback(({message}) => {
        alert(message);
    }, []);

    useEffect(() => {
      socket.on('joined-room', handleRoomJoined);
      socket.on('room-full', handleRoomFull);

      return ()=> {
        socket.off('joined-room', handleRoomJoined);
        socket.off('room-full', handleRoomFull);
      }
    }, [socket, handleRoomJoined, handleRoomFull])
    
    


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Join a Room</h2>
        <form className="space-y-5" onSubmit={handleJoinRoom}>
          <input
            type='email'
            value={email}
            placeholder='Enter your email'
            className='w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-center'
            onChange={(e)=>setEmail(e.target.value)}
          />
          <input
            type="text"
            value={room}
            className='w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-center'
            placeholder='Enter the room ID'
            onChange={(e)=> setRoom(e.target.value)}
          />
          <button
            type='submit'
            className='w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition'
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  )
}

export default Home
