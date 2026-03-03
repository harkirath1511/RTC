import {BrowserRouter as Router , Routes , Route} from 'react-router-dom'
import { SocketProvider } from './context/Socket'
import { PeerProvider } from './context/Peer'
import { Toaster } from 'react-hot-toast'
import Home from './pages/Home'
import Room from './pages/Room'

function App() {

  return (
    <>
    <SocketProvider>
      <PeerProvider>
       <Toaster 
         position="top-right"
         toastOptions={{
           duration: 3500,
           style: {
             background: '#1e293b',
             color: '#f1f5f9',
             borderRadius: '12px',
             padding: '14px 20px',
             fontSize: '14px',
             border: '1px solid rgba(148, 163, 184, 0.15)',
             boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
           },
           success: {
             iconTheme: { primary: '#22c55e', secondary: '#0f172a' },
           },
           error: {
             iconTheme: { primary: '#ef4444', secondary: '#0f172a' },
           },
         }}
       />
       <Router>
        <Routes>
          <Route path='/' element={<Home/>}></Route>
          <Route path='/room/:roomId' element={<Room/>}></Route>
        </Routes>
       </Router>
      </PeerProvider>
      </SocketProvider>
    </>
  )
}

export default App
