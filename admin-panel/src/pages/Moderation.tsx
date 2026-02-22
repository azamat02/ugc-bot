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
  status: string;
  createdAt: string;
}

const nicheLabels: Record<string, string> = {
  бытовая_техника: "Бытовая техника",
  уходовая_косметика: "Уходовая косметика",
  одежда_и_аксессуары: "Одежда и аксессуары",
  еда_и_напитки: "Еда и напитки",
  it_и_технологии: "IT и технологии",
  другое: "Другое",
};

function DetailModal({
  company,
  onClose,
  onModerate,
}: {
  company: Company;
  onClose: () => void;
  onModerate: (id: number, status: "approved" | "rejected") => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {company.companyName}
              </h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-yellow-100 text-yellow-800 border-yellow-300">
                На модерации
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Ниша</div>
              <div className="font-medium text-gray-900">
                {nicheLabels[company.niche] || company.niche}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Продукт / услуга</div>
              <div className="font-medium text-gray-900">{company.productDesc}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Соцсети</div>
              <div className="font-medium text-gray-900">{company.socialLinks}</div>
            </div>
            {company.instagram && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">Instagram</div>
                <a href={`https://instagram.com/${company.instagram}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                  instagram.com/{company.instagram}
                </a>
              </div>
            )}
            {company.tiktok && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">TikTok</div>
                <a href={`https://tiktok.com/@${company.tiktok}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                  tiktok.com/@{company.tiktok}
                </a>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Требования к креаторам</div>
              <div className="font-medium text-gray-900">{company.creatorReqs}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Условия</div>
              <div className="font-medium text-gray-900">{company.conditions}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Критерии успеха</div>
              <div className="font-medium text-gray-900">{company.successCriteria}</div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                onModerate(company.id, "approved");
                onClose();
              }}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Одобрить
            </button>
            <button
              onClick={() => {
                onModerate(company.id, "rejected");
                onClose();
              }}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Отклонить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Moderation() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Company | null>(null);
  const [view, setView] = useState<ViewMode>("cards");

  const load = () => {
    api.get("/companies?status=pending").then((res) => setCompanies(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const handleModerate = async (id: number, status: "approved" | "rejected") => {
    await api.patch(`/companies/${id}/moderate`, { status });
    setSelected(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Модерация ({companies.length})
        </h1>
        {companies.length > 0 && <ViewToggle view={view} onChange={setView} />}
      </div>

      {companies.length === 0 && (
        <p className="text-gray-500">Нет заявок на модерации</p>
      )}

      {view === "cards" ? (
        <div className="space-y-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-lg shadow p-6 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {company.companyName}
                </h2>
                <span className="text-sm text-gray-500">
                  {new Date(company.createdAt).toLocaleDateString("ru")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Ниша:</span>{" "}
                  {nicheLabels[company.niche] || company.niche}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Соцсети:</span>{" "}
                  {company.socialLinks}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Продукт:</span>{" "}
                  {company.productDesc}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Требования:</span>{" "}
                  {company.creatorReqs}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Условия:</span>{" "}
                  {company.conditions}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Критерии:</span>{" "}
                  {company.successCriteria}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleModerate(company.id, "approved")}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Одобрить
                </button>
                <button
                  onClick={() => handleModerate(company.id, "rejected")}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Отклонить
                </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                <th className="px-6 py-3"></th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.companyName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{nicheLabels[c.niche] || c.niche}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{c.productDesc}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString("ru")}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelected(c)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Анкета
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModerate(c.id, "approved")}
                        className="text-sm text-green-600 hover:text-green-800 font-medium"
                      >
                        Одобрить
                      </button>
                      <button
                        onClick={() => handleModerate(c.id, "rejected")}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Отклонить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal
          company={selected}
          onClose={() => setSelected(null)}
          onModerate={handleModerate}
        />
      )}
    </div>
  );
}
