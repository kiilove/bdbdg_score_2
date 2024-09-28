import { Dialog, Modal } from "@mui/material";
import React from "react";

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, message }) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  const handleCancelClick = (event, reason) => {
    onCancel();
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleCancelClick();
    }
  };

  const handleBackdropClick = (event) => {
    //these fail to keep the modal open
    event.stopPropagation();
    return false;
  };
  return (
    <Modal
      open={isOpen}
      onClose={handleCancelClick}
      disableBackdropClick
      disableEscapeKeyDown
    >
      <div
        className="flex flex-col w-96 bg-white justify-center items-center absolute top-1/2 left-1/2 gap-y-2 rounded-lg border p-8"
        style={{
          transform: "translate(-50%, -50%)",
        }}
        onClick={() => {
          return;
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="flex flex-col gap-y-2 text-black items-center">
          <h2 className="font-semibold">{message.body}</h2>
          {message.body2 && <h2 className="font-semibold">{message.body2}</h2>}
          {message.body3 && <h2 className="font-semibold">{message.body3}</h2>}
        </div>
        {message.isButton === true && (
          <div className="flex justify-center gap-x-5 mt-5">
            {message.cancelButtonText && (
              <button
                className="bg-gray-200 hover:bg-gray-300 rounded py-2 px-4 mr-4 text-sm"
                onClick={handleCancelClick()}
              >
                {message.cancelButtonText}
              </button>
            )}
            {message.confirmButtonText && (
              <button
                className="bg-red-500 hover:bg-red-600 text-white rounded py-1 px-4 text-sm w-20 h-8"
                onClick={handleConfirmClick}
              >
                {message.confirmButtonText}
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
