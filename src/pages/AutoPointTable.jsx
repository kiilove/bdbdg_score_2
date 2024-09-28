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
import { FaCircleCheck } from "react-icons/fa6";
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
import {
  MaxPoint,
  MinPoint,
  PointArray,
  PointRange,
} from "../components/PointCard";
import { FaCheck } from "react-icons/fa";

const AutoPointTable = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [contestInfo, setContestInfo] = useState({});
  const [currentJudgeInfo, setCurrentJudgeInfo] = useState({});
  const [topPlayersArray, setTopPlayersArray] = useState([]);
  const [playersPointInfo, setPlayersPointInfo] = useState([]);

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

  const updatePlayerPoints = (player, playerPointArrayIndex, pointValue) => {
    const updatedPlayerPointArray = player.playerPointArray.map((point, idx) =>
      idx === playerPointArrayIndex ? { ...point, point: pointValue } : point
    );

    return {
      ...player,
      playerScore: handlePointSum(updatedPlayerPointArray),
      playerPointArray: updatedPlayerPointArray,
    };
  };

  const handlePoint = (
    playerUid,
    gradeId,
    stageInfoIndex,
    playerPointArrayIndex,
    pointValue
  ) => {
    const newCurrentStageInfo = [...currentStageInfo];
    const newStage = { ...newCurrentStageInfo[stageInfoIndex] };

    const updatePlayerList = (players) =>
      players.map((player) => {
        if (
          player.playerUid === playerUid &&
          player.contestGradeId === gradeId &&
          player.playerPointArray[playerPointArrayIndex]
        ) {
          return updatePlayerPoints(player, playerPointArrayIndex, pointValue);
        }
        return player;
      });

    newStage.originalPlayers = updatePlayerList(newStage.originalPlayers);
    newStage.matchedNormalPlayers = updatePlayerList(
      newStage.matchedNormalPlayers
    );

    newCurrentStageInfo[stageInfoIndex] = newStage;

    setCurrentStageInfo(newCurrentStageInfo);
  };

  const handlePointSum = (arr) => {
    return arr.reduce((acc, playerPoint) => {
      if (typeof playerPoint.point === "undefined") return acc;
      return acc + playerPoint.point;
    }, 0);
  };

  //리팩토리 v2

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
            playerPointArray,
          } = original;

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
            scoreType: "point",
            playerNumber,
            playerUid,
            playerName,
            playerGym,
            playerIndex,
            playerScore: parseInt(playerScore),
            playerPointArray,
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
    console.log(currentStageInfo);
    const newCurrentStageInfo = [...currentStageInfo];
    if (newCurrentStageInfo && compareData?.scoreMode !== "compare") {
      const hasUndefinedScoreOwner = newCurrentStageInfo.some((stage) => {
        return (
          stage.originalPlayers &&
          stage.originalPlayers.some((player) =>
            player.playerPointArray.some(
              (pointObj) => typeof pointObj.point === "undefined"
            )
          )
        );
      });
      console.log(hasUndefinedScoreOwner);
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
  }, [location]);

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
    <div className="flex w-full justify-center items-start">
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
                    <div className="flex w-full justify-start items-center flex-col gap-y-2 px-1">
                      <div className="flex w-full h-12 rounded-md gap-x-2 justify-center items-center bg-blue-300 mb-2 font-semibold text-lg">
                        {stage.categoryTitle} / {stage.gradeTitle}
                      </div>
                    </div>
                    <div className="flex w-full justify-start items-center flex-col gap-y-2">
                      <div className="flex w-full rounded-md gap-x-2 justify-center items-center p-1">
                        <div
                          className="flex h-10 justify-center items-center bg-blue-200 rounded-lg border border-gray-200"
                          style={{ width: "140px" }}
                        >
                          <span className="text-sm">선수번호</span>
                        </div>
                        <div className="flex w-full justify-center items-start gap-2 flex-wrap">
                          <div className="flex w-full h-10 justify-center items-center bg-blue-200 rounded-lg border border-gray-200">
                            <span className="text-sm">
                              심사항목(최소:{MinPoint}/최대:{MaxPoint})
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex h-10 justify-center items-center bg-blue-300 rounded-lg border border-gray-200"
                          style={{ width: "140px" }}
                        >
                          <span className="text-sm">합계</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full justify-start items-center flex-col gap-y-2 p-1">
                      {/* <div
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
                                  <div
                                    className="flex h-auto flex-col gap-y-2 justify-center items-center bg-blue-100 rounded-lg border border-gray-200"
                                    style={{ width: "118px" }}
                                  >
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
                      </div> */}
                      <div className="flex w-full justify-start items-center flex-col gap-y-2">
                        {stage.matchedNormalPlayers?.length > 0 &&
                          stage.matchedNormalPlayers.map((matched, mIdx) => {
                            const {
                              playerNumber,
                              playerPointArray,
                              playerUid,
                              playerScore,
                            } = matched;

                            return (
                              <div className="flex w-full h-auto p-1 border-2 border-blue-300 rounded-lg">
                                <div
                                  className="flex h-auto justify-center items-center bg-blue-200 rounded-lg border border-gray-200"
                                  style={{ width: "128px" }}
                                >
                                  <span className="text-4xl font-semibold">
                                    {playerNumber}
                                  </span>
                                </div>
                                <div className="flex w-full h-full justify-between items-start flex-wrap px-2 gap-2">
                                  {PointArray.map((point, pIdx) => {
                                    const {
                                      title,
                                      startPoint,
                                      endPoint,
                                      rangeLength,
                                    } = point;
                                    return (
                                      <div
                                        className="flex justify-between items-center bg-blue-100 rounded-lg border border-gray-200 gap-2 p-2 flex-col w-56 lg:w-auto"
                                        style={{
                                          minWidth: "230px",
                                          maxWidth: "430px",
                                        }}
                                      >
                                        <div className="flex text-sm justify-center items-center w-full bg-blue-300 h-10 rounded-lg px-2">
                                          <span className="flex justify-start w-1/2 font-semibold">
                                            {title}
                                          </span>
                                          <div className="flex justify-end w-1/2 items-center">
                                            {playerPointArray[pIdx].point !==
                                              undefined && (
                                              <span className="flex justify-center items-center w-8 h-8 bg-green-600 rounded-lg text-gray-100">
                                                <FaCheck className="text-2xl" />
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex w-full gap-2 h-auto flex-wrap items-center">
                                          {Array.from({
                                            length: endPoint,
                                          }).map((_, idx) => (
                                            <button
                                              className={
                                                playerPointArray[pIdx].point ===
                                                startPoint + idx
                                                  ? "flex w-9 h-9 p-2 rounded-lg bg-blue-800 justify-center items-center text-gray-100"
                                                  : "flex w-9 h-9 p-2 rounded-lg bg-blue-200 justify-center items-center"
                                              }
                                              onClick={() =>
                                                handlePoint(
                                                  playerUid,
                                                  stage.gradeId,
                                                  sIdx,
                                                  pIdx,
                                                  startPoint + idx
                                                )
                                              }
                                            >
                                              {startPoint + idx}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div
                                  className="flex h-auto justify-center items-center bg-blue-200 rounded-lg border border-gray-200"
                                  style={{ width: "128px" }}
                                >
                                  <span className="text-4xl font-semibold">
                                    {playerScore}
                                  </span>
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
    </div>
  );
};

export default AutoPointTable;
