// src/utils/scoreCard.js
import { PointArray } from "../components/PointCard";

/**
 * 무대/심판/선수 데이터로 ScoreCard 구조를 생성
 */
export const makeScoreCard = (
  stageInfo,
  judgeInfo,
  grades,
  players,
  topPlayers = [],
  prevComparePlayers = [],
  realtimeComparemode = {},
  judgePoolsArray = []
) => {
  const { stageId, stageNumber, categoryJudgeType } = stageInfo;
  const { judgeUid, judgeName, isHead, seatIndex, contestId, onedayPassword } =
    judgeInfo;

  const judgeSignature = judgePoolsArray.find(
    (f) => f.judgeUid === judgeUid
  )?.judgeSignature;

  const playerPointArray = PointArray.map((point) => {
    const { title } = point;
    return { title, point: undefined };
  });

  const scoreCardInfo = grades.map((grade) => {
    const { categoryId, categoryTitle, gradeId, gradeTitle } = grade;

    let comparePlayers = [];
    if (realtimeComparemode.scoreMode === "topOnly" && topPlayers.length > 0) {
      comparePlayers = [...topPlayers];
    }
    if (
      realtimeComparemode.scoreMode === "topWithSub" &&
      prevComparePlayers.length > 0
    ) {
      comparePlayers = [...prevComparePlayers];
    }

    const filterPlayers = players
      .filter((player) => player.contestGradeId === gradeId)
      .sort((a, b) => a.playerIndex - b.playerIndex);

    let matchedOriginalPlayers = filterPlayers.map((player) => ({
      ...player,
      playerScore: 0,
      playerPointArray,
    }));

    let matchedOriginalRange = matchedOriginalPlayers.map((player, pIdx) => ({
      scoreValue: pIdx + 1,
      scoreIndex: pIdx,
      scoreOwner: undefined,
    }));

    const filterTopPlayers = filterPlayers.filter((fp) =>
      topPlayers.some((cp) => cp.playerNumber === fp.playerNumber)
    );
    const filterSubPlayers = comparePlayers.filter((fp) =>
      topPlayers.every((cp) => cp.playerNumber !== fp.playerNumber)
    );

    let filterNormalPlayers = [];
    let filterExtraPlayers = [];

    if (
      realtimeComparemode.scoreMode === "topOnly" ||
      realtimeComparemode.scoreMode === "topWithSub"
    ) {
      filterNormalPlayers = [];
      filterExtraPlayers = filterPlayers.filter((fp) =>
        comparePlayers.every((cp) => cp.playerNumber !== fp.playerNumber)
      );
    }

    if (realtimeComparemode.scoreMode === "all") {
      filterNormalPlayers = filterPlayers.filter(
        (fp) => !topPlayers.some((cp) => cp.playerNumber === fp.playerNumber)
      );
    }

    const buildMatched = (source, baseScore = 0, startIndex = 0) =>
      source.map((p, idx) => ({
        ...p,
        playerScore: baseScore,
        playerPointArray,
        range: {
          scoreValue: startIndex + idx + 1,
          scoreIndex: startIndex + idx,
          scoreOwner: undefined,
        },
      }));

    const matchedTop = buildMatched(filterTopPlayers);
    const matchedSub = buildMatched(filterSubPlayers, 0, matchedTop.length);
    const matchedNormal = buildMatched(
      filterNormalPlayers,
      0,
      matchedTop.length + matchedSub.length
    );
    const matchedExtra = filterExtraPlayers.map((p) => ({
      ...p,
      playerScore: 1000,
      playerPointArray,
      range: {
        scoreValue: 1000,
        scoreIndex: matchedNormal.length,
        scoreOwner: "noId",
      },
    }));

    if (matchedExtra.length > 0) {
      matchedOriginalPlayers = matchedOriginalPlayers.map((p) => ({
        ...p,
        playerScore: matchedExtra.some((e) => e.playerNumber === p.playerNumber)
          ? 1000
          : p.playerScore,
      }));
    }

    if (matchedTop.length === 0 && matchedNormal.length === 0) {
      matchedNormal.push(
        ...matchedOriginalPlayers.map((p, idx) => ({
          ...p,
          range: {
            scoreValue: idx + 1,
            scoreIndex: idx,
            scoreOwner: undefined,
          },
        }))
      );
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
      matchedTopPlayers: matchedTop,
      matchedTopRange: matchedTop.map((m) => m.range),
      matchedSubPlayers: matchedSub,
      matchedSubRange: matchedSub.map((m) => m.range),
      matchedNormalPlayers: matchedNormal,
      matchedNormalRange: matchedNormal.map((m) => m.range),
      matchedExtraPlayers: matchedExtra,
      matchedExtraRange: matchedExtra.map((m) => m.range),
    };
  });

  return scoreCardInfo;
};
