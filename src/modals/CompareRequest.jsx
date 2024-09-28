import React from "react";
import { useState } from "react";
import LoadingPage from "../pages/LoadingPage";
import { useEffect } from "react";

const CompareRequest = ({
  stageInfo,
  setClose,
  fullMatched,
  prevMatched,
  compareList,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [originalFullMatchedPlayers, setOriginalFullMatchedPlayers] = useState(
    []
  );
  const [originalPrevMatchedPlayers, setOriginalPrevMatchedPlayers] = useState(
    []
  );
  const [fullMatchedPlayers, setFullMatchedPlayers] = useState([]);
  const [prevMatchedPlayers, setPrevMatchedPlayers] = useState([]);
  const [compareArray, setCompareArray] = useState([]);
  const [votedPlayers, setVotedPlayers] = useState([]);

  const initMatched = () => {
    console.log(fullMatched);
    const promises = [
      setFullMatchedPlayers(fullMatched),
      setOriginalFullMatchedPlayers(fullMatched),
      setPrevMatchedPlayers(prevMatched),
      setOriginalPrevMatchedPlayers(prevMatched),
      setCompareArray(compareList),
      setIsLoading(false),
    ];
    Promise.all(promises);
  };

  useEffect(() => {
    initMatched();
  }, [stageInfo]);

  return (
    <>
      {isLoading && (
        <div className="flex w-full h-screen justify-center items-center bg-white">
          <LoadingPage />
        </div>
      )}
      <div className="flex w-full h-full flex-col bg-white justify-start items-center p-5 gap-y-2">
        {!isLoading && (
          <>
            <div className="flex text-xl font-bold  bg-blue-300 rounded-lg w-full h-auto justify-center items-center text-gray-700 flex-col p-2 gap-y-2">
              <div className="flex w-full bg-blue-100 rounded-lg py-3 flex-col">
                <div className="flex w-full h-auto justify-center items-center">
                  <span>
                    {stageInfo?.categoryTitle}(
                    {stageInfo?.grades[0]?.gradeTitle}){" "}
                  </span>
                  <span className="pl-5 pr-2">
                    {compareArray?.length + 1 || 1}차
                  </span>
                  <span> 비교심사 제안</span>
                </div>
                <div className="flex w-full h-auto justify-center items-center text-xl font-bold">
                  선수인원수
                </div>
              </div>
            </div>
            <div className="flex w-full h-fulljustify-center items-center">
              <button onClick={() => setClose(() => false)}>닫기</button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CompareRequest;
