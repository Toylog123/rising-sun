import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Tasks from "@/pages/Tasks";
import AddTask from "@/pages/AddTask";

export default function App() {
  return (
    <Router basename="/rising-sun">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/new" element={<AddTask />} />
        </Route>
      </Routes>
    </Router>
  );
}
