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
  const { currentContest, setCurrentContest } = useContext(
    CurrentContestContext
  );

  const fetchContestQuery = useFirestoreQuery();
  const fetchContestNotice = useFirestoreQuery();
  const fetchContest = useFirestoreGetDocument("contests");
  const navigate = useNavigate();

  const fetchNotice = async (contestId) => {
    const condition = [where("refContestId", "==", contestId)];
    const returnNotice = await fetchContestNotice.getDocuments(
      "contest_notice",
      condition
    );
    console.log(contestId);
    console.log(returnNotice);
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
    console.log(returnContest);
    setCollectionPool(returnContest);
  };

  const handleSelectContest = async (e) => {
    const selectedContestId = e.target.value;

    // 먼저 contestId를 업데이트한 후 비동기 작업을 처리합니다.
    setContestId(selectedContestId);

    try {
      // contestId가 업데이트된 이후에 fetchContest.getDocument 호출
      const returnContests = await fetchContest.getDocument(selectedContestId);

      // returnContests가 제대로 반환되었는지 확인 후 처리
      if (returnContests) {
        setCurrentContest((prev) => ({
          ...prev,
          contests: returnContests,
        }));
      } else {
        console.error("No contest data found.");
      }
    } catch (error) {
      console.error("Error fetching contest data:", error);
    }
  };

  const handleMachineInfo = (e) => {
    const machineNumber = e.target.value;

    if (machineNumber) {
      setCurrentContest((prev) => ({
        ...prev,
        machineId: parseInt(machineNumber),
      }));
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
            className="ml-5 h-12 w-64 text-lg p-2" // select 크기 조정
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
            className="ml-5 h-12 w-64 text-lg p-2" // input 크기 조정
            onChange={(e) => handleMachineInfo(e)}
          />
        </div>
      </div>
      <div className="flex w-full justify-end ">
        <button
          className="mr-5 px-2 w-auto h-auto bg-blue-500 p-5 rounded-lg text-white"
          onClick={() => navigate("/lobby")}
        >
          로비로 이동
        </button>
      </div>
    </div>
  );
};

export default Setting;
