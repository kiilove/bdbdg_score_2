import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useFirestoreAddData,
  useFirestoreGetDocument,
  useFirestoreQuery,
} from "../hooks/useFirestores";
import { v4 as uuidv4 } from "uuid";
import { AiFillLock } from "react-icons/ai";
import YbbfLogo from "../assets/img/ybbf_logo.png";
import { addDoc, collection, where } from "firebase/firestore";
import CanvasWithImageData from "../components/CanvasWithImageData";
import { db } from "../firebase";
import { add } from "date-fns";
import { useFirebaseRealtimeUpdateData } from "../hooks/useFirebaseRealtime";

const AutoScoreTable = (currentStageId, currentJudgeUid) => {
  const [scoreRange, setScoreRange] = useState([]);

  const [scheduleInfo, setScheduleInfo] = useState({});
  const [judgeInfo, setJudgeInfo] = useState({});
  const [nextScheduleInfo, setNextScheduleInfo] = useState({});
  const [nextJudgeInfo, setNextJudgeInfo] = useState({});
  const [judgeSign, setJudgeSign] = useState(null);
  const [isHolding, setIsHolding] = useState(false);
  const [currentScoreBoard, setCurrentScoreBoard] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  const getJudgeData = useFirestoreQuery();
  const addScoreBoard = useFirestoreAddData(location.state.collectionInfo);
  const updateRealtimeJudge = useFirebaseRealtimeUpdateData();
  const handleAddedSuccessState = async (
    collectionName,
    documentId,
    seatIndex
  ) => {
    const currentJudge = {
      isLogined: true,
      isEnd: true,
      seatIndex,
    };
    const updatedData = await updateRealtimeJudge.updateData(
      collectionName,
      documentId,
      currentJudge
    );
    //setCurrentState({ ...updatedData });
    console.log("Updated Data:", updatedData);
  };

  const clearScore = () => {};
  const addScore = async (collectionName) => {
    setIsHolding(true);
    const propCollection = `currentStage/${location.state.contestId}/judges`;
    const propIndex = judgeInfo.seatIndex - 1;
    const propSeatIndex = judgeInfo.seatIndex;

    const newData = currentScoreBoard.map((score, sIdx) => {
      return {
        ...score,
        seatIndex: judgeInfo.seatIndex,
        judgeSignature: judgeSign,
      };
    });

    newData?.length &&
      newData.map(async (data, dIdx) => {
        try {
          const added = await addScoreBoard.addData(data);

          setIsHolding(false);
        } catch (error) {
          console.log(error);
          setIsHolding(false);
        }
      });

    !isHolding &&
      (await handleAddedSuccessState(
        propCollection,
        propIndex,
        propSeatIndex
      ).then(() => {
        console.log(currentScoreBoard.judgeUid, nextJudgeInfo.judgeUid);
        judgeInfo.judgeUid === nextJudgeInfo.judgeUid
          ? navigate("/scoreloginauto", {
              state: { propStageNumber: scheduleInfo.stageNumber + 1 },
            })
          : navigate("/scorelogin");
      }));
  };
  const fetchJudge = async (judgeUid) => {
    console.log("judgeUid", judgeUid);
    const condition = [where("judgeUid", "==", judgeUid)];
    const returnData = await getJudgeData.getDocuments(
      "judges_pool",
      condition
    );
    console.log(returnData);
    if (returnData.length > 0) {
      setJudgeSign(returnData[0].judgeSignature);
    }
    console.log(judgeSign);
  };

  const initScoreCard = () => {
    const scoreCardInfo = scheduleInfo.matchedPlayers.map((player, pIdx) => {
      const { playerNumber, playerUid, playerIndex } = player;

      return {
        contestId: judgeInfo.contestId,
        scoreId: uuidv4(),
        categoryId: scheduleInfo.contestCategoryId,
        gradeId: scheduleInfo.contestGradeId,
        scoreType: scheduleInfo.contestCategoryJudgeType,
        playerNumber,
        playerUid,
        playerIndex,
        judgeUId: judgeInfo.judgeUid,
        playerScore: 0,
      };
    });

    const scoreRange = scheduleInfo.matchedPlayers.map((player, pIdx) => {
      return {
        scoreValue: pIdx + 1,
        scoreOwner: undefined,
        scoreIndex: pIdx + 1,
      };
    });
    return { scoreCardInfo, scoreRange };
  };

  const handleScore = (rangeIndex, boardIndex, playerNumber, scoreValue) => {
    const newScoreRange = [...scoreRange];
    const newValue = {
      scoreValue,
      scoreOwner: playerNumber.toString(),
    };

    const newScoreBoard = [...currentScoreBoard];
    const newBoardInfo = {
      ...currentScoreBoard[boardIndex],
      playerScore: parseInt(scoreValue),
    };
    newScoreBoard.splice(boardIndex, 1, newBoardInfo);
    newScoreRange.splice(rangeIndex, 1, newValue);
    setCurrentScoreBoard([...newScoreBoard]);
    setScoreRange([...newScoreRange]);
  };

  const handleUnScore = (rangeIndex, boardIndex, playerNumber, scoreValue) => {
    const newScoreRange = [...scoreRange];
    const newValue = {
      scoreValue,
      scoreOwner: undefined,
    };

    const newScoreBoard = [...currentScoreBoard];
    const newBoardInfo = {
      ...currentScoreBoard[boardIndex],
      playerScore: 0,
    };
    newScoreBoard.splice(boardIndex, 1, newBoardInfo);
    newScoreRange.splice(rangeIndex, 1, newValue);
    setCurrentScoreBoard([...newScoreBoard]);
    setScoreRange([...newScoreRange]);
  };
  const handleExceptScore = (boardIndex, scoreValue) => {
    const newScoreRange = [...scoreRange];

    const newScoreBoard = [...currentScoreBoard];
    const newBoardInfo = {
      ...currentScoreBoard[boardIndex],
      playerScore: scoreValue,
    };
    newScoreBoard.splice(boardIndex, 1, newBoardInfo);

    setCurrentScoreBoard([...newScoreBoard]);
    setScoreRange([...newScoreRange]);
  };
  const handleUnExceptScore = (boardIndex) => {
    const newScoreRange = [...scoreRange];

    const newScoreBoard = [...currentScoreBoard];
    const newBoardInfo = {
      ...currentScoreBoard[boardIndex],
      playerScore: 0,
    };
    newScoreBoard.splice(boardIndex, 1, newBoardInfo);

    setCurrentScoreBoard([...newScoreBoard]);
    setScoreRange([...newScoreRange]);
  };

  useEffect(() => {
    if (scheduleInfo.stageId) {
      const scoreboardInfo = initScoreCard();

      setCurrentScoreBoard(scoreboardInfo.scoreCardInfo);
      setScoreRange(scoreboardInfo.scoreRange);
    }

    console.log(scheduleInfo);
  }, [scheduleInfo]);

  useEffect(() => {
    if (judgeInfo?.judgeUid) {
      fetchJudge(judgeInfo.judgeUid);
    }
  }, [judgeInfo]);

  useEffect(() => {
    console.log(location);
    if (location?.state?.stageId) {
      setScheduleInfo({
        ...location.state.scheduleInfo,
      });
      setJudgeInfo({ ...location.state.judgeInfo });
      setNextScheduleInfo({ ...location.state.nextSchedule });
      setNextJudgeInfo({ ...location.state.nextJudge });
    }
  }, [location]);

  useEffect(() => {
    console.log(currentScoreBoard);
    console.log(scoreRange);
  }, [currentScoreBoard, scoreRange]);

  return (
    <div className="flex w-full justify-start items-start mb-44 flex-col p-4">
      <div className="flex h-auto py-2 justify-end items-center w-full">
        <div className="flex w-1/3 items-start flex-col">
          <div className="flex w-32 h-auto py-2 justify-center items-center text-lg">
            모드
          </div>
          <div className="flex w-32 h-auto py-2 justify-center items-center text-xl font-semibold">
            일반
          </div>
          <div className="flex w-32 h-auto py-2 justify-center items-center ">
            <button className="w-auto h-auto px-5 py-2 bg-blue-500 font-semibold rounded-lg text-white text-sm">
              비교심사요청
            </button>
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
            {judgeInfo.seatIndex}
          </div>
        </div>
      </div>
      {currentScoreBoard && (
        <div className="flex justify-start flex-col w-full">
          <div className="flex w-full h-12 rounded-md gap-x-2 justify-center items-center bg-blue-100 mb-2 font-semibold text-lg">
            {scheduleInfo.contestCategoryTitle}({scheduleInfo.contestGradeTitle}
            )
          </div>
          <div className="flex w-full justify-start items-center flex-col gap-y-2">
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
            <div className="flex h-full rounded-md gap-y-2 flex-col w-full">
              {currentScoreBoard?.length > 0 &&
                currentScoreBoard.map((scoreboard, bIdx) => {
                  const { playerNumber, playerScore } = scoreboard;
                  return (
                    <div className="flex w-full h-full rounded-md gap-x-2">
                      <div className="flex w-32 h-auto flex-col gap-y-2 justify-center items-center bg-blue-100 rounded-lg border border-gray-200">
                        <span className="text-4xl font-semibold">
                          {playerNumber}
                        </span>
                      </div>
                      <div className="flex w-32 font-semibold justify-center items-center bg-blue-300 rounded-lg border border-gray-200">
                        {playerScore !== 0 && playerScore < 100 && (
                          <span className="text-4xl">{playerScore}</span>
                        )}
                        {playerScore >= 100 && (
                          <span className="text-4xl">제외</span>
                        )}
                      </div>
                      <div className="flex w-full h-full justify-center items-center bg-white rounded-lg border border-gray-500 flex-wrap p-1 gap-1">
                        <div className="flex w-full h-full flex-wrap gap-2">
                          {scoreRange?.length > 0 &&
                            scoreRange
                              .sort((a, b) => a.playerIndex - b.playerIndex)
                              .map((score, rIdx) => {
                                const { scoreValue, scoreOwner } = score;
                                return (
                                  <>
                                    {scoreOwner === undefined &&
                                      playerScore === 0 && (
                                        <button
                                          className="flex w-20 h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-100 text-3xl text-gray-600"
                                          onClick={() =>
                                            handleScore(
                                              rIdx,
                                              bIdx,
                                              playerNumber?.toString(),
                                              scoreValue
                                            )
                                          }
                                        >
                                          {scoreValue}
                                        </button>
                                      )}
                                    {scoreOwner === playerNumber?.toString() &&
                                      playerScore === scoreValue && (
                                        <button
                                          className="flex w-20 h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-500 text-3xl text-gray-100"
                                          onClick={() =>
                                            handleUnScore(
                                              rIdx,
                                              bIdx,
                                              playerNumber.toString(),
                                              scoreValue
                                            )
                                          }
                                        >
                                          <AiFillLock />
                                        </button>
                                      )}
                                  </>
                                );
                              })}
                          {/* {playerScore >= 100 ? (
                            <button
                              className="flex w-20 h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-600 text-2xl text-gray-200"
                              onClick={() => handleUnExceptScore(bIdx)}
                            >
                              <span className="text-base">복원</span>
                            </button>
                          ) : (
                            <button
                              className="flex ml-10 w-20 h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-600 text-2xl text-gray-200"
                              onClick={() => handleExceptScore(bIdx, 100)}
                            >
                              <span className="text-base">제외</span>
                            </button>
                          )} */}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="flex w-full h-auto py-2">
              <div className="flex w-1/2 h-24 p-2">
                <div className="flex rounded-lg">
                  <div className="flex w-1/6 justify-center items-center text-lg">
                    서명
                  </div>
                  <div className="flex w-5/6 justify-center items-center h-20 ">
                    {judgeSign && <CanvasWithImageData imageData={judgeSign} />}
                  </div>
                </div>
              </div>
              <div className="flex w-1/2 h-20 py-2 justify-center items-center">
                <button
                  className="w-full h-full bg-blue-500 text-white text-xl font-bold rounded-lg"
                  onClick={() =>
                    addScore(
                      {
                        ...currentScoreBoard,
                        judgeSignature: judgeSign,
                      },
                      location.state.collectionInfo
                    )
                  }
                >
                  제출
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoScoreTable;
