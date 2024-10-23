import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useFirebaseRealtimeGetDocument,
  useFirebaseRealtimeUpdateData,
} from "../hooks/useFirebaseRealtime";
import { useEffect } from "react";
import { debounce } from "lodash";
import { useContext } from "react";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import { useState } from "react";
import LoadingPage from "./LoadingPage";
import ConfirmationModal from "../messageBox/ConfirmationModal";
import { FaSpinner } from "react-icons/fa";
import { CgSpinner } from "react-icons/cg";
import {
  useFirestoreGetDocument,
  useFirestoreQuery,
} from "../hooks/useFirestores";
import { Modal } from "@mui/material";
import CompareVote from "./CompareVote";
import { PointArray } from "../components/PointCard";
import { where } from "firebase/firestore";

const JudgeLobby = () => {
  const navigate = useNavigate();
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

  const fetchPool = async (
    stageId,
    judgeAssignId,
    playersFinalId,
    contestId,
    compareListId
  ) => {
    const condition = [where("contestId", "==", contestId)];
    try {
      await fetchStagesAssign
        .getDocument(stageId)
        .then((data) => setCurrentStagesAssign([...data.stages]));

      await fetchJudgeAssign.getDocument(judgeAssignId).then((data) => {
        setCurrentJudgeAssign([...data.judges]);
      });

      await fetchPlayersFinal
        .getDocument(playersFinalId)
        .then((data) =>
          setCurrentPlayersFinalArray([
            ...data.players.filter((f) => f.playerNoShow === false),
          ])
        );

      await fetchCompareList.getDocument(compareListId).then((data) => {
        if (data?.compares?.length > 0) {
          console.log(data);
          setCurrentComparesArray(() => [...data.compares]);
        }
      });
      await fetchJudgePool
        .getDocuments("contest_judges_pool", condition)
        .then((data) => {
          console.log(data);
          setJudgePoolsArray([...data]);
        });
    } catch (error) {
      console.log(error);
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
    let topPlayers = [];
    let compareMode = "";
    let grades = [];
    let findCurrentStage = {};
    let findCurrentJudge = {};
    let findCurrentCompare = {};

    if (stageId && stagesAssign?.length > 0) {
      findCurrentStage = stagesAssign.find((f) => f.stageId === stageId);
      //console.log(findCurrentStage);
      if (findCurrentStage?.categoryJudgeType === "ranking") {
        setCardType(() => "score");
      }
      if (findCurrentStage?.categoryJudgeType === "point") {
        setCardType(() => "point");
      }
      grades = [...findCurrentStage?.grades];

      if (machineId && grades[0].gradeId) {
        findCurrentJudge = judgesAssign.find(
          (f) =>
            f.seatIndex === machineId && f.contestGradeId == grades[0].gradeId
        );
      }
    }

    //    console.log(realtimeData?.compares?.players);
    if (
      realtimeData?.compares?.players?.length > 0 &&
      realtimeData.compares.status.compareIng
    ) {
      topPlayers = [...realtimeData.compares.players];
      // console.log(topPlayers);
      compareMode = realtimeData.compares;
    }

    if (realtimeData?.compares?.compareIndex > 1) {
      //이전 회차 top선수를 찾아야하므로 -1 되어야 한다.
      findCurrentCompare = currentComparesArray.find(
        (f) => f.compareIndex === realtimeData.compares.compareIndex - 1
      );
      console.log(findCurrentCompare);
    }

    if (
      findCurrentStage &&
      findCurrentJudge &&
      grades.length > 0 &&
      playersFinalArray.length > 0
    ) {
      setCurrentJudgeInfo(() => ({ ...findCurrentJudge }));
      setCurrentStageInfo([
        ...makeScoreCard(
          findCurrentStage,
          findCurrentJudge,
          grades,
          playersFinalArray,
          topPlayers,
          findCurrentCompare?.players,
          compareMode
        ),
      ]);
      setIsLoading(false);
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

    // 점수형에 필요한 정보를 초기화해서 선수 각자에게 부여한후 넘어간다.
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

      // topOnly 설정인 경우
      if (
        realtimeData.compares?.scoreMode === "topOnly" &&
        topPlayers.length > 0
      ) {
        comparePlayers = [...topPlayers];
      }

      // topWithSub 설정인 경우
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

      let matchedOriginalRange = matchedOriginalPlayers.map((player, pIdx) => {
        return {
          scoreValue: pIdx + 1,
          scoreIndex: pIdx,
          scoreOwner: undefined,
        };
      });

      const filterTopPlayers = filterPlayers.filter((fp) =>
        topPlayers.some((cp) => cp.playerNumber === fp.playerNumber)
      );

      // 다회차 비교심사의 경우 이전 회차 선수들 처리
      const filterSubPlayers = comparePlayers.filter((fp) =>
        topPlayers.every((cp) => cp.playerNumber !== fp.playerNumber)
      );

      let filterNormalPlayers = [];
      let filterExtraPlayers = [];

      // 'topOnly'와 'topWithSub' 모드 처리
      if (
        realtimeComparemode.scoreMode === "topOnly" ||
        realtimeComparemode.scoreMode === "topWithSub"
      ) {
        filterNormalPlayers = [];
        filterExtraPlayers = filterPlayers.filter((fp) =>
          comparePlayers.every((cp) => cp.playerNumber !== fp.playerNumber)
        );
      }

      // 'all' 모드에서 top에 속한 선수를 제외하고 normal을 생성
      if (realtimeComparemode.scoreMode === "all") {
        filterNormalPlayers = filterPlayers.filter(
          (fp) => !topPlayers.some((cp) => cp.playerNumber === fp.playerNumber)
        );
      }

      // top 범주 처리
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

      // sub 범주 처리
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

      // normal 범주 처리
      if (filterNormalPlayers?.length > 0) {
        const matchedPlayers = filterNormalPlayers.map((player) => {
          const newPlayers = { ...player, playerScore: 0, playerPointArray };
          return newPlayers;
        });
        matchedNormalPlayers = [...matchedPlayers];

        // scoreValue는 topPlayers와 subPlayers에 이어서 할당
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

      // extra 범주 처리 (top, normal에 속하지 않는 선수)
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

        // matchedOriginalPlayers에서 1000등으로 설정
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

      // top과 normal이 없는 경우
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

  const handleMachineCheck = () => {
    const savedCurrentContest = localStorage.getItem("currentContest");
    const loginedJudgeUid = localStorage.getItem("loginedUid");

    // 타이머 변수를 선언합니다.
    let timer;

    if (savedCurrentContest) {
      // 타이머가 설정되었다면 중단시킴
      if (timer) clearTimeout(timer);

      // currentContest가 존재할 경우 설정값들을 가져옴
      setMachineId(JSON.parse(savedCurrentContest).machineId);
      setContestInfo(JSON.parse(savedCurrentContest).contests);

      if (loginedJudgeUid) {
        // loginedJudgeUid가 있을 경우 로컬 상태로 저장
        setLocalJudgeUid(JSON.parse(loginedJudgeUid));
      }
    } else {
      // currentContest가 없을 경우 타이머를 설정하여 2초 후에 메시지와 함께 이동 로직 실행
      timer = setTimeout(() => {
        setIsLoading(false);
        setMessage({
          body: "기기 초기값이 설정되지 않았습니다.",
          body2: "관리자 로그인페이지로 이동합니다.",
          isButton: true,
          confirmButtonText: "확인",
        });
        setMsgOpen(true);
      }, 2000); // 2초 후에 메시지를 출력
    }
  };

  const handleLoginCheck = (judgeUid, currentJudgeUid) => {
    if (!judgeUid) {
      setJudgeLogined(false);
    }

    if (judgeUid !== currentJudgeUid) {
      setJudgeLogined(false);
    }

    if (judgeUid === currentJudgeUid) {
      setJudgeLogined(true);
    }
  };

  const handleMsgClose = () => {
    navigate("/adminlogin");
    setMsgOpen(false);
  };

  const handleNavigate = async ({ actionType }) => {
    console.log("handleNavigate called with actionType:", actionType); // 콘솔 로그 추가
    const collectionInfo = `currentStage/${contestInfo.id}/judges/${
      currentJudgeInfo.seatIndex - 1
    }`;

    console.log("collectionInfo:", collectionInfo); // 콘솔 로그 추가
    console.log(currentJudgeInfo.seatIndex - 1);
    let prevTop = [];

    try {
      switch (actionType) {
        case "login":
          console.log(
            "Navigating to login with currentStageInfo:",
            currentStageInfo
          );
          navigate("/scorelogin", {
            replace: true,
            state: { currentStageInfo, currentJudgeInfo, contestInfo },
          });
          break;

        case "point":
          console.log(
            "Navigating to point table with currentStageInfo:",
            currentStageInfo
          );
          await updateRealtimeData
            .updateData(collectionInfo, {
              isEnd: false,
              isLogined: true,
              seatIndex: currentJudgeInfo.seatIndex,
            })
            .then(() =>
              navigate("/autopointtable", {
                replace: true,
                state: {
                  currentStageInfo,
                  currentJudgeInfo,
                  contestInfo,
                  compareInfo: { ...realtimeData?.compares },
                },
              })
            );
          break;

        case "ranking":
          console.log(
            "Navigating to score table with currentStageInfo:",
            currentStageInfo
          );
          await updateRealtimeData
            .updateData(collectionInfo, {
              isEnd: false,
              isLogined: true,
              seatIndex: currentJudgeInfo.seatIndex,
            })
            .then(() =>
              navigate("/autoscoretable", {
                replace: true,
                state: {
                  currentStageInfo,
                  currentJudgeInfo,
                  contestInfo,
                  compareInfo: { ...realtimeData?.compares },
                },
              })
            );
          break;

        case "vote":
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
            prevTop = []; // prevTop을 빈 배열로 초기화
          }

          console.log("prevTop:", prevTop); // 콘솔 로그 추가

          const collectionInfoVote = `currentStage/${
            contestInfo.id
          }/compares/judges/${currentJudgeInfo.seatIndex - 1}/messageStatus`;

          try {
            await updateRealtimeData
              .updateData(collectionInfoVote, "투표중")
              .then((data, error) => {
                console.log("error", error);
                console.log("updated", data);
                navigate("/comparevote", {
                  replace: true,
                  state: {
                    currentStageInfo,
                    currentJudgeInfo,
                    contestInfo,
                    compareInfo: { ...realtimeData?.compares },
                    propSubPlayers: [...prevTop], // 추가된 prevTop 확인
                  },
                });
              });
          } catch (error) {
            console.error("Error during updateRealtimeData:", error); // 예외 발생 시 오류 출력
          }
          break;

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

    return () => clearInterval(timer); // cleanup
  }, [realtimeData?.stageId]);

  // useEffect(() => {
  //   if (realtimeData) {
  //     // 데이터가 변경되면 처리할 로직 추가
  //     setCurrentStageInfo(realtimeData);
  //   }
  // }, [realtimeData]);

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
      // console.log(judgeScoreEnd);
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

  useEffect(() => {
    console.log(currentStageInfo);
  }, [currentStageInfo]);

  return (
    <>
      {isLoading && (
        <div className="flex w-full h-screen justify-center items-center bg-white">
          <LoadingPage />
        </div>
      )}
      <div className="flex w-full h-screen flex-col bg-white justify-center items-start ">
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
        <div className="flex text-xl font-bold  bg-gray-100 w-full justify-center items-center text-gray-700 flex-col  h-screen ">
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
            <CompareVote />
          </Modal>
          <div className="flex w-full justify-center items-center h-auto py-20 ">
            <span className="text-7xl font-sans font-bold text-gray-800">
              JUDGE
            </span>
            <span className="text-7xl font-sans font-bold text-gray-800 ml-2">
              {machineId}
            </span>
          </div>
          <div className="flex w-full justify-center items-center h-auto ">
            {realtimeData !== null && (
              <span className="text-3xl font-sans font-bold text-gray-800">
                {realtimeData?.categoryTitle}({realtimeData?.gradeTitle})
              </span>
            )}
          </div>
          <div className="flex w-full justify-center items-center h-auto py-20">
            <div className="flex w-full justify-start items-center flex-col">
              {judgeLogined &&
                !compareStatus.compareStart &&
                !compareStatus.compareIng &&
                !judgeScoreEnd && (
                  <div className="flex flex-col items-center gap-y-2">
                    <span className="text-2xl h-10">
                      {realtimeData?.categoryJudgeType === "point"
                        ? "점수형"
                        : "랭킹형"}{" "}
                      심사페이지로 이동합니다.
                    </span>
                    <button
                      onClick={() =>
                        handleNavigate({
                          actionType: realtimeData?.categoryJudgeType,
                        })
                      }
                      className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                    >
                      <div className="flex w-full">
                        <span>심사화면으로 이동</span>
                      </div>
                      {/* <div className="flex  justify-center items-center w-20 h-20 relative">
                        <CgSpinner
                          className="animate-spin w-16 h-16 "
                          style={{ animationDuration: "1.5s" }}
                        />
                        <span className="absolute inset-0 flex justify-center items-center">
                          {countdown}
                        </span>
                      </div> */}
                    </button>
                  </div>
                )}
              {judgeLogined && compareStatus.compareIng && !judgeScoreEnd && (
                <div className="flex flex-col items-center gap-y-2">
                  <span className="text-2xl h-10">
                    심사페이지로 이동합니다.
                  </span>
                  <button
                    onClick={() =>
                      handleNavigate({
                        actionType: realtimeData?.categoryJudgeType,
                      })
                    }
                    className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                  >
                    <div className="flex w-full">
                      <span>심사화면으로 이동</span>
                    </div>
                    {/* <div className="flex  justify-center items-center w-20 h-20 relative">
                      <CgSpinner
                        className="animate-spin w-16 h-16 "
                        style={{ animationDuration: "1.5s" }}
                      />
                      <span className="absolute inset-0 flex justify-center items-center">
                        {countdown}
                      </span>
                    </div> */}
                  </button>
                </div>
              )}
              {!judgeLogined && (
                <div className="flex flex-col items-center gap-y-2">
                  <span className="text-2xl h-10">
                    로그인 페이지로 이동합니다.
                  </span>
                  <button
                    onClick={() => handleNavigate({ actionType: "login" })}
                    className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                  >
                    <div className="flex w-full">
                      <span>로그인화면</span>
                    </div>
                    {/* <div className="flex  justify-center items-center w-20 h-20 relative">
                      <CgSpinner
                        className="animate-spin w-16 h-16 "
                        style={{ animationDuration: "1.5s" }}
                      />
                      <span className="absolute inset-0 flex justify-center items-center">
                        {countdown}
                      </span>
                    </div> */}
                  </button>
                </div>
              )}
              {judgeLogined &&
                compareStatus.compareStart &&
                judgeCompareVoted === "확인전" && (
                  <div className="flex flex-col items-center gap-y-2">
                    <span className="text-2xl h-10">
                      비교심사가 시작됩니다.
                    </span>
                    <span className="text-2xl h-10">
                      {realtimeData?.compares?.compareIndex}차 비교심사
                      투표화면으로 이동합니다.
                    </span>
                    <button
                      onClick={() => handleNavigate({ actionType: "vote" })}
                      className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                    >
                      <div className="flex w-full">
                        <span>투표화면</span>
                      </div>
                      {/* <div className="flex  justify-center items-center w-20 h-20 relative">
                        <CgSpinner
                          className="animate-spin w-16 h-16 "
                          style={{ animationDuration: "1.5s" }}
                        />
                        <span className="absolute inset-0 flex justify-center items-center">
                          {countdown}
                        </span>
                      </div> */}
                    </button>
                  </div>
                )}
              {judgeLogined &&
                compareStatus.compareStart &&
                judgeCompareVoted === "투표중" && (
                  <div className="flex flex-col items-center gap-y-2">
                    <span className="text-2xl h-10">
                      비교심사 투표가 완료되지 않았습니다.
                    </span>
                    <span className="text-2xl h-10">
                      {realtimeData?.compares?.compareIndex}차 비교심사
                      투표화면으로 이동합니다.
                    </span>
                    <button
                      onClick={() => handleNavigate({ actionType: "vote" })}
                      className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                    >
                      <div className="flex w-full">
                        <span>투표화면</span>
                      </div>
                      {/* <div className="flex  justify-center items-center w-20 h-20 relative">
                        <CgSpinner
                          className="animate-spin w-16 h-16 "
                          style={{ animationDuration: "1.5s" }}
                        />
                        <span className="absolute inset-0 flex justify-center items-center">
                          {countdown}
                        </span>
                      </div> */}
                    </button>
                  </div>
                )}
              {judgeLogined &&
                compareStatus.compareStart &&
                judgeCompareVoted === "투표완료" && (
                  <div className="flex flex-col items-center gap-y-2">
                    <span className="text-2xl h-10">
                      비교심사 투표를 집계중입니다.
                    </span>
                    <span className="text-2xl h-10">잠시만 기다려주세요.</span>
                  </div>
                )}
              {judgeScoreEnd && !compareStatus.compareStart && (
                <div className="flex flex-col items-center gap-y-2">
                  <span className="text-2xl h-10">집계중입니다.</span>
                  <span className="text-2xl h-10">잠시만 기다려주세요.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JudgeLobby;
