import React, { useContext, useEffect, useState } from "react";
import {
  useFirestoreGetDocument,
  useFirestoreQuery,
} from "../hooks/useFirestores";
import { CurrentContestContext } from "../contexts/CurrentContestContext";

import { useNavigate } from "react-router-dom";
import { BasicDataContext } from "../contexts/BasicDataContext";

const Setting = () => {
  const [collectionPool, setCollectionPool] = useState([]);
  const { currentContest, setCurrentContest } = useContext(
    CurrentContestContext
  );
  const { basicData, setBasciData, basicDataVer, setBasicDataVer } =
    useContext(BasicDataContext);

  const fetchContestQuery = useFirestoreQuery();
  const fetchContest = useFirestoreGetDocument("contests");
  const navigate = useNavigate();

  const fetchPool = async () => {
    const returnContest = await fetchContestQuery.getDocuments(
      "contest_stages_assign"
    );
    console.log(returnContest);
    setCollectionPool(returnContest);
  };

  const handleSelectContest = async (e) => {
    const contestId = e.target.value;
    const returnContests = await fetchContest.getDocument(contestId);

    if (returnContests) {
      setCurrentContest({ ...currentContest, contests: returnContests });
    }
  };

  const handleMachineInfo = (e) => {
    const machineNumber = e.target.value;

    if (machineNumber) {
      setCurrentContest({
        ...currentContest,
        machineId: parseInt(machineNumber),
      });
    }
  };

  useEffect(() => {
    fetchPool();
  }, []);

  useEffect(() => {}, [collectionPool]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex">
        <div className="flex w-1/4 h-14 justify-end items-center bg-gray-200">
          <span className="mr-5 text-lg">데이터베이스</span>
        </div>
        <div className="flex w-3/4 justify-start items-center bg-gray-100 h-14  ">
          <select
            name="selectContest"
            className="ml-5"
            onChange={(e) => handleSelectContest(e)}
          >
            <option>선택</option>
            {collectionPool?.length > 0 &&
              collectionPool.map((collection, cIdx) => {
                const { collectionName, contestId } = collection;
                return <option value={contestId}>{collectionName}</option>;
              })}
          </select>
        </div>
      </div>
      <div className="flex">
        <div className="flex w-1/4 h-14 justify-end items-center bg-gray-200">
          <span className="mr-5 text-lg">심판좌석번호</span>
        </div>
        <div className="flex w-3/4 justify-start items-center bg-gray-100 h-14  ">
          <input
            type="text"
            className="ml-5 h-auto"
            onChange={(e) => handleMachineInfo(e)}
          />
        </div>
      </div>
      <div className="flex w-full justify-end ">
        <button
          className="mr-5 px-2 w-auto h-10 bg-blue-200"
          onClick={() => navigate("/lobby")}
        >
          로비로 이동
        </button>
      </div>
    </div>
  );
};

export default Setting;
