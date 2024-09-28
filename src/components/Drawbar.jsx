import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { MenuArray } from "./Menus";

const Drawbar = ({ setOpen }) => {
  const navigate = useNavigate();
  const [menuVisible, setMenuVisible] = useState({
    menuIndex: -1,
    isHidden: true,
  });

  const handleMenuClick = (idx) => {
    if (MenuArray[idx].subMenus) {
      setMenuVisible((prevState) => ({
        menuIndex: idx,
        isHidden: !prevState.isHidden || prevState.menuIndex !== idx,
      }));
    } else {
      setOpen(); // subMenus를 클릭해서 페이지 이동 시 창 닫기
      navigate(MenuArray[idx].link);
    }
  };

  const handleSubMenuClick = (parentIdx, subIdx) => {
    setOpen();
    navigate(MenuArray[parentIdx].subMenus[subIdx].link);
  };

  useEffect(() => {
    setMenuVisible({ menuIndex: 0, isHidden: true });
  }, []);

  return (
    <div className="flex flex-col w-full bg-sky-800 h-screen">
      {MenuArray.map((menu, idx) => (
        <div key={menu.index} className="flex flex-col ">
          <div
            className={`${
              menuVisible.index === menu.index && "bg-sky-800 "
            } flex w-full h-14 justify-start items-center hover:bg-sky-900 hover:text-white  text-gray-300 md:px-1 lg:px-3`}
            onClick={() => handleMenuClick(idx)}
          >
            <div className="flex justify-between w-full items-center">
              <div className="flex">
                <button className="flex w-full h-10 justify-start items-center ml-4">
                  <div className="flex justify-start items-center">
                    <span className="mr-2">{menu.icon}</span>
                    <span className="">{menu.title}</span>
                  </div>
                </button>
              </div>
              <div className="flex">
                {/* {menu?.subMenus ? (
                  menuVisible.index === idx && menuVisible.isHidden ? (
                    <MdOutlineKeyboardArrowDown />
                  ) : (
                    <MdOutlineKeyboardArrowUp />
                  )
                ) : null} */}
              </div>
            </div>
          </div>
          {menuVisible.menuIndex === idx &&
            menuVisible.isHidden === false &&
            menu?.subMenus && (
              <div className="flex flex-col text-gray-200 text-base bg-sky-700 w-full">
                {menu.subMenus.map((subMenus, sIdx) => (
                  <div className="flex w-full">
                    <div className="flex w-full h-12" key={subMenus.id}>
                      <button
                        className="py-2 px-10 hover:text-gray-200 w-full flex justify-start items-center "
                        onClick={() => handleSubMenuClick(idx, sIdx)}
                      >
                        <div className="flex justify-start items-center">
                          <span className="text-base text-white mr-2">
                            {subMenus?.icon}
                          </span>
                          <span className="text-sm text-white">
                            {subMenus.title}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      ))}
    </div>
  );
};

export default Drawbar;
