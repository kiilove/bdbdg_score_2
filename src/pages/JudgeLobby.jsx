"use client";
import { useNavigate } from "react-router-dom";
import {
  useFirebaseRealtimeGetDocument,
  useFirebaseRealtimeUpdateData,
} from "../hooks/useFirebaseRealtime";
import { useEffect } from "react";
import { useContext } from "react";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import { useState } from "react";
import LoadingPage from "./LoadingPage";
import ConfirmationModal from "../messageBox/ConfirmationModal";
import {
  useFirestoreGetDocument,
  useFirestoreQuery,
} from "../hooks/useFirestores";
import { Modal, Button, Card, Space, Collapse, Descriptions } from "antd";
import {
  UserOutlined,
  HomeOutlined,
  SettingOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import CompareVote from "./CompareVote";
import { PointArray } from "../components/PointCard";
import { where } from "firebase/firestore";

const { Panel } = Collapse;

const JudgeLobby = () => {
  const navigate = useNavigate();
  const { currentContest } = useContext(CurrentContestContext);
  const [judgeDisplayInfo, setJudgeDisplayInfo] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [compareCountdown, setCompareCountdown] = useState(5);
  const [loginCountdown, setLoginCountdown] = useState(5);
  const [lobbyStatus, setLobbyStatus] = useState({
    isInitSetting: false,
    isLogined: false,
    isCompared: false,
    isVotedEnd: false,
    navigate: "",
    message: "",
    loadingIcon: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefresh, setIsRefresh] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [message, setMessage] = useState({});
  const [compareVoteOpen, setCompareVoteOpen] = useState(false);
  const [machineId, setMachineId] = useState(null);
  const [contestInfo, setContestInfo] = useState({});
  const [judgeLogined, setJudgeLogined] = useState(false);
  const [judgeScoreEnd, setJudgeScoreEnd] = useState(false);
  const [judgeSign, setJudgeSign] = useState("");
  const [compareStatus, setCompareStatus] = useState({});
  const [judgeCompareVoted, setJudgeCompareVoted] = useState();
  const [navigateType, setNavigateType] = useState("");
  const [cardType, setCardType] = useState("score");
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [localJudgeUid, setLocalJudgeUid] = useState();
  const [currentplayersFinalArray, setCurrentPlayersFinalArray] = useState([]);
  const [currentStagesAssign, setCurrentStagesAssign] = useState({});
  const [currentJudgeAssign, setCurrentJudgeAssign] = useState([]);
  const [currentJudgeInfo, setCurrentJudgeInfo] = useState({});
  const [judgePoolsArray, setJudgePoolsArray] = useState([]);
  const [currentComparesArray, setCurrentComparesArray] = useState([]);
  const [currentStageInfo, setCurrentStageInfo] = useState([]);

  const {
    data: realtimeData,
    loading: realtimeLoading,
    error: realtimeError,
  } = useFirebaseRealtimeGetDocument(
    contestInfo?.id ? `currentStage/${contestInfo.id}` : null
  );
  const updateRealtimeData = useFirebaseRealtimeUpdateData();

  const fetchPlayersFinal = useFirestoreGetDocument("contest_players_final");
  const fetchStagesAssign = useFirestoreGetDocument("contest_stages_assign");
  const fetchJudgeAssign = useFirestoreGetDocument("contest_judges_assign");
  const fetchCompareList = useFirestoreGetDocument("contest_compares_list");
  const fetchJudgePool = useFirestoreQuery();

  const addLog = (logMessage) => {
    setLogs((prevLogs) => [...prevLogs, logMessage]);
  };

  const handleMachineCheck = () => {
    addLog("Machine check started.");
    const savedCurrentContest = JSON.parse(
      localStorage.getItem("currentContest")
    );
    addLog(`Saved Current Contest: ${JSON.stringify(savedCurrentContest)}`);

    const loginedJudgeUid = JSON.parse(localStorage.getItem("loginedUid"));

    let timer;
    timer = setTimeout(() => {
      if (!savedCurrentContest?.contests) {
        setIsLoading(false);
        setMessage({
          body: "기기 초기값이 설정되지 않았습니다.",
          body2: "관리자 로그인페이지로 이동합니다.",
          isButton: true,
          confirmButtonText: "확인",
        });
        setMsgOpen(true);
        addLog("기기 초기값이 설정되지 않음");
      }
    }, 2000);

    if (savedCurrentContest?.contests) {
      clearTimeout(timer);
      setMachineId(savedCurrentContest?.machineId);
      setContestInfo(savedCurrentContest?.contests);
      if (loginedJudgeUid) {
        setLocalJudgeUid(loginedJudgeUid);
        addLog("JudgeUid: " + loginedJudgeUid);
      }
      setIsLoading(false);
    }
  };

  const fetchPool = async (
    stageId,
    judgeAssignId,
    playersFinalId,
    contestId,
    compareListId
  ) => {
    addLog("Fetching pool data...");
    const condition = [where("contestId", "==", contestId)];
    try {
      const stageData = await fetchStagesAssign.getDocument(stageId);
      setCurrentStagesAssign([...stageData.stages]);
      addLog(`Fetched stages: ${JSON.stringify(stageData)}`);

      const judgeData = await fetchJudgeAssign.getDocument(judgeAssignId);
      setCurrentJudgeAssign([...judgeData.judges]);
      addLog(`Fetched judges: ${JSON.stringify(judgeData)}`);

      const playersData = await fetchPlayersFinal.getDocument(playersFinalId);
      setCurrentPlayersFinalArray([
        ...playersData.players.filter((f) => f.playerNoShow === false),
      ]);
      addLog(`Fetched players: ${JSON.stringify(playersData)}`);

      const compareData = await fetchCompareList.getDocument(compareListId);
      if (compareData?.compares?.length > 0) {
        setCurrentComparesArray([...compareData.compares]);
        addLog(`Fetched compares: ${JSON.stringify(compareData)}`);
      }

      const poolData = await fetchJudgePool.getDocuments(
        "contest_judges_pool",
        condition
      );
      setJudgePoolsArray([...poolData]);
      addLog(`Fetched judge pool: ${JSON.stringify(poolData)}`);
    } catch (error) {
      addLog(`Error fetching pool data: ${error.message}`);
    } finally {
      setIsRefresh(false);
    }
  };

  const handleCurrentStageInfo = (
    stageId,
    machineId,
    stagesAssign,
    judgesAssign,
    playersFinalArray,
    comparesArray
  ) => {
    addLog("Handling current stage info...");

    let topPlayers = [];
    let compareMode = "";
    let grades = [];
    let findCurrentStage = {};
    let findCurrentJudge = {};
    let findCurrentCompare = {};

    if (stageId && stagesAssign?.length > 0) {
      findCurrentStage = stagesAssign.find((f) => f.stageId === stageId);
      if (findCurrentStage?.categoryJudgeType === "ranking") {
        setCardType("score");
      } else if (findCurrentStage?.categoryJudgeType === "point") {
        setCardType("point");
      }
      grades = [...findCurrentStage?.grades];

      if (machineId && grades[0].gradeId) {
        findCurrentJudge = judgesAssign.find(
          (f) =>
            f.seatIndex === machineId && f.contestGradeId == grades[0].gradeId
        );
      }
      addLog(`Found current stage: ${JSON.stringify(findCurrentStage)}`);
      addLog(`Found current judge: ${JSON.stringify(findCurrentJudge)}`);
    }

    if (
      realtimeData?.compares?.players?.length > 0 &&
      realtimeData.compares.status.compareIng
    ) {
      topPlayers = [...realtimeData.compares.players];
      compareMode = realtimeData.compares;
      addLog(
        `Real-time comparison in progress: ${JSON.stringify(compareMode)}`
      );
    }

    if (realtimeData?.compares?.compareIndex > 1) {
      findCurrentCompare = currentComparesArray.find(
        (f) => f.compareIndex === realtimeData.compares.compareIndex - 1
      );
      addLog(`Found previous compare: ${JSON.stringify(findCurrentCompare)}`);
    }

    if (
      findCurrentStage &&
      findCurrentJudge &&
      grades.length > 0 &&
      playersFinalArray.length > 0
    ) {
      setCurrentJudgeInfo(findCurrentJudge);
      setCurrentStageInfo(
        makeScoreCard(
          findCurrentStage,
          findCurrentJudge,
          grades,
          playersFinalArray,
          topPlayers,
          findCurrentCompare?.players,
          compareMode
        )
      );
      setIsLoading(false);
      addLog("Stage info successfully processed.");
    } else {
      addLog("Error: Missing stage or judge info.");
    }
  };

  const makeScoreCard = (
    stageInfo,
    judgeInfo,
    grades,
    players,
    topPlayers = [],
    prevComparePlayers = [],
    realtimeComparemode = {}
  ) => {
    const { stageId, stageNumber, categoryJudgeType } = stageInfo;
    const {
      judgeUid,
      judgeName,
      isHead,
      seatIndex,
      contestId,
      onedayPassword,
    } = judgeInfo;

    const judgeSignature = judgePoolsArray.find(
      (f) => f.judgeUid === judgeUid
    )?.judgeSignature;

    const playerPointArray = PointArray.map((point) => {
      const { title } = point;
      return { title, point: undefined };
    });

    const scoreCardInfo = grades.map((grade) => {
      let comparePlayers = [];
      let matchedTopPlayers = [];
      let matchedSubPlayers = [];
      let matchedNormalPlayers = [];
      let matchedExtraPlayers = [];
      let matchedTopRange = [];
      let matchedSubRange = [];
      let matchedNormalRange = [];
      let matchedExtraRange = [];

      const { categoryId, categoryTitle, gradeId, gradeTitle } = grade;

      if (
        realtimeData.compares?.scoreMode === "topOnly" &&
        topPlayers.length > 0
      ) {
        comparePlayers = [...topPlayers];
      }

      if (
        realtimeData.compares?.scoreMode === "topWithSub" &&
        prevComparePlayers.length > 0
      ) {
        comparePlayers = [...prevComparePlayers];
      }

      const filterPlayers = players
        .filter((player) => player.contestGradeId === gradeId)
        .sort((a, b) => a.playerIndex - b.playerIndex);

      let matchedOriginalPlayers = filterPlayers.map((player) => {
        const newPlayers = { ...player, playerScore: 0, playerPointArray };
        return newPlayers;
      });

      const matchedOriginalRange = matchedOriginalPlayers.map(
        (player, pIdx) => {
          return {
            scoreValue: pIdx + 1,
            scoreIndex: pIdx,
            scoreOwner: undefined,
          };
        }
      );

      const filterTopPlayers = filterPlayers.filter((fp) =>
        topPlayers.some((cp) => cp.playerNumber === fp.playerNumber)
      );

      const filterSubPlayers = comparePlayers.filter((fp) =>
        topPlayers.every((cp) => cp.playerNumber !== fp.playerNumber)
      );

      let filterNormalPlayers = [];
      let filterExtraPlayers = [];

      if (
        realtimeComparemode.scoreMode === "topOnly" ||
        realtimeComparemode.scoreMode === "topWithSub"
      ) {
        filterNormalPlayers = [];
        filterExtraPlayers = filterPlayers.filter((fp) =>
          comparePlayers.every((cp) => cp.playerNumber !== fp.playerNumber)
        );
      }

      if (realtimeComparemode.scoreMode === "all") {
        filterNormalPlayers = filterPlayers.filter(
          (fp) => !topPlayers.some((cp) => cp.playerNumber === fp.playerNumber)
        );
      }

      if (filterTopPlayers?.length > 0) {
        const matchedPlayers = filterTopPlayers.map((player) => {
          const newPlayers = { ...player, playerScore: 0, playerPointArray };
          return newPlayers;
        });
        matchedTopPlayers = [...matchedPlayers];
        matchedTopRange = matchedPlayers.map((player, pIdx) => {
          return {
            scoreValue: pIdx + 1,
            scoreIndex: pIdx,
            scoreOwner: undefined,
          };
        });
      }

      if (filterSubPlayers?.length > 0) {
        const matchedPlayers = filterSubPlayers.map((player) => {
          const newPlayers = { ...player, playerScore: 0, playerPointArray };
          return newPlayers;
        });
        matchedSubPlayers = [...matchedPlayers];
        matchedSubRange = matchedPlayers.map((player, pIdx) => {
          return {
            scoreValue: matchedTopPlayers.length + pIdx + 1,
            scoreIndex: matchedTopPlayers.length + pIdx,
            scoreOwner: undefined,
          };
        });
      }

      if (filterNormalPlayers?.length > 0) {
        const matchedPlayers = filterNormalPlayers.map((player) => {
          const newPlayers = { ...player, playerScore: 0, playerPointArray };
          return newPlayers;
        });
        matchedNormalPlayers = [...matchedPlayers];

        matchedNormalRange = matchedPlayers.map((player, pIdx) => {
          return {
            scoreValue:
              matchedTopPlayers.length + matchedSubPlayers.length + pIdx + 1,
            scoreIndex:
              matchedTopPlayers.length + matchedSubPlayers.length + pIdx,
            scoreOwner: undefined,
          };
        });
      }

      if (filterExtraPlayers?.length > 0) {
        const matchedPlayers = filterExtraPlayers.map((player) => {
          const newPlayers = { ...player, playerScore: 1000, playerPointArray };
          return newPlayers;
        });
        matchedExtraPlayers = [...matchedPlayers];
        matchedExtraRange = matchedPlayers.map((player, pIdx) => {
          return {
            scoreValue: 1000,
            scoreIndex: matchedPlayers.length + pIdx,
            scoreOwner: "noId",
          };
        });

        const newMatchedOriginalPlayers = matchedOriginalPlayers.map(
          (player) => {
            const newPlayerScore = matchedExtraPlayers.some(
              (extraPlayer) => extraPlayer.playerNumber === player.playerNumber
            )
              ? 1000
              : player.playerScore;
            return { ...player, playerScore: newPlayerScore };
          }
        );
        matchedOriginalPlayers = [...newMatchedOriginalPlayers];
      }

      if (filterTopPlayers.length === 0 && filterNormalPlayers.length === 0) {
        matchedTopPlayers = [];
        matchedTopRange = [];
        matchedNormalPlayers = [...matchedOriginalPlayers];
        matchedNormalRange = matchedOriginalPlayers.map((player, pIdx) => {
          return {
            scoreValue: pIdx + 1,
            scoreIndex: pIdx,
            scoreOwner: undefined,
          };
        });
      }

      return {
        contestId,
        stageId,
        stageNumber,
        categoryId,
        categoryTitle,
        categoryJudgeType,
        gradeId,
        gradeTitle,
        originalPlayers: matchedOriginalPlayers,
        originalRange: matchedOriginalRange,
        judgeUid,
        judgeName,
        judgeSignature,
        onedayPassword,
        isHead,
        seatIndex,
        matchedTopPlayers,
        matchedTopRange,
        matchedSubPlayers,
        matchedSubRange,
        matchedNormalPlayers,
        matchedNormalRange,
        matchedExtraPlayers,
        matchedExtraRange,
      };
    });

    return scoreCardInfo;
  };

  const handleLoginCheck = (judgeUid, currentJudgeUid) => {
    console.log(judgeUid);
    console.log(currentJudgeUid);
    addLog(
      `Login check started: judgeUid=${judgeUid}, currentJudgeUid=${currentJudgeUid}`
    );

    if (!judgeUid) {
      setJudgeLogined(false);
      addLog("No judgeUid provided, setting judgeLogined to false.");
    }

    if (judgeUid !== currentJudgeUid) {
      setJudgeLogined(false);
      addLog(
        `judgeUid (${judgeUid}) does not match currentJudgeUid (${currentJudgeUid}), setting judgeLogined to false.`
      );
    }

    if (judgeUid === currentJudgeUid) {
      setJudgeLogined(true);
      addLog(
        `judgeUid matches currentJudgeUid (${judgeUid}), setting judgeLogined to true.`
      );
    }
  };

  const handleMsgClose = () => {
    navigate("/setting");
    setMsgOpen(false);
  };
  const injectSignature = (stageInfoArr, signature) =>
    Array.isArray(stageInfoArr)
      ? stageInfoArr.map((s) => ({ ...s, judgeSignature: signature }))
      : stageInfoArr;

  // 🔸 기존 함수를 이걸로 완전히 교체
  const handleNavigate = async ({ actionType }) => {
    console.log("handleNavigate called with actionType:", actionType);
    const collectionInfo = `currentStage/${contestInfo.id}/judges/${
      currentJudgeInfo.seatIndex - 1
    }`;

    console.log("collectionInfo:", collectionInfo);
    console.log(currentJudgeInfo.seatIndex - 1);
    let prevTop = [];

    // ✅ 로비에서 이미 불러온 서명 데이터
    const sigFromLobby =
      judgeDisplayInfo?.signature || currentJudgeInfo?.judgeSignature || null;

    // ✅ 주입된 payload들 (다음 화면으로 넘길 때 사용)
    const payloadJudgeInfo = {
      ...currentJudgeInfo,
      judgeSignature: sigFromLobby,
    };
    const payloadStageInfo = injectSignature(currentStageInfo, sigFromLobby);

    try {
      switch (actionType) {
        case "login": {
          console.log(
            "Navigating to login with currentStageInfo:",
            currentStageInfo
          );
          navigate("/scorelogin", {
            replace: true,
            state: {
              currentStageInfo: payloadStageInfo,
              currentJudgeInfo: payloadJudgeInfo,
              contestInfo,
            },
          });
          break;
        }

        case "point": {
          console.log(
            "Navigating to point table with currentStageInfo:",
            currentStageInfo
          );
          await updateRealtimeData.updateData(collectionInfo, {
            isEnd: false,
            isLogined: true,
            seatIndex: currentJudgeInfo.seatIndex,
          });
          navigate("/autopointtable", {
            replace: true,
            state: {
              currentStageInfo: payloadStageInfo,
              currentJudgeInfo: payloadJudgeInfo,
              contestInfo,
              compareInfo: { ...realtimeData?.compares },
            },
          });
          break;
        }

        case "ranking": {
          console.log(
            "Navigating to score table with currentStageInfo:",
            currentStageInfo
          );
          await updateRealtimeData.updateData(collectionInfo, {
            isEnd: false,
            isLogined: true,
            seatIndex: currentJudgeInfo.seatIndex,
          });
          navigate("/autoscoretable", {
            replace: true,
            state: {
              currentStageInfo: payloadStageInfo,
              currentJudgeInfo: payloadJudgeInfo,
              contestInfo,
              compareInfo: { ...realtimeData?.compares },
            },
          });
          break;
        }

        case "vote": {
          console.log(realtimeData?.compares?.compareIndex);
          console.log(
            "Navigating to vote, checking realtimeData compares:",
            realtimeData?.compares
          );

          if (
            currentComparesArray.length > 0 &&
            currentComparesArray[currentComparesArray.length - 1]?.players
          ) {
            prevTop = [
              ...currentComparesArray[currentComparesArray.length - 1].players,
            ];
          } else {
            prevTop = [];
          }

          console.log("prevTop:", prevTop);

          const collectionInfoVote = `currentStage/${
            contestInfo.id
          }/compares/judges/${currentJudgeInfo.seatIndex - 1}/messageStatus`;

          await updateRealtimeData.updateData(collectionInfoVote, "투표중");
          navigate("/comparevote", {
            replace: true,
            state: {
              currentStageInfo: payloadStageInfo,
              currentJudgeInfo: payloadJudgeInfo,
              contestInfo,
              compareInfo: { ...realtimeData?.compares },
              propSubPlayers: [...prevTop],
            },
          });
          break;
        }

        default:
          console.log("Invalid actionType:", actionType);
          break;
      }
    } catch (error) {
      console.error("Error in handleNavigate:", error);
    }
  };

  useEffect(() => {
    let timer;

    if (realtimeData?.stageId) {
      timer = setInterval(() => {
        setCountdown((prevCount) => {
          if (prevCount < 0) {
            //autoClickFunction();
          }
          return prevCount - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [realtimeData?.stageId]);

  useEffect(() => {
    //console.log(currentJudgeAssign);
    if (
      machineId &&
      currentJudgeAssign?.length > 0 &&
      judgePoolsArray.length > 0
    ) {
      const assignedJudge = currentJudgeAssign.find(
        (j) =>
          j.seatIndex === machineId &&
          j.contestGradeId === realtimeData?.gradeId
      );

      if (assignedJudge) {
        const judgeInfo = judgePoolsArray.find(
          (f) => f.judgeUid === assignedJudge.judgeUid
        );

        if (judgeInfo) {
          setJudgeDisplayInfo({
            name: judgeInfo.judgeName,
            gym: judgeInfo.judgeGym,
            signature: judgeInfo.judgeSignature,
          });
        }
      }
    }
  }, [machineId, currentJudgeAssign, judgePoolsArray, realtimeData]);

  useEffect(() => {
    console.log(contestInfo);
    if (contestInfo?.id && isRefresh) {
      fetchPool(
        contestInfo.contestStagesAssignId,
        contestInfo.contestJudgesAssignId,
        contestInfo.contestPlayersFinalId,
        contestInfo.id,
        contestInfo.contestComparesListId
      );
    }
  }, [contestInfo, isRefresh]);

  useEffect(() => {
    if (realtimeData?.stageId) {
      addLog(`Realtime data detected: ${JSON.stringify(realtimeData)}`);
      setIsLoading(false);
      handleCurrentStageInfo(
        realtimeData.stageId,
        machineId,
        currentStagesAssign,
        currentJudgeAssign,
        currentplayersFinalArray,
        currentComparesArray
      );
    }
    if (realtimeData?.compares) {
      setCompareStatus(() => ({ ...realtimeData.compares.status }));
    }

    if (realtimeData?.compares?.status?.compareStart) {
      setJudgeCompareVoted(
        () => realtimeData.compares.judges[machineId - 1].messageStatus
      );
    }

    if (realtimeData?.judges[machineId - 1]) {
      setJudgeScoreEnd(() => realtimeData?.judges[machineId - 1]?.isEnd);
    }
  }, [
    currentJudgeAssign,
    currentStagesAssign,
    currentplayersFinalArray,
    realtimeData,
  ]);

  useEffect(() => {
    setIsLoading(true);
    if (realtimeData?.stageId) {
      handleCurrentStageInfo(
        realtimeData.stageId,
        machineId,
        currentStagesAssign,
        currentJudgeAssign,
        currentplayersFinalArray,
        currentComparesArray
      );
    }
  }, [realtimeData?.stageId, realtimeData?.compares]);

  useEffect(() => {
    handleMachineCheck();
    setIsRefresh(true);
  }, []);

  useEffect(() => {
    if (localJudgeUid && currentJudgeInfo) {
      handleLoginCheck(localJudgeUid, currentJudgeInfo.judgeUid);
    }
  }, [localJudgeUid, currentJudgeInfo, realtimeData?.judges]);

  return (
    <>
      {isLoading && (
        <div className="flex w-full h-screen justify-center items-center bg-white">
          <LoadingPage />
        </div>
      )}
      <div className="flex w-full h-screen flex-col bg-white">
        <ConfirmationModal
          isOpen={msgOpen}
          message={message}
          onCancel={handleMsgClose}
          onConfirm={handleMsgClose}
        />
        <Modal open={compareVoteOpen} onClose={() => setCompareVoteOpen(false)}>
          <CompareVote />
        </Modal>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8">
          <Space direction="vertical" size="large" className="w-full max-w-4xl">
            {/* JUDGE 번호 카드 */}
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
                  </div>
                )}
              </Space>
            </Card>

            {/* 액션 버튼 영역 */}
            <Card className="shadow-xl border-0">
              <Space
                direction="vertical"
                size="large"
                className="w-full items-center"
              >
                {/* 로그인 전 */}
                {!judgeLogined && (
                  <>
                    <span className="text-xl md:text-2xl text-center font-medium text-gray-700">
                      로그인 페이지로 이동합니다.
                    </span>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => handleNavigate({ actionType: "login" })}
                      className="w-full md:w-auto min-w-[300px] h-16 text-xl font-semibold"
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "none",
                      }}
                    >
                      로그인화면
                    </Button>
                  </>
                )}

                {/* 로그인 후 - 일반 심사 */}
                {judgeLogined &&
                  !compareStatus.compareStart &&
                  !compareStatus.compareIng &&
                  !judgeScoreEnd && (
                    <>
                      <span className="text-xl md:text-2xl text-center font-medium text-gray-700">
                        {realtimeData?.categoryJudgeType === "point"
                          ? "점수형"
                          : "랭킹형"}{" "}
                        심사페이지로 이동합니다.
                      </span>
                      <Button
                        type="primary"
                        size="large"
                        onClick={() =>
                          handleNavigate({
                            actionType: realtimeData?.categoryJudgeType,
                          })
                        }
                        className="w-full md:w-auto min-w-[300px] h-16 text-xl font-semibold"
                        style={{
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                        }}
                      >
                        심사화면으로 이동
                      </Button>
                    </>
                  )}

                {/* 비교심사 진행 중 */}
                {judgeLogined && compareStatus.compareIng && !judgeScoreEnd && (
                  <>
                    <span className="text-xl md:text-2xl text-center font-medium text-gray-700">
                      심사페이지로 이동합니다.
                    </span>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() =>
                        handleNavigate({
                          actionType: realtimeData?.categoryJudgeType,
                        })
                      }
                      className="w-full md:w-auto min-w-[300px] h-16 text-xl font-semibold"
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "none",
                      }}
                    >
                      심사화면으로 이동
                    </Button>
                  </>
                )}

                {/* 비교심사 시작 - 투표 전 */}
                {judgeLogined &&
                  compareStatus.compareStart &&
                  judgeCompareVoted === "확인전" && (
                    <>
                      <span className="text-xl md:text-2xl text-center font-medium text-gray-700">
                        비교심사가 시작됩니다.
                      </span>
                      <span className="text-lg md:text-xl text-center text-gray-600">
                        {realtimeData?.compares?.compareIndex}차 비교심사
                        투표화면으로 이동합니다.
                      </span>
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => handleNavigate({ actionType: "vote" })}
                        className="w-full md:w-auto min-w-[300px] h-16 text-xl font-semibold"
                        style={{
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                        }}
                      >
                        투표화면
                      </Button>
                    </>
                  )}

                {/* 비교심사 시작 - 투표 중 */}
                {judgeLogined &&
                  compareStatus.compareStart &&
                  judgeCompareVoted === "투표중" && (
                    <>
                      <span className="text-xl md:text-2xl text-center font-medium text-gray-700">
                        비교심사 투표가 완료되지 않았습니다.
                      </span>
                      <span className="text-lg md:text-xl text-center text-gray-600">
                        {realtimeData?.compares?.compareIndex}차 비교심사
                        투표화면으로 이동합니다.
                      </span>
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => handleNavigate({ actionType: "vote" })}
                        className="w-full md:w-auto min-w-[300px] h-16 text-xl font-semibold"
                        style={{
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                        }}
                      >
                        투표화면
                      </Button>
                    </>
                  )}

                {/* 비교심사 투표 완료 */}
                {judgeLogined &&
                  compareStatus.compareStart &&
                  judgeCompareVoted === "투표완료" && (
                    <>
                      <span className="text-xl md:text-2xl text-center font-medium text-gray-700">
                        비교심사 투표를 집계중입니다.
                      </span>
                      <span className="text-lg md:text-xl text-center text-gray-600">
                        잠시만 기다려주세요.
                      </span>
                    </>
                  )}

                {/* 집계 중 */}
                {judgeScoreEnd && !compareStatus.compareStart && (
                  <>
                    <span className="text-xl md:text-2xl text-center font-medium text-gray-700">
                      집계중입니다.
                    </span>
                    <span className="text-lg md:text-xl text-center text-gray-600">
                      잠시만 기다려주세요.
                    </span>
                  </>
                )}
              </Space>
            </Card>

            {/* 심판 정보 카드 */}
            {judgeDisplayInfo && (
              <Collapse className="border-0 shadow-md" defaultActiveKey={["1"]}>
                <Panel
                  header={
                    <Space>
                      <UserOutlined />
                      <span>심판 정보</span>
                    </Space>
                  }
                  key="1"
                >
                  <Descriptions column={1}>
                    <Descriptions.Item label="이름">
                      {judgeDisplayInfo.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="서명">
                      {judgeDisplayInfo.signature ? (
                        <img
                          src={judgeDisplayInfo.signature || "/placeholder.svg"}
                          alt="서명"
                          className="w-32 h-20 object-contain border"
                        />
                      ) : (
                        <span className="text-gray-500">
                          서명을 불러오지 못했습니다.
                        </span>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </Panel>
              </Collapse>
            )}
            <Collapse className="border-0 shadow-md mt-4">
              <Panel
                header={
                  <Space>
                    <SettingOutlined />
                    <span>관리자 메뉴</span>
                  </Space>
                }
                key="admin"
              >
                <Space direction="vertical" size="middle" className="w-full">
                  <Button
                    icon={<FileTextOutlined />}
                    onClick={() => setShowLogs(!showLogs)}
                  >
                    {showLogs ? "로그 숨기기" : "로그 보기"}
                  </Button>
                  <Button
                    icon={<HomeOutlined />}
                    onClick={() => navigate("/lobby", { replace: true })}
                  >
                    대기화면 강제이동
                  </Button>
                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => navigate("/setting", { replace: true })}
                  >
                    기기설정
                  </Button>
                </Space>
              </Panel>
            </Collapse>

            {/* 디버그 로그 */}
            {showLogs && (
              <Collapse className="border-0 shadow-md">
                <Panel header="디버그 로그" key="1">
                  <pre className="text-xs overflow-auto max-h-64 bg-gray-100 p-4 rounded">
                    {logs.join("\n")}
                  </pre>
                </Panel>
              </Collapse>
            )}
          </Space>
        </div>
      </div>
    </>
  );
};

export default JudgeLobby;
