// src/utils/navigateJudge.js
export const handleNavigate = async ({
  actionType,
  navigate,
  updateRealtimeData,
  contestInfo,
  currentStageInfo,
  currentJudgeInfo,
  realtimeData,
  currentComparesArray,
}) => {
  const collectionInfo = `currentStage/${contestInfo.id}/judges/${
    currentJudgeInfo.seatIndex - 1
  }`;

  let prevTop = [];
  if (
    currentComparesArray.length > 0 &&
    currentComparesArray[currentComparesArray.length - 1]?.players
  ) {
    prevTop = [
      ...currentComparesArray[currentComparesArray.length - 1].players,
    ];
  }

  switch (actionType) {
    case "login":
      navigate("/scorelogin", {
        replace: true,
        state: { currentStageInfo, currentJudgeInfo, contestInfo },
      });
      break;

    case "point":
      await updateRealtimeData.updateData(collectionInfo, {
        isEnd: false,
        isLogined: true,
        seatIndex: currentJudgeInfo.seatIndex,
      });
      navigate("/autopointtable", {
        replace: true,
        state: {
          currentStageInfo,
          currentJudgeInfo,
          contestInfo,
          compareInfo: { ...realtimeData?.compares },
        },
      });
      break;

    case "ranking":
      await updateRealtimeData.updateData(collectionInfo, {
        isEnd: false,
        isLogined: true,
        seatIndex: currentJudgeInfo.seatIndex,
      });
      navigate("/autoscoretable", {
        replace: true,
        state: {
          currentStageInfo,
          currentJudgeInfo,
          contestInfo,
          compareInfo: { ...realtimeData?.compares },
        },
      });
      break;

    case "vote":
      await updateRealtimeData.updateData(
        `currentStage/${contestInfo.id}/compares/judges/${
          currentJudgeInfo.seatIndex - 1
        }/messageStatus`,
        "투표중"
      );
      navigate("/comparevote", {
        replace: true,
        state: {
          currentStageInfo,
          currentJudgeInfo,
          contestInfo,
          compareInfo: { ...realtimeData?.compares },
          propSubPlayers: [...prevTop],
        },
      });
      break;

    default:
      console.warn("Invalid actionType:", actionType);
  }
};
