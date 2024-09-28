import { Dialog, Modal } from "@mui/material";
import React from "react";
import { FaCheck } from "react-icons/fa";
import { Oval } from "react-loader-spinner";
import { BiSolidErrorCircle } from "react-icons/bi";

const AddedModal = ({ isOpen, onConfirm, onCancel, message }) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  const handleCancelClick = () => {
    onCancel();
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleCancelClick();
    }
  };
  return (
    <div>
      <Modal open={isOpen} onClose={handleCancelClick} disableBackdropClick>
        <div
          className="flex flex-col w-full bg-white justify-center items-center gap-y-2  p-8 h-screen"
          onKeyDown={handleKeyDown}
        >
          <div className="flex flex-col gap-y-2 text-gray-800 items-center justify-center w-full text-xl font-semibold ">
            {message.delete === "wait" && (
              <div className="flex w-full justify-center items-center">
                <h2>1. 데이터 정리 준비중...</h2>
              </div>
            )}
            {message.delete === "start" && (
              <div className="flex w-full justify-center items-center">
                <div className="flex">
                  <h2>1. 데이터 정리중</h2>
                </div>
                <div className="flex ml-2 justify-center items-center">
                  <Oval
                    height={20}
                    width={20}
                    color="#0455c0"
                    wrapperStyle={{}}
                    wrapperClass=""
                    visible={true}
                    ariaLabel="oval-loading"
                    secondaryColor="#4fa94d"
                    strokeWidth={2}
                    strokeWidthSecondary={2}
                  />
                </div>
              </div>
            )}
            {message.delete === "end" && (
              <div className="flex justify-center items-center w-full">
                <div className="flex">
                  <h2>1. 정리 완료</h2>
                </div>
                <div className="flex ml-2 justify-center items-center text-blue-800">
                  <FaCheck />
                </div>
              </div>
            )}
            {message.add === "wait" && (
              <div className="flex justify-center items-center">
                <h2>2. 데이터 저장 준비중</h2>
              </div>
            )}
            {message.add === "start" && (
              <div className="flex justify-center items-center">
                <h2>2. 데이터 저장중</h2>{" "}
              </div>
            )}
            {message.add === "end" && (
              <div className="flex justify-center items-center w-full">
                <div className="flex">
                  <h2>2. 저장 완료</h2>
                </div>
                <div className="flex ml-2 justify-center items-center text-blue-800">
                  <FaCheck />
                </div>
              </div>
            )}
            {message.validate === "wait" && (
              <div className="flex justify-center items-center">
                <h2>3. 데이터 검증 준비중</h2>
              </div>
            )}
            {message.validate === "start" && (
              <div className="flex justify-center items-center">
                <h2>3. 데이터 검증중</h2>{" "}
              </div>
            )}
            {message.validate === "fail" && (
              <div className="flex justify-center items-center w-full flex-col">
                <div className="flex">
                  <h2>3. 검증 실패</h2>
                </div>
                <div className="flex justify-center items-center text-red-600">
                  <BiSolidErrorCircle className="mr-2" />
                  <span>{message.validateMsg}</span>
                </div>
              </div>
            )}
            {message.validate === "end" && (
              <div className="flex justify-center items-center w-full">
                <div className="flex">
                  <h2>3. 검증 완료</h2>
                </div>
                <div className="flex ml-2 justify-center items-center text-blue-800">
                  <FaCheck />
                </div>
              </div>
            )}
          </div>
          {/* <div className="flex w-full justify-center items-center gap-x-2">
            <div className="flex justify-center gap-x-5 mt-5">
              <button className="bg-white text-gray-800 rounded py-1 px-4 text-lg w-52 h-10 border border-gray-800">
                되돌아가기
              </button>
            </div>
          </div> */}
          <div className="flex w-full justify-center items-center gap-x-6">
            <div className="flex justify-center gap-x-5 mt-5">
              <button
                className="bg-red-500 hover:bg-red-600 text-white rounded py-1 px-4 text-lg w-52 h-16"
                onClick={handleCancelClick}
              >
                되돌아가기
              </button>
            </div>
            {message.validate === "end" && (
              <div className="flex justify-center gap-x-5 mt-5">
                <button
                  className="bg-blue-700 hover:bg-blue-600 text-white rounded py-1 px-4 text-lg w-52 h-16"
                  onClick={handleConfirmClick}
                >
                  로비로 이동합니다.
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddedModal;
