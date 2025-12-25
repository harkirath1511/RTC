import { useMemo } from "react";
import { useContext, createContext } from "react";
import {io} from 'socket.io-client'

const socketContext = createContext(null);

const useSocket = ()=>{
    return useContext(socketContext);
}

const SocketProvider = ({children}) =>{

    const socket = useMemo(()=> io(`https://962d20646578.ngrok-free.app`), [])

    return (
        <socketContext.Provider value={socket}>
            {children}
        </socketContext.Provider>
    )
}

export {
    SocketProvider,
    useSocket
}
