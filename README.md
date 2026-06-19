
# RTC - Real-Time Video Chat

A modern, peer-to-peer video chat web application built with React, Vite, Socket.IO, and WebRTC. Connect instantly with anyone, share your video and audio, and experience seamless real-time communication — all in your browser.

---

## Live Demo

👉 [Try it now!](https://rtc-roan-eight.vercel.app/)

---

## Features

- **Peer-to-peer video calls** using WebRTC
- **Room-based connection** — join with a room ID and email
- **Live connection status** and remote user display
- **Share your video/audio** with a single click
- **Mute/unmute microphone** and toggle camera
- **Responsive UI** with dark mode and event notifications
- **No media server required** — only signaling via Socket.IO
- **Mobile and desktop support**

---

## Getting Started

You can use the deployed site here: [https://rtc-roan-eight.vercel.app/](https://rtc-roan-eight.vercel.app/)

Or run locally:

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Clone the repository
```bash
git clone https://github.com/harkirath1511/RTC.git
cd RTC
```

### 2. Install dependencies
```bash
cd server
npm install
cd ../client
npm install
```

### 3. Configure environment variables
Create a `.env` file in the `server/` directory:
```
ALLOWED_ORIGINS=http://localhost:5173 || http://localhost:5174
```

You can add deployed frontend URLs as needed.

### 4. Start the backend server
```bash
cd server
node index.js
```

### 5. Start the frontend (Vite)
```bash
cd client
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deployment

- **Frontend:** Deploy the `client/` folder to Vercel, Netlify, or any static hosting.
- **Backend:** Host the `server/` folder on a Node.js server (e.g., Heroku, Render, or your own VPS).
- **Signaling:** The backend uses Socket.IO for signaling only — no media is relayed through the server.

---

## How It Works

- **Signaling:** When you join a room, your browser connects to the backend via Socket.IO. The server relays signaling messages (SDP offers/answers, ICE candidates) between peers.
- **WebRTC:** Once signaling is complete, media flows directly peer-to-peer. No media server is required.
- **UI:** The frontend provides a modern, responsive interface with live status, event notifications, and controls for video/audio.

---

## Security & Privacy
- All media is end-to-end encrypted via WebRTC.
- The server only relays signaling data — it never sees your video/audio.
- Common browser developer tools are blocked for casual users (see `index.html`).

---

## Contributing

Pull requests and suggestions are welcome! Please open an issue for bugs or feature requests.

---

## License

MIT

---


