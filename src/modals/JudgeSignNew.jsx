import React from "react";
import useSignature from "../hooks/useSignature";
import SignatureCanvas from "react-signature-canvas";

const JudgeSignNew = ({ setClose, propState }) => {
  const { signCanvasRef, saveSignature, clearSignature } = useSignature();

  const handleSave = () => {
    if (!signCanvasRef.current.isEmpty()) {
      propState.setState(() => ({
        ...propState.state,
        judgeSignature: saveSignature(),
      }));
    }
    setClose();
  };

  return (
    <div className="flex w-full h-full flex-col justify-start items-center ">
      <div className="flex bg-yellow-50 w-96 h-96 border-4 border-dashed">
        <SignatureCanvas
          ref={signCanvasRef}
          canvasProps={{ style: { width: "100%", height: "100%" } }}
        />
      </div>
      <button onClick={handleSave}>저장</button>
      <button onClick={clearSignature}>초기화</button>
      <button onClick={setClose}>닫기</button>
    </div>
  );
};

export default JudgeSignNew;
