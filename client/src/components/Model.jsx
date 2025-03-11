import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const Model = ({ action, setName }) => {
  const dialogRef = useRef();
  const navigate = useNavigate();
  const [myName, setMyName] = useState("");
  const [dialId, setDialId] = useState("");

  const submitAction = (e) => {
    e.preventDefault();
    if (action === "start") {
      navigate(`/meet/initiator`, { state: { hasUserJoined: false, myName } });
    } else if (action === "set_name") {
      setName(myName);
      dialogRef.current.close();
    } else {
      navigate(`/meet/${dialId}`, { state: { hasUserJoined: true, myName } });
    }
  };

  const handleClose = () => {
    document.getElementById("my_modal_1").close();
  };
  return (
    <dialog ref={dialogRef} id="my_modal_1" className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">
          {action === "join" ? "Join a call" : "Get on a call"}
        </h3>
        <p className="py-2">
          {action === "join"
            ? "& dial id to join"
            : action === "set_name"
            ? "to join"
            : "to start"}{" "}
          the call
        </p>
        <div className="modal-action">
          <form
            onSubmit={(e) => submitAction(e)}
            method="dialog"
            className="w-full"
          >
            <div className="mb-4">
              <label htmlFor="name" className="text-sm sr-only">
                Your name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                className="w-full input input-ghost rounded-md focus:ring focus:ri dark:border-gray-700 p-3"
                required
              />
            </div>
            {action === "join" && (
              <div className="mb-4">
                <label htmlFor="dialId" className="text-sm sr-only">
                  Dial Id
                </label>
                <input
                  id="dialId"
                  type="text"
                  placeholder="Enter dial id"
                  value={dialId}
                  onChange={(e) => setDialId(e.target.value)}
                  className="w-full input input-info rounded-md focus:ring focus:ri dark:border-gray-700 p-3"
                  required
                  autoComplete="off"
                />
              </div>
            )}
            <div className="flex gap-5">
              <button className="btn btn-soft btn-error" onClick={handleClose}>
                Cancel
              </button>
              <button className="btn btn-soft btn-success">
                {action === "join"
                  ? "Join"
                  : action === "set_name"
                  ? "Proceed"
                  : "Start"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default Model;
