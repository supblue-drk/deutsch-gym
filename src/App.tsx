import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import {
  Today,
  Gym,
  Review,
  Progress,
  Library,
  Settings,
  NotFound,
} from "./pages/Pages";
export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Today />} />
        <Route path="gym" element={<Gym />} />
        <Route path="review" element={<Review />} />
        <Route path="progress" element={<Progress />} />
        <Route path="library" element={<Library />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
