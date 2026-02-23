import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Creators from "./pages/Creators";
import Companies from "./pages/Companies";
import Moderation from "./pages/Moderation";
import Broadcasts from "./pages/Broadcasts";
import Users from "./pages/Users";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/moderation" element={<Moderation />} />
          <Route path="/broadcasts" element={<Broadcasts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
