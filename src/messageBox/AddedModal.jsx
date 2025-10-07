"use client";

import { Modal, Button, Spin, Space } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
} from "@ant-design/icons";

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
    <Modal
      open={isOpen}
      onCancel={handleCancelClick}
      footer={null}
      closable={false}
      centered
      width={600}
    >
      <div
        className="flex flex-col w-full justify-center items-center gap-y-6 py-8"
        onKeyDown={handleKeyDown}
      >
        <Space direction="vertical" size="large" className="w-full">
          {/* 1. 데이터 정리 */}
          <div className="flex flex-col gap-y-2 text-gray-800 items-center justify-center w-full text-xl font-semibold">
            {message.delete === "wait" && (
              <div className="flex w-full justify-center items-center gap-2">
                <span>1. 데이터 정리 준비중...</span>
              </div>
            )}
            {message.delete === "start" && (
              <div className="flex w-full justify-center items-center gap-2">
                <span>1. 데이터 정리중</span>
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />}
                />
              </div>
            )}
            {message.delete === "end" && (
              <div className="flex justify-center items-center w-full gap-2">
                <span>1. 정리 완료</span>
                <CheckCircleFilled style={{ fontSize: 20, color: "#52c41a" }} />
              </div>
            )}

            {/* 2. 데이터 저장 */}
            {message.add === "wait" && (
              <div className="flex justify-center items-center gap-2">
                <span>2. 데이터 저장 준비중</span>
              </div>
            )}
            {message.add === "start" && (
              <div className="flex justify-center items-center gap-2">
                <span>2. 데이터 저장중</span>
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />}
                />
              </div>
            )}
            {message.add === "end" && (
              <div className="flex justify-center items-center w-full gap-2">
                <span>2. 저장 완료</span>
                <CheckCircleFilled style={{ fontSize: 20, color: "#52c41a" }} />
              </div>
            )}

            {/* 3. 데이터 검증 */}
            {message.validate === "wait" && (
              <div className="flex justify-center items-center gap-2">
                <span>3. 데이터 검증 준비중</span>
              </div>
            )}
            {message.validate === "start" && (
              <div className="flex justify-center items-center gap-2">
                <span>3. 데이터 검증중</span>
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />}
                />
              </div>
            )}
            {message.validate === "fail" && (
              <div className="flex justify-center items-center w-full flex-col gap-2">
                <span>3. 검증 실패</span>
                <div className="flex justify-center items-center text-red-600 gap-2">
                  <CloseCircleFilled style={{ fontSize: 20 }} />
                  <span className="text-base">{message.validateMsg}</span>
                </div>
              </div>
            )}
            {message.validate === "end" && (
              <div className="flex justify-center items-center w-full gap-2">
                <span>3. 검증 완료</span>
                <CheckCircleFilled style={{ fontSize: 20, color: "#52c41a" }} />
              </div>
            )}
          </div>
        </Space>

        {/* 버튼 영역 */}
        <div className="flex w-full justify-center items-center gap-4 mt-4">
          <Button
            danger
            size="large"
            onClick={handleCancelClick}
            className="w-52 h-16 text-lg"
          >
            되돌아가기
          </Button>
          {message.validate === "end" && (
            <Button
              type="primary"
              size="large"
              onClick={handleConfirmClick}
              className="w-52 h-16 text-lg"
            >
              로비로 이동합니다.
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddedModal;
