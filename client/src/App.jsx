import {BrowserRouter as Router , Routes , Route} from 'react-router-dom'
import { SocketProvider } from './context/Socket'
import { PeerProvider } from './context/Peer'
import Home from './pages/Home'
import Room from './pages/Room'

function App() {

  return (
    <>
    <SocketProvider>
      <PeerProvider>
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
