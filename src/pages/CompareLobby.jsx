import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFirebaseRealtimeGetDocument } from "../hooks/useFirebaseRealtime";
import { useEffect } from "react";
import { debounce } from "lodash";
import { useContext } from "react";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import { useState } from "react";
import LoadingPage from "./LoadingPage";

const CompareLobby = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const { currentContest } = useContext(CurrentContestContext);
  const { data: fetchRealtimeVotedStatus, getDocument: votedStatusFunction } =
    useFirebaseRealtimeGetDocument();

  useEffect(() => {
    if (!isHolding && currentContest?.contests?.id) {
      // Debounce the getDocument call to once every second
      const debouncedGetDocument = debounce(
        () =>
          votedStatusFunction(
            `currentStage/${currentContest.contests.id}/compares/judges`,
            currentContest.contests.id
          ),
        2000
      );
      debouncedGetDocument();
    }
    return () => {};
  }, [votedStatusFunction]);

  useEffect(() => {
    console.log(fetchRealtimeVotedStatus);
  }, [fetchRealtimeVotedStatus]);

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
              <div className="flex">
                <button onClick={() => setIsHolding(!isHolding)}>
                  {isHolding ? "다시시작" : "일시정지"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CompareLobby;
