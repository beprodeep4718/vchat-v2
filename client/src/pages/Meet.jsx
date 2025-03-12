import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { UserPlus, Mic, Video, LogOut } from "lucide-react";

import Model from "../components/Model";
import Comms from "../components/Comms";

const Meet = ({ socket }) => {
  const { id } = useParams();
  const location = useLocation();

  const myVideoRef = useRef();
  const remoteVideoRef = useRef();
  const connectionRef = useRef();

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
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }
      socket.disconnect();
      socket.off("connect", handleConnection);
      socket.off("incommingCall", handleIncommingCall);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, []);

  useEffect(() => {
    if (mySocketId && myName && id && id !== "initiator") {
      console.log("Meeting ID:", id);
      if (stream) {
        initiateCall();
      } else {
        console.error("Stream is not available yet.");
      }
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

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
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
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        const recipientId = id === "initiator" ? callerId : id;
        socket.emit("ice-candidate", {
          to: recipientId,
          candidate: event.candidate,
          from: mySocketId,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("Received track:", event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = (event) => {
      console.log("Connection state change:", pc.connectionState);
    };

    pc.oniceconnectionstatechange = (event) => {
      console.log("ICE Connection state change:", pc.iceConnectionState);
    };

    // Add local stream tracks to peer connection
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    } else {
      console.error("No local stream available to add to peer connection");
    }

    return pc;
  };

  const handleIceCandidate = async ({ candidate, from }) => {
    console.log("Received ICE candidate from", from);
    if (connectionRef.current && candidate) {
      try {
        await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Added ICE candidate successfully");
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    }
  };

  const handleIncommingCall = async (data) => {
    console.log("📩 Incoming call from", data.from);
    console.log("🔗 Received Signal:", data.signal);
    setReceivingCall(true);
    setCallerName(data.name);
    setCallerSignal(data.signal);
    setCallerId(data.from);
  };

  const acceptCall = async () => {
    try {
      setCallAccepted(true);
      setReceivingCall(false);
      
      const pc = createPeerConnection();
      connectionRef.current = pc;
      
      // Set the remote description with the offer received
      await pc.setRemoteDescription(new RTCSessionDescription(callerSignal));
      
      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      // Send the answer to the caller
      socket.emit("acceptCall", {
        signalData: pc.localDescription,
        to: callerId,
        name: myName,
      });
      
      console.log("Call accepted and answer sent");
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  const initiateCall = async () => {
    console.log("Calling to", id);
    console.log("Current stream:", stream);

    if (!stream) {
      console.error("Stream is null! Cannot create peer connection.");
      return;
    }
    
    try {
      const pc = createPeerConnection();
      connectionRef.current = pc;
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      console.log("Sending call to:", id);
      socket.emit("initiateCall", {
        userToCall: id,
        signalData: pc.localDescription,
        from: mySocketId,
        name: myName,
      });
      
      socket.on("callAccepted", async (data) => {
        console.log("Call accepted:", data);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          setCallAccepted(true);
          setCallerName(data.name);
          console.log("Remote description set successfully");
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      });
      
    } catch (error) {
      console.error("Error initiating call:", error);
    }
  };

  const endCall = () => {
    const to = id === "initiator" ? callerId : id;
    socket.emit("call:end", { to, from: mySocketId, name: myName });
    setCallEnded(true);
    
    if (connectionRef.current) {
      connectionRef.current.close();
    }
    
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
          muted
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
        {
          // mic, video, end call
          callAccepted && !callEnded && (
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
          )
        }
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
