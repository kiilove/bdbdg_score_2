"use client";

import { useContext, useEffect, useState } from "react";
import LoadingPage from "./LoadingPage";
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmationModal from "../messageBox/ConfirmationModal";
import { useFirebaseRealtimeUpdateData } from "../hooks/useFirebaseRealtime";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import { Card, Button, Space, Badge } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";

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
        {
          errors: "",
          isEnd: false,
          isLogined: true,
          seatIndex,
        }
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

  useEffect(() => {
    console.log(location);
  }, [location]);

  return (
    <>
      {isLoading ? (
        <div className="flex w-full h-screen justify-center items-center bg-white">
          <LoadingPage />
        </div>
      ) : (
        <div className="flex w-full h-screen flex-col bg-gray-50 overflow-hidden">
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

          {/* 상단 정보 카드 */}
          <div className="flex-shrink-0 p-2">
            <Card className="shadow-lg">
              <Space direction="vertical" size={6} className="w-full">
                {/* 종목 및 차수 정보 */}
                <div className="flex items-center justify-center gap-2 md:gap-4 text-center">
                  <span className="text-base md:text-lg font-semibold text-gray-700">
                    {stageInfo[0]?.categoryTitle}({stageInfo[0]?.gradeTitle})
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-sm md:text-base font-medium text-gray-600">
                    {compareInfo.compareIndex || 1}차 비교심사 투표
                  </span>
                </div>

                {/* 선택 인원수 강조 */}
                <div
                  className="text-center py-4 rounded-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <div className="text-white text-lg md:text-xl font-bold">
                    {compareInfo.playerLength}명을 선택해주세요
                  </div>
                </div>

                {/* 투표 현황 */}
                <Card
                  className="bg-gray-50"
                  bodyStyle={{ padding: "6px 10px" }}
                >
                  <Space direction="vertical" size={4} className="w-full">
                    <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                      <span className="font-semibold">
                        투표:{" "}
                        <span className="text-blue-600">
                          {judgeVoted.length || 0}
                        </span>
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className="font-semibold">
                        남은:{" "}
                        <span className="text-orange-600">
                          {compareInfo.playerLength - judgeVoted.length}
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[72px] items-start">
                      {judgeVoted.length > 0 ? (
                        judgeVoted.map((voted) => (
                          <Badge
                            key={voted.playerNumber}
                            count={voted.playerNumber}
                            overflowCount={9999}
                            onClick={() =>
                              handleUnVotedPlayers(
                                voted.playerUid,
                                voted.playerNumber,
                                compareInfo.voteRange === "voted"
                                  ? "sub"
                                  : "original"
                              )
                            }
                            style={{
                              backgroundColor: "#1890ff",
                              fontSize: "18px",
                              fontWeight: "bold",
                              width: "66px",
                              height: "66px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            className="hover:opacity-80"
                          />
                        ))
                      ) : (
                        <div className="w-full text-center text-gray-500 py-1 text-xs">
                          선수번호를 터치해주세요.
                        </div>
                      )}
                    </div>
                  </Space>
                </Card>
              </Space>
            </Card>
          </div>

          {/* 투표 대상 선수 목록 */}
          <div className="flex-1 overflow-y-auto px-2">
            {compareInfo.voteRange === "voted" ? (
              <Card
                title={`${compareInfo.compareIndex - 1}차 비교심사 명단`}
                style={{
                  header: {
                    fontSize: "16px",
                    fontWeight: "600",
                    padding: "8px 16px",
                    minHeight: "auto",
                  },
                }}
                className="shadow-lg mb-2"
                bodyStyle={{ padding: "8px" }}
              >
                <div className="flex flex-wrap gap-1">
                  {subPlayers.map((player) => (
                    <Button
                      key={player.playerNumber}
                      type={player.selected ? "primary" : "default"}
                      size="large"
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
                      className="w-16 h-16 min-w-[64px] text-xl font-bold flex-shrink-0"
                      icon={player.selected ? <CheckCircleFilled /> : null}
                    >
                      {!player.selected && player.playerNumber}
                    </Button>
                  ))}
                </div>
              </Card>
            ) : (
              <Card
                title="전체 선수명단"
                style={{
                  header: {
                    fontSize: "16px",
                    fontWeight: "600",
                    padding: "8px 16px",
                    minHeight: "auto",
                  },
                }}
                className="shadow-lg mb-2"
                bodyStyle={{ padding: "8px" }}
              >
                <div className="flex flex-wrap gap-1">
                  {originalPlayers.map((player) => (
                    <Button
                      key={player.playerNumber}
                      type={player.selected ? "primary" : "default"}
                      size="large"
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
                      className="w-24 h-24 min-w-[96px] text-xl font-bold flex-shrink-0"
                      icon={player.selected ? <CheckCircleFilled /> : null}
                    >
                      {!player.selected && player.playerNumber}
                    </Button>
                  ))}
                </div>
              </Card>
            )}
            {/* 투표 버튼 */}
            {compareInfo.playerLength === judgeVoted.length && (
              <div className="flex-shrink-0 p-2">
                <Button
                  type="primary"
                  size="large"
                  onClick={() =>
                    handleUpdateVote(
                      contestInfo.id,
                      judgeInfo.seatIndex,
                      judgeVoted
                    )
                  }
                  className="w-full h-14 text-lg font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                  }}
                >
                  투표
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CompareVote;
