import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useNavigation } from "react-router-dom";
import {
  useFirestoreAddData,
  useFirestoreDeleteData,
  useFirestoreGetDocument,
  useFirestoreQuery,
} from "../hooks/useFirestores";

import { AiFillLock, AiFillMinusCircle } from "react-icons/ai";
import YbbfLogo from "../assets/img/ybbf_logo.png";
import { where } from "firebase/firestore";
import CanvasWithImageData from "../components/CanvasWithImageData";

import {
  useFirebaseRealtimeGetDocument,
  useFirebaseRealtimeUpdateData,
} from "../hooks/useFirebaseRealtime";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import LoadingPage from "./LoadingPage";
import { generateUUID } from "../functions/functions";
import AddedModal from "../messageBox/AddedModal";
import { Modal } from "@mui/material";
import CompareSetting from "../modals/CompareSetting";
import { debounce } from "lodash";
import ConfirmationModal from "../messageBox/ConfirmationModal";

const AutoScoreTable = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [judgeInfo, setJudgeInfo] = useState({});
  const [playersFinalArray, setPlayersFinalArray] = useState([]);
  const [topPlayersArray, setTopPlayersArray] = useState([]);

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareSettingOpen, setCompareSettingOpen] = useState(false);

  const [msgOpen, setMsgOpen] = useState(false);
  const [message, setMessage] = useState({
    delete: "wait",
    add: "wait",
    validate: "wait",
  });

  const [compareMsgOpen, setCompareMsgOpen] = useState(false);
  const [validateScoreCard, setValidateScoreCard] = useState(true);

  const [currentStageInfo, setCurrentStageInfo] = useState([]);

  const { currentContest } = useContext(CurrentContestContext);

  const fetchPlayersFinal = useFirestoreGetDocument("contest_players_final");
  const deleteScoreCard = useFirestoreDeleteData(location.state.collectionName);
  const addScoreCard = useFirestoreAddData(location.state.collectionName);
  const fetchScoreCardQuery = useFirestoreQuery();
  const {
    data: compareData,
    loading,
    error,
    getDocument,
  } = useFirebaseRealtimeGetDocument();

  const updateRealTimeJudgeMessage = useFirebaseRealtimeUpdateData();

  // 심사전인지 후인지 체크하여 state값 변경함
  const handleScore = (playerUid, scoreValue, stageInfoIndex, actionType) => {
    let newScoreValue = scoreValue;
    let newPlayerUid = playerUid;

    if (actionType === "unScore") {
      newScoreValue = 0;
      newPlayerUid = undefined;
    }
    const newCurrentStageInfo = [...currentStageInfo];
    const newOriginalPlayers = [
      ...newCurrentStageInfo[stageInfoIndex].originalPlayers,
    ];
    const newMatchedTopPlayers = [
      ...newCurrentStageInfo[stageInfoIndex].matchedTopPlayers,
    ];

    if (newMatchedTopPlayers.length > 0) {
      setIsHolding(true);
    }
    const newMatchedNormalPlayers = [
      ...newCurrentStageInfo[stageInfoIndex].matchedNormalPlayers,
    ];
    const playerArrayIndex = newOriginalPlayers.findIndex(
      (f) => f.playerUid === playerUid
    );
    const topPlayerArrayIndex = newMatchedTopPlayers.findIndex(
      (f) => f.playerUid === playerUid
    );
    const normalPlayerArrayIndex = newMatchedNormalPlayers.findIndex(
      (f) => f.playerUid === playerUid
    );

    const newOriginalPlayer = {
      ...newOriginalPlayers[playerArrayIndex],
      playerScore: newScoreValue,
    };

    newOriginalPlayers.splice(playerArrayIndex, 1, { ...newOriginalPlayer });

    const newMatchedTopRange = [
      ...newCurrentStageInfo[stageInfoIndex].matchedTopRange,
    ];
    const newMatchedNormalRange = [
      ...newCurrentStageInfo[stageInfoIndex].matchedNormalRange,
    ];

    const topRangeArrayIndex = newMatchedTopRange.findIndex(
      (f) => f.scoreValue === scoreValue
    );

    const normalRangeArrayIndex = newMatchedNormalRange.findIndex(
      (f) => f.scoreValue === scoreValue
    );
    if (topRangeArrayIndex !== -1) {
      const newValue = {
        ...newMatchedTopRange[topRangeArrayIndex],
        scoreOwner: newPlayerUid,
      };
      const newPlayer = {
        ...newMatchedTopPlayers[topPlayerArrayIndex],
        playerScore: newScoreValue,
      };

      newMatchedTopRange.splice(topRangeArrayIndex, 1, { ...newValue });
      newMatchedTopPlayers.splice(topPlayerArrayIndex, 1, { ...newPlayer });
    }

    if (normalRangeArrayIndex !== -1) {
      const newValue = {
        ...newMatchedNormalRange[normalRangeArrayIndex],
        scoreOwner: newPlayerUid,
      };
      const newPlayer = {
        ...newMatchedNormalPlayers[normalPlayerArrayIndex],
        playerScore: newScoreValue,
      };
      console.log(newPlayer);
      newMatchedNormalRange.splice(normalRangeArrayIndex, 1, { ...newValue });
      newMatchedNormalPlayers.splice(normalPlayerArrayIndex, 1, {
        ...newPlayer,
      });
    }

    const newStageInfo = {
      ...newCurrentStageInfo[stageInfoIndex],
      originalPlayers: [...newOriginalPlayers],
      matchedTopRange: [...newMatchedTopRange],
      matchedNormalRange: [...newMatchedNormalRange],
      matchedTopPlayers: [...newMatchedTopPlayers],
      matchedNormalPlayers: [...newMatchedNormalPlayers],
    };

    newCurrentStageInfo.splice(stageInfoIndex, 1, { ...newStageInfo });
    console.log(newCurrentStageInfo);
    setCurrentStageInfo([...newCurrentStageInfo]);
  };

  // 비교심사등을 위해서 함수 따로 분리되었음
  // 여기서 비교심사 명단 분기시켜야함 23.08.13
  const makeScoreCard = (stageInfo, judgeInfo, grades, players) => {
    const { stageId, stageNumber } = stageInfo;
    const { judgeUid, judgeName, isHead, seatIndex, contestId } = judgeInfo;

    const scoreCardInfo = grades.map((grade, gIdx) => {
      let comparePlayers = [];
      let matchedTopPlayers = [];
      let matchedNormalPlayers = [];
      let matchedTopRange = [];
      let matchedNormalRange = [];

      const { categoryId, categoryTitle, gradeId, gradeTitle } = grade;
      if (topPlayersArray.length > 0) {
        comparePlayers = [...topPlayersArray];
      }
      const filterPlayers = players
        .filter((player) => player.contestGradeId === gradeId)
        .sort((a, b) => a.playerIndex - b.playerIndex);

      const matchedOriginalPlayers = filterPlayers.map((player, pIdx) => {
        const newPlayers = { ...player, playerScore: 0 };

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
        comparePlayers.some((cp) => cp.playerNumber === fp.playerNumber)
      );
      const filterNormalPlayers = filterPlayers.filter((fp) =>
        comparePlayers.some((cp) => cp.playerNumber !== fp.playerNumber)
      );

      //비교심사 선정 인원있는 경우 비교심사대상 인원을 top으로 배정
      //topRange도 같이 배정
      if (filterTopPlayers?.length > 0) {
        const matchedPlayers = filterTopPlayers.map((player, pIdx) => {
          const newPlayers = { ...player, playerScore: 0 };

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

      //비교심사 선정 인원있는 경우 비교심사대상 인원을 제외한 인원을 normal로 배정
      //normalRange도 같이 배정
      if (filterNormalPlayers?.length > 0) {
        const matchedPlayers = filterNormalPlayers.map((player, pIdx) => {
          const newPlayers = { ...player, playerScore: 0 };

          return newPlayers;
        });
        matchedNormalPlayers = [...matchedPlayers];
        matchedNormalRange = matchedPlayers.map((player, pIdx) => {
          return {
            scoreValue: matchedPlayers.length + pIdx + 1,
            scoreIndex: matchedPlayers.length + pIdx,
            scoreOwner: undefined,
          };
        });
      }

      //top, normal이 모두 없는 경우는 비교심시가 아니거나 아직 명단 확정이 안되었다고 가정
      //top은 빈배열로 정의하고 normal에 체급에 해당하는 선수 모두 배정
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
        gradeId,
        gradeTitle,
        originalPlayers: matchedOriginalPlayers,
        originalRange: matchedOriginalRange,
        judgeUid,
        judgeName,
        matchedTopPlayers,
        matchedTopRange,
        matchedNormalPlayers,
        matchedNormalRange,
        isHead,
        seatIndex,
      };
    });

    return scoreCardInfo;
  };

  // 심사표 전송을 하기전에 이중 등록을 방지하기 위해 gradeId,judgeUid값을 받아서
  // 문서id를 수집한후에 map으로 돌리면서 삭제해줌
  const deletePreScoreCard = async (collectionName, gradeId, judgeUid) => {
    const condition = [
      where("gradeId", "==", gradeId),
      where("judgeUid", "==", judgeUid),
    ];

    const getDocuId = await fetchScoreCardQuery.getDocuments(
      collectionName,
      condition
    );

    if (getDocuId?.length <= 0) {
      return;
    }
    setMessage({
      delete: "start",
      add: "wait",
      validate: "wait",
      validateMsg: "",
    });
    getDocuId.map(async (docu, dIdx) => {
      try {
        await deleteScoreCard.deleteData(docu.id);
        console.log("deleted:", docu.id);
      } catch (error) {
        console.log(error);
      }
    });
    setMessage({ delete: "end", add: "wait", validate: "wait" });
  };

  //currentStageInfo를 받아서 matchedPlayers를 맵으로 돌면서 각각 문서를 작성함
  // 작성전에 deletePreScoreCard함수를 호출해서 이중으로 작성을 방지함
  const hadleAddedUpdateState = async (contestId, seatIndex, actionType) => {
    let currentJudge = {};
    if (actionType === "success") {
      currentJudge = { isLogined: true, isEnd: true, seatIndex, errors: "" };
    }

    if (actionType === "fail") {
      currentJudge = {
        isLogined: true,
        isEnd: true,
        seatIndex,
        errors: "저장오류",
      };
    }
    try {
      await updateRealTimeJudgeMessage
        .updateData(
          `currentStage/${contestId}/judges/${seatIndex - 1}`,
          currentJudge
        )
        .then(() => {
          setMsgOpen(false);
        });
    } catch (error) {
      console.log(error);
    }
  };
  const handleSaveScoreCard = async (propData) => {
    let scoreCardsArray = [];

    if (propData?.length <= 0) {
      return;
    }

    // 기존 score card 삭제

    setMsgOpen(true);
    await Promise.all(
      propData.map(async (data) => {
        await deletePreScoreCard(
          location.state.collectionName,
          data.gradeId,
          data.judgeUid
        );

        const {
          categoryId,
          categoryTitle,
          gradeId,
          gradeTitle,
          judgeUid,
          judgeName,
          seatIndex,
          matchedPlayers,
        } = data;

        matchedPlayers.forEach((match) => {
          const {
            playerNumber,
            playerUid,
            playerName,
            playerGym,
            playerScore,
            playerIndex,
          } = match;

          const newInfo = {
            docuId: generateUUID(),
            categoryId,
            categoryTitle,
            gradeId,
            gradeTitle,
            judgeUid,
            judgeName,
            seatIndex,
            playerNumber,
            playerUid,
            playerName,
            playerGym,
            playerIndex,
            playerScore: parseInt(playerScore),
          };

          scoreCardsArray.push(newInfo);
        });
      })
    );

    // 새로운 score card 추가
    setMessage({
      delete: "end",
      add: "start",
      validate: "wait",
      validateMsg: "",
    });
    await Promise.all(
      scoreCardsArray.map(async (score) => {
        try {
          await addScoreCard.addData(score);
          console.log("added");
        } catch (error) {
          console.log(error);
        }
      })
    );

    setMessage({
      delete: "end",
      add: "end",
      validate: "wait",
      validateMsg: "",
    });
    handleValidateScore(location.state.collectionName, scoreCardsArray);
  };

  const handleValidateScore = async (collectionName, prevState) => {
    if (prevState?.length <= 0) {
      setMessage({
        delete: "end",
        add: "end",
        validate: "fail",
        validateMsg: "데이터 공유에 문제가 발생했습니다.",
      });
      return;
    }

    prevState.map(async (state, sIdx) => {
      const { gradeId, judgeUid, playerUid, playerScore } = state;
      const condition = [
        where("gradeId", "==", gradeId),
        where("judgeUid", "==", judgeUid),
        where("playerUid", "==", playerUid),
      ];

      const getAddedData = await fetchScoreCardQuery.getDocuments(
        collectionName,
        condition
      );

      if (getAddedData?.length > 1) {
        setMessage({
          delete: "end",
          add: "end",
          validate: "fail",
          validateMsg: "다중 저장된 데이터가 있습니다.",
        });
      }

      switch (getAddedData?.length) {
        case 0:
          setMessage({
            delete: "end",
            add: "end",
            validate: "fail",
            validateMsg: "데이터 저장에 문제가 있습니다.",
          });
          break;

        case 1:
          if (parseInt(getAddedData[0].playerScore) === parseInt(playerScore)) {
            setMessage({
              delete: "end",
              add: "end",
              validate: "end",
              validateMsg: "검증완료",
            });
          } else {
            setMessage({
              delete: "end",
              add: "end",
              validate: "fail",
              validateMsg: "저장된 데이터 오류",
            });
          }
          break;

        default:
          break;
      }
    });
  };

  const handleComparePopup = () => {
    setMessage({
      body: "비교심사가 진행됩니다.",
      isButton: true,
      confirmButtonText: "확인",
    });
    setCompareMsgOpen(true);
  };

  const handleUpdateJudgeMessage = async (contestId, seatIndex) => {
    try {
      await updateRealTimeJudgeMessage
        .updateData(
          `currentStage/${contestId}/compares/judges/${
            seatIndex - 1
          }/messageStatus`,
          "투표중"
        )
        .then(() =>
          navigate("/comparevote", {
            state: {
              stageInfo: location.state.stageInfo,
              contestId: location.state.contestId,
              prevMatched: currentStageInfo[0].matchedPlayers,
              fullMatched: currentStageInfo[0].originalPlayers,
              voteInfo: compareData,
              seatIndex,
            },
          })
        );
    } catch (error) {
      console.log(error);
    }
  };

  const fetchPool = async (playersFinalId, gradeListId) => {
    if (playersFinalId === undefined) {
      return;
    }
    try {
      await fetchPlayersFinal
        .getDocument(playersFinalId)
        .then((data) =>
          setPlayersFinalArray(() => [
            ...data.players.filter((f) => f.playerNoShow === false),
          ])
        );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const hasUndefinedScoreOwner = currentStageInfo.some((stage) => {
      return (
        stage.matchedRange &&
        stage.matchedRange.some((range) => range.scoreOwner === undefined)
      );
    });

    setValidateScoreCard(hasUndefinedScoreOwner);
  }, [currentStageInfo]);

  useEffect(() => {
    if (!currentContest?.contests) {
      return;
    } else {
      fetchPool(
        currentContest.contests.contestPlayersFinalId,
        currentContest.contests.contestGradesListId
      );
    }
  }, [currentContest?.contests]);

  useEffect(() => {
    if (!location.state) {
      return;
    }

    setJudgeInfo(location.state.judgeInfo);
  }, [location, validateScoreCard]);

  useEffect(() => {
    //console.log(compareData);
    if (compareData?.players?.length > 0) {
      setIsHolding(true);
      setTopPlayersArray(() => [...compareData.players]);
    }
  }, [compareData?.status]);

  useEffect(() => {
    if (compareData?.status?.compareStart) {
      handleComparePopup();
    }
  }, [compareData?.status?.compareStart]);

  useEffect(() => {
    if (currentContest?.contests?.id) {
      // Debounce the getDocument call to once every second
      const debouncedGetDocument = debounce(
        () =>
          getDocument(
            `currentStage/${currentContest.contests.id}/compares`,
            currentContest.contests.id
          ),
        1000
      );
      debouncedGetDocument();
    }
    return () => {};
  }, [getDocument]);

  return (
    <>
      {isLoading && (
        <div className="flex w-full h-screen justify-center items-center">
          <LoadingPage />
        </div>
      )}
      <div className="flex w-full justify-start items-start mb-44 flex-col p-4">
        {!isLoading && (
          <>
            <div className="flex h-auto py-2 justify-end items-center w-full">
              <AddedModal
                isOpen={msgOpen}
                message={message}
                onCancel={() =>
                  hadleAddedUpdateState(
                    location.state.contestId,
                    currentStageInfo[0].seatIndex,
                    "fail"
                  )
                }
                onConfirm={() =>
                  hadleAddedUpdateState(
                    location.state.contestId,
                    currentStageInfo[0].seatIndex,
                    "success"
                  )
                }
              />
              <Modal
                open={compareSettingOpen}
                onClose={() => setCompareSettingOpen(false)}
              >
                <CompareSetting
                  stageInfo={location.state.stageInfo}
                  contestId={location.state.contestId}
                  prevMatched={currentStageInfo[0]?.matchedPlayers}
                  fullMatched={currentStageInfo[0]?.originalPlayers}
                  setClose={setCompareSettingOpen}
                  gradeListId={currentContest.contests.contestGradesListId}
                />
              </Modal>

              {/* <Modal open={compareOpen} onClose={() => setCompareOpen(false)}>
                <CompareSelection
                  stageInfo={location.state.stageInfo}
                  contestId={location.state.contestId}
                  prevMatched={currentStageInfo[0]?.matchedPlayers}
                  fullMatched={currentStageInfo[0]?.originalPlayers}
                  setClose={setCompareOpen}
                  gradeListId={currentContest.contests.contestGradesListId}
                />
              </Modal> */}
              <ConfirmationModal
                isOpen={compareMsgOpen}
                message={message}
                onCancel={() => setCompareMsgOpen(false)}
                onConfirm={() =>
                  handleUpdateJudgeMessage(
                    currentContest.contests.id,
                    judgeInfo.seatIndex
                  )
                }
              />

              <div className="flex w-1/3 items-start flex-col">
                <div className="flex w-32 h-auto py-2 justify-center items-center text-lg">
                  채점모드
                </div>
                <div className="flex w-32 h-auto py-2 justify-center items-center text-xl font-semibold">
                  {compareData?.status?.compareIng ? "비교심사" : "일반심사"}
                </div>
                <div className="flex w-32 h-auto py-2 justify-center items-center ">
                  {currentStageInfo[0].isHead && (
                    <button
                      className="w-auto h-auto px-5 py-2 bg-blue-500 font-semibold rounded-lg text-white text-sm"
                      onClick={() => setCompareSettingOpen(true)}
                    >
                      비교심사설정
                    </button>
                  )}
                </div>
              </div>
              <div className="flex w-1/3 justify-center">
                <img src={YbbfLogo} alt="" className="w-36" />
              </div>
              <div className="flex w-1/3 items-end flex-col">
                <div className="flex w-32 h-auto py-2 justify-center items-center text-lg">
                  좌석번호
                </div>
                <div className="flex w-32 h-auto py-2 justify-center items-center text-5xl font-semibold">
                  {currentStageInfo[0].seatIndex}
                </div>
              </div>
            </div>
            <div className="flex justify-start flex-col w-full">
              {currentStageInfo?.length >= 1 &&
                currentStageInfo.map((stage, sIdx) => (
                  <>
                    <div className="flex w-full h-12 rounded-md gap-x-2 justify-center items-center bg-blue-300 mb-2 font-semibold text-lg">
                      {stage.categoryTitle} / {stage.gradeTitle}
                    </div>
                    <div className="flex w-full justify-start items-center flex-col gap-y-2 mb-5">
                      <div className="flex w-full rounded-md gap-x-2 justify-center items-center">
                        <div className="flex w-32 h-10 justify-center items-center bg-blue-200 rounded-lg border border-gray-200">
                          <span className="text-sm">선수번호</span>
                        </div>
                        <div className="flex w-32 h-10 justify-center items-center bg-blue-300 rounded-lg border border-gray-200">
                          <span className="text-sm">순위</span>
                        </div>
                        <div className="flex w-full h-10 justify-center items-center bg-blue-200 rounded-lg border border-gray-200">
                          <span className="text-sm">순위선택</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full justify-start items-center flex-col gap-y-2">
                      <div className="flex h-full rounded-md gap-y-2 flex-col w-full">
                        {stage.matchedTopPlayers?.length > 0 &&
                          stage.matchedTopPlayers.map((matched, mIdx) => {
                            const { playerNumber, playerScore, playerUid } =
                              matched;

                            return (
                              <div className="flex w-full h-full rounded-md gap-x-2">
                                <div className="flex w-32 h-auto flex-col gap-y-2 justify-center items-center bg-blue-100 rounded-lg border border-gray-200">
                                  <span className="text-4xl font-semibold">
                                    {playerNumber}
                                  </span>
                                </div>
                                <div className="flex w-32 font-semibold justify-center items-center bg-blue-300 rounded-lg border border-gray-200">
                                  {playerScore !== 0 && playerScore < 100 && (
                                    <span className="text-4xl">
                                      {playerScore}
                                    </span>
                                  )}
                                  {playerScore >= 100 && (
                                    <span className="text-4xl">제외</span>
                                  )}
                                </div>
                                <div className="flex w-full h-full justify-center items-center bg-white rounded-lg border border-gray-500 flex-wrap p-1 gap-1">
                                  <div
                                    className="flex w-full h-full flex-wrap gap-2"
                                    style={{ minHeight: "80px" }}
                                  >
                                    {stage.matchedTopRange?.length > 0 &&
                                      stage.matchedTopRange
                                        .sort(
                                          (a, b) => a.scoreIndex - b.scoreIndex
                                        )
                                        .map((range, rIdx) => {
                                          const { scoreValue, scoreOwner } =
                                            range;
                                          return (
                                            <>
                                              {scoreOwner === undefined &&
                                              matched.playerScore === 0 ? (
                                                <button
                                                  className="flex w-20 h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-100 text-3xl text-gray-600"
                                                  onClick={() =>
                                                    handleScore(
                                                      playerUid,
                                                      scoreValue,
                                                      sIdx,
                                                      "score"
                                                    )
                                                  }
                                                >
                                                  {scoreValue}
                                                </button>
                                              ) : scoreOwner === playerUid &&
                                                matched.playerScore ===
                                                  scoreValue ? (
                                                <button
                                                  className="flex w-full h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-800 text-3xl text-gray-100"
                                                  onClick={() =>
                                                    handleScore(
                                                      playerUid,
                                                      scoreValue,
                                                      sIdx,
                                                      "unScore"
                                                    )
                                                  }
                                                >
                                                  <div className="flex w-18 h-18 rounded-full border border-gray-100 p-2">
                                                    <AiFillLock />
                                                  </div>
                                                </button>
                                              ) : scoreOwner !== playerUid &&
                                                playerScore === 0 ? (
                                                <div className="flex w-20 h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-100 text-3xl text-gray-600 cursor-not-allowed">
                                                  <div className="flex w-18 h-18 rounded-full border-blue-400 p-2 text-blue-400">
                                                    <AiFillMinusCircle />
                                                  </div>
                                                </div>
                                              ) : null}
                                            </>
                                          );
                                        })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                      <div className="flex h-full rounded-md gap-y-2 flex-col w-full">
                        {stage.matchedNormalPlayers?.length > 0 &&
                          stage.matchedNormalPlayers.map((matched, mIdx) => {
                            const { playerNumber, playerScore, playerUid } =
                              matched;

                            return (
                              <div className="flex w-full h-full rounded-md gap-x-2">
                                <div className="flex w-32 h-auto flex-col gap-y-2 justify-center items-center bg-blue-100 rounded-lg border border-gray-200">
                                  <span className="text-4xl font-semibold">
                                    {playerNumber}
                                  </span>
                                </div>
                                <div className="flex w-32 font-semibold justify-center items-center bg-blue-300 rounded-lg border border-gray-200">
                                  {playerScore !== 0 && playerScore < 100 && (
                                    <span className="text-4xl">
                                      {playerScore}
                                    </span>
                                  )}
                                  {playerScore >= 100 && (
                                    <span className="text-4xl">제외</span>
                                  )}
                                </div>
                                <div className="flex w-full h-full justify-center items-center bg-white rounded-lg border border-gray-500 flex-wrap p-1 gap-1">
                                  <div
                                    className="flex w-full h-full flex-wrap gap-2"
                                    style={{ minHeight: "80px" }}
                                  >
                                    {stage.matchedNormalRange?.length > 0 &&
                                      stage.matchedNormalRange
                                        .sort(
                                          (a, b) => a.scoreIndex - b.scoreIndex
                                        )
                                        .map((range, rIdx) => {
                                          const { scoreValue, scoreOwner } =
                                            range;
                                          return (
                                            <>
                                              {scoreOwner === undefined &&
                                              matched.playerScore === 0 ? (
                                                <button
                                                  className="flex w-20 h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-100 text-3xl text-gray-600"
                                                  onClick={() =>
                                                    handleScore(
                                                      playerUid,
                                                      scoreValue,
                                                      sIdx,
                                                      "score"
                                                    )
                                                  }
                                                >
                                                  {scoreValue}
                                                </button>
                                              ) : scoreOwner === playerUid &&
                                                matched.playerScore ===
                                                  scoreValue ? (
                                                <button
                                                  className="flex w-full h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-800 text-3xl text-gray-100"
                                                  onClick={() =>
                                                    handleScore(
                                                      playerUid,
                                                      scoreValue,
                                                      sIdx,
                                                      "unScore"
                                                    )
                                                  }
                                                >
                                                  <div className="flex w-18 h-18 rounded-full border border-gray-100 p-2">
                                                    <AiFillLock />
                                                  </div>
                                                </button>
                                              ) : scoreOwner !== playerUid &&
                                                playerScore === 0 ? (
                                                <div className="flex w-20 h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-100 text-3xl text-gray-600 cursor-not-allowed">
                                                  <div className="flex w-18 h-18 rounded-full border-blue-400 p-2 text-blue-400">
                                                    <AiFillMinusCircle />
                                                  </div>
                                                </div>
                                              ) : null}
                                            </>
                                          );
                                        })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </>
                ))}

              <div className="flex w-full justify-start items-center flex-col gap-y-2">
                <div className="flex h-full rounded-md gap-y-2 flex-col w-full"></div>
                <div className="flex w-full h-auto py-2">
                  <div className="flex w-1/2 h-24 p-2">
                    <div className="flex rounded-lg">
                      <div className="flex w-1/6 justify-center items-center text-lg">
                        서명
                      </div>
                      <div className="flex w-5/6 justify-center items-center h-20 ">
                        {judgeInfo && (
                          <CanvasWithImageData
                            imageData={judgeInfo.judgeSignature}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex w-1/2 h-20 py-2 justify-center items-center">
                    {!validateScoreCard ? (
                      <button
                        className="w-full h-full bg-blue-500 text-white text-xl font-bold rounded-lg"
                        onClick={() => handleSaveScoreCard(currentStageInfo)}
                      >
                        제출
                      </button>
                    ) : (
                      <div className="w-full h-full bg-gray-500 text-white text-xl font-bold rounded-lg flex justify-center items-center flex-col">
                        <span>심사중</span>
                        <span className="text-base font-normal">
                          모든 선수 채점이 완료되면 제출버튼이 활성화됩니다.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AutoScoreTable;
