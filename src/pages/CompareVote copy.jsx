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

const CompareVote = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const [msgOpen, setMsgOpen] = useState(false);
  const [lobbyMsgOpen, setLobbyMsgOpen] = useState(false);
  const [message, setMessage] = useState({});

  const [originalFullMatchedPlayers, setOriginalFullMatchedPlayers] = useState(
    []
  );
  const [originalPrevMatchedPlayers, setOriginalPrevMatchedPlayers] = useState(
    []
  );
  const [fullMatchedPlayers, setFullMatchedPlayers] = useState([]);
  const [prevMatchedPlayers, setPrevMatchedPlayers] = useState([]);
  const [voteInfo, setVoteInfo] = useState({});
  const [compareList, setCompareList] = useState({});
  const [compareArray, setCompareArray] = useState([]);
  const [votedPlayers, setVotedPlayers] = useState([]);
  const [stageInfo, setStageInfo] = useState({});
  const [judgeSeatIndex, setJudgeSeatIndex] = useState();
  const { currentContest } = useContext(CurrentContestContext);

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
    const {
      fullMatched,
      prevMatched,
      voteInfo: realtimeVoteInfo,
      stageInfo: stateStageInfo,
      seatIndex,
    } = location.state;
    const promises = [
      setFullMatchedPlayers(fullMatched),
      setOriginalFullMatchedPlayers(fullMatched),
      setPrevMatchedPlayers(prevMatched),
      setOriginalPrevMatchedPlayers(prevMatched),
      setStageInfo(stateStageInfo),
      setVoteInfo(realtimeVoteInfo),
      setJudgeSeatIndex(seatIndex),
      setIsLoading(false),
    ];
    Promise.all(promises);
  };

  const handleNavigateLobby = () => {
    setLobbyMsgOpen(false);
    navigate("/comparelobby", { replace: true });
  };

  const handleVotedPlayers = (playerUid, playerNumber) => {
    if (!playerUid && !playerNumber) {
      return;
    }

    if (votedPlayers.length >= voteInfo.playerLength) {
      setMessage({
        body: `${voteInfo.playerLength}명만 선택해주세요`,
        isButton: true,
        confirmButtonText: "확인",
      });
      setMsgOpen(true);
      return;
    }
    const newVoted = [...votedPlayers];
    const newPrevMatched = [...prevMatchedPlayers];
    const newFullMatched = [...fullMatchedPlayers];
    const votedInfo = { playerUid, playerNumber };

    newVoted.push({ ...votedInfo });

    if (prevMatchedPlayers?.length > 0) {
      const findIndexPrevMatched = newPrevMatched.findIndex(
        (f) => f.playerUid === playerUid
      );
      newPrevMatched.splice(findIndexPrevMatched, 1);
    }

    if (fullMatchedPlayers?.length > 0) {
      const findIndexFullMatched = newFullMatched.findIndex(
        (f) => f.playerUid === playerUid
      );
      newFullMatched.splice(findIndexFullMatched, 1);
    }

    const promises = [
      setVotedPlayers(() => [...newVoted]),
      setPrevMatchedPlayers(() => [...newPrevMatched]),
      setFullMatchedPlayers(() => [...newFullMatched]),
    ];

    Promise.all(promises);
  };

  const handleUnVotedPlayers = (playerUid, playerNumber) => {
    if (!playerUid && !playerNumber) {
      return;
    }
    const newVoted = votedPlayers.filter((f) => f.playerUid !== playerUid);
    const newPrevMatched = [...prevMatchedPlayers];
    const newFullMatched = [...fullMatchedPlayers];

    const findPrevMatchedPlayers = originalPrevMatchedPlayers.find(
      (f) => f.playerUid === playerUid
    );

    const findFullMatchedPlayers = originalFullMatchedPlayers.find(
      (f) => f.playerUid === playerUid
    );

    if (findPrevMatchedPlayers !== undefined) {
      newPrevMatched.push({ ...findPrevMatchedPlayers });
    }

    if (findFullMatchedPlayers !== undefined) {
      newFullMatched.push({ ...findFullMatchedPlayers });
    }

    const promises = [
      setVotedPlayers(() => [...newVoted]),
      setPrevMatchedPlayers(() => [...newPrevMatched]),
      setFullMatchedPlayers(() => [...newFullMatched]),
    ];

    Promise.all(promises);
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
        {!isLoading && voteInfo && (
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
                    {stageInfo.categoryTitle}({stageInfo.grades[0].gradeTitle}){" "}
                  </span>
                  <span className="pl-5 pr-2">
                    {voteInfo.compareIndex || 1}차
                  </span>
                  <span> 비교심사 투표</span>
                </div>
                <div className="flex w-full h-auto justify-center items-center text-3xl font-extrabold">
                  {voteInfo.playerLength}명을 선택해주세요
                </div>
              </div>
              <div className="flex w-full h-auto justify-center items-start flex-col text-base font-normal">
                <div className="flex flex-col w-full h-auto p-2 bg-blue-100 rounded-lg">
                  <div className="flex w-full justify-start items-center">
                    <span>투표한 인원수 : {votedPlayers.length || 0}명</span>
                    <span className="mx-3"> / </span>
                    <span>
                      남은 인원수 :{" "}
                      {voteInfo.playerLength - votedPlayers.length}명
                    </span>
                  </div>
                  <div className="flex w-full h-auto p-2 justify-start items-center">
                    {votedPlayers?.length > 0 ? (
                      <>
                        <div className="flex w-5/6 h-auto flex-wrap box-border">
                          {votedPlayers
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
                                        playerNumber
                                      )
                                    }
                                  >
                                    <span>취소</span>
                                  </button>
                                </div>
                              );
                            })}
                        </div>{" "}
                        {5 - votedPlayers.length === 0 && (
                          <div className="flex 1/6">제출</div>
                        )}
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
            {prevMatchedPlayers?.length > 0 && voteInfo.compareIndex > 1 && (
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
            )}

            <div className="flex w-full h-auto p-2 bg-gray-400 rounded-lg flex-col gap-y-2">
              <div className="flex bg-gray-100 w-full h-auto p-2 rounded-lg">
                전체 선수명단
              </div>
              <div className="flex bg-gray-100 w-full h-auto p-2 rounded-lg gap-2 flex-wrap box-border">
                {fullMatchedPlayers?.length > 0 &&
                  fullMatchedPlayers
                    .sort((a, b) => a.playerIndex - b.playerIndex)
                    .map((matched, mIdx) => {
                      const { playerUid, playerNumber } = matched;

                      return (
                        <button
                          className="flex w-20 h-20 rounded-lg bg-white justify-center items-center font-semibold border-2 border-gray-400 flex-col text-4xl"
                          onClick={() =>
                            handleVotedPlayers(playerUid, playerNumber)
                          }
                        >
                          {playerNumber}
                        </button>
                      );
                    })}
              </div>
            </div>
            {voteInfo.playerLength === votedPlayers.length && (
              <div className="flex w-full h-auto p-2 ">
                <button
                  className="w-full h-10 rounded-lg bg-blue-500 text-gray-100 flex justify-center items-center"
                  onClick={() =>
                    handleUpdateVote(
                      currentContest.contests.id,
                      currentContest.contests.contestComparesListId,
                      judgeSeatIndex,
                      votedPlayers
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
