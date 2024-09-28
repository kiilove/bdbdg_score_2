import {
  BsTrophyFill,
  BsPrinterFill,
  BsFillHandIndexThumbFill,
  BsCpuFill,
  BsCheckAll,
  BsInfoLg,
  BsListOl,
  BsCardChecklist,
  BsPerson,
  BsPersonCircle,
} from "react-icons/bs";

import { TiInputChecked } from "react-icons/ti";
import {
  TbCertificate,
  TbFileCertificate,
  TbHeartRateMonitor,
} from "react-icons/tb";
import { HiUserGroup, HiUsers } from "react-icons/hi";
import {
  MdTimeline,
  MdBalance,
  MdDoneAll,
  MdOutlineScale,
  MdOutlineTouchApp,
} from "react-icons/md";
import { BiAddToQueue } from "react-icons/bi";

export const MenuArray = [
  {
    id: 0,
    title: "마이페이지",
    icon: <BsPersonCircle />,
    subMenus: [
      {
        id: 1,
        title: "새로운대회개설",
        icon: <BiAddToQueue />,
        link: "/newcontest",
      },
      {
        id: 1,
        title: "대회정보관리",
        icon: <BsInfoLg />,
        link: "/contestinfo",
      },
      {
        id: 2,
        title: "타임테이블",
        icon: <MdTimeline />,
        link: "/contesttimetable",
      },
      {
        id: 3,
        title: "참가신청서",
        icon: <BsCheckAll />,
        link: "/contestinvoicetable",
      },
      {
        id: 3,
        title: "참가신청서 수동작성",
        icon: <BsCheckAll />,
        link: "/contestnewinvoicemanual",
      },
      {
        id: 4,
        title: "선수명단",
        icon: <TiInputChecked />,
        link: "/contestplayerordertable",
      },
      { id: 5, title: "전체심판명단", icon: <MdDoneAll /> },
      { id: 6, title: "배정된 심판명단", icon: <MdBalance /> },
    ],
  },
  {
    id: 1,
    title: "출력관리",
    icon: <BsPrinterFill />,
    subMenus: [
      { id: 1, title: "선수명단 통합", icon: <HiUserGroup /> },
      { id: 2, title: "선수명단 종목별", icon: <HiUsers /> },
      { id: 3, title: "계측명단 통합", icon: <MdOutlineScale /> },
      { id: 4, title: "계측명단 종목별", icon: <MdOutlineScale /> },
      { id: 5, title: "순위표 통합", icon: <BsListOl /> },
      { id: 6, title: "순위표 종목별", icon: <BsListOl /> },
      { id: 7, title: "집계표 출력", icon: <BsCardChecklist /> },
      { id: 8, title: "상장 출력", icon: <TbCertificate /> },
      { id: 9, title: "상장부여현황", icon: <TbFileCertificate /> },
    ],
  },
  {
    id: 2,
    title: "수동모드",
    icon: <BsFillHandIndexThumbFill />,
    subMenus: [{ id: 1, title: "심사표 입력", icon: <MdOutlineTouchApp /> }],
  },
  {
    id: 3,
    title: "자동모드",
    icon: <BsCpuFill />,
    subMenus: [{ id: 1, title: "모니터링 화면", icon: <TbHeartRateMonitor /> }],
  },
];
