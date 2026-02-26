import React, { useState } from "react";
import { TicketsPage } from "./pages/TicketsPage";
import { KnowledgePage } from "./pages/KnowledgePage";
import "./App.css";
import { Layout } from "./components/layout/Layout";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("tickets");

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === "tickets" && <TicketsPage />}
      {currentPage === "knowledge" && <KnowledgePage />}
    </Layout>
  );
};

export default App;
