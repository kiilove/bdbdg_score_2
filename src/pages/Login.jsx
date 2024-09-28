import React, { useState } from "react";
import LoginBg from "../assets/img/loginbg.png";
import LoginBg2 from "../assets/img/loginbg2.png";
import LoginBg3 from "../assets/img/loginbg3.jpg";
import LoginBg4 from "../assets/img/loginbg4.jpg";
import { FaUser, FaKey } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [inputPassword, setInputPassword] = useState("");
  const adminPassword = "aosepbqbkii!";
  const handleAdminLogin = () => {
    console.log(inputPassword);
    if (adminPassword === inputPassword) {
      navigate("/setting");
    } else {
      return;
    }
  };
  const navigate = useNavigate();
  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-300 to-sky-700">
      <div className="hidden md:flex justify-center items-center h-full px-3 lg:px-0">
        <div
          className="rounded-lg shadow-lg flex w-full lg:w-3/4 lg:h-3/4"
          style={{
            backgroundColor: "#f9f9f9",
            backgroundImage: `url(${LoginBg4})`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="flex w-full h-full py-10 lg:mt-16">
            <div className="flex w-full h-full flex-col px-5 py-10">
              <div className="flex w-full justify-start items-center h-full flex-col gap-y-3">
                <div className="flex flex-col items-center my-5">
                  <h1 className="text-4xl font-san font-semibold text-gray-200">
                    관리자 로그인
                  </h1>
                </div>
                <div className="flex flex-col items-center w-full px-5 ml-5 gap-y-5">
                  <div className="flex w-60 bg-gray-200 h-14 rounded-lg">
                    <div className="flex w-14 h-14 justify-center items-center">
                      <FaKey className="text-gray-600 text-xl" />
                    </div>
                    <input
                      type="password"
                      className=" bg-transparent  outline-none w-2/3"
                      onChange={(e) => setInputPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                    />
                  </div>
                  <div className="flex w-full h-14 justify-center items-center">
                    <button
                      className="w-60  bg-gradient-to-r from-amber-400 to-pink-600 h-14 rounded-lg mt-2"
                      onClick={() => handleAdminLogin()}
                    >
                      <span
                        className="font-semibold font-san text-gray-100 text-xl"
                        style={{ letterSpacing: "10px" }}
                      >
                        로그인
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
