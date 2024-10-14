import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { debounce } from "lodash"; // Import debounce from lodash
import {
  useFirebaseRealtimeGetDocument,
  useFirebaseRealtimeUpdateData,
} from "../hooks/useFirebaseRealtime";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import { useFirestoreGetDocument } from "../hooks/useFirestores";
import { handleMachineCheck } from "../functions/functions";
import ConfirmationModal from "../messageBox/ConfirmationModal";
import LoadingPage from "./LoadingPage";

const ScoreLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [msgOpen, setMsgOpen] = useState(false);
  const [message, setMessage] = useState({});
  const [machineId, setMachineId] = useState(null);
  const [contestInfo, setContestInfo] = useState({});
  const [missingData, setMissingData] = useState([]); // 빠진 데이터를 저장하는 상태 추가
  const [cardType, setCardType] = useState("");

  const [password, setPassword] = useState("");
  const [passwordInputs, setPasswordInputs] = useState(["", "", "", ""]);

  const {
    data: realtimeData,
    loading: realtimeLoading,
    error: realtimeError,
  } = useFirebaseRealtimeGetDocument(
    contestInfo?.id ? `currentStage/${contestInfo.id}` : null
  );
  const updateRealtimeData = useFirebaseRealtimeUpdateData();

  const pwdRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];

  // 빠진 데이터를 체크하는 함수 추가
  const checkMissingData = () => {
    const missing = [];
    if (!location?.state?.currentStageInfo) missing.push("무대 정보");
    if (!location?.state?.currentJudgeInfo) missing.push("심판 정보");
    if (!contestInfo.id) missing.push("대회 정보");
    if (!realtimeData?.categoryTitle) missing.push("실시간 데이터");

    setMissingData(missing);
  };

  const handleInputs = (index, value) => {
    if (value.length > 1) {
      return; // 입력의 길이가 1을 초과하면 아무 것도 하지 않음
    }

    setPasswordInputs((prevState) =>
      prevState.map((input, i) => (i === index ? value : input))
    );

    // 입력 값이 존재하면 다음 입력 칸으로 focus 이동
    if (value) {
      if (index < pwdRefs.length - 1) {
        pwdRefs[index + 1].current.focus();
      }
    } else {
      // 입력 값이 없으면 이전 입력 칸으로 focus 이동
      if (index > 0) {
        pwdRefs[index - 1].current.focus();
      }
    }

    // 모든 입력 칸에 값이 채워졌을 때 심사진행 버튼으로 focus 이동
    if (passwordInputs.join("").length === 4) {
      pwdRefs[pwdRefs.length - 1].current.blur(); // 마지막 입력 칸에서 focus 해제
      pwdRefs[4].current.focus(); // 심사진행 버튼으로 focus 이동
    }
  };

  const handleKeyDown = (index, refPrev, e) => {
    if (e.key === "Backspace" && e.target.value === "") {
      if (refPrev && refPrev.current) {
        refPrev.current.focus();
      }
    }

    // 엔터키를 누르면 심사진행 버튼 클릭과 동일한 동작을 처리
    if (e.key === "Enter" && index === pwdRefs.length - 2) {
      handleJudgeLogin(
        "currentStage",
        contestInfo.id,
        location.state.currentJudgeInfo.seatIndex
      );
    }
  };

  const handleUpdateState = async (collectionInfo, seatIndex) => {
    const currentJudge = {
      isLogined: true,
      isEnd: false,
      seatIndex,
    };
    const updatedData = await updateRealtimeData.updateData(
      collectionInfo,
      currentJudge
    );
    console.log("Updated Data:", updatedData);
  };

  const handleEnterKey = (e) => {
    if (
      e.key === "Enter" &&
      passwordInputs.join("") ===
        location?.state?.currentStageInfo[0].onedayPassword
    ) {
      handleJudgeLogin(
        "currentStage",
        contestInfo.id,
        location.state.currentJudgeInfo.seatIndex
      );
    }
  };

  //로그인시에 location.state에 currentStageInfo를 담아서 넘겨야한다.
  const handleJudgeLogin = async (collectionName, documentId, seatIndex) => {
    await handleUpdateState(
      `${collectionName}/${documentId}/judges/${seatIndex - 1}`,
      seatIndex
    )
      .then(() =>
        localStorage.setItem(
          "loginedUid",
          JSON.stringify(location?.state?.currentJudgeInfo?.judgeUid)
        )
      )
      .then(() => {
        if (location.state.currentStageInfo[0].categoryJudgeType === "point") {
          navigate("/autopointtable", {
            state: {
              currentStageInfo: location.state.currentStageInfo,
              currentJudgeInfo: location.state.currentJudgeInfo,
              contestInfo,
            },
          });
        } else {
          navigate("/autoscoretable", {
            state: {
              currentStageInfo: location.state.currentStageInfo,
              currentJudgeInfo: location.state.currentJudgeInfo,
              contestInfo,
            },
          });
        }
      });
  };

  useEffect(() => {
    const contextInfo = handleMachineCheck();

    if (contextInfo.error.code === "200") {
      navigate("/lobby", { replace: true });
    } else {
      setMachineId(() => contextInfo.machineId);
      setContestInfo(() => ({ ...contextInfo.contestInfo }));
    }
  }, []);

  useEffect(() => {
    checkMissingData(); // 빠진 데이터 체크
    console.log(checkMissingData());
    console.log(location);
    realtimeData?.categoryTitle && setIsLoading(false);
  }, [realtimeData, contestInfo]);

  useEffect(() => {
    if (
      realtimeData &&
      realtimeData?.stageId !== location?.state?.currentStageInfo[0].stageId
    ) {
      navigate("/lobby", { replace: true });
    }
  }, [realtimeData?.stageId]);

  return (
    <>
      {isLoading && (
        <div className="flex w-full h-screen justify-center items-center">
          <LoadingPage />
        </div>
      )}
      {!isLoading && (
        <div className="flex w-full h-full flex-col">
          <ConfirmationModal
            isOpen={msgOpen}
            message={message}
            onCancel={() => setMsgOpen(false)}
            onConfirm={() => setMsgOpen(false)}
          />

          {/* 빠진 데이터가 있으면 경고 메시지 표시 */}
          {missingData.length > 0 && (
            <div className="text-red-600 text-center font-bold mb-5">
              {`누락된 데이터: ${missingData.join(", ")}`}
            </div>
          )}

          {/* 되돌아가기 버튼 추가 */}
          <div className="flex justify-center mb-5">
            <button
              className="w-44 h-12 border text-gray-800 text-base font-semibold rounded-lg"
              onClick={() => navigate("/lobby")}
            >
              되돌아가기
            </button>
          </div>

          <div className="flex w-full justify-center items-center h-20">
            <span className="text-6xl font-sans font-bold text-gray-800">
              JUDGE
            </span>
            <span className="text-6xl font-sans font-bold text-gray-800 ml-2">
              {machineId}
            </span>
          </div>

          <div className="flex text-2xl font-bold text-blue-900 h-auto w-full justify-center items-center p-5">
            {realtimeData?.categoryTitle} ({realtimeData?.gradeTitle})
            {location?.state?.currentStageInfo[0].onedayPassword}
          </div>

          <div className="flex w-full justify-center items-center p-5 gap-x-5">
            <div className="flex w-full justify-center items-center p-5 gap-x-5">
              {passwordInputs.map((value, index) => (
                <div
                  key={index}
                  className="flex justify-center items-center w-32 h-32 border-8 border-orange-400 rounded-md"
                >
                  <input
                    type="number"
                    ref={pwdRefs[index]}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) =>
                      handleKeyDown(index, pwdRefs[index - 1], e)
                    }
                    onChange={(e) => handleInputs(index, e.target.value)}
                    value={value}
                    name={`judgePassword${index + 1}`}
                    maxLength={1}
                    className="w-28 h-28 text-6xl flex text-center align-middle outline-none"
                  />
                </div>
              ))}
              <div className="flex w-auto h-auto p-3 justify-start items-center">
                {passwordInputs.join("") ===
                location?.state?.currentStageInfo[0].onedayPassword ? (
                  <button
                    className="w-32 h-32 bg-blue-500 text-white text-2xl font-semibold rounded-lg"
                    ref={pwdRefs[4]}
                    onClick={() =>
                      handleJudgeLogin(
                        "currentStage",
                        contestInfo.id,
                        location.state.currentJudgeInfo.seatIndex
                      )
                    }
                  >
                    심사진행
                  </button>
                ) : (
                  <button
                    className="w-44 h-24 bg-blue-500 text-white text-2xl font-semibold rounded-lg hidden"
                    ref={pwdRefs[4]}
                  >
                    심사진행
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScoreLogin;
