import React from "react";

const Comms = ({answerCall, callerName}) => {
  return (
    <dialog id="incomming_model" className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Incomming Request to join</h3>
        <p className="py-4">{callerName} want&apos;s to join</p>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn" onClick={answerCall}>Accept</button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default Comms;
