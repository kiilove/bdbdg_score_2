import React, { useEffect } from "react";
import { useState } from "react";
import LoadingPage from "./LoadingPage";
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmationModal from "../messageBox/ConfirmationModal";
import { useFirebaseRealtimeUpdateData } from "../hooks/useFirebaseRealtime";
import { useContext } from "react";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import { replace } from "lodash";
import {
  useFirestoreGetDocument,
  useFirestoreUpdateData,
} from "../hooks/useFirestores";
import { AiFillCheckCircle, AiFillMinusCircle } from "react-icons/ai";

const CompareVote = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const [msgOpen, setMsgOpen] = useState(false);
  const [lobbyMsgOpen, setLobbyMsgOpen] = useState(false);
  const [message, setMessage] = useState({});

  const [contestInfo, setContestInfo] = useState({});
  const [stageInfo, setStageInfo] = useState({});
  const [originalPlayers, setOriginalPlayers] = useState([]);
  const [subPlayers, setSubPlayers] = useState([]);
  const [judgeInfo, setJudgeInfo] = useState({});
  const [compareInfo, setCompareInfo] = useState({});
  const [judgeVoted, setJudgeVoted] = useState([]);

  const updateRealtime = useFirebaseRealtimeUpdateData();
  const updateComparesList = useFirestoreUpdateData("contest_compares_list");
  const fetchComparesList = useFirestoreGetDocument("contest_compares_list");

  const handleUpdateVote = async (
    contestId,
    compareListId,
    seatIndex,
    votedPlayerNumber
  ) => {
    try {
      await updateRealtime
        .updateData(
          `currentStage/${contestId}/compares/judges/${
            seatIndex - 1
          }/votedPlayerNumber`,
          votedPlayerNumber
        )
        .then(
          async () =>
            await updateRealtime.updateData(
              `currentStage/${contestId}/compares/judges/${
                seatIndex - 1
              }/messageStatus`,
              "투표완료"
            )
        )
        .then(
          async () =>
            await updateRealtime.updateData(
              `currentStage/${contestId}/judges/${seatIndex - 1}`,
              { errors: "", isEnd: false, isLogined: true, seatIndex }
            )
        )
        .then(() => {
          setMessage({
            body: "투표가 완료되었습니다.",
            body2: "대기화면으로 이동합니다.",
            isButton: true,
            confirmButtonText: "확인",
          });
          setLobbyMsgOpen(true);
        });
    } catch (error) {
      console.log(error);
    }
  };
  const initMatched = () => {
    console.log(location.state);
    let newOriginalPlayers = [];

    let newSubPlayers = [];
    const { currentJudgeInfo, currentStageInfo, contestInfo, compareInfo } =
      location.state;

    if (location?.state?.propSubPlayers?.length > 0) {
      newSubPlayers = location.state.propSubPlayers.map((player, pIdx) => {
        const { playerNumber, playerUid } = player;
        return { playerNumber, playerUid, selected: false };
      });
    }

    newOriginalPlayers = currentStageInfo[0].originalPlayers.map(
      (player, pIdx) => {
        const { playerNumber, playerUid } = player;
        return { playerNumber, playerUid, selected: false };
      }
    );

    console.log(newOriginalPlayers);

    //console.log(propSubPlayers);

    const promises = [];
    promises.push(setJudgeInfo({ ...currentJudgeInfo }));
    promises.push(setStageInfo([...currentStageInfo]));
    promises.push(setContestInfo({ ...contestInfo }));
    promises.push(setCompareInfo({ ...compareInfo }));
    promises.push(setOriginalPlayers([...newOriginalPlayers]));
    promises.push(setSubPlayers([...newSubPlayers]));
    promises.push(setIsLoading(false));

    Promise.all(promises);
  };

  const handleNavigateLobby = () => {
    setLobbyMsgOpen(false);
    navigate("/lobby", { replace: true });
  };

  //모든 선수명단과 n차 선수명단 선택불가 처리해야함
  const handleVotedPlayers = (playerUid, playerNumber, listType) => {
    let newOriginalPlayers = [...originalPlayers];
    let newSubPlayers = [...subPlayers];
    if (!playerUid && !playerNumber) {
      return;
    }

    if (judgeVoted.length >= compareInfo.playerLength) {
      setMessage({
        body: `${compareInfo.playerLength}명만 선택해주세요`,
        isButton: true,
        confirmButtonText: "확인",
      });
      setMsgOpen(true);
      return;
    }
    const selectedInfo = { playerNumber, playerUid, selected: true };
    const newJudgeVoted = [...judgeVoted];
    if (listType === "original") {
      const findIndexOriginalPlayers = newOriginalPlayers.findIndex(
        (f) => f.playerNumber === playerNumber
      );
      newOriginalPlayers.splice(findIndexOriginalPlayers, 1, {
        ...selectedInfo,
      });
    }

    if (listType === "sub") {
      console.log(newSubPlayers);
      const findIndexSubPlayers = newSubPlayers.findIndex(
        (f) => f.playerNumber === playerNumber
      );
      console.log(findIndexSubPlayers);
      newSubPlayers.splice(findIndexSubPlayers, 1, {
        ...selectedInfo,
      });
    }

    const newJudgeVotedInfo = { playerUid, playerNumber };

    newJudgeVoted.push({ ...newJudgeVotedInfo });

    const promises = [];
    promises.push(
      setJudgeVoted(() => [
        ...newJudgeVoted.sort((a, b) => a.playerNumber - b.playerNumber),
      ])
    );
    promises.push(setOriginalPlayers(() => [...newOriginalPlayers]));
    promises.push(setSubPlayers(() => [...newSubPlayers]));
    Promise.all(promises);
  };

  const handleUnVotedPlayers = (playerUid, playerNumber, listType) => {
    let newOriginalPlayers = [...originalPlayers];
    let newSubPlayers = [...subPlayers];
    if (!playerUid && !playerNumber) {
      return;
    }
    const selectedInfo = { playerNumber, playerUid, selected: false };

    const newJudgeVoted = [...judgeVoted];
    const findIndexJudgeVoted = newJudgeVoted.findIndex(
      (f) => f.playerNumber === playerNumber
    );
    newJudgeVoted.splice(findIndexJudgeVoted, 1);
    const newOriginalPlayersInfo = { playerUid, playerNumber };

    if (listType === "original") {
      const findIndexOriginalPlayers = newOriginalPlayers.findIndex(
        (f) => f.playerNumber === playerNumber
      );
      newOriginalPlayers.splice(findIndexOriginalPlayers, 1, {
        ...selectedInfo,
      });
    }

    if (listType === "sub") {
      const findIndexSubPlayers = newSubPlayers.findIndex(
        (f) => f.playerNumber === playerNumber
      );
      newSubPlayers.splice(findIndexSubPlayers, 1, {
        ...selectedInfo,
      });
    }

    const promises = [];
    promises.push(setJudgeVoted(() => [...newJudgeVoted]));
    promises.push(
      setOriginalPlayers(() => [
        ...newOriginalPlayers.sort((a, b) => a.playerNumber - b.playerNumber),
      ])
    );
    promises.push(
      setSubPlayers(() => [
        ...newSubPlayers.sort((a, b) => a.playerNumber - b.playerNumber),
      ])
    );
    Promise.all(promises);

    // const newVoted = votedPlayers.filter((f) => f.playerUid !== playerUid);
    // const newPrevMatched = [...prevMatchedPlayers];
    // const newFullMatched = [...fullMatchedPlayers];

    // const findPrevMatchedPlayers = originalPrevMatchedPlayers.find(
    //   (f) => f.playerUid === playerUid
    // );

    // const findFullMatchedPlayers = originalFullMatchedPlayers.find(
    //   (f) => f.playerUid === playerUid
    // );

    // if (findPrevMatchedPlayers !== undefined) {
    //   newPrevMatched.push({ ...findPrevMatchedPlayers });
    // }

    // if (findFullMatchedPlayers !== undefined) {
    //   newFullMatched.push({ ...findFullMatchedPlayers });
    // }

    // const promises = [
    //   setVotedPlayers(() => [...newVoted]),
    //   setPrevMatchedPlayers(() => [...newPrevMatched]),
    //   setFullMatchedPlayers(() => [...newFullMatched]),
    // ];

    // Promise.all(promises);
  };

  useEffect(() => {
    if (location.state) {
      initMatched();
    }
  }, [location.state]);

  return (
    <>
      {isLoading && (
        <div className="flex w-full h-screen justify-center items-center bg-white">
          <LoadingPage />
        </div>
      )}
      <div className="flex w-full h-full flex-col bg-white justify-start items-center p-5 gap-y-2">
        {!isLoading && compareInfo && (
          <>
            <div className="flex text-xl font-bold  bg-blue-300 rounded-lg w-full h-auto justify-center items-center text-gray-700 flex-col p-2 gap-y-2">
              <ConfirmationModal
                isOpen={msgOpen}
                message={message}
                onCancel={() => setMsgOpen(false)}
                onConfirm={() => setMsgOpen(false)}
              />
              <ConfirmationModal
                isOpen={lobbyMsgOpen}
                message={message}
                onCancel={() => setMsgOpen(false)}
                onConfirm={() => handleNavigateLobby()}
              />
              <div className="flex w-full bg-blue-100 rounded-lg py-3 flex-col">
                <div className="flex w-full h-auto justify-center items-center">
                  <span>
                    {stageInfo[0].categoryTitle}({stageInfo[0].gradeTitle}){" "}
                  </span>
                  <span className="pl-5 pr-2">
                    {compareInfo.compareIndex || 1}차
                  </span>
                  <span> 비교심사 투표</span>
                </div>
                <div className="flex w-full h-auto justify-center items-center text-3xl font-extrabold">
                  {compareInfo.playerLength}명을 선택해주세요
                </div>
              </div>
              <div className="flex w-full h-auto justify-center items-start flex-col text-base font-normal">
                <div className="flex flex-col w-full h-auto p-2 bg-blue-100 rounded-lg">
                  <div className="flex w-full justify-start items-center">
                    <span>투표한 인원수 : {judgeVoted.length || 0}명</span>
                    <span className="mx-3"> / </span>
                    <span>
                      남은 인원수 :{" "}
                      {compareInfo.playerLength - judgeVoted.length}명
                    </span>
                  </div>
                  <div className="flex w-full h-auto p-2 justify-start items-center">
                    {judgeVoted?.length > 0 ? (
                      <>
                        <div className="flex w-5/6 h-auto flex-wrap box-border">
                          {judgeVoted
                            .sort((a, b) => a.playerIndex - b.playerIndex)
                            .map((voted, vIdx) => {
                              const { playerUid, playerNumber } = voted;

                              return (
                                <div className="flex w-auto h-auto p-2 flex-col gap-y-2">
                                  <div className="flex w-20 h-20 rounded-lg bg-blue-500 justify-center items-center font-semibold border-2 border-blue-800 flex-col text-4xl text-gray-100">
                                    {playerNumber}
                                  </div>
                                  <button
                                    className="flex w-20 h-auto justify-center items-center bg-red-500 rounded-lg border-2 border-red-600 text-white text-sm"
                                    onClick={() =>
                                      handleUnVotedPlayers(
                                        playerUid,
                                        playerNumber,
                                        compareInfo.voteRange === "sub"
                                          ? "sub"
                                          : "original"
                                      )
                                    }
                                  >
                                    <span>취소</span>
                                  </button>
                                </div>
                              );
                            })}
                        </div>{" "}
                      </>
                    ) : (
                      <div className="flex w-full h-auto flex-wrap box-border">
                        <div className="flex w-full h-auto p-2 flex-col gap-y-2 text-lg justify-center items-center">
                          선수목록에서 선수번호를 터치해주세요.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* {prevMatchedPlayers?.length > 0 && voteInfo.compareIndex > 1 && (
              <div className="flex w-full h-auto p-2 bg-blue-400 rounded-lg flex-col gap-y-2">
                <div className="flex bg-blue-100 w-full h-auto p-2 rounded-lg">
                  n차 비교심사 명단
                </div>
                <div className="flex bg-blue-100 w-full h-auto p-2 rounded-lg">
                  <div className="flex w-20 h-20 rounded-lg bg-white justify-center items-center font-semibold border-2 border-blue-400 flex-col text-4xl">
                    13
                  </div>
                </div>
              </div>
            )} */}

            {compareInfo.voteRange === "voted" ? (
              <div className="flex w-full h-auto p-2 bg-blue-400 rounded-lg flex-col gap-y-2">
                <div className="flex bg-blue-100 w-full h-auto p-2 rounded-lg">
                  {compareInfo.compareIndex - 1}차 비교심사 명단
                </div>
                <div className="flex bg-gray-100 w-full h-auto p-2 rounded-lg gap-2 flex-wrap box-border">
                  {subPlayers?.length > 0 &&
                    subPlayers
                      .sort((a, b) => a.playerIndex - b.playerIndex)
                      .map((matched, mIdx) => {
                        const { playerUid, playerNumber, selected } = matched;

                        return (
                          <>
                            {selected ? (
                              <div className="flex w-20 h-20 rounded-lg bg-white justify-center items-center font-semibold border-2 border-gray-400 flex-col text-4xl text-green-500">
                                <AiFillCheckCircle />
                              </div>
                            ) : (
                              <button
                                className="flex w-20 h-20 rounded-lg bg-white justify-center items-center font-semibold border-2 border-gray-400 flex-col text-4xl"
                                onClick={() =>
                                  handleVotedPlayers(
                                    playerUid,
                                    playerNumber,
                                    "sub"
                                  )
                                }
                              >
                                {playerNumber}
                              </button>
                            )}
                          </>
                        );
                      })}
                </div>
              </div>
            ) : (
              <div className="flex w-full h-auto p-2 bg-gray-400 rounded-lg flex-col gap-y-2">
                <div className="flex bg-gray-100 w-full h-auto p-2 rounded-lg">
                  전체 선수명단
                </div>
                <div className="flex bg-gray-100 w-full h-auto p-2 rounded-lg gap-2 flex-wrap box-border">
                  {originalPlayers?.length > 0 &&
                    originalPlayers
                      .sort((a, b) => a.playerIndex - b.playerIndex)
                      .map((matched, mIdx) => {
                        const { playerUid, playerNumber, selected } = matched;
                        console.log(matched);
                        return (
                          <>
                            {selected ? (
                              <div className="flex w-20 h-20 rounded-lg bg-white justify-center items-center font-semibold border-2 border-gray-400 flex-col text-4xl text-green-500">
                                <AiFillCheckCircle />
                              </div>
                            ) : (
                              <button
                                className="flex w-20 h-20 rounded-lg bg-white justify-center items-center font-semibold border-2 border-gray-400 flex-col text-4xl"
                                onClick={() =>
                                  handleVotedPlayers(
                                    playerUid,
                                    playerNumber,
                                    "original"
                                  )
                                }
                              >
                                {playerNumber}
                              </button>
                            )}
                          </>
                        );
                      })}
                </div>
              </div>
            )}

            {compareInfo.playerLength === judgeVoted.length && (
              <div className="flex w-full h-auto ">
                <button
                  className="w-full h-14 rounded-lg bg-blue-500 text-gray-100 flex justify-center items-center text-2xl"
                  onClick={() =>
                    handleUpdateVote(
                      contestInfo.id,
                      contestInfo.contestComparesListId,
                      judgeInfo.seatIndex,
                      judgeVoted
                    )
                  }
                >
                  투표
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
export default CompareVote;
