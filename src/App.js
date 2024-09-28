import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import ManagementHome from "./homes/ManagementHome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Setting from "./pages/Setting";

import { CurrentContestProvider } from "./contexts/CurrentContestContext";
import { BasicDataProvider } from "./contexts/BasicDataContext";
import ScoreLogin from "./pages/ScoreLogin";
import AutoScoreTable from "./pages/AutoScoreTable";
import ScoreLoginAuto from "./pages/ScoreLoginAuto";
import CompareVote from "./pages/CompareVote";
import CompareLobby from "./pages/CompareLobby";
import JudgeLobby from "./pages/JudgeLobby";
import AutoPointTable from "./pages/AutoPointTable";

function App() {
  return (
    <BasicDataProvider>
      <CurrentContestProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<JudgeLobby />} />
            <Route path="/adminlogin" element={<Login />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="/scorelogin" element={<ScoreLogin />} />
            <Route path="/scoreloginauto" element={<ScoreLoginAuto />} />
            <Route path="/autoscoretable" element={<AutoScoreTable />} />
            <Route path="/autopointtable" element={<AutoPointTable />} />
            <Route path="/comparevote" element={<CompareVote />} />
            <Route path="/lobby" element={<JudgeLobby />} />
          </Routes>
        </BrowserRouter>
      </CurrentContestProvider>
    </BasicDataProvider>
  );
}

export default App;
