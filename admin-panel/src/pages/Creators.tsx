import { useEffect, useState } from "react";
import api from "../api/client";
import ViewToggle, { type ViewMode } from "../components/ViewToggle";

interface Creator {
  id: number;
  name: string;
  username: string | null;
  gender: string;
  age: number;
  phone: string;
  telegramNick: string;
  instagram: string | null;
  tiktok: string | null;
  photoFileId: string;
  editingSkill: string;
  hasExperience: boolean;
  createdAt: string;
}

const skillLabels: Record<string, string> = {
  pro: "Профи",
  medium: "Средний",
  beginner: "Начинающий",
};

function cleanPhone(phone: string) {
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("8") && digits.length === 11) {
    digits = "7" + digits.slice(1);
  }
  return digits;
}

function photoUrl(fileId: string) {
  const token = localStorage.getItem("token") || "";
  return `/api/photo/${fileId}?token=${token}`;
}

function ProfileModal({
  creator,
  onClose,
  onDelete,
}: {
  creator: Creator;
  onClose: () => void;
  onDelete: (id: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <img
            src={photoUrl(creator.photoFileId)}
            alt={creator.name}
            className="w-full rounded-t-2xl"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{creator.name}</h2>
            <span className="text-sm text-gray-500">
              {new Date(creator.createdAt).toLocaleDateString("ru")}
            </span>
          </div>

          <div className="flex gap-3">
            <a
              href={`https://wa.me/${cleanPhone(creator.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              WhatsApp
            </a>
            {creator.username && (
              <a
                href={`https://t.me/${creator.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Telegram
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Пол</div>
              <div className="font-medium text-gray-900">
                {creator.gender === "male" ? "Мужской" : "Женский"}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Возраст</div>
              <div className="font-medium text-gray-900">{creator.age}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Монтаж</div>
              <div className="font-medium text-gray-900">
                {skillLabels[creator.editingSkill] || creator.editingSkill}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Опыт UGC</div>
              <div className="font-medium text-gray-900">
                {creator.hasExperience ? "Да" : "Нет"}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Телефон</div>
              <div className="font-medium text-gray-900">{creator.phone}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Telegram</div>
              <div className="font-medium text-gray-900">
                {creator.telegramNick}
              </div>
            </div>
            {creator.instagram && (
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <div className="text-gray-500 text-xs mb-1">Instagram</div>
                <a
                  href={`https://instagram.com/${creator.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  instagram.com/{creator.instagram}
                </a>
              </div>
            )}
            {creator.tiktok && (
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <div className="text-gray-500 text-xs mb-1">TikTok</div>
                <a
                  href={`https://tiktok.com/@${creator.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  tiktok.com/@{creator.tiktok}
                </a>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-gray-200">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Удалить креатора
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onDelete(creator.id);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Да, удалить
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Creators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Creator | null>(null);
  const [view, setView] = useState<ViewMode>("cards");

  useEffect(() => {
    api.get("/creators").then((res) => setCreators(res.data));
  }, []);

  const handleDelete = async (id: number) => {
    await api.delete(`/creators/${id}`);
    setCreators((prev) => prev.filter((c) => c.id !== id));
    setSelected(null);
  };

  const filtered = creators.filter(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.telegramNick.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Креаторы ({creators.length})
        </h1>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <input
        type="text"
        placeholder="Поиск по имени или Telegram..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-6 w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((creator) => (
            <div
              key={creator.id}
              className="bg-white rounded-xl shadow hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              onClick={() => setSelected(creator)}
            >
              <img
                src={photoUrl(creator.photoFileId)}
                alt={creator.name}
                className="w-full aspect-square object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{creator.name}</h3>
                  <span className="text-xs text-gray-500">
                    {creator.age} лет
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <span>{creator.telegramNick}</span>
                  <span className="text-gray-300">|</span>
                  <span>
                    {skillLabels[creator.editingSkill] || creator.editingSkill}
                  </span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/${cleanPhone(creator.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-center text-xs px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    WhatsApp
                  </a>
                  {creator.username && (
                    <a
                      href={`https://t.me/${creator.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-center text-xs px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Telegram
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telegram</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пол</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Возраст</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Монтаж</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Опыт</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.telegramNick}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.gender === "male" ? "М" : "Ж"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.age}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{skillLabels[c.editingSkill] || c.editingSkill}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.hasExperience ? "Да" : "Нет"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString("ru")}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelected(c)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Анкета
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-gray-500 text-center mt-8">Нет креаторов</p>
      )}

      {selected && (
        <ProfileModal
          creator={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
