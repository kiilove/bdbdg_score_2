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
  const [contestInfo, setContestInfo] = useState({});
  const [currentJudgeInfo, setCurrentJudgeInfo] = useState({});
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

  const deleteScoreCard = useFirestoreDeleteData(
    location.state.contestInfo.collectionName
  );
  const addScoreCard = useFirestoreAddData(
    location.state.contestInfo.collectionName
  );
  const fetchScoreCardQuery = useFirestoreQuery();
  const {
    data: compareData,
    loading,
    error,
    getDocument,
  } = useFirebaseRealtimeGetDocument();

  const updateRealTimeJudgeMessage = useFirebaseRealtimeUpdateData();

  //리팩토리 v2
  const handleScore = (playerUid, scoreValue, stageInfoIndex, actionType) => {
    const newScoreValue = actionType === "unScore" ? 0 : scoreValue;
    const newPlayerUid = actionType === "unScore" ? undefined : playerUid;
    const newCurrentStageInfo = [...currentStageInfo];
    const stage = newCurrentStageInfo[stageInfoIndex];

    const updateArray = (arr, findKey, findValue, updatedValues) => {
      const index = arr.findIndex((item) => item[findKey] === findValue);
      if (index !== -1) {
        arr[index] = { ...arr[index], ...updatedValues };
      }
    };

    updateArray(stage.matchedTopRange, "scoreValue", scoreValue, {
      scoreOwner: newPlayerUid,
    });
    updateArray(stage.matchedSubRange, "scoreValue", scoreValue, {
      scoreOwner: newPlayerUid,
    });
    updateArray(stage.matchedNormalRange, "scoreValue", scoreValue, {
      scoreOwner: newPlayerUid,
    });
    updateArray(stage.originalRange, "scoreValue", scoreValue, {
      scoreOwner: newPlayerUid,
    });
    updateArray(stage.matchedTopPlayers, "playerUid", playerUid, {
      playerScore: newScoreValue,
    });
    updateArray(stage.matchedSubPlayers, "playerUid", playerUid, {
      playerScore: newScoreValue,
    });
    updateArray(stage.matchedNormalPlayers, "playerUid", playerUid, {
      playerScore: newScoreValue,
    });
    updateArray(stage.originalPlayers, "playerUid", playerUid, {
      playerScore: newScoreValue,
    });

    setCurrentStageInfo(newCurrentStageInfo);
    console.log(newCurrentStageInfo);
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
        .then(
          () =>
            actionType === "success" && navigate("/lobby", { replace: true })
        )
        .then(() => {
          setMsgOpen(false);
        });
    } catch (error) {
      console.log(error);
    }
  };
  const handleSaveScoreCard = async (propData) => {
    console.log(propData);
    let scoreCardsArray = [];

    console.log(propData);
    if (propData?.length <= 0) {
      return;
    }

    // 기존 score card 삭제

    setMsgOpen(true);
    await Promise.all(
      propData.map(async (data) => {
        await deletePreScoreCard(
          contestInfo.collectionName,
          data.gradeId,
          data.judgeUid
        );

        const {
          contestId,
          categoryId,
          categoryTitle,
          categoryJudgeType,
          gradeId,
          gradeTitle,
          judgeUid,
          judgeName,
          seatIndex,
          originalPlayers,
        } = data;

        originalPlayers.forEach((original) => {
          const {
            playerNumber,
            playerUid,
            playerName,
            playerGym,
            playerScore,
            playerIndex,
          } = original;
          console.log(original);

          const newInfo = {
            docuId: generateUUID(),
            contestId,
            categoryId,
            categoryTitle,
            categoryJudgeType,
            gradeId,
            gradeTitle,
            judgeUid,
            judgeName,
            seatIndex,
            scoreType: "ranking",
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
    handleValidateScore(contestInfo.collectionName, scoreCardsArray);
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
            replace: true,
            state: {
              currentStageInfo,
              currentJudgeInfo,
              contestInfo,
              compareInfo: { ...compareData },
            },
          })
        );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    //console.log(currentStageInfo);
    if (currentStageInfo && !compareData?.status.compareStart) {
      const hasUndefinedScoreOwner = currentStageInfo.some((stage) => {
        return (
          stage.originalRange &&
          stage.originalRange.some((range) => range.scoreOwner === undefined)
        );
      });

      setValidateScoreCard(hasUndefinedScoreOwner);
    }
    if (currentStageInfo && compareData?.scoreMode === "all") {
      const hasUndefinedScoreOwner = currentStageInfo.some((stage) => {
        return (
          stage.originalRange &&
          stage.originalRange.some((range) => range.scoreOwner === undefined)
        );
      });

      setValidateScoreCard(hasUndefinedScoreOwner);
    }

    if (currentStageInfo && compareData?.scoreMode === "topOnly") {
      const hasUndefinedScoreOwner = currentStageInfo.some((stage) => {
        return (
          stage.matchedTopRange &&
          stage.matchedTopRange.some((range) => range.scoreOwner === undefined)
        );
      });

      setValidateScoreCard(hasUndefinedScoreOwner);
    }

    if (currentStageInfo && compareData?.scoreMode === "topWithSub") {
      const hasUndefinedScoreOwner = currentStageInfo.some((stage) => {
        return (
          (stage.matchedTopRange &&
            stage.matchedTopRange.some(
              (range) => range.scoreOwner === undefined
            )) ||
          (stage.matchedSubRange && // 추가: matchedSubRange 체크
            stage.matchedSubRange.some(
              (range) => range.scoreOwner === undefined
            ))
        );
      });

      setValidateScoreCard(hasUndefinedScoreOwner);
    }
  }, [currentStageInfo]);

  useEffect(() => {
    if (!location.state) {
      return;
    }
    setContestInfo(() => ({ ...location.state.contestInfo }));
    setCurrentJudgeInfo(() => ({ ...location.state.currentJudgeInfo }));
    setCurrentStageInfo(location.state.currentStageInfo);
    setIsLoading(false);
  }, [location, validateScoreCard]);

  useEffect(() => {
    //console.log(compareData);
    if (compareData?.players?.length > 0) {
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

  useEffect(() => {
    console.log(location);
  }, [location]);

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
                    contestInfo.id,
                    currentJudgeInfo.seatIndex,
                    "fail"
                  )
                }
                onConfirm={() =>
                  hadleAddedUpdateState(
                    contestInfo.id,
                    currentJudgeInfo.seatIndex,
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
                  contestId={contestInfo.id}
                  prevMatched={currentStageInfo[0]?.matchedPlayers}
                  fullMatched={currentStageInfo[0]?.originalPlayers}
                  setClose={setCompareSettingOpen}
                  gradeListId={currentContest.contests.contestGradesListId}
                />
              </Modal>

              <ConfirmationModal
                isOpen={compareMsgOpen}
                message={message}
                onCancel={() => setCompareMsgOpen(false)}
                onConfirm={() =>
                  handleUpdateJudgeMessage(
                    currentContest.contests.id,
                    currentJudgeInfo.seatIndex
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
                  <div
                    className={`flex justify-start flex-col w-full border-2 rounded-lg py-2 mb-3 border-blue-200`}
                  >
                    <div className="flex w-full justify-start items-center flex-col gap-y-2 px-6">
                      <div className="flex w-full h-12 rounded-md gap-x-2 justify-center items-center bg-blue-300 mb-2 font-semibold text-lg">
                        {stage.categoryTitle} / {stage.gradeTitle}
                      </div>
                    </div>
                    <div className="flex w-full justify-start items-center flex-col gap-y-2 px-6">
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
                    <div className="flex w-full justify-start items-center flex-col gap-y-2 p-2">
                      <div
                        className={`${
                          stage.matchedTopPlayers?.length > 0
                            ? "flex h-full rounded-lg gap-y-2 flex-col w-full p-2 border-4 border-blue-600"
                            : "hidden"
                        }`}
                      >
                        {stage.matchedTopPlayers?.length > 0 &&
                          stage.matchedTopPlayers.map((matched, mIdx) => {
                            const { playerNumber, playerScore, playerUid } =
                              matched;

                            return (
                              <div className="flex w-full h-auto ">
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
                                            (a, b) =>
                                              a.scoreIndex - b.scoreIndex
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
                              </div>
                            );
                          })}
                      </div>
                      <div className="flex h-full rounded-md gap-y-2 flex-col w-full px-4">
                        {stage.matchedSubPlayers?.length > 0 &&
                          compareData?.scoreMode === "topWithSub" &&
                          stage.matchedSubPlayers.map((matched, mIdx) => {
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
                                    {stage.matchedSubRange?.length > 0 &&
                                      stage.matchedSubRange
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
                      <div className="flex h-full rounded-md gap-y-2 flex-col w-full px-4">
                        {stage.matchedNormalPlayers?.length > 0 &&
                          (compareData?.scoreMode === "all" ||
                            !compareData?.status?.compareStart) &&
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
                  </div>
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
                        {currentJudgeInfo && (
                          <CanvasWithImageData
                            imageData={currentStageInfo[0].judgeSignature}
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
