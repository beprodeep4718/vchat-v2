# VeeChat - WebRTC Video Chat Application

VeeChat is a real-time video chat application that allows users to create and join video meetings using WebRTC technology. The application provides a simple, user-friendly interface for peer-to-peer video communication.

![VeeChat](https://github.com/user-attachments/assets/b0dcde33-54bf-4677-ac18-4a7ef67fc4be)

## Features

- 🎥 Real-time video and audio communication
- 🔊 Toggle microphone on/off
- 📹 Toggle camera on/off
- 🔗 Simple link sharing to invite participants
- 🪄 User-friendly interface
- 📱 Responsive design
- 🔒 Peer-to-peer connection (data doesn't go through a server)

## Technologies Used

- **Frontend**: React.js
- **WebRTC**: SimplePeer.js
- **Signaling**: Socket.IO
- **Backend**: Express.js
- **Styling**: TailwindCSS with DaisyUI components

## Installation

### Prerequisites
- Node.js (v14+ recommended)
- NPM or Yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd p4
```

2. Install dependencies:
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

3. Create a `.env` file in the root directory with the following content:
```
PORT=3000
```

4. Create a `.env` file in the client directory with:
```
VITE_SERVER_URL=http://localhost:3000
```

## Running the Application

### Development Mode

1. Start the server:
```bash
npm run server
```

2. In another terminal, start the client:
```bash
cd client
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173` (or the port Vite assigns)

### Production Mode

1. Build the client:
```bash
cd client
npm run build
cd ..
```

2. Start the server which will serve the built client:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage Guide

### Creating a Meeting

1. Click on the "Create" button on the home page
2. Enter your name in the dialog
3. Click "Start" to create the meeting
4. Use the "Invite People" button to copy the meeting link
5. Share the link with others to invite them to join

### Joining a Meeting

1. Click on the "Join" button on the home page
2. Enter your name and the meeting ID or full link
3. Click "Join" to enter the meeting

### During the Meeting

- Use the microphone button to mute/unmute yourself
- Use the video button to turn your camera on/off
- Use the logout button to leave the call

## How It Works

VeeChat uses WebRTC technology through the SimplePeer library to establish peer-to-peer connections between users:

1. When a user creates a meeting, they become the "initiator" and wait for others to connect
2. When another user joins using the meeting link, they connect to the initiator
3. The connection process involves:
   - Signaling through Socket.IO to exchange connection data
   - ICE candidate negotiation to establish the best connection path
   - Media stream exchange for audio/video sharing

The server only facilitates the initial connection (signaling) between peers. Once connected, all audio/video data flows directly between the users' browsers without going through the server.

## Project Structure

```
p4/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   └── App.jsx       # Main application component
│   └── package.json      # Frontend dependencies
├── server.js             # Express and Socket.IO server
├── package.json          # Backend dependencies
└── README.md             # Project documentation
```

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
