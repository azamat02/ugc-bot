import { useEffect, useState } from "react";
import api from "../api/client";

interface Stats {
  creators: number;
  companies: number;
  pending: number;
  projects: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    creators: 0,
    companies: 0,
    pending: 0,
    projects: 0,
  });

  useEffect(() => {
    async function load() {
      const [creatorsRes, companiesRes, pendingRes, projectsRes] =
        await Promise.all([
          api.get("/creators"),
          api.get("/companies"),
          api.get("/companies?status=pending"),
          api.get("/projects"),
        ]);

      setStats({
        creators: creatorsRes.data.length,
        companies: companiesRes.data.length,
        pending: pendingRes.data.length,
        projects: projectsRes.data.length,
      });
    }
    load();
  }, []);

  const cards = [
    { label: "Креаторы", value: stats.creators, color: "bg-blue-500" },
    { label: "Компании", value: stats.companies, color: "bg-green-500" },
    { label: "На модерации", value: stats.pending, color: "bg-yellow-500" },
    { label: "Проекты", value: stats.projects, color: "bg-purple-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className={`inline-block px-3 py-1 rounded-full text-white text-xs font-semibold mb-3 ${card.color}`}>
              {card.label}
            </div>
            <div className="text-3xl font-bold text-gray-900">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
