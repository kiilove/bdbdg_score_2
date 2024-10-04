import React, { createContext, useEffect, useState } from "react";

export const CurrentContestContext = createContext();

export const CurrentContestProvider = ({ children }) => {
  const [currentContest, setCurrentContest] = useState(null);

  useEffect(() => {
    const savedCurrentContest = localStorage.getItem("currentContest");
    if (savedCurrentContest) {
      setCurrentContest(JSON.parse(savedCurrentContest));
    }
  }, []);

  useEffect(() => {
    if (currentContest) {
      console.log(currentContest);
      localStorage.setItem("currentContest", JSON.stringify(currentContest));
    } else {
      localStorage.removeItem("currentContest");
    }
  }, [currentContest]);

  return (
    <CurrentContestContext.Provider
      value={{ currentContest, setCurrentContest }}
    >
      {children}
    </CurrentContestContext.Provider>
  );
};
