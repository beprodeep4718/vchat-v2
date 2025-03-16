import React, { useState } from "react";
import Model from "../components/Model";
import { Camera } from 'lucide-react';

const Home = ({ socket }) => {
  const [action, setAction] = useState(null);
  const handleAction = (action) => {
    setAction(action);
    document.getElementById("my_modal_1").showModal();
  };

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="navbar fixed top-0 left-0 bg-base-100">
        <a className="btn btn-ghost text-xl"><Camera className="text-primary" />VeeChat</a>
      </div>
      <div className="card-cont flex gap-2 flex-wrap justify-center items-center">
        <div className="card card-border bg-base-200 w-96">
          <div className="card-body">
            <h2 className="card-title">Create a meeting</h2>
            <p>
              Create a meeting and share the link with your friends to invite
              them to the meeting
            </p>
            <div className="card-actions justify-end">
              <button
                onClick={() => handleAction("start")}
                className="btn btn-soft btn-primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>
        <div className="card card-border bg-base-200 w-96">
          <div className="card-body">
            <h2 className="card-title">Join a meeting</h2>
            <p>
              Enter the link shared with you by your friend to join the meeting
            </p>
            <div className="card-actions justify-end">
              <button
                onClick={() => handleAction("join")}
                className="btn btn-soft btn-secondary"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
      <Model action={action} />
    </div>
  );
};

export default Home;
