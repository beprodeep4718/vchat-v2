import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { UserPlus, Mic, Video, LogOut } from "lucide-react";
import Peer from "simple-peer/simplepeer.min.js";

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
    socket.connect();

    socket.on("connect", handleConnection);
    socket.on("incommingCall", handleIncommingCall);
    return () => {
      socket.disconnect();
      socket.off("connect", handleConnection);
      socket.off("incommingCall", handleIncommingCall);
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

  const handleIncommingCall = (data) => {
    console.log("📩 Incoming call from", data.from);
    console.log("🔗 Received Signal:", data.signal);
    setReceivingCall(true);
    setCallerName(data.name);
    setCallerSignal(data.signal);
    setCallerId(data.from);
  };

  const acceptCall = () => {
    setCallAccepted(true);
    setReceivingCall(false);
    const pr = new Peer({ initiator: false, trickle: false, stream });
    pr.on("signal", (data) => {
      console.log("Sending signal data:", data);
      socket.emit("acceptCall", {
        signalData: data,
        to: callerId,
        name: myName,
      });
    });
    pr.on("stream", (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });
    pr.signal(callerSignal);
    connectionRef.current = pr;
  };

  const initiateCall = () => {
    console.log("Calling to", id);
    console.log("Current stream:", stream);

    if (!stream) {
      console.error("Stream is null! Cannot create peer.");
      return;
    }

    const pr = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" }, // Free STUN server
          { urls: "stun:stun1.l.google.com:19302" },
          {
            urls: "turn:turn.anyfirewall.com:443?transport=tcp",
            username: "webrtc",
            credential: "webrtc",
          }, // Example TURN server
        ],
      },
    });
    pr.on("signal", (data) => {
      console.log("Sending signal data:", data);
      socket.emit("initiateCall", {
        userToCall: id,
        signalData: data,
        from: mySocketId,
        name: myName,
      });
    });

    pr.on("stream", (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    socket.on("callAccepted", (data) => {
      console.log("Call accepted:", data);
      pr.signal(data.signal);
      setCallAccepted(true);
      setCallerName(data.name);
    });

    pr.on("connect", () => {
      console.log("✅ WebRTC Connection Established!");
    });
    
    pr.on("error", (err) => {
      console.error("❌ WebRTC Error:", err);
    });
    
    pr.on("close", () => {
      console.warn("🔴 WebRTC Connection Closed!");
    });
    

    connectionRef.current = pr;
  };

  const endCall = () => {
    const to = id === "initiator" ? callerId : id;
    socket.emit("call:end", { to, from: mySocketId, name: myName });
    setCallEnded(true);
    connectionRef.current?.destroy();
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
