import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Tasks from "@/pages/Tasks";
import Archive from "@/pages/Archive";
import AddTask from "@/pages/AddTask";
import Students from "@/pages/Students";
import Meetings from "@/pages/Meetings";
import Achievements from "@/pages/Achievements";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Router basename="/rising-sun">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/new" element={<AddTask />} />
          <Route path="/students" element={<Students />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}
