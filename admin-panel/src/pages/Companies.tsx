import { useEffect, useState } from "react";
import api from "../api/client";
import ViewToggle, { type ViewMode } from "../components/ViewToggle";

interface Company {
  id: number;
  companyName: string;
  niche: string;
  productDesc: string;
  socialLinks: string;
  instagram: string | null;
  tiktok: string | null;
  creatorReqs: string;
  conditions: string;
  successCriteria: string;
  telegramId: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

const statusLabels: Record<string, string> = {
  pending: "На модерации",
  approved: "Одобрена",
  rejected: "Отклонена",
};

const nicheLabels: Record<string, string> = {
  бытовая_техника: "Бытовая техника",
  уходовая_косметика: "Уходовая косметика",
  одежда_и_аксессуары: "Одежда и аксессуары",
  еда_и_напитки: "Еда и напитки",
  it_и_технологии: "IT и технологии",
  другое: "Другое",
};

function CompanyModal({
  company,
  onClose,
  onDelete,
}: {
  company: Company;
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
        <div className="p-6 space-y-4">
          {/* Заголовок */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {company.companyName}
              </h2>
              <span
                className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[company.status] || ""}`}
              >
                {statusLabels[company.status] || company.status}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          {/* Детали */}
          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Ниша</div>
              <div className="font-medium text-gray-900">
                {nicheLabels[company.niche] || company.niche}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Продукт / услуга</div>
              <div className="font-medium text-gray-900">
                {company.productDesc}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Соцсети</div>
              <div className="font-medium text-gray-900">
                {company.socialLinks}
              </div>
            </div>

            {company.instagram && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">Instagram</div>
                <a
                  href={`https://instagram.com/${company.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  instagram.com/{company.instagram}
                </a>
              </div>
            )}

            {company.tiktok && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">TikTok</div>
                <a
                  href={`https://tiktok.com/@${company.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  tiktok.com/@{company.tiktok}
                </a>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">
                Требования к креаторам
              </div>
              <div className="font-medium text-gray-900">
                {company.creatorReqs}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Условия</div>
              <div className="font-medium text-gray-900">
                {company.conditions}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Критерии успеха</div>
              <div className="font-medium text-gray-900">
                {company.successCriteria}
              </div>
            </div>

            <div className="text-xs text-gray-400">
              Дата регистрации:{" "}
              {new Date(company.createdAt).toLocaleDateString("ru")}
            </div>
          </div>

          {/* Удаление */}
          <div className="pt-2 border-t border-gray-200">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Удалить компанию
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onDelete(company.id);
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

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Company | null>(null);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<ViewMode>("cards");

  useEffect(() => {
    api.get("/companies").then((res) => setCompanies(res.data));
  }, []);

  const handleDelete = async (id: number) => {
    await api.delete(`/companies/${id}`);
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setSelected(null);
  };

  const filtered = companies.filter((c) =>
    c.companyName.toLowerCase().includes(filter.toLowerCase()) ||
    c.niche.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Компании ({companies.length})
        </h1>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <input
        type="text"
        placeholder="Поиск по названию или нише..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-6 w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-xl shadow hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              onClick={() => setSelected(company)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {company.companyName}
                  </h3>
                  <span
                    className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[company.status] || ""}`}
                  >
                    {statusLabels[company.status] || company.status}
                  </span>
                </div>

                <div className="text-sm text-gray-500 mb-2">
                  {nicheLabels[company.niche] || company.niche}
                </div>

                <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                  {company.productDesc}
                </p>

                <div className="text-xs text-gray-400">
                  {new Date(company.createdAt).toLocaleDateString("ru")}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Компания</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ниша</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Продукт</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.companyName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{nicheLabels[c.niche] || c.niche}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{c.productDesc}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[c.status] || ""}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                  </td>
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
        <p className="text-gray-500 text-center mt-8">Нет компаний</p>
      )}

      {selected && (
        <CompanyModal
          company={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
