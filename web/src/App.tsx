import { Route, Routes } from "react-router";
import Admin from "./components/admin/Login";
import BrowserBroadcaster from "./components/broadcast/Broadcast";
import PageLayout from "./components/layout/PageLayout";
import PlayerRoute from "./components/player/PlayerPage";
import Frontpage from "./components/selection/Frontpage";
import Statistics from "./components/statistics/Statistics";

function App() {
  return (
    <Routes>
      <Route element={<PageLayout />}>
        <Route index element={<Frontpage />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/publish/*" element={<BrowserBroadcaster />} />
        <Route path="/admin/*" element={<Admin />} />
      </Route>
      <Route path="/*" element={<PlayerRoute />} />
    </Routes>
  );
}

export default App;
