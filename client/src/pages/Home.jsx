import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../context/Socket'
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiVideoCamera, HiMail, HiHashtag, HiArrowRight } from 'react-icons/hi';

function Home() {
    const [email, setEmail] = useState('');
    const [room, setRoom] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const socket = useSocket();

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (!email.trim() || !room.trim()) {
            toast.error('Please fill in all fields');
            return;
        }
        setLoading(true);
        const data = {
            email,
            roomId: room
        }
        socket.emit('join-room', data);
    }

    const handleRoomJoined = useCallback(({ roomId }) => {
        toast.success(`Joined room ${roomId}`);
        setLoading(false);
        navigate(`/room/${roomId}`);
    }, [socket, navigate])

    const handleRoomFull = useCallback(({ message }) => {
        toast.error(message || 'Room is full');
        setLoading(false);
    }, []);

    useEffect(() => {
        socket.on('joined-room', handleRoomJoined);
        socket.on('room-full', handleRoomFull);

        return () => {
            socket.off('joined-room', handleRoomJoined);
            socket.off('room-full', handleRoomFull);
        }
    }, [socket, handleRoomJoined, handleRoomFull])


    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden">
            {/* Ambient glow effects */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-lg mx-auto relative z-10">
                {/* Logo / Brand */}
                <div className="flex flex-col items-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4 shadow-2xl shadow-indigo-500/30">
                        <HiVideoCamera className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">RTC</h1>
                    <p className="text-slate-300 mt-2 text-base font-medium">Real-time video calls, right in your browser</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/60 rounded-3xl px-10 py-12 shadow-2xl shadow-black/30 flex flex-col gap-6">
                    <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">Join a Room</h2>

                    <form className="flex flex-col gap-5" onSubmit={handleJoinRoom}>
                        {/* Email input */}
                        <div className="relative flex items-center mb-2">
                            <span className="absolute left-5 text-indigo-400">
                                <HiMail className="w-6 h-6" />
                            </span>
                            <input
                                type='email'
                                value={email}
                                placeholder='Your email'
                                required
                                className='w-full pl-14 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none transition-all text-base shadow-sm'
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Room ID input */}
                        <div className="relative flex items-center mb-2">
                            <span className="absolute left-5 text-indigo-400">
                                <HiHashtag className="w-6 h-6" />
                            </span>
                            <input
                                type="text"
                                value={room}
                                required
                                className='w-full pl-14 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none transition-all text-base shadow-sm'
                                placeholder='Room ID'
                                onChange={(e) => setRoom(e.target.value)}
                            />
                        </div>

                        {/* Submit button */}
                        <button
                            type='submit'
                            disabled={loading}
                            className='w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 group disabled:opacity-60 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 cursor-pointer mt-2'
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Join Room
                                    <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-sm mt-8 font-medium drop-shadow">End-to-end peer connection via WebRTC</p>
            </div>
        </div>
    )
}

export default Home
