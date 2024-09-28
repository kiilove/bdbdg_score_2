import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useFirebaseRealtimeGetDocument,
  useFirebaseRealtimeQuery,
  useFirebaseRealtimeUpdateData,
} from "../hooks/useFirebaseRealtime";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import { useFirestoreGetDocument } from "../hooks/useFirestores";

const ScoreLoginAuto = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [contestSchedule, setContestSchedule] = useState([]);
  const [contestJudgeAssign, setContestJudgeAssign] = useState([]);
  const [currentShedule, setCurrentShedule] = useState({});
  const [currentJudgeAssign, setCurrentJudgeAssign] = useState({});
  const [nextShedule, setNextShedule] = useState({});
  const [nextJudgeAssign, setNextJudgeAssign] = useState({});
  const [contests, setContests] = useState({});
  const [currentStageNumber, setCurrentStageNumber] = useState();
  const [collectionInfo, setCollectionInfo] = useState(null);
  const { data, loading, error, getDocument } =
    useFirebaseRealtimeGetDocument();

  const updateRealtimeJudge = useFirebaseRealtimeUpdateData();

  const pwdRef1 = useRef(null);
  const pwdRef2 = useRef(null);
  const pwdRef3 = useRef(null);
  const pwdRef4 = useRef(null);

  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [password3, setPassword3] = useState("");
  const [password4, setPassword4] = useState("");
  const [password, setPassword] = useState("");
  const handleKeyDown = (refPrev, event) => {
    if (event.key === "Backspace" && event.target.value === "") {
      refPrev.current.focus();
    }
  };

  const handleUpdateState = async (collectionName, documentId, seatIndex) => {
    const currentJudge = {
      isLogined: true,
      isEnd: false,
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

  const handleJudgeLogin = async (collectionName, documentId, seatIndex) => {
    await handleUpdateState(
      `${collectionName}/${documentId}/judges`,
      seatIndex - 1,
      seatIndex
    ).then(() =>
      navigate("/autoscoretable", {
        state: {
          stageId: data.stageId,
          contestId: contests.contests.id,
          scheduleInfo: currentShedule,
          judgeInfo: currentJudgeAssign,
          nextSchedule: nextShedule,
          nextJudge: nextJudgeAssign,
          collectionInfo,
        },
      })
    );
  };

  const handleInputs = (setPwd, pwdRefNext, event) => {
    if (event.target.value.length > 1) {
      return; // 입력의 길이가 1을 초과하면 아무 것도 하지 않음
    }
    setPwd(event.target.value);
    if (event.target.value) {
      pwdRefNext.current.focus();
    }
  };
  const handleInputsLast = (setPwd, pwdRefNext, event, onedayPassword) => {
    if (event.target.value.length > 1) {
      return; // 입력의 길이가 1을 초과하면 아무 것도 하지 않음
    }
    setPwd(event.target.value);

    if (event.target.value) {
      const pwd =
        pwdRef1.current.value.toString() +
        pwdRef2.current.value.toString() +
        pwdRef3.current.value.toString() +
        pwdRef4.current.value.toString();
      setPassword(pwd);
    }
  };
  //const { currentContest } = useContext(CurrentContestContext);

  const fetchSchedule = useFirestoreGetDocument("contest_data");
  const fetchJudgeAssign = useFirestoreGetDocument("contest_judges_assign");

  const fetchPool = async (contestDataId, contestJudgeAssignId) => {
    const returnSchedule = await fetchSchedule.getDocument(contestDataId);
    const returnJudgeAssign = await fetchJudgeAssign.getDocument(
      contestJudgeAssignId
    );
    returnSchedule && setCollectionInfo(returnSchedule.collectionTitle);
    returnSchedule && setContestSchedule([...returnSchedule.schedule]);
    returnJudgeAssign && setContestJudgeAssign([...returnJudgeAssign.judges]);
  };

  const handleCurrentInfo = (stageId) => {
    const findSchedule = contestSchedule.find((f) => f.stageId === stageId);
    const findNextSchedule = contestSchedule.find(
      (f) => f.stageNumber === findSchedule.stageNumber + 1
    );

    const findJudges = contestJudgeAssign.find(
      (f) =>
        f.gradeId === findSchedule?.contestGradeId &&
        f.seatIndex === contests.machineId
    );
    const findNextJudges = contestJudgeAssign.find(
      (f) =>
        f.gradeId === findNextSchedule?.contestGradeId &&
        f.seatIndex === contests.machineId
    );
    //console.log(findNextJudges);

    setCurrentShedule({ ...findSchedule });
    setCurrentJudgeAssign({ ...findJudges });
    setNextShedule({ ...findNextSchedule });
    setNextJudgeAssign({ ...findNextJudges });
  };

  useEffect(() => {
    const getContests = JSON.parse(localStorage.getItem("currentContest"));

    if (!getContests) {
      navigate("/adminlogin", { replace: true });
    } else {
      setContests(getContests);
    }
  }, []);

  useEffect(() => {
    if (contests?.contests?.id) {
      getDocument("currentStage", contests.contests.id); // Replace with your actual collection name and document id
    }
  }, [getDocument, contests]);

  useEffect(() => {
    contests?.contests?.id &&
      fetchPool(
        contests.contests.contestDataId,
        contests.contests.contestJudgeAssignListId
      );
  }, [contests]);

  useEffect(() => {
    //console.log(data);
    if (
      contestSchedule?.length > 0 &&
      contestJudgeAssign?.length > 0 &&
      data?.stageId
    ) {
      handleCurrentInfo(data.stageId);
      setCurrentStageNumber(data.stageNumber);
    }
  }, [contestSchedule, contestJudgeAssign, data]);

  if (!contests) {
    // 리다이렉트를 위한 useEffect를 기다림
    return null;
  }

  return (
    <div className="flex w-full h-full flex-col">
      <div className="flex w-full justify-center items-center h-20">
        <span className="text-6xl font-sans font-bold text-gray-800">
          JUDGE
        </span>
        <span className="text-6xl font-sans font-bold text-gray-800 ml-2">
          {contests?.machineId}
        </span>
      </div>
      <div className="flex text-5xl font-bold text-blue-900 h-auto w-full justify-center items-center p-5">
        {nextShedule?.contestCategoryTitle} ({nextShedule?.contestGradeTitle})
        {currentJudgeAssign?.onedayPassword}
      </div>

      <div className="flex w-full h-auto p-3 justify-center items-center">
        {location?.state?.propStageNumber !== currentStageNumber ? (
          <button
            className=" w-44 h-24 bg-blue-500 text-white text-2xl font-semibold rounded-lg"
            onClick={() =>
              handleJudgeLogin(
                "currentStage",
                contests.contests.id,
                currentJudgeAssign.seatIndex
              )
            }
          >
            대기중
          </button>
        ) : (
          <button
            className=" w-44 h-24 bg-blue-500 text-white text-2xl font-semibold rounded-lg"
            onClick={() =>
              handleJudgeLogin(
                "currentStage",
                contests.contests.id,
                currentJudgeAssign.seatIndex
              )
            }
          >
            심사진행
          </button>
        )}
      </div>
    </div>
  );
};

export default ScoreLoginAuto;
