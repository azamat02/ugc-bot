import { useEffect, useState, useRef, useCallback } from "react";
import api from "../api/client";

interface Broadcast {
  id: number;
  text: string;
  mediaFileId: string | null;
  mediaType: string | null;
  targetAudience: string;
  filterGender: string | null;
  filterEditingSkill: string | null;
  filterHasExperience: boolean | null;
  filterNiche: string | null;
  filterStatus: string | null;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  totalRecipients: number;
  deliveredCount: number;
  failedCount: number;
  createdBy: number;
  admin?: { username: string };
  createdAt: string;
  updatedAt: string;
}

type Tab = "history" | "create";

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  scheduled: "Запланировано",
  sending: "Отправка",
  sent: "Отправлено",
  failed: "Ошибка",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-yellow-100 text-yellow-700",
  sending: "bg-blue-100 text-blue-700",
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const audienceLabels: Record<string, string> = {
  creators: "Креаторы",
  companies: "Компании",
  all: "Все",
};

function photoUrl(fileId: string) {
  const token = localStorage.getItem("token") || "";
  return `/api/photo/${fileId}?token=${token}`;
}

// --- Toolbar Button ---
function ToolbarBtn({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`px-2 py-1 text-sm font-mono rounded transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

// --- Telegram Preview ---
function TelegramPreview({
  text,
  mediaFileId,
  mediaType,
}: {
  text: string;
  mediaFileId: string | null;
  mediaType: string | null;
}) {
  const renderHtml = (html: string) => {
    return html
      .replace(/\n/g, "<br/>")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  };

  return (
    <div className="bg-[#0e1621] rounded-xl p-4 min-h-[200px]">
      <div className="max-w-[320px] ml-auto">
        <div className="bg-[#2b5278] rounded-xl overflow-hidden">
          {mediaFileId && mediaType === "photo" && (
            <img
              src={photoUrl(mediaFileId)}
              alt="preview"
              className="w-full"
            />
          )}
          {mediaFileId && mediaType === "video" && (
            <div className="w-full aspect-video bg-gray-800 flex items-center justify-center text-gray-400 text-sm">
              Video
            </div>
          )}
          {text && (
            <div
              className="p-3 text-white text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderHtml(text) }}
            />
          )}
          <div className="px-3 pb-2 text-right">
            <span className="text-[10px] text-gray-400">
              {new Date().toLocaleTimeString("ru", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Detail Modal ---
function DetailModal({
  broadcast,
  onClose,
}: {
  broadcast: Broadcast;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Рассылка #{broadcast.id}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Статус</div>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  statusColors[broadcast.status]
                }`}
              >
                {statusLabels[broadcast.status]}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Аудитория</div>
              <div className="font-medium text-gray-900">
                {audienceLabels[broadcast.targetAudience]}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Получатели</div>
              <div className="font-medium text-gray-900">
                {broadcast.totalRecipients}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Доставлено / Ошибки</div>
              <div className="font-medium text-gray-900">
                {broadcast.deliveredCount} / {broadcast.failedCount}
              </div>
            </div>
            {broadcast.scheduledAt && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">Запланировано</div>
                <div className="font-medium text-gray-900">
                  {new Date(broadcast.scheduledAt).toLocaleString("ru")}
                </div>
              </div>
            )}
            {broadcast.sentAt && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">Отправлено</div>
                <div className="font-medium text-gray-900">
                  {new Date(broadcast.sentAt).toLocaleString("ru")}
                </div>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">Создано</div>
              <div className="font-medium text-gray-900">
                {new Date(broadcast.createdAt).toLocaleString("ru")}
              </div>
            </div>
            {broadcast.admin && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">Автор</div>
                <div className="font-medium text-gray-900">
                  {broadcast.admin.username}
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">Предпросмотр</div>
            <TelegramPreview
              text={broadcast.text}
              mediaFileId={broadcast.mediaFileId}
              mediaType={broadcast.mediaType}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- History View ---
function HistoryView() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAudience, setFilterAudience] = useState("");
  const [selected, setSelected] = useState<Broadcast | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (filterStatus) params.status = filterStatus;
    if (filterAudience) params.audience = filterAudience;

    const res = await api.get("/broadcasts", { params });
    setBroadcasts(res.data);
    setLoading(false);
  }, [search, filterStatus, filterAudience]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Поиск по тексту..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Все статусы</option>
          <option value="draft">Черновик</option>
          <option value="scheduled">Запланировано</option>
          <option value="sending">Отправка</option>
          <option value="sent">Отправлено</option>
          <option value="failed">Ошибка</option>
        </select>
        <select
          value={filterAudience}
          onChange={(e) => setFilterAudience(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Вся аудитория</option>
          <option value="creators">Креаторы</option>
          <option value="companies">Компании</option>
          <option value="all">Все</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-8">Загрузка...</p>
      ) : broadcasts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Нет рассылок</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Текст
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Аудитория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Запланировано
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Получатели
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Доставлено
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {broadcasts.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelected(b)}
                >
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-[200px] truncate">
                    {b.text.replace(/<[^>]+>/g, "").slice(0, 60)}
                    {b.text.length > 60 ? "..." : ""}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {audienceLabels[b.targetAudience]}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        statusColors[b.status]
                      }`}
                    >
                      {statusLabels[b.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {b.scheduledAt
                      ? new Date(b.scheduledAt).toLocaleString("ru")
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {b.totalRecipients}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {b.deliveredCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(b.createdAt).toLocaleDateString("ru")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal
          broadcast={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// --- Create View ---
function CreateView({ onCreated }: { onCreated: () => void }) {
  const [text, setText] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [filterGender, setFilterGender] = useState("");
  const [filterEditingSkill, setFilterEditingSkill] = useState("");
  const [filterHasExperience, setFilterHasExperience] = useState("");
  const [filterNiche, setFilterNiche] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [mediaFileId, setMediaFileId] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (before: string, after: string) => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.substring(start, end);
    const newText =
      text.substring(0, start) + before + selected + after + text.substring(end);
    setText(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  };

  const insertLink = () => {
    const url = prompt("URL:");
    if (!url) return;
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.substring(start, end) || "ссылка";
    const linkHtml = `<a href="${url}">${selected}</a>`;
    const newText = text.substring(0, start) + linkHtml + text.substring(end);
    setText(newText);
  };

  const ensureDraft = async (): Promise<number> => {
    if (draftId) return draftId;
    const res = await api.post("/broadcasts", {
      text,
      targetAudience,
      filterGender: filterGender || undefined,
      filterEditingSkill: filterEditingSkill || undefined,
      filterHasExperience:
        filterHasExperience !== ""
          ? filterHasExperience === "true"
          : undefined,
      filterNiche: filterNiche || undefined,
      filterStatus: filterStatus || undefined,
    });
    const id = res.data.id;
    setDraftId(id);
    return id;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const id = await ensureDraft();
      const form = new FormData();
      form.append("file", file);
      const res = await api.post(`/broadcasts/${id}/upload`, form);
      setMediaFileId(res.data.mediaFileId);
      setMediaType(res.data.mediaType);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Не удалось загрузить файл");
    }
    setUploading(false);
  };

  const removeMedia = () => {
    setMediaFileId(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePreviewCount = async () => {
    try {
      const id = await ensureDraft();
      // Update draft with current filters
      await api.put(`/broadcasts/${id}`, {
        text,
        targetAudience,
        filterGender: filterGender || undefined,
        filterEditingSkill: filterEditingSkill || undefined,
        filterHasExperience:
          filterHasExperience !== ""
            ? filterHasExperience === "true"
            : undefined,
        filterNiche: filterNiche || undefined,
        filterStatus: filterStatus || undefined,
      });
      const res = await api.post(`/broadcasts/${id}/preview-count`);
      setRecipientCount(res.data.count);
    } catch (err) {
      console.error("Preview count failed:", err);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) {
      alert("Введите текст рассылки");
      return;
    }
    setSending(true);
    try {
      const id = await ensureDraft();
      // Update draft with latest data
      await api.put(`/broadcasts/${id}`, {
        text,
        targetAudience,
        filterGender: filterGender || undefined,
        filterEditingSkill: filterEditingSkill || undefined,
        filterHasExperience:
          filterHasExperience !== ""
            ? filterHasExperience === "true"
            : undefined,
        filterNiche: filterNiche || undefined,
        filterStatus: filterStatus || undefined,
      });
      // Send or schedule
      await api.post(`/broadcasts/${id}/send`, {
        scheduledAt: scheduled && scheduledAt ? scheduledAt : undefined,
      });
      alert(
        scheduled
          ? "Рассылка запланирована!"
          : "Рассылка запущена!"
      );
      // Reset form
      setText("");
      setTargetAudience("all");
      setFilterGender("");
      setFilterEditingSkill("");
      setFilterHasExperience("");
      setFilterNiche("");
      setFilterStatus("");
      setScheduled(false);
      setScheduledAt("");
      setMediaFileId(null);
      setMediaType(null);
      setDraftId(null);
      setRecipientCount(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onCreated();
    } catch (err) {
      console.error("Send failed:", err);
      alert("Ошибка при отправке");
    }
    setSending(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Editor */}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 bg-white p-2 rounded-lg shadow">
          <ToolbarBtn label="B" onClick={() => wrapSelection("<b>", "</b>")} />
          <ToolbarBtn label="I" onClick={() => wrapSelection("<i>", "</i>")} />
          <ToolbarBtn label="U" onClick={() => wrapSelection("<u>", "</u>")} />
          <ToolbarBtn label="S" onClick={() => wrapSelection("<s>", "</s>")} />
          <ToolbarBtn
            label="<>"
            onClick={() => wrapSelection("<code>", "</code>")}
          />
          <ToolbarBtn label="Link" onClick={insertLink} />
        </div>

        {/* Text editor */}
        <textarea
          ref={editorRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Текст рассылки (поддержка HTML: <b>, <i>, <u>, <s>, <code>, <a>)..."
          className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />

        {/* Media upload */}
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Медиа (фото или видео)
          </label>
          {mediaFileId ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-green-600">
                {mediaType === "photo" ? "Фото" : "Видео"} загружено
              </span>
              <button
                onClick={removeMedia}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Удалить
              </button>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleUpload}
                className="text-sm"
                disabled={uploading}
              />
              {uploading && (
                <span className="text-sm text-gray-500 ml-2">
                  Загрузка...
                </span>
              )}
            </div>
          )}
        </div>

        {/* Audience */}
        <div className="bg-white p-4 rounded-lg shadow space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Аудитория
          </label>
          <div className="flex gap-2">
            {(["all", "creators", "companies"] as const).map((a) => (
              <button
                key={a}
                onClick={() => {
                  setTargetAudience(a);
                  setRecipientCount(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  targetAudience === a
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {audienceLabels[a]}
              </button>
            ))}
          </div>

          {/* Creator filters */}
          {(targetAudience === "creators" || targetAudience === "all") && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 uppercase font-medium">
                Фильтры креаторов
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={filterGender}
                  onChange={(e) => {
                    setFilterGender(e.target.value);
                    setRecipientCount(null);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Любой пол</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
                <select
                  value={filterEditingSkill}
                  onChange={(e) => {
                    setFilterEditingSkill(e.target.value);
                    setRecipientCount(null);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Любой монтаж</option>
                  <option value="pro">Профи</option>
                  <option value="medium">Средний</option>
                  <option value="beginner">Начинающий</option>
                </select>
                <select
                  value={filterHasExperience}
                  onChange={(e) => {
                    setFilterHasExperience(e.target.value);
                    setRecipientCount(null);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Любой опыт</option>
                  <option value="true">С опытом</option>
                  <option value="false">Без опыта</option>
                </select>
              </div>
            </div>
          )}

          {/* Company filters */}
          {(targetAudience === "companies" || targetAudience === "all") && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 uppercase font-medium">
                Фильтры компаний
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filterNiche}
                  onChange={(e) => {
                    setFilterNiche(e.target.value);
                    setRecipientCount(null);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Любая ниша</option>
                  <option value="бытовая_техника">Бытовая техника</option>
                  <option value="уходовая_косметика">Уходовая косметика</option>
                  <option value="декоративная_косметика">
                    Декоративная косметика
                  </option>
                  <option value="одежда_и_аксессуары">Одежда и аксессуары</option>
                  <option value="еда_и_напитки">Еда и напитки</option>
                  <option value="другое">Другое</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setRecipientCount(null);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Любой статус</option>
                  <option value="pending">На модерации</option>
                  <option value="approved">Одобрена</option>
                  <option value="rejected">Отклонена</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <input
              type="checkbox"
              checked={scheduled}
              onChange={(e) => setScheduled(e.target.checked)}
              className="rounded"
            />
            Запланировать отправку
          </label>
          {scheduled && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {/* Preview count + Send */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePreviewCount}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            {recipientCount !== null
              ? `Получателей: ${recipientCount}`
              : "Показать кол-во получателей"}
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending
              ? "Отправка..."
              : scheduled
              ? "Запланировать"
              : "Отправить сейчас"}
          </button>
        </div>
      </div>

      {/* Right: Preview */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">
          Предпросмотр
        </div>
        <TelegramPreview
          text={text}
          mediaFileId={mediaFileId}
          mediaType={mediaType}
        />
      </div>
    </div>
  );
}

// --- Main Page ---
export default function Broadcasts() {
  const [tab, setTab] = useState<Tab>("history");
  const [key, setKey] = useState(0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Рассылки</h1>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "history"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            История
          </button>
          <button
            onClick={() => setTab("create")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "create"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Создать рассылку
          </button>
        </div>
      </div>

      {tab === "history" ? (
        <HistoryView key={key} />
      ) : (
        <CreateView onCreated={() => { setKey((k) => k + 1); setTab("history"); }} />
      )}
    </div>
  );
}
