import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import { ThemeProvider } from "./components/ThemeProvider";
import { DEMO_MODE } from "./lib/auth";

const App = () => {
  return (
    <ThemeProvider>
      <Routes>
        {/* Mode demo: tidak ada landing/login — "/" langsung ke zona chat */}
        <Route
          path="/"
          element={DEMO_MODE ? <Navigate to="/chat" replace /> : <Home />}
        />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
