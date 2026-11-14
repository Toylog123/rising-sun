import { lazy, Suspense } from "react";
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

// 选刊手册的数据量很大（CCF 全量 + 中科院分区 3.8 万条），按需加载，
// 不让它拖慢其它页面的首屏。
const DegreeRequirements = lazy(() => import("@/pages/DegreeRequirements"));

function PageLoading() {
  return (
    <div className="py-16 text-center text-sm text-[#9a9590]">正在加载选刊手册…</div>
  );
}

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
          <Route
            path="/degree-requirements"
            element={
              <Suspense fallback={<PageLoading />}>
                <DegreeRequirements />
              </Suspense>
            }
          />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}