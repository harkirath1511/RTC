import { useMemo } from "react";
import { useContext, createContext } from "react";
import {io} from 'socket.io-client'

const socketContext = createContext(null);

const useSocket = ()=>{
    return useContext(socketContext);
}

const SocketProvider = ({children}) =>{

    const socket = useMemo(()=> io(`http://localhost:8000`), [])

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
