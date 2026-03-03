import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useSocket } from '../context/Socket'
import { useParams } from 'react-router-dom';
import { getPeerContext } from '../context/Peer';
import toast from 'react-hot-toast';
import { HiVideoCamera, HiPhone, HiUser, HiStatusOnline } from 'react-icons/hi';
import { HiVideoCameraSlash, HiMicrophone, HiSpeakerXMark } from 'react-icons/hi2';

function Room() {

    const [myStream, setMyStream] = useState(null);
    const [remoteEmail, setRemoteEmail] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [connectionState, setConnectionState] = useState('waiting');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    
    const remoteEmailRef = useRef(null);
    const iceCandidateBuffer = useRef([]);

    const {peer, createOffer, createAnswer, setRemoteAns, sendStream, remoteStream} = getPeerContext();
    const socket = useSocket();
    const params = useParams();

    
    const updateRemoteEmail = useCallback((email) => {
        remoteEmailRef.current = email;
        setRemoteEmail(email);
    }, []);


    
    const wasConnectedRef = useRef(false);

    useEffect(() => {
        const handleIceChange = () => {
            const state = peer.iceConnectionState;
            if (state === 'connected' || state === 'completed') {
                const isFirstConnect = !wasConnectedRef.current;
                wasConnectedRef.current = true;
                setConnectionState('connected');
                if (isFirstConnect) {
                    toast.success('Peer connection established!');
                }
            } else if (state === 'disconnected') {
                setConnectionState('disconnected');
                toast('Peer disconnected', { icon: '⚠️' });
                wasConnectedRef.current = false;
            } else if (state === 'failed') {
                setConnectionState('failed');
                toast.error('Connection failed');
                wasConnectedRef.current = false;
            } else if (state === 'checking') {
                
                
                if (!wasConnectedRef.current) {
                    setConnectionState('connecting');
                }
            }
        };
        peer.addEventListener('iceconnectionstatechange', handleIceChange);
        return () => peer.removeEventListener('iceconnectionstatechange', handleIceChange);
    }, [peer]);


    const handleUserJoined = useCallback((data) =>{
        const {email} = data;
        console.log(`User ${email} joined this room`);
        updateRemoteEmail(email);
        toast((t) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <HiUser className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                    <p className="font-medium text-sm text-white">{email}</p>
                    <p className="text-xs text-slate-400">joined the room</p>
                </div>
            </div>
        ), { duration: 4000 });
    }, []);

    const handleUserReady = useCallback(async(data) =>{
        const {email} = data;
        console.log(`User ${email} is ready, initiating offer`);
        updateRemoteEmail(email);
        const offer = await createOffer();
        socket.emit('reqUser', {email, offer});
        console.log(`Sending offer to ${email}`);
    }, [socket, createOffer, updateRemoteEmail]);
    

    const handleIncomingReq = useCallback(async (data)=> {
      console.log('incoming-req');
        const {offer} = data;

        const reqSender = data.from;
        console.log(`Incoming request from ${reqSender} with offer : `, offer);

        
        const isRenegotiation = wasConnectedRef.current || !!peer.remoteDescription;
        updateRemoteEmail(reqSender);

        if (!isRenegotiation) {
            setConnectionState('connecting');
            toast('Connecting...', { icon: '🔗', duration: 2000 });
        } else {
            console.log('Renegotiation offer received, updating SDP...');
        }

        const answer = await createAnswer(offer);
        socket.emit('sendRes', { email : reqSender, answer });
        
    }, [socket, createAnswer, updateRemoteEmail, peer]);


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
            toast.error('Could not access camera/microphone');
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

            const handleTrackChange = () => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                    remoteVideoRef.current.play().catch(e => console.error("Error playing video:", e));
                }
            };

            remoteStream.addEventListener('addtrack', handleTrackChange);
            remoteStream.addEventListener('removetrack', handleTrackChange);

            return () => {
                remoteStream.removeEventListener('addtrack', handleTrackChange);
                remoteStream.removeEventListener('removetrack', handleTrackChange);
            };
        }
    }, [remoteStream]);

    const handleSendStream = useCallback(async () => {
        if (myStream) {
            await sendStream(myStream);
            setIsSending(true);
            toast.success('Sharing your video');
            if (remoteEmail) {
                
                
                
                if (peer.iceConnectionState === 'checking') {
                    console.log('Waiting for ICE to settle before renegotiating...');
                    await new Promise((resolve) => {
                        const onStateChange = () => {
                            const s = peer.iceConnectionState;
                            if (s === 'connected' || s === 'completed' || s === 'failed' || s === 'disconnected') {
                                peer.removeEventListener('iceconnectionstatechange', onStateChange);
                                resolve();
                            }
                        };
                        peer.addEventListener('iceconnectionstatechange', onStateChange);
                        
                        setTimeout(() => {
                            peer.removeEventListener('iceconnectionstatechange', onStateChange);
                            resolve();
                        }, 8000);
                    });
                    console.log(`ICE settled: ${peer.iceConnectionState}`);
                }
                const offer = await createOffer();
                socket.emit('reqUser', {email: remoteEmail, offer});
                console.log(`Renegotiating with ${remoteEmail}`);
            }
        }
    }, [myStream, sendStream, remoteEmail, createOffer, socket, peer]);

    const toggleMute = useCallback(() => {
        if (myStream) {
            const audioTrack = myStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                toast(audioTrack.enabled ? 'Microphone on' : 'Microphone muted', {
                    icon: audioTrack.enabled ? '🎙️' : '🔇',
                    duration: 1500
                });
            }
        }
    }, [myStream]);

    const toggleVideo = useCallback(() => {
        if (myStream) {
            const videoTrack = myStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
                toast(videoTrack.enabled ? 'Camera on' : 'Camera off', {
                    icon: videoTrack.enabled ? '📹' : '📷',
                    duration: 1500
                });
            }
        }
    }, [myStream]);


    
    useEffect(() => {
        const handleIceCandidate = (event) => {
            if (event.candidate && remoteEmailRef.current) {
                console.log('Sending ICE candidate to', remoteEmailRef.current);
                socket.emit('ice-candidate', {
                    email: remoteEmailRef.current,
                    candidate: event.candidate
                });
            }
        };
        peer.addEventListener('icecandidate', handleIceCandidate);
        return () => peer.removeEventListener('icecandidate', handleIceCandidate);
    }, [peer, socket]);

    
    const flushIceCandidates = useCallback(async () => {
        while (iceCandidateBuffer.current.length > 0) {
            const candidate = iceCandidateBuffer.current.shift();
            try {
                await peer.addIceCandidate(candidate);
                console.log('Flushed buffered ICE candidate');
            } catch (e) {
                console.error('Error flushing ICE candidate:', e);
            }
        }
    }, [peer]);

    
    useEffect(() => {
        if (peer.remoteDescription) {
            flushIceCandidates();
        }
    }, [peer.remoteDescription, flushIceCandidates]);

    
    const handleIceCandidate = useCallback(async (data) => {
        const { candidate } = data;
        try {
            if (peer.remoteDescription) {
                await peer.addIceCandidate(candidate);
                console.log('Added ICE candidate directly');
            } else {
                console.log('Buffering ICE candidate (no remote desc yet)');
                iceCandidateBuffer.current.push(candidate);
            }
        } catch (e) {
            console.error('Error adding ICE candidate:', e);
        }
    }, [peer]);

    useEffect(() => {
      socket.on('user-joined', handleUserJoined);
      socket.on('user-ready', handleUserReady);
      socket.on('incoming-req', handleIncomingReq);
      socket.on('incoming-res', handleIncomingRes);
      socket.on('ice-candidate', handleIceCandidate);

      return ()=>{
        socket.off('user-joined', handleUserJoined);
        socket.off('user-ready', handleUserReady);
        socket.off('incoming-req', handleIncomingReq);
        socket.off('incoming-res', handleIncomingRes);
        socket.off('ice-candidate', handleIceCandidate);
      }
      
    }, [socket, handleIncomingReq, handleUserJoined, handleIncomingRes, handleUserReady, handleIceCandidate]);

    
    useEffect(() => {
        socket.emit('user-ready', { roomId: params.roomId });
    }, []);

    const connectionBadge = () => {
        const styles = {
            waiting: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400', label: 'Waiting for peer' },
            connecting: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Connecting...' },
            connected: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Connected' },
            disconnected: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400', label: 'Disconnected' },
            failed: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400', label: 'Failed' },
        };
        const s = styles[connectionState] || styles.waiting;
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${s.bg}`}>
                <span className={`w-2 h-2 rounded-full ${s.dot} ${connectionState === 'connecting' ? 'animate-pulse' : ''}`} />
                <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
            </div>
        );
    };

    
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <HiVideoCamera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">RTC</h1>
            <p className="text-slate-500 text-xs">Room: {params.roomId}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {connectionBadge()}
          {remoteEmail && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <HiUser className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-300">{remoteEmail}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl">

          {/* My video */}
          <div className="relative group">
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
              <div className="relative aspect-video bg-slate-900">
                <video
                  ref={myVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                      <HiUser className="w-10 h-10 text-slate-600" />
                    </div>
                  </div>
                )}
                {/* Label */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                    You
                  </span>
                  {isSending && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-sm text-emerald-400 text-xs font-medium flex items-center gap-1">
                      <HiStatusOnline className="w-3 h-3" /> Live
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Remote video */}
          <div className="relative group">
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
              <div className="relative aspect-video bg-slate-900">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!remoteStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                      <HiUser className="w-10 h-10 text-slate-700" />
                    </div>
                    <p className="text-slate-600 text-sm">
                      {remoteEmail ? `Waiting for ${remoteEmail} to share video...` : 'Waiting for someone to join...'}
                    </p>
                  </div>
                )}
                {/* Label */}
                <div className="absolute bottom-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                    {remoteEmail || 'Remote'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Mobile remote email notice */}
        {remoteEmail && (
          <div className="sm:hidden mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <HiUser className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-300">{remoteEmail}</span>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="relative z-10 flex items-center justify-center gap-3 px-6 py-5 border-t border-slate-800/60">
        {/* Toggle mic */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer
            ${isMuted
              ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
              : 'bg-slate-700/50 border border-slate-600/30 text-slate-300 hover:bg-slate-600/50'
            }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted
            ? <HiSpeakerXMark className="w-5 h-5" />
            : <HiMicrophone className="w-5 h-5" />
          }
        </button>

        {/* Toggle video */}
        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer
            ${isVideoOff
              ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
              : 'bg-slate-700/50 border border-slate-600/30 text-slate-300 hover:bg-slate-600/50'
            }`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff
            ? <HiVideoCameraSlash className="w-5 h-5" />
            : <HiVideoCamera className="w-5 h-5" />
          }
        </button>

        {/* Send stream */}
        <button
          onClick={handleSendStream}
          disabled={isSending}
          className={`h-12 px-6 rounded-2xl font-medium text-sm flex items-center gap-2 transition-all duration-200 cursor-pointer
            ${isSending
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
            }`}
          title="Share your video with peer"
        >
          <HiVideoCamera className="w-5 h-5" />
          {isSending ? 'Sharing' : 'Share Video'}
        </button>

        {/* End (placeholder) */}
        <button
          onClick={() => {
            window.location.href = '/';
            toast('Left the room', { icon: '👋' });
          }}
          className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-all duration-200 cursor-pointer"
          title="Leave room"
        >
          <HiPhone className="w-5 h-5 rotate-[135deg]" />
        </button>
      </div>
    </div>
  )
}

export default Room
