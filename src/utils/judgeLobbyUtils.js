// src/utils/judgeLobbyUtils.js
import { PointArray } from "../components/PointCard";

// 디버그 로그 추가용 헬퍼
export const addLog = (setLogs, logMessage) => {
  setLogs((prevLogs) => [...prevLogs, logMessage]);
};

// 기기 초기화 체크
export const handleMachineCheck = (
  setIsLoading,
  setMessage,
  setMsgOpen,
  setMachineId,
  setContestInfo,
  setLocalJudgeUid,
  addLogFn
) => {
  addLogFn("Machine check started.");
  const savedCurrentContest = JSON.parse(
    localStorage.getItem("currentContest")
  );
  addLogFn(`Saved Current Contest: ${JSON.stringify(savedCurrentContest)}`);

  const loginedJudgeUid = JSON.parse(localStorage.getItem("loginedUid"));

  let timer = setTimeout(() => {
    if (!savedCurrentContest?.contests) {
      setIsLoading(false);
      setMessage({
        body: "기기 초기값이 설정되지 않았습니다.",
        body2: "관리자 로그인페이지로 이동합니다.",
        isButton: true,
        confirmButtonText: "확인",
      });
      setMsgOpen(true);
      addLogFn("기기 초기값이 설정되지 않음");
    }
  }, 2000);

  if (savedCurrentContest?.contests) {
    clearTimeout(timer);
    setMachineId(savedCurrentContest?.machineId);
    setContestInfo(savedCurrentContest?.contests);
    if (loginedJudgeUid) {
      setLocalJudgeUid(loginedJudgeUid);
      addLogFn("JudgeUid: " + loginedJudgeUid);
    }
    setIsLoading(false);
  }
};

// 파이어스토어 데이터 불러오기
export const fetchPool = async ({
  stageId,
  judgeAssignId,
  playersFinalId,
  contestId,
  compareListId,
  fetchStagesAssign,
  fetchJudgeAssign,
  fetchPlayersFinal,
  fetchCompareList,
  fetchJudgePool,
  setCurrentStagesAssign,
  setCurrentJudgeAssign,
  setCurrentPlayersFinalArray,
  setCurrentComparesArray,
  setJudgePoolsArray,
  setIsRefresh,
  addLogFn,
}) => {
  addLogFn("Fetching pool data...");
  const { where } = await import("firebase/firestore");
  const condition = [where("contestId", "==", contestId)];
  try {
    const stageData = await fetchStagesAssign.getDocument(stageId);
    setCurrentStagesAssign([...stageData.stages]);
    addLogFn(`Fetched stages: ${JSON.stringify(stageData)}`);

    const judgeData = await fetchJudgeAssign.getDocument(judgeAssignId);
    setCurrentJudgeAssign([...judgeData.judges]);
    addLogFn(`Fetched judges: ${JSON.stringify(judgeData)}`);

    const playersData = await fetchPlayersFinal.getDocument(playersFinalId);
    setCurrentPlayersFinalArray([
      ...playersData.players.filter((f) => f.playerNoShow === false),
    ]);
    addLogFn(`Fetched players: ${JSON.stringify(playersData)}`);

    const compareData = await fetchCompareList.getDocument(compareListId);
    if (compareData?.compares?.length > 0) {
      setCurrentComparesArray([...compareData.compares]);
      addLogFn(`Fetched compares: ${JSON.stringify(compareData)}`);
    }

    const poolData = await fetchJudgePool.getDocuments(
      "contest_judges_pool",
      condition
    );
    setJudgePoolsArray([...poolData]);
    addLogFn(`Fetched judge pool: ${JSON.stringify(poolData)}`);
  } catch (error) {
    addLogFn(`Error fetching pool data: ${error.message}`);
  } finally {
    setIsRefresh(false);
  }
};

// 스코어카드 생성
export const makeScoreCard = ({
  stageInfo,
  judgeInfo,
  grades,
  players,
  topPlayers = [],
  prevComparePlayers = [],
  realtimeComparemode = {},
  judgePoolsArray,
}) => {
  const { stageId, stageNumber, categoryJudgeType } = stageInfo;
  const { judgeUid, judgeName, isHead, seatIndex, contestId, onedayPassword } =
    judgeInfo;

  const judgeSignature = judgePoolsArray.find(
    (f) => f.judgeUid === judgeUid
  )?.judgeSignature;

  const playerPointArray = PointArray.map((point) => ({
    title: point.title,
    point: undefined,
  }));

  const scoreCardInfo = grades.map((grade) => {
    const { categoryId, categoryTitle, gradeId, gradeTitle } = grade;

    const filterPlayers = players
      .filter((p) => p.contestGradeId === gradeId)
      .sort((a, b) => a.playerIndex - b.playerIndex);

    let matchedOriginalPlayers = filterPlayers.map((player) => ({
      ...player,
      playerScore: 0,
      playerPointArray,
    }));
    let matchedOriginalRange = matchedOriginalPlayers.map((_, idx) => ({
      scoreValue: idx + 1,
      scoreIndex: idx,
      scoreOwner: undefined,
    }));

    // topPlayers / prevComparePlayers / 모드별 처리
    let comparePlayers = [];
    if (realtimeComparemode.scoreMode === "topOnly" && topPlayers.length > 0)
      comparePlayers = [...topPlayers];
    if (
      realtimeComparemode.scoreMode === "topWithSub" &&
      prevComparePlayers.length > 0
    )
      comparePlayers = [...prevComparePlayers];

    const filterTopPlayers = filterPlayers.filter((fp) =>
      topPlayers.some((tp) => tp.playerNumber === fp.playerNumber)
    );
    const filterSubPlayers = comparePlayers.filter((fp) =>
      topPlayers.every((tp) => tp.playerNumber !== fp.playerNumber)
    );

    let filterNormalPlayers = [];
    let filterExtraPlayers = [];

    if (
      realtimeComparemode.scoreMode === "topOnly" ||
      realtimeComparemode.scoreMode === "topWithSub"
    ) {
      filterExtraPlayers = filterPlayers.filter((fp) =>
        comparePlayers.every((cp) => cp.playerNumber !== fp.playerNumber)
      );
    }
    if (realtimeComparemode.scoreMode === "all") {
      filterNormalPlayers = filterPlayers.filter(
        (fp) => !topPlayers.some((tp) => tp.playerNumber === fp.playerNumber)
      );
    }

    // Range 생성 유틸
    const createRange = (playersArr, startIndex = 0, scoreValue = 1) =>
      playersArr.map((_, idx) => ({
        scoreValue: scoreValue + idx,
        scoreIndex: startIndex + idx,
        scoreOwner: undefined,
      }));

    const matchedTopPlayers = filterTopPlayers.map((p) => ({
      ...p,
      playerScore: 0,
      playerPointArray,
    }));
    const matchedTopRange = createRange(matchedTopPlayers);

    const matchedSubPlayers = filterSubPlayers.map((p) => ({
      ...p,
      playerScore: 0,
      playerPointArray,
    }));
    const matchedSubRange = createRange(
      matchedSubPlayers,
      matchedTopPlayers.length,
      matchedTopPlayers.length + 1
    );

    const matchedNormalPlayers = filterNormalPlayers.map((p) => ({
      ...p,
      playerScore: 0,
      playerPointArray,
    }));
    const matchedNormalRange = createRange(
      matchedNormalPlayers,
      matchedTopPlayers.length + matchedSubPlayers.length,
      matchedTopPlayers.length + matchedSubPlayers.length + 1
    );

    const matchedExtraPlayers = filterExtraPlayers.map((p) => ({
      ...p,
      playerScore: 1000,
      playerPointArray,
    }));
    const matchedExtraRange = matchedExtraPlayers.map((_, idx) => ({
      scoreValue: 1000,
      scoreIndex: matchedNormalPlayers.length + idx,
      scoreOwner: "noId",
    }));

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

// 로그인 상태 체크
export const handleLoginCheck = (
  judgeUid,
  currentJudgeUid,
  setJudgeLogined,
  addLogFn
) => {
  addLogFn(
    `Login check started: judgeUid=${judgeUid}, currentJudgeUid=${currentJudgeUid}`
  );
  if (!judgeUid || judgeUid !== currentJudgeUid) {
    setJudgeLogined(false);
    addLogFn("judgeUid mismatch or undefined -> set false");
  } else {
    setJudgeLogined(true);
    addLogFn("judgeUid matched -> set true");
  }
};
