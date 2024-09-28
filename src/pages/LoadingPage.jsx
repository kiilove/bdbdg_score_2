import React from "react";
import { ThreeDots } from "react-loader-spinner";

const LoadingPage = () => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <ThreeDots
        height="80"
        width="80"
        radius="9"
        color="#264c92"
        ariaLabel="three-dots-loading"
        wrapperStyle={{}}
        wrapperClassName=""
        visible={true}
      />
    </div>
  );
};

export default LoadingPage;
