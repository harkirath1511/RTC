import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useSocket } from '../context/Socket'
import { useParams } from 'react-router-dom';
import { getPeerContext } from '../context/Peer';

function Room() {

    const [myStream, setMyStream] = useState(null);
    const [remoteEmail, setRemoteEmail] = useState(null);
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const {peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream} = getPeerContext();
    const socket = useSocket();
    const params = useParams();


    const handleUserJoined = useCallback(async(data) =>{
        const {email} = data;
        console.log(`User ${email} joined this room`);
        setRemoteEmail(email);

        const offer = await createOffer();
        socket.emit('reqUser', {email , offer});
        console.log(`Emitting req with offer to ${email}`);
        
    }, [socket, createOffer]);
    

    const handleIncomingReq = useCallback(async (data)=> {
      console.log('incoming-req');
        const {offer} = data;

        const reqSender = data.from;
        console.log(`Incoming request from ${reqSender} with offer : `, offer);
        setRemoteEmail(reqSender);

        const answer = await createAnswer(offer);
        socket.emit('sendRes', { email : reqSender, answer });
        
    }, [socket, createAnswer]);


    const handleIncomingRes = useCallback(async (data)=>{
        const {answer, from} = data;

        const resSender = data.from;
        console.log(`Incoming response from ${resSender} with answer : `, answer);
        await setRemoteAns(answer);

    }, [socket])


    const getUserMediaStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            setMyStream(stream);
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    }, []);


    useEffect(() => {
        getUserMediaStream();
    }, [getUserMediaStream]);


    useEffect(() => {
        if (myStream && myVideoRef.current) {
            myVideoRef.current.srcObject = myStream;
        }
    }, [myStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(e => console.error("Error playing video:", e));
        }
    }, [remoteStream]);

    const handleSendStream = useCallback(async () => {
        if (myStream) {
            sendStream(myStream);
            if (remoteEmail) {
                const offer = await createOffer();
                socket.emit('reqUser', {email: remoteEmail, offer});
                console.log(`Renegotiating with ${remoteEmail}`);
            }
        }
    }, [myStream, sendStream, remoteEmail, createOffer, socket]);


    useEffect(() => {
      socket.on('user-joined', handleUserJoined);
      socket.on('incoming-req', handleIncomingReq);
      socket.on('incoming-res', handleIncomingRes);

      return ()=>{
        socket.off('user-joined', handleUserJoined);
        socket.off('incoming-req', handleIncomingReq);
        socket.off('incoming-res', handleIncomingRes);
      }
      
    }, [socket, handleIncomingReq, handleUserJoined, handleIncomingRes]);

    
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center">Room</h2>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl justify-center items-center">

        <div className="flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-2">My Video</h3>
          <video 
            ref={myVideoRef}
            autoPlay 
            muted
            className="w-96 h-72 bg-black rounded-lg shadow-lg"
          />
          <button onClick={handleSendStream} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
             Send My Video
           </button>
        </div>

        <div className="flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-2">Remote Video</h3>
          <video 
            ref={remoteVideoRef}
            autoPlay 
            playsInline
            className="w-96 h-72 bg-black rounded-lg shadow-lg"
          />
        </div>

      </div>
    </div>
  )
}

export default Room
