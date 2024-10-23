import React, { createContext, useEffect, useState } from "react";

export const CurrentContestContext = createContext();

export const CurrentContestProvider = ({ children }) => {
  const [currentContest, setCurrentContest] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가
  const [isTimeout, setIsTimeout] = useState(false); // 타이머 상태 추가

  useEffect(() => {
    let timer;

    // 2초 동안 데이터를 기다림
    timer = setTimeout(() => {
      setIsTimeout(true);
      setIsLoading(false); // 2초 후 로딩 종료
    }, 2000);

    const savedCurrentContest = localStorage.getItem("currentContest");
    if (savedCurrentContest) {
      clearTimeout(timer); // 데이터가 들어오면 타이머 중단
      setCurrentContest(JSON.parse(savedCurrentContest)); // 저장된 데이터를 불러옴
      setIsLoading(false); // 로딩 종료
    }

    return () => {
      clearTimeout(timer); // 컴포넌트가 언마운트될 때 타이머 정리
    };
  }, []);

  useEffect(() => {
    // 로딩이 완료된 후에만 localStorage에 데이터를 저장하거나 삭제

    if (currentContest !== null) {
      // currentContest가 있을 때만 localStorage에 저장
      localStorage.setItem("currentContest", JSON.stringify(currentContest));
    } else if (localStorage.getItem("currentContest")) {
      // currentContest가 null일 때만 localStorage에서 삭제
      localStorage.removeItem("currentContest");
    }
  }, [currentContest, isLoading]);

  return (
    <CurrentContestContext.Provider
      value={{ currentContest, setCurrentContest, isLoading }} // isLoading을 같이 전달
    >
      {children}
    </CurrentContestContext.Provider>
  );
};
