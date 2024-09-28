import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

export const generateUUID = () => {
  const uuid = uuidv4();
  return uuid;
};

export const generateToday = () => {
  const currentDateTime = dayjs().format("YYYY-MM-DD HH:mm");
  return currentDateTime;
};

export const handleMachineCheck = () => {
  const savedCurrentContest = localStorage.getItem("currentContest");
  const loading = false;
  let error = { code: undefined, popupMessage: undefined };
  const popupMessage = {
    body: "기기 초기값이 설정되지 않았습니다.",
    body2: "관리자 로그인페이지로 이동합니다.",
    isButton: true,
    confirmButtonText: "확인",
  };

  if (!savedCurrentContest) {
    error = { code: "200", popupMessage };
  }
  const machineId = JSON.parse(savedCurrentContest).machineId;
  const contestInfo = JSON.parse(savedCurrentContest).contests;

  const msgOpen = true;
  return { machineId, contestInfo, loading, error };
};
