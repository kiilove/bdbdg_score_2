import React from "react";
import TopBar from "../components/TopBar";
import Sidebar from "../components/SideBar";

const ManagementHome = ({ children }) => {
  return (
    <div className="w-full h-full min-h-screen bg-gradient-to-br from-blue-300 to-sky-700">
      <div className="flex w-full h-full justify-start items-start flex-col ">
        <div className="flex h-12 w-full shadow-md">
          <TopBar />
        </div>
        <div className=" flex w-full h-full justify-start items-start">
          <div className="hidden lg:flex w-72 h-full bg-sky-800 shadow-md">
            <Sidebar />
          </div>
          <div className="flex w-full h-full p-2">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default ManagementHome;
