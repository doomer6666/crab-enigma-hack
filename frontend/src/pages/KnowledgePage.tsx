import React, { useState } from "react";
import { BookOpen, Search, Tag } from "lucide-react";
import { api } from "../services/api";
import type { KnowledgeArticle } from "../types";

export const KnowledgePage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const results = await api.searchKnowledge(query);
    setArticles(results);
    setSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <>
      <div className="page-header">
        <BookOpen size={22} />
        <div>
          <h1>База знаний</h1>
          <p className="page-subtitle">
            Поиск по статьям и инструкциям для операторов
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <div className="search-wrapper" style={{ maxWidth: 400 }}>
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="пароль, оплата, 2fa..."
          />
        </div>
        <button className="btn btn-primary" onClick={handleSearch}>
          <Search size={14} />
          Найти
        </button>
      </div>

      {searched && articles.length === 0 && (
        <div style={{ color: "var(--text-muted)", padding: 20 }}>
          Ничего не найдено по запросу «{query}»
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {articles.map((article) => (
          <div
            key={article.id}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 20,
            }}
          >
            <h3
              style={{ fontSize: 15, marginBottom: 8, color: "var(--accent)" }}
            >
              {article.title}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {article.content}
            </p>
            {article.tags && article.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginTop: 10,
                  alignItems: "center",
                }}
              >
                <Tag size={12} style={{ color: "var(--text-muted)" }} />
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      background: "var(--accent-glow)",
                      color: "var(--accent)",
                      borderRadius: 4,
                      border: "1px solid var(--border-accent)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};
