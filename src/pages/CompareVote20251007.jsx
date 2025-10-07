import React, { useContext, useEffect, useState } from "react";
import LoadingPage from "./LoadingPage";
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmationModal from "../messageBox/ConfirmationModal";
import {
  useFirebaseRealtimeGetDocument,
  useFirebaseRealtimeUpdateData,
} from "../hooks/useFirebaseRealtime";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import {
  useFirestoreGetDocument,
  useFirestoreUpdateData,
} from "../hooks/useFirestores";
import { AiFillCheckCircle } from "react-icons/ai";

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

  const { currentContest } = useContext(CurrentContestContext);

  // 실시간 데이터 가져오기 (필요하다면 추가)
  // const { data: realtimeData } = useFirebaseRealtimeGetDocument(
  //   currentContest?.contests?.id
  //     ? `currentStage/${currentContest.contests.id}`
  //     : null
  // );

  const handleUpdateVote = async (contestId, seatIndex, votedPlayerNumber) => {
    try {
      await updateRealtime.updateData(
        `currentStage/${contestId}/compares/judges/${seatIndex - 1}`,
        {
          votedPlayerNumber,
          messageStatus: "투표완료",
        }
      );

      await updateRealtime.updateData(
        `currentStage/${contestId}/judges/${seatIndex - 1}`,
        { errors: "", isEnd: false, isLogined: true, seatIndex }
      );

      setMessage({
        body: "투표가 완료되었습니다.",
        body2: "대기화면으로 이동합니다.",
        isButton: true,
        confirmButtonText: "확인",
      });
      setLobbyMsgOpen(true);
    } catch (error) {
      console.error("Error updating vote:", error);
    }
  };

  const initMatched = () => {
    if (!location.state) {
      setIsLoading(false);
      return;
    }

    const {
      currentJudgeInfo,
      currentStageInfo,
      contestInfo,
      compareInfo,
      propSubPlayers = [],
    } = location.state;

    const newOriginalPlayers = currentStageInfo[0].originalPlayers.map(
      (player) => ({
        ...player,
        selected: false,
      })
    );

    const newSubPlayers = propSubPlayers.map((player) => ({
      ...player,
      selected: false,
    }));

    setJudgeInfo({ ...currentJudgeInfo });
    setStageInfo([...currentStageInfo]);
    setContestInfo({ ...contestInfo });
    setCompareInfo({ ...compareInfo });
    setOriginalPlayers([...newOriginalPlayers]);
    setSubPlayers([...newSubPlayers]);
    setIsLoading(false);
  };

  const handleNavigateLobby = () => {
    setLobbyMsgOpen(false);
    navigate("/lobby", { replace: true });
  };

  const handleVotedPlayers = (playerUid, playerNumber, listType) => {
    if (!playerUid || !playerNumber) return;

    if (judgeVoted.length >= compareInfo.playerLength) {
      setMessage({
        body: `${compareInfo.playerLength}명만 선택해주세요.`,
        isButton: true,
        confirmButtonText: "확인",
      });
      setMsgOpen(true);
      return;
    }

    const selectedInfo = { playerNumber, playerUid, selected: true };
    let updatedPlayers = [];
    if (listType === "original") {
      updatedPlayers = originalPlayers.map((player) =>
        player.playerNumber === playerNumber ? selectedInfo : player
      );
      setOriginalPlayers(updatedPlayers);
    } else if (listType === "sub") {
      updatedPlayers = subPlayers.map((player) =>
        player.playerNumber === playerNumber ? selectedInfo : player
      );
      setSubPlayers(updatedPlayers);
    }

    setJudgeVoted((prev) => [...prev, { playerNumber, playerUid }]);
  };

  const handleUnVotedPlayers = (playerUid, playerNumber, listType) => {
    if (!playerUid || !playerNumber) return;

    const selectedInfo = { playerNumber, playerUid, selected: false };
    let updatedPlayers = [];
    if (listType === "original") {
      updatedPlayers = originalPlayers.map((player) =>
        player.playerNumber === playerNumber ? selectedInfo : player
      );
      setOriginalPlayers(updatedPlayers);
    } else if (listType === "sub") {
      updatedPlayers = subPlayers.map((player) =>
        player.playerNumber === playerNumber ? selectedInfo : player
      );
      setSubPlayers(updatedPlayers);
    }

    setJudgeVoted((prev) =>
      prev.filter((voted) => voted.playerNumber !== playerNumber)
    );
  };

  useEffect(() => {
    initMatched();
  }, []);

  return (
    <>
      {isLoading ? (
        <div className="flex w-full h-screen justify-center items-center bg-white">
          <LoadingPage />
        </div>
      ) : (
        <div className="flex w-full h-full flex-col bg-white justify-start items-center p-5 gap-y-2">
          <ConfirmationModal
            isOpen={msgOpen}
            message={message}
            onCancel={() => setMsgOpen(false)}
            onConfirm={() => setMsgOpen(false)}
          />
          <ConfirmationModal
            isOpen={lobbyMsgOpen}
            message={message}
            onCancel={() => setLobbyMsgOpen(false)}
            onConfirm={handleNavigateLobby}
          />

          {/* 상단 정보 */}
          <div className="flex text-xl font-bold bg-blue-300 rounded-lg w-full h-auto justify-center items-center text-gray-700 flex-col p-2 gap-y-2">
            <div className="flex w-full bg-blue-100 rounded-lg py-3 flex-col">
              <div className="flex w-full h-auto justify-center items-center">
                <span>
                  {stageInfo[0]?.categoryTitle}({stageInfo[0]?.gradeTitle})
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
            {/* 투표한 인원수 및 목록 */}
            <div className="flex w-full h-auto justify-center items-start flex-col text-base font-normal">
              <div className="flex flex-col w-full h-auto p-2 bg-blue-100 rounded-lg">
                <div className="flex w-full justify-start items-center">
                  <span>투표한 인원수 : {judgeVoted.length || 0}명</span>
                  <span className="mx-3"> / </span>
                  <span>
                    남은 인원수 : {compareInfo.playerLength - judgeVoted.length}
                    명
                  </span>
                </div>
                <div className="flex w-full h-auto p-2 justify-start items-center">
                  {judgeVoted.length > 0 ? (
                    <div className="flex w-5/6 h-auto flex-wrap">
                      {judgeVoted.map((voted) => (
                        <div
                          key={voted.playerNumber}
                          className="flex w-auto h-auto p-2 flex-col gap-y-2"
                        >
                          <div className="flex w-20 h-20 rounded-lg bg-blue-500 justify-center items-center font-semibold border-2 border-blue-800 text-4xl text-gray-100">
                            {voted.playerNumber}
                          </div>
                          <button
                            className="flex w-20 h-auto justify-center items-center bg-red-500 rounded-lg border-2 border-red-600 text-white text-sm"
                            onClick={() =>
                              handleUnVotedPlayers(
                                voted.playerUid,
                                voted.playerNumber,
                                compareInfo.voteRange === "voted"
                                  ? "sub"
                                  : "original"
                              )
                            }
                          >
                            취소
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex w-full h-auto flex-wrap">
                      <div className="flex w-full h-auto p-2 flex-col gap-y-2 text-lg justify-center items-center">
                        선수목록에서 선수번호를 터치해주세요.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 투표 대상 선수 목록 */}
          {compareInfo.voteRange === "voted" ? (
            <div className="flex w-full h-auto p-2 bg-blue-400 rounded-lg flex-col gap-y-2">
              <div className="flex bg-blue-100 w-full h-auto p-2 rounded-lg">
                {compareInfo.compareIndex - 1}차 비교심사 명단
              </div>
              <div className="flex bg-gray-100 w-full h-auto p-2 rounded-lg gap-2 flex-wrap">
                {subPlayers.map((player) => (
                  <button
                    key={player.playerNumber}
                    className={`flex w-20 h-20 rounded-lg ${
                      player.selected ? "bg-green-500" : "bg-white"
                    } justify-center items-center font-semibold border-2 border-gray-400 text-4xl`}
                    onClick={() =>
                      player.selected
                        ? handleUnVotedPlayers(
                            player.playerUid,
                            player.playerNumber,
                            "sub"
                          )
                        : handleVotedPlayers(
                            player.playerUid,
                            player.playerNumber,
                            "sub"
                          )
                    }
                  >
                    {player.selected ? (
                      <AiFillCheckCircle />
                    ) : (
                      player.playerNumber
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex w-full h-auto p-2 bg-gray-400 rounded-lg flex-col gap-y-2">
              <div className="flex bg-gray-100 w-full h-auto p-2 rounded-lg">
                전체 선수명단
              </div>
              <div className="flex bg-gray-100 w-full h-auto p-2 rounded-lg gap-2 flex-wrap">
                {originalPlayers.map((player) => (
                  <button
                    key={player.playerNumber}
                    className={`flex w-20 h-20 rounded-lg ${
                      player.selected ? "bg-green-500" : "bg-white"
                    } justify-center items-center font-semibold border-2 border-gray-400 text-4xl`}
                    onClick={() =>
                      player.selected
                        ? handleUnVotedPlayers(
                            player.playerUid,
                            player.playerNumber,
                            "original"
                          )
                        : handleVotedPlayers(
                            player.playerUid,
                            player.playerNumber,
                            "original"
                          )
                    }
                  >
                    {player.selected ? (
                      <AiFillCheckCircle />
                    ) : (
                      player.playerNumber
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 투표 버튼 */}
          {compareInfo.playerLength === judgeVoted.length && (
            <div className="flex w-full h-auto">
              <button
                className="w-full h-14 rounded-lg bg-blue-500 text-gray-100 flex justify-center items-center text-2xl"
                onClick={() =>
                  handleUpdateVote(
                    contestInfo.id,
                    judgeInfo.seatIndex,
                    judgeVoted
                  )
                }
              >
                투표
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CompareVote;
