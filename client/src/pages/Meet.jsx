import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { UserPlus, Mic, Video, LogOut } from "lucide-react";
import SimplePeer from "simple-peer/simplepeer.min.js";

import Model from "../components/Model";
import Comms from "../components/Comms";

const Meet = ({ socket }) => {
  const { id } = useParams();
  const location = useLocation();

  const myVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef();

  const [myName, setMyName] = useState(location.state?.myName);
  const [stream, setStream] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);
  const [callerName, setCallerName] = useState("");
  const [callerId, setCallerId] = useState(""); // caller's socket id
  const [callerSignal, setCallerSignal] = useState();

  const [receivingCall, setReceivingCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [callAction, setCallAction] = useState(""); // actions performed throughout call

  const getMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      console.log("Media stream set:", mediaStream);
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  useEffect(() => {
    if (!myName) {
      document.getElementById("my_modal_1").showModal();
    }
    getMedia();

    // More robust socket connection
    socket.io.opts.transports = ["websocket", "polling"];
    socket.connect();

    socket.io.on("error", (error) => {
      console.error("Socket.IO error:", error);
    });

    socket.io.on("reconnect_attempt", () => {
      console.log("Socket.IO reconnecting...");
    });

    socket.on("connect", handleConnection);
    socket.on("incommingCall", handleIncommingCall);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("callEnded", handleCallEnded);

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      socket.disconnect();
      socket.off("connect", handleConnection);
      socket.off("incommingCall", handleIncommingCall);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("callEnded", handleCallEnded);
    };
  }, []);

  useEffect(() => {
    if (mySocketId && myName && id && id !== "initiator" && stream) {
      console.log("Meeting ID:", id);
      initiateCall();
    }
  }, [myName, mySocketId, id, stream]);

  useEffect(() => {
    // incoming call notification
    if (receivingCall && !callAccepted) {
      setCallAction("call_incoming");
      document.getElementById("incomming_model")?.showModal();
    }
  }, [receivingCall]);

  const handleConnection = () => {
    const socketId = socket.id;
    console.log("Connected to socket", socketId);
    setMySocketId(socketId);
  };

  const handleIncommingCall = async (data) => {
    console.log("📩 Incoming call from", data.from);
    console.log("🔗 Received Signal:", data.signal);
    setReceivingCall(true);
    setCallerName(data.name);
    setCallerSignal(data.signal);
    setCallerId(data.from);
  };

  const handleCallAccepted = (data) => {
    console.log("Call accepted:", data);
    peerRef.current.signal(data.signal);
    setCallAccepted(true);
    setCallerName(data.name);
  };

  const handleCallEnded = (data) => {
    console.log("Call ended by", data.name);
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setCallEnded(true);
    setCallAction("call_terminated");
  };

  const createPeer = (initiator, receiverId) => {
    console.log("Creating peer, initiator:", initiator);
    
    const peer = new SimplePeer({
      initiator,
      stream,
      trickle: false,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          {
            urls: "turn:turn.anyfirewall.com:443?transport=tcp",
            username: "webrtc",
            credential: "webrtc",
          },
        ],
      }
    });

    peer.on("signal", (data) => {
      console.log("Generated signal:", data);
      
      if (initiator) {
        console.log("Sending call to:", receiverId);
        socket.emit("initiateCall", {
          userToCall: receiverId,
          signalData: data,
          from: mySocketId,
          name: myName,
        });
      } else {
        socket.emit("acceptCall", {
          signalData: data,
          to: callerId,
          name: myName,
        });
      }
    });

    peer.on("stream", (remoteStream) => {
      console.log("Received remote stream");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
    });

    peer.on("close", () => {
      console.log("Peer connection closed");
    });

    peer.on("connect", () => {
      console.log("Peer connection established");
    });

    return peer;
  };

  const initiateCall = () => {
    console.log("Initiating call to", id);
    if (!stream) {
      console.error("Stream is null! Cannot create peer connection.");
      return;
    }

    const peer = createPeer(true, id);
    peerRef.current = peer;
  };

  const acceptCall = () => {
    console.log("Accepting call from", callerId);
    setCallAccepted(true);
    setReceivingCall(false);

    const peer = createPeer(false);
    peerRef.current = peer;
    
    // Signal the peer with caller's signal data
    peer.signal(callerSignal);
  };

  const endCall = () => {
    const to = id === "initiator" ? callerId : id;
    socket.emit("call:end", { to, from: mySocketId, name: myName });
    
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    
    setCallEnded(true);
    setCallAction("call_terminated");
  };

  const toggleMic = () => {
    setMicOn((prev) => !prev);
    stream.getAudioTracks()[0].enabled = !micOn;
  };

  const toggleVideo = () => {
    setVideoOn((prev) => !prev);
    stream.getVideoTracks()[0].enabled = !videoOn;
  };

  return (
    <div className="p-4 py-6 flex flex-col items-center justify-between gap-5 w-full h-screen">
      <div className="video-cont w-full flex items-center justify-center gap-5 rounded-lg">
        <video
          ref={myVideoRef}
          autoPlay
          playsInline
          className="w-1/2 h-[300px] bg-base-300 rounded-lg scale-x-[-1]"
        ></video>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-1/2 h-[300px] bg-base-300 rounded-lg scale-x-[-1]"
        ></video>
      </div>
      <div className="action-btns px-10 grid grid-cols-3 w-full">
        <button className="badge badge-xl badge-primary badge-dash">
          {myName}
        </button>

        {callAccepted && !callEnded && (
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center gap-8 p-4 px-8 bg-neutral-content/5 backdrop-blur-lg rounded-lg shadow-[inset_0_0_0_1px_#ffffff1a]">
              <button className="" onClick={toggleMic}>
                <Mic
                  className={micOn ? "text-primary-content" : "text-error"}
                />
              </button>
              <button className="" onClick={toggleVideo}>
                <Video
                  className={videoOn ? "text-primary-content" : "text-error"}
                />
              </button>
              <button className="text-error">
                <LogOut onClick={endCall} />
              </button>
            </div>
          </div>
        )}
        {callerName && (
          <div className="flex items-center justify-end">
            <button className="badge badge-xl badge-primary badge-dash">
              {callerName}
            </button>
          </div>
        )}
        {!(callAccepted && !callEnded) && (
          <div className="col-start-3 col-end-3 flex items-center justify-end">
            <div className="tooltip" data-tip="Copy invite link">
              <button
                className="btn btn-accent"
                onClick={() => {
                  const link = `${window.location.origin}/meet/${socket?.id}`;
                  navigator.clipboard.writeText(link);
                }}
              >
                Invite People <UserPlus />
              </button>
            </div>
          </div>
        )}
      </div>
      <Comms
        callAction={callAction}
        answerCall={acceptCall}
        callerName={callerName}
      />
      <Model action="set_name" setName={setMyName} />
    </div>
  );
};

export default Meet;
