import React, { useState } from "react";

import Drawer from "react-modern-drawer";
import { MdLogout } from "react-icons/md";
import { RxHamburgerMenu } from "react-icons/rx";
import Drawbar from "./Drawbar";
import "react-modern-drawer/dist/index.css";

const TopBar = () => {
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);

  const handleDrawer = () => {
    setIsOpenDrawer((prev) => !prev);
    console.log(isOpenDrawer);
  };

  return (
    <div className="flex w-full h-full justify-start items-center bg-white">
      <div className="flex w-full h-full lg:hidden ">
        <div className="flex w-full h-full items-center">
          <button
            onClick={() => handleDrawer()}
            className="flex w-10 h-10 justify-center items-center"
          >
            <RxHamburgerMenu className="text-2xl" />
          </button>
        </div>
        <Drawer
          open={isOpenDrawer}
          onClose={handleDrawer}
          direction="left"
          size={300}
        >
          <Drawbar setOpen={handleDrawer} />
        </Drawer>
      </div>

      <div className="hidden lg:flex justify-between w-full">
        <div className="flex w-auto">
          <button className="w-auto h-full px-5 py-2">
            <span className="font-sans text-gray-500 font-semibold font-sm">
              BDBDg심판시스템
            </span>
          </button>
        </div>
        <div className="flex justify-end items-center w-auto px-5">
          <div className="flex justify-start items-center h-8 px-5 gap-x-2">
            <span className="text-sm text-gray-500">
              <MdLogout />
            </span>
            <span>로그아웃</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
