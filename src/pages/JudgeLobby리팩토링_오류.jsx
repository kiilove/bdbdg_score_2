import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useFirebaseRealtimeGetDocument,
  useFirebaseRealtimeUpdateData,
} from "../hooks/useFirebaseRealtime";
import {
  useFirestoreGetDocument,
  useFirestoreQuery,
} from "../hooks/useFirestores";
import LoadingPage from "./LoadingPage";
import ConfirmationModal from "../messageBox/ConfirmationModal";
import { Modal } from "@mui/material";
import { PointArray } from "../components/PointCard";
import { where } from "firebase/firestore";

const JudgeLobby = () => {
  const navigate = useNavigate();

  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [msgOpen, setMsgOpen] = useState(false);
  const [message, setMessage] = useState({});
  const [compareVoteOpen, setCompareVoteOpen] = useState(false);

  // 심사 관련 상태
  const [machineId, setMachineId] = useState(null);
  const [contestInfo, setContestInfo] = useState({});
  const [judgeLogined, setJudgeLogined] = useState(false);
  const [judgeScoreEnd, setJudgeScoreEnd] = useState(false);
  const [currentJudgeInfo, setCurrentJudgeInfo] = useState({});

  // 데이터 관련 상태
  const [currentplayersFinalArray, setCurrentPlayersFinalArray] = useState([]);
  const [currentStagesAssign, setCurrentStagesAssign] = useState([]);
  const [currentJudgeAssign, setCurrentJudgeAssign] = useState([]);
  const [judgePoolsArray, setJudgePoolsArray] = useState([]);
  const [currentComparesArray, setCurrentComparesArray] = useState([]);
  const [currentStageInfo, setCurrentStageInfo] = useState([]);

  // 로컬 저장소에서 로그인된 심사위원 UID 가져오기
  const [localJudgeUid, setLocalJudgeUid] = useState("");

  // 실시간 데이터베이스 훅
  const { data: realtimeData, getDocument } = useFirebaseRealtimeGetDocument();
  const updateRealtimeData = useFirebaseRealtimeUpdateData();

  // Firestore 데이터 가져오기 훅
  const fetchPlayersFinal = useFirestoreGetDocument("contest_players_final");
  const fetchStagesAssign = useFirestoreGetDocument("contest_stages_assign");
  const fetchJudgeAssign = useFirestoreGetDocument("contest_judges_assign");
  const fetchCompareList = useFirestoreGetDocument("contest_compares_list");
  const fetchJudgePool = useFirestoreQuery();

  // 기기 및 대회 정보 확인
  const handleMachineCheck = useCallback(() => {
    const savedCurrentContest = localStorage.getItem("currentContest");
    const loginedJudgeUid = localStorage.getItem("loginedUid");
    console.log("handleMachineCheck called");
    console.log("savedCurrentContest:", savedCurrentContest);
    console.log("loginedJudgeUid:", loginedJudgeUid);

    if (savedCurrentContest) {
      const parsedContest = JSON.parse(savedCurrentContest);
      console.log("parsedContest:", parsedContest);
      setMachineId(parsedContest.machineId);
      setContestInfo(parsedContest.contests);
      if (loginedJudgeUid) {
        setJudgeLogined(true);
        setLocalJudgeUid(JSON.parse(loginedJudgeUid));
        console.log("Judge is logged in:", loginedJudgeUid);
      } else {
        setJudgeLogined(false);
      }
    } else {
      setIsLoading(false);
      setMessage({
        body: "기기 초기값이 설정되지 않았습니다.",
        body2: "관리자 로그인페이지로 이동합니다.",
        isButton: true,
        confirmButtonText: "확인",
      });
      setMsgOpen(true);
    }
  }, []);

  // 메시지 모달 닫기
  const handleMsgClose = () => {
    navigate("/adminlogin");
    setMsgOpen(false);
  };

  // Firestore에서 데이터 가져오기
  const fetchPool = useCallback(async () => {
    if (!contestInfo.id) {
      console.warn("contestInfo.id가 없습니다.");
      return;
    }
    console.log("fetchPool called with contestInfo.id:", contestInfo.id);
    const condition = [where("contestId", "==", contestInfo.id)];
    try {
      const [stagesData, judgesData, playersData, comparesData, poolsData] =
        await Promise.all([
          fetchStagesAssign.getDocument(contestInfo.contestStagesAssignId),
          fetchJudgeAssign.getDocument(contestInfo.contestJudgesAssignId),
          fetchPlayersFinal.getDocument(contestInfo.contestPlayersFinalId),
          fetchCompareList.getDocument(contestInfo.contestComparesListId),
          fetchJudgePool.getDocuments("contest_judges_pool", condition),
        ]);

      console.log("stagesData:", stagesData);
      console.log("judgesData:", judgesData);
      console.log("playersData:", playersData);
      console.log("comparesData:", comparesData);
      console.log("poolsData:", poolsData);

      setCurrentStagesAssign(stagesData?.stages || []);
      setCurrentJudgeAssign(judgesData?.judges || []);
      setCurrentPlayersFinalArray(
        playersData?.players.filter((player) => !player.playerNoShow) || []
      );
      setCurrentComparesArray(comparesData?.compares || []);
      setJudgePoolsArray(poolsData || []);
    } catch (error) {
      console.error("Error in fetchPool:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    contestInfo,
    fetchStagesAssign,
    fetchJudgeAssign,
    fetchPlayersFinal,
    fetchCompareList,
    fetchJudgePool,
  ]);

  // 현재 스테이지 정보 처리
  const handleCurrentStageInfo = useCallback(() => {
    console.log("handleCurrentStageInfo called");
    if (!realtimeData) {
      console.warn("realtimeData가 없습니다.");
      return;
    }
    if (!machineId) {
      console.warn("machineId가 없습니다.");
      return;
    }
    console.log("realtimeData:", realtimeData);
    console.log("machineId:", machineId);

    const findCurrentStage = currentStagesAssign.find(
      (stage) => stage.stageId === realtimeData.stageId
    );
    console.log("findCurrentStage:", findCurrentStage);
    if (!findCurrentStage) {
      console.warn("findCurrentStage를 찾을 수 없습니다.");
      return;
    }

    const grades = findCurrentStage.grades || [];
    const grade = grades[0];
    if (!grade) {
      console.warn("grade가 없습니다.");
      return;
    }
    console.log("grade:", grade);

    const findCurrentJudge = currentJudgeAssign.find(
      (judge) =>
        judge.seatIndex === machineId && judge.contestGradeId === grade.gradeId
    );
    console.log("findCurrentJudge:", findCurrentJudge);
    if (!findCurrentJudge) {
      console.warn("findCurrentJudge를 찾을 수 없습니다.");
      return;
    }

    setCurrentJudgeInfo(findCurrentJudge);

    const scoreCard = makeScoreCard(
      findCurrentStage,
      findCurrentJudge,
      grades,
      currentplayersFinalArray
    );
    console.log("scoreCard:", scoreCard);
    setCurrentStageInfo(scoreCard);
  }, [
    realtimeData,
    machineId,
    currentStagesAssign,
    currentJudgeAssign,
    currentplayersFinalArray,
  ]);

  // 심사 카드 생성 함수
  const makeScoreCard = (stageInfo, judgeInfo, grades, players) => {
    console.log("makeScoreCard called");
    // 필요한 데이터 추출
    const { stageId, stageNumber, categoryJudgeType } = stageInfo;
    const { judgeUid, judgeName, isHead, seatIndex, contestId } = judgeInfo;

    const judgePool = judgePoolsArray.find(
      (judge) => judge.judgeUid === judgeUid
    );
    console.log("judgePool:", judgePool);
    const judgeSignature = judgePool?.judgeSignature || "";

    // 점수 배열 초기화
    const playerPointArray = PointArray.map((point) => ({
      title: point.title,
      point: undefined,
    }));

    // 등급별로 선수 매칭
    const result = grades.map((grade) => {
      const { gradeId, gradeTitle, categoryId, categoryTitle } = grade;
      const filteredPlayers = players.filter(
        (player) => player.contestGradeId === gradeId
      );
      console.log("filteredPlayers for gradeId", gradeId, ":", filteredPlayers);

      const matchedPlayers = filteredPlayers.map((player) => ({
        ...player,
        playerScore: 0,
        playerPointArray,
      }));

      return {
        contestId,
        stageId,
        stageNumber,
        categoryId,
        categoryTitle,
        categoryJudgeType,
        gradeId,
        gradeTitle,
        judgeUid,
        judgeName,
        judgeSignature,
        isHead,
        seatIndex,
        matchedPlayers,
      };
    });

    console.log("makeScoreCard result:", result);
    return result;
  };

  // 네비게이션 처리 함수
  const handleNavigate = useCallback(
    async (actionType) => {
      console.log("handleNavigate called with actionType:", actionType);
      if (!contestInfo || !currentJudgeInfo) {
        console.error(
          "contestInfo 또는 currentJudgeInfo가 정의되지 않았습니다."
        );
        return;
      }
      const collectionInfo = `currentStage/${contestInfo.id}/judges/${
        currentJudgeInfo.seatIndex - 1
      }`;

      try {
        switch (actionType) {
          case "login":
            console.log("Navigating to /scorelogin");
            navigate("/scorelogin", {
              replace: true,
              state: { currentStageInfo, currentJudgeInfo, contestInfo },
            });
            break;
          case "point":
            console.log(
              "Updating realtimeData and navigating to /autopointtable"
            );
            await updateRealtimeData.updateData(collectionInfo, {
              isEnd: false,
              isLogined: true,
              seatIndex: currentJudgeInfo.seatIndex,
            });
            navigate("/autopointtable", {
              replace: true,
              state: {
                currentStageInfo,
                currentJudgeInfo,
                contestInfo,
                compareInfo: { ...realtimeData?.compares },
              },
            });
            break;
          case "ranking":
            console.log(
              "Updating realtimeData and navigating to /autoscoretable"
            );
            await updateRealtimeData.updateData(collectionInfo, {
              isEnd: false,
              isLogined: true,
              seatIndex: currentJudgeInfo.seatIndex,
            });
            navigate("/autoscoretable", {
              replace: true,
              state: {
                currentStageInfo,
                currentJudgeInfo,
                contestInfo,
                compareInfo: { ...realtimeData?.compares },
              },
            });
            break;
          default:
            console.warn("Unknown actionType:", actionType);
            break;
        }
      } catch (error) {
        console.error("Error in handleNavigate:", error);
      }
    },
    [
      navigate,
      contestInfo,
      currentJudgeInfo,
      currentStageInfo,
      realtimeData,
      updateRealtimeData,
    ]
  );

  // 효과 처리
  useEffect(() => {
    console.log("useEffect - handleMachineCheck");
    handleMachineCheck();
  }, [handleMachineCheck]);

  useEffect(() => {
    console.log("useEffect - fetchPool");
    fetchPool();
  }, [fetchPool]);

  useEffect(() => {
    console.log("useEffect - handleCurrentStageInfo");
    handleCurrentStageInfo();
  }, [handleCurrentStageInfo]);

  useEffect(() => {
    console.log("useEffect - realtimeData changed");
    console.log("realtimeData:", realtimeData);
    if (realtimeData?.judges && machineId) {
      const judgeData = realtimeData.judges[machineId - 1];
      console.log("judgeData:", judgeData);
      setJudgeScoreEnd(judgeData?.isEnd || false);
    }
  }, [realtimeData, machineId]);

  useEffect(() => {
    console.log("useEffect - contestInfo.id changed:", contestInfo?.id);
    if (contestInfo?.id) {
      const interval = setInterval(() => {
        console.log("Fetching realtimeData...");
        getDocument(`currentStage/${contestInfo.id}`);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [getDocument, contestInfo]);

  return (
    <>
      {isLoading ? (
        <div className="flex w-full h-screen justify-center items-center bg-white">
          <LoadingPage />
        </div>
      ) : (
        <div className="flex w-full h-screen flex-col bg-white justify-center items-start">
          <div className="flex w-full h-14 justify-end items-center px-5 gap-x-2">
            <button
              className="flex border px-5 py-2 rounded-lg"
              onClick={() => navigate("/lobby", { replace: true })}
            >
              대기화면 강제이동
            </button>
            <button
              className="flex border px-5 py-2 rounded-lg"
              onClick={() => navigate("/setting", { replace: true })}
            >
              기기설정
            </button>
          </div>
          <div className="flex text-xl font-bold bg-gray-100 w-full justify-center items-center text-gray-700 flex-col h-screen">
            <ConfirmationModal
              isOpen={msgOpen}
              message={message}
              onCancel={handleMsgClose}
              onConfirm={handleMsgClose}
            />
            <Modal
              open={compareVoteOpen}
              onClose={() => setCompareVoteOpen(false)}
            >
              {/* 필요한 컴포넌트 삽입 */}
            </Modal>
            <div className="flex w-full justify-center items-center h-auto py-20">
              <span className="text-7xl font-sans font-bold text-gray-800">
                JUDGE
              </span>
              <span className="text-7xl font-sans font-bold text-gray-800 ml-2">
                {machineId}
              </span>
            </div>
            <div className="flex w-full justify-center items-center h-auto">
              {realtimeData && (
                <span className="text-3xl font-sans font-bold text-gray-800">
                  {realtimeData.categoryTitle}({realtimeData.gradeTitle})
                </span>
              )}
            </div>
            <div className="flex w-full justify-center items-center h-auto py-20">
              <div className="flex w-full justify-start items-center flex-col">
                {/* 심사 상태에 따른 화면 렌더링 */}
                {judgeLogined ? (
                  <div className="flex flex-col items-center gap-y-2">
                    <span className="text-2xl h-10">
                      {realtimeData?.categoryJudgeType === "point"
                        ? "점수형"
                        : "랭킹형"}{" "}
                      심사페이지로 이동합니다.
                    </span>
                    <button
                      onClick={() =>
                        handleNavigate(realtimeData?.categoryJudgeType)
                      }
                      className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md w-68 h-20 flex justify-center items-center"
                    >
                      <span>심사화면으로 이동</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-y-2">
                    <span className="text-2xl h-10">
                      로그인 페이지로 이동합니다.
                    </span>
                    <button
                      onClick={() => handleNavigate("login")}
                      className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md w-68 h-20 flex justify-center items-center"
                    >
                      <span>로그인화면</span>
                    </button>
                  </div>
                )}
                {judgeScoreEnd && (
                  <div className="flex flex-col items-center gap-y-2">
                    <span className="text-2xl h-10">집계중입니다.</span>
                    <span className="text-2xl h-10">잠시만 기다려주세요.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JudgeLobby;
