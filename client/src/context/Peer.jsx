import React, { useCallback } from 'react'
import { useContext, createContext, useEffect, useState } from 'react'
import { useMemo } from 'react';

    const PeerContext = createContext(null);
 
    const getPeerContext = ()=>{
        return useContext(PeerContext);
    }

    const PeerProvider = ({children}) => {

        const [remoteStream, setRemoteStream] = useState(null);

        const peer = useMemo(() => new RTCPeerConnection({
            iceServers : [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun.l.google.com:5349" },
                { urls: "stun:stun1.l.google.com:3478" },
                { urls: "stun:stun1.l.google.com:5349" },
                { urls: "stun:stun2.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:5349" },
                { urls: "stun:stun3.l.google.com:3478" },
                { urls: "stun:stun3.l.google.com:5349" },
                { urls: "stun:stun4.l.google.com:19302" },
                { urls: "stun:stun4.l.google.com:5349" }
            ]
        }), []);

        const createOffer = async() =>{
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            return offer;
        }

        const createAnswer = async(offer)=>{
            await peer.setRemoteDescription(offer);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            return answer;
        }

        const setRemoteAns = async(ans)=>{
            await peer.setRemoteDescription(ans);
        }

        const sendStream = async(stream)=>{
            const tracks = stream.getTracks();
            console.log("Setting stream ...")
            for(const track of tracks){
                peer.addTrack(track, stream);
            }
        }

       const handleTrackEvent = useCallback((ev) => {
        console.log("Stream received!!!", ev);
        const streams = ev.streams;
        if (streams && streams[0]) {
            console.log("Setting remote stream", streams[0]);
            setRemoteStream(streams[0]);
        }
       }, []);

        useEffect(() => {
          peer.addEventListener('track', handleTrackEvent);

          return ()=>{
            peer.removeEventListener('track', handleTrackEvent);
          }
        }, [peer, handleTrackEvent])
        

        return (
            <PeerContext.Provider value={{createOffer, peer, createAnswer, setRemoteAns, sendStream, remoteStream}}>
                {children}
            </PeerContext.Provider>
    )};



export {
    PeerProvider,
    getPeerContext
}
