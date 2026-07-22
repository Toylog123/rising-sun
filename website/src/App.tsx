import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Board from "@/pages/Board";
import Archive from "@/pages/Archive";
import AddTask from "@/pages/AddTask";

export default function App() {
  return (
    <Router basename="/rising-sun">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Board />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/new" element={<AddTask />} />
        </Route>
      </Routes>
    </Router>
  );
}
