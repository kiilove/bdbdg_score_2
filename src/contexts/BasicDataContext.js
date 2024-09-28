import React, { createContext, useEffect, useState } from "react";

export const BasicDataContext = createContext();

export const BasicDataProvider = ({ children }) => {
  const [basicData, setBasicData] = useState(null);
  const [basicDataVer, setBasicDataVer] = useState(null);
  useEffect(() => {
    const savedBasicData = localStorage.getItem("basicData");
    const savedBasicDataVer = localStorage.getItem("basicDataVer");
    if (savedBasicData) {
      setBasicData(JSON.parse(savedBasicData));
    }
    if (savedBasicDataVer) {
      setBasicData(JSON.parse(savedBasicDataVer));
    }
  }, []);

  useEffect(() => {
    if (basicData) {
      localStorage.setItem("basicData", JSON.stringify(basicData));
    } else {
      localStorage.removeItem("basicData");
    }

    if (basicDataVer) {
      localStorage.setItem("basicDataVer", JSON.stringify(basicDataVer));
    } else {
      localStorage.removeItem("basicDataVer");
    }
  }, [basicData]);

  return (
    <BasicDataContext.Provider
      value={{ basicData, setBasicData, basicDataVer, setBasicDataVer }}
    >
      {children}
    </BasicDataContext.Provider>
  );
};
