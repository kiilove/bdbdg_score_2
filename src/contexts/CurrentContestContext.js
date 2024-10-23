import React, { createContext, useEffect, useState } from "react";

export const CurrentContestContext = createContext();

export const CurrentContestProvider = ({ children }) => {
  const [currentContest, setCurrentContest] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

  useEffect(() => {
    const savedCurrentContest = localStorage.getItem("currentContest");
    if (savedCurrentContest) {
      setCurrentContest(JSON.parse(savedCurrentContest)); // 저장된 데이터를 불러옴
    }
    setIsLoading(false); // 데이터를 불러왔거나 없으면 로딩 완료
  }, []);

  useEffect(() => {
    if (currentContest !== null) {
      // currentContest가 있을 때만 localStorage에 저장
      localStorage.setItem("currentContest", JSON.stringify(currentContest));
    } else if (localStorage.getItem("currentContest")) {
      // currentContest가 null일 때만 localStorage에서 삭제
      localStorage.removeItem("currentContest");
    }
  }, [currentContest]);

  if (isLoading) {
    return <div>Loading...</div>; // 로딩 중일 때는 로딩 메시지를 표시
  }

  return (
    <CurrentContestContext.Provider
      value={{ currentContest, setCurrentContest }}
    >
      {children}
    </CurrentContestContext.Provider>
  );
};
