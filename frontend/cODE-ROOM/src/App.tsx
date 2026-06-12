import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Workspace from "./pages/Workspace";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    fetch("http://localhost:3000")
      .then((res) => res.json())
      .then((data) => console.log(data));
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/workspace/:workspaceId" element={<Workspace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
