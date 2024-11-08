import React, { useContext, useEffect, useState } from "react";
import {
  useFirestoreGetDocument,
  useFirestoreQuery,
} from "../hooks/useFirestores";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import { useNavigate } from "react-router-dom";
import { BasicDataContext } from "../contexts/BasicDataContext";
import { where } from "firebase/firestore";

const Setting = () => {
  const [collectionPool, setCollectionPool] = useState([]);
  const [contestId, setContestId] = useState("");
  const [logs, setLogs] = useState([]); // 디버깅 로그 저장
  const [showLogs, setShowLogs] = useState(false); // 로그 보이기 여부
  const { currentContest, setCurrentContest } = useContext(
    CurrentContestContext
  );

  const fetchContestQuery = useFirestoreQuery();
  const fetchContestNotice = useFirestoreQuery();
  const fetchContest = useFirestoreGetDocument("contests");
  const navigate = useNavigate();

  const addLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const fetchNotice = async (contestId) => {
    const condition = [where("refContestId", "==", contestId)];
    const returnNotice = await fetchContestNotice.getDocuments(
      "contest_notice",
      condition
    );
    addLog(`Fetching notice for contestId: ${contestId}`);
    addLog(`Fetched notice: ${JSON.stringify(returnNotice)}`);
    if (returnNotice.length > 0) {
      setCurrentContest((prev) => ({
        ...prev,
        contestInfo: { ...returnNotice[0] },
      }));
    }
  };

  const fetchPool = async () => {
    const condition = [where("isCompleted", "==", false)];
    const returnContest = await fetchContestQuery.getDocuments(
      "contests",
      condition
    );
    addLog(`Fetched contest pool: ${JSON.stringify(returnContest)}`);
    setCollectionPool(returnContest);
  };

  const handleSelectContest = async (e) => {
    const selectedContestId = e.target.value;
    setContestId(selectedContestId);

    try {
      const returnContests = await fetchContest.getDocument(selectedContestId);

      if (returnContests) {
        setCurrentContest((prev) => ({
          ...prev,
          contests: returnContests,
        }));
        addLog(`Contest data loaded: ${JSON.stringify(returnContests)}`);
      } else {
        throw new Error("No contest data found.");
      }
    } catch (error) {
      console.error("Error fetching contest data:", error.message);
      addLog(`Error: ${error.message}`);
      alert("해당 대회의 데이터를 불러오지 못했습니다. 다시 시도해주세요.");
      return;
    }
  };

  const handleMachineInfo = (e) => {
    const machineNumber = e.target.value;

    if (machineNumber) {
      setCurrentContest((prev) => ({
        ...prev,
        machineId: parseInt(machineNumber),
      }));
      addLog(`Machine ID set: ${machineNumber}`);
    }
  };

  useEffect(() => {
    fetchPool();
  }, []);

  useEffect(() => {
    if (contestId) {
      fetchNotice(contestId);
    }
  }, [contestId]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex">
        <div className="flex w-1/4 h-14 justify-end items-center bg-gray-200">
          <span className="mr-5 text-lg">데이터베이스</span>
        </div>
        <div className="flex w-3/4 justify-start items-center bg-gray-100 h-14">
          <select
            name="selectContest"
            className="ml-5 h-12 w-64 text-lg p-2"
            onChange={(e) => handleSelectContest(e)}
          >
            <option>선택</option>
            {collectionPool?.length > 0 &&
              collectionPool.map((collection, cIdx) => {
                const { collectionName, id } = collection;

                return (
                  <option key={cIdx} value={id}>
                    {collectionName}
                  </option>
                );
              })}
          </select>
        </div>
      </div>
      <div className="flex">
        <div className="flex w-1/4 h-14 justify-end items-center bg-gray-200">
          <span className="mr-5 text-lg">심판좌석번호</span>
        </div>
        <div className="flex w-3/4 justify-start items-center bg-gray-100 h-14">
          <input
            type="text"
            className="ml-5 h-12 w-64 text-lg p-2"
            onChange={(e) => handleMachineInfo(e)}
          />
        </div>
      </div>
      <div className="flex w-full justify-end">
        <button
          className="mr-5 px-2 w-auto h-auto bg-blue-500 p-5 rounded-lg text-white"
          onClick={() => navigate("/lobby")}
        >
          로비로 이동
        </button>
      </div>

      {/* 로그 보기 버튼 */}
      <div className="flex w-full justify-end mt-5">
        <button
          className="mr-5 px-2 w-auto h-auto bg-green-500 p-5 rounded-lg text-white"
          onClick={() => setShowLogs(!showLogs)}
        >
          로그 보기
        </button>
      </div>

      {/* 로그 출력 */}
      {showLogs && (
        <div className="mt-5 p-5 bg-gray-100 h-64 overflow-auto">
          <h3 className="text-lg font-bold">디버그 로그:</h3>
          <pre className="text-sm">{logs.join("\n")}</pre>
        </div>
      )}
    </div>
  );
};

export default Setting;
