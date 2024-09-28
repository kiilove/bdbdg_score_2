import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

const useSignature = () => {
  const signCanvasRef = useRef(null);

  // 사인 이미지를 저장하고 반환합니다.
  const saveSignature = () => {
    if (signCanvasRef.current.isEmpty()) {
      return null; // 사인이 비어있는 경우 null 반환
    }

    const signatureData = signCanvasRef.current.toDataURL();
    // 사인 이미지 데이터를 저장하거나 전송하는 로직 추가

    return signatureData; // 사인 이미지 데이터 반환
  };

  // 저장된 사인 이미지를 읽어옵니다.
  const readSignature = (signatureData) => {
    console.log(signatureData);
    if (!signatureData) {
      return; // 사인 이미지 데이터가 없으면 종료
    }

    signCanvasRef.current.fromDataURL(signatureData);
  };

  // 사인 이미지를 삭제합니다.
  const clearSignature = () => {
    signCanvasRef.current.clear();
  };

  return { signCanvasRef, saveSignature, readSignature, clearSignature };
};

export default useSignature;
