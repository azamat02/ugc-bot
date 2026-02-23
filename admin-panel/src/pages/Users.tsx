import { useEffect, useState } from "react";
import api from "../api/client";
import Table from "../components/Table";

interface User {
  id: number;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  registrationStep: string;
  role: string | null;
  createdAt: string;
  updatedAt: string;
}

const stepOptions = [
  { value: "", label: "Все этапы" },
  { value: "started", label: "started" },
  { value: "choosing_role", label: "choosing_role" },
  { value: "completed", label: "completed" },
];

function getStepBadge(step: string) {
  let color = "bg-gray-100 text-gray-700";
  if (step === "started") color = "bg-gray-200 text-gray-700";
  else if (step === "choosing_role") color = "bg-blue-100 text-blue-700";
  else if (step.startsWith("creator:")) color = "bg-purple-100 text-purple-700";
  else if (step.startsWith("company:")) color = "bg-orange-100 text-orange-700";
  else if (step === "completed") color = "bg-green-100 text-green-700";

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {step}
    </span>
  );
}

function getRoleBadge(role: string | null) {
  if (!role) return <span className="text-gray-400">-</span>;
  const color = role === "creator" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {role}
    </span>
  );
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [stepFilter, setStepFilter] = useState("");

  useEffect(() => {
    async function load() {
      const params = stepFilter ? { step: stepFilter } : {};
      const res = await api.get("/users", { params });
      setUsers(res.data);
    }
    load();
  }, [stepFilter]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.telegramId.includes(q)
    );
  });

  const columns = [
    {
      key: "telegramId",
      label: "Telegram ID",
      render: (u: User) => <span className="font-mono text-sm">{u.telegramId}</span>,
    },
    {
      key: "firstName",
      label: "Имя",
      render: (u: User) => u.firstName || <span className="text-gray-400">-</span>,
    },
    {
      key: "username",
      label: "Username",
      render: (u: User) => u.username ? `@${u.username}` : <span className="text-gray-400">-</span>,
    },
    {
      key: "role",
      label: "Роль",
      render: (u: User) => getRoleBadge(u.role),
    },
    {
      key: "registrationStep",
      label: "Этап",
      render: (u: User) => getStepBadge(u.registrationStep),
    },
    {
      key: "createdAt",
      label: "Дата",
      render: (u: User) => new Date(u.createdAt).toLocaleDateString("ru-RU"),
    },
    {
      key: "updatedAt",
      label: "Последняя активность",
      render: (u: User) => new Date(u.updatedAt).toLocaleString("ru-RU"),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Пользователи</h1>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Поиск по имени, username или ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={stepFilter}
          onChange={(e) => setStepFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {stepOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        Найдено: {filtered.length}
      </div>

      <Table data={filtered} columns={columns} keyField="id" />
    </div>
  );
}
