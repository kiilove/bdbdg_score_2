"use client";

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useFirebaseRealtimeGetDocument,
  useFirebaseRealtimeUpdateData,
} from "../hooks/useFirebaseRealtime";
import { handleMachineCheck } from "../functions/functions";
import ConfirmationModal from "../messageBox/ConfirmationModal";
import LoadingPage from "./LoadingPage";
import { Button, Input, Alert, Card, Space } from "antd";
import { ArrowLeftOutlined, LoginOutlined } from "@ant-design/icons";

const ScoreLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [msgOpen, setMsgOpen] = useState(false);
  const [message, setMessage] = useState({});
  const [machineId, setMachineId] = useState(null);
  const [contestInfo, setContestInfo] = useState({});
  const [missingData, setMissingData] = useState([]);
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
      return;
    }

    setPasswordInputs((prevState) =>
      prevState.map((input, i) => (i === index ? value : input))
    );

    if (value) {
      if (index < pwdRefs.length - 1 && pwdRefs[index + 1].current) {
        pwdRefs[index + 1].current.focus();
      }
    } else {
      if (index > 0 && pwdRefs[index - 1].current) {
        pwdRefs[index - 1].current.focus();
      }
    }

    if (passwordInputs.join("").length === 4) {
      if (pwdRefs[pwdRefs.length - 1].current) {
        pwdRefs[pwdRefs.length - 1].current.blur();
      }
      if (pwdRefs[4]?.current) {
        pwdRefs[4].current.focus();
      }
    }
  };

  const handleKeyDown = (index, refPrev, e) => {
    if (e.key === "Backspace" && e.target.value === "") {
      if (refPrev && refPrev.current) {
        refPrev.current.focus();
      }
    }

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
    checkMissingData();
    console.log(checkMissingData());
    console.log(location);
    realtimeData?.categoryTitle && setIsLoading(false);
  }, [realtimeData, contestInfo]);

  useEffect(() => {
    if (
      realtimeData &&
      location?.state?.currentStageInfo[0].stageId !== undefined &&
      realtimeData?.stageId !== location?.state?.currentStageInfo[0].stageId
    ) {
      navigate("/lobby", { replace: true });
    }
  }, [realtimeData, location.state.currentStageInfo]);

  return (
    <>
      {isLoading && (
        <div className="flex w-full h-screen justify-center items-center">
          <LoadingPage />
        </div>
      )}
      {!isLoading && (
        <div className="flex w-full min-h-screen flex-col bg-white p-8">
          <ConfirmationModal
            isOpen={msgOpen}
            message={message}
            onCancel={() => setMsgOpen(false)}
            onConfirm={() => setMsgOpen(false)}
          />

          {missingData.length > 0 && (
            <Alert
              message="누락된 데이터"
              description={`누락된 데이터: ${missingData.join(", ")}`}
              type="error"
              showIcon
              className="mb-6"
            />
          )}

          <div className="flex justify-center mb-8">
            <Button
              icon={<ArrowLeftOutlined />}
              size="large"
              onClick={() => navigate("/lobby")}
              className="min-w-[180px]"
            >
              되돌아가기
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center mb-8">
            <Card
              className="text-center shadow-2xl border-0"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <Space direction="vertical" size="large" className="w-full">
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="text-white text-4xl md:text-5xl font-light tracking-wider">
                    JUDGE
                  </span>
                  <span className="text-white text-8xl md:text-9xl font-bold tracking-tight">
                    {machineId}
                  </span>
                </div>
                {realtimeData !== null && (
                  <div className="pt-4 border-t border-white/30">
                    <span className="text-white text-2xl md:text-3xl font-medium">
                      {realtimeData?.categoryTitle} ({realtimeData?.gradeTitle})
                    </span>
                    <div className="text-white text-lg font-medium opacity-70 mt-2">
                      비밀번호:{" "}
                      {location?.state?.currentStageInfo[0].onedayPassword}
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          </div>

          <div className="flex flex-col items-center justify-center gap-8">
            <div className="text-2xl font-semibold text-gray-700 mb-4">
              비밀번호를 입력하세요
            </div>

            <div className="flex gap-4 items-center">
              {passwordInputs.map((value, index) => (
                <Input
                  key={index}
                  ref={pwdRefs[index]}
                  type="number"
                  maxLength={1}
                  value={value}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => handleKeyDown(index, pwdRefs[index - 1], e)}
                  onChange={(e) => handleInputs(index, e.target.value)}
                  className="w-24 h-24 text-center text-5xl font-bold"
                  style={{
                    fontSize: "3rem",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                />
              ))}
            </div>

            {passwordInputs.join("") ===
              location?.state?.currentStageInfo[0].onedayPassword && (
              <Button
                ref={pwdRefs[4]}
                type="primary"
                size="large"
                icon={<LoginOutlined />}
                onClick={() =>
                  handleJudgeLogin(
                    "currentStage",
                    contestInfo.id,
                    location.state.currentJudgeInfo.seatIndex
                  )
                }
                className="min-w-[200px] h-16 text-2xl font-semibold"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}
              >
                심사진행
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ScoreLogin;
