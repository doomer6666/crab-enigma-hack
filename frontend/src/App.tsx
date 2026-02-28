import React, { useState } from "react";
import { TicketsPage } from "./pages/TicketsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import "./App.css";
import { Layout } from "./components/layout/Layout";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("tickets");

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === "tickets" && <TicketsPage />}
      {currentPage === "analytics" && <AnalyticsPage />}
    </Layout>
  );
};

export default App;
