import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import MessagingAPI from "./MessagingAPI";
import { getChatSocket, disconnectChatSocket } from "@/socket/chatSocket";
import { Send, Loader2, Paperclip, X, FileText } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLocation } from "react-router-dom";
import { resetUnread } from "./messagingSlice";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Building2 } from "lucide-react";

/**
 * Trang chat: dùng chung cho ứng viên (/messages) và recruiter (/recruiter/messages).
 */
export default function MessagesPage() {
  const user = useSelector((s) => s.auth.user);
  /** `auth/me` trả về account — `id` là account id */
  const accountId = user?.id;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [text, setText] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const selectedRef = useRef(null);
  const fileInputRef = useRef(null);

  const ATTACHMENT_MAX_FILES = 5;
  const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024;
  const ALLOWED_ATTACHMENT_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  // Log connect/disconnect cho chat socket
  useEffect(() => {
    if (!user) return;

    const socket = getChatSocket();

    const onConnect = () => {
      console.log("✅ Chat WS connected:", socket.id, "| role:", user?.role);
    };
    const onDisconnect = (reason) => {
      console.log("🛑 Chat WS disconnected:", reason);
    };
    const onConnectError = (err) => {
      console.log("❌ Chat WS connect_error:", err?.message || err);
    };
    const onMessageSent = (payload) => {
      console.log("✅ Chat message:sent (server event)", payload);
    };
    const onErrorEvent = (payload) => {
      console.log("❌ Chat error (server event)", payload);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("message:sent", onMessageSent);
    socket.on("error", onErrorEvent);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("message:sent", onMessageSent);
      socket.off("error", onErrorEvent);
    };
  }, [user]);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await MessagingAPI.list();
      const list = res?.data?.data ?? [];
      setConversations(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setConversations([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadList();
    return () => {
      disconnectChatSocket();
    };
  }, [loadList]);

  // Reset badge khi vào trang messages
  useEffect(() => {
    if (!user) return;
    dispatch(resetUnread());
  }, [user, dispatch, location?.pathname]);

  // Nếu điều hướng từ notification với openConversationId thì auto-open
  useEffect(() => {
    const cid = location?.state?.openConversationId;
    if (!cid) return;
    // tránh loop khi user đã chọn rồi
    if (String(selectedRef.current) === String(cid)) return;
    openConversation(cid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state?.openConversationId]);

  const leaveRoom = (socket, cid) => {
    if (!cid) return;
    socket.emit("conversation:leave", { conversationId: String(cid) });
  };

  const subscribeRoom = useCallback((conversationId) => {
    const socket = getChatSocket();
    if (!socket.connected) socket.connect();

    socket.off("message:new");
    socket.on("message:new", (payload) => {
      if (String(payload.conversation_id) === String(selectedRef.current)) {
        setMessages((prev) => {
          const exists = prev.some((m) => String(m.id) === String(payload.id));
          if (exists) return prev;
          return [
            ...prev,
            {
              id: payload.id,
              body: payload.body,
              created_at: payload.created_at,
              sender_account_id: payload.sender_account_id,
              sender: payload.sender,
              attachments: payload.attachments || [],
            },
          ];
        });
      }
      loadList();
    });

    return socket;
  }, [loadList]);

  const openConversation = async (id) => {
    const prev = selectedRef.current;
    selectedRef.current = id;
    setSelectedId(id);
    setLoadingMsg(true);
    setMessages([]);
    setNextCursor(null);

    try {
      const socket = getChatSocket();
      if (prev) leaveRoom(socket, prev);

      const res = await MessagingAPI.messages(id, {});
      const payload = res?.data?.data ?? {};
      setMessages(payload.messages ?? []);
      setNextCursor(payload.nextCursor ?? null);

      subscribeRoom(id);
      const s = getChatSocket();
      if (!s.connected) s.connect();
      s.emit("conversation:join", { conversationId: String(id) });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMsg(false);
    }
  };

  const loadOlder = async () => {
    if (!selectedId || !nextCursor) return;
    setLoadingMsg(true);
    try {
      const res = await MessagingAPI.messages(selectedId, {
        before: nextCursor,
      });
      const payload = res?.data?.data ?? {};
      const older = payload.messages ?? [];
      setMessages((prev) => [...older, ...prev]);
      setNextCursor(payload.nextCursor ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMsg(false);
    }
  };

  const send = async () => {
    const t = text.trim();
    if ((!t && selectedFiles.length === 0) || !selectedId) return;
    setSending(true);
    const socket = getChatSocket();
    if (!socket.connected) socket.connect();

    console.log("➡️ Click send chat message", {
      conversationId: String(selectedId),
      bodyLength: t.length,
    });

    if (selectedFiles.length > 0) {
      try {
        await MessagingAPI.sendWithAttachments(selectedId, t, selectedFiles);
        setText("");
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        const res = await MessagingAPI.messages(selectedId, {});
        setMessages(res?.data?.data?.messages ?? []);
        loadList();
      } catch (e) {
        console.error(e);
      } finally {
        setSending(false);
      }
      return;
    }

    // NestJS gateway trả `message:sent` / `error` như server events, không phải socket.io ack callback.
    // Vì vậy không chờ ack để tránh timeout giả.
    if (socket.connected) {
      socket.emit("message:send", {
        conversationId: String(selectedId),
        body: t,
      });
      console.log("➡️ Socket emit message:send");
      setText("");
      setSending(false);
      return;
    }

    console.warn("Socket not connected, fallback HTTP");
    try {
      console.log("➡️ Fallback HTTP send", {
        conversationId: String(selectedId),
        bodyLength: t.length,
      });
      await MessagingAPI.send(selectedId, t);
      setText("");
      const res = await MessagingAPI.messages(selectedId, {});
      setMessages(res?.data?.data?.messages ?? []);
      console.log("✅ Fallback HTTP send success");
    } catch (e2) {
      console.error(e2);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (event) => {
    const inputFiles = Array.from(event.target.files || []);
    if (inputFiles.length === 0) return;

    const validated = [];
    for (const file of inputFiles) {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
        alert(`Định dạng không hỗ trợ: ${file.name}`);
        continue;
      }
      if (file.size > ATTACHMENT_MAX_SIZE) {
        alert(`File quá lớn (tối đa 10MB): ${file.name}`);
        continue;
      }
      validated.push(file);
    }

    setSelectedFiles((prev) => {
      const next = [...prev, ...validated].slice(0, ATTACHMENT_MAX_FILES);
      if (prev.length + validated.length > ATTACHMENT_MAX_FILES) {
        alert(`Tối đa ${ATTACHMENT_MAX_FILES} files mỗi tin nhắn.`);
      }
      return next;
    });
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const titleForConv = (c) => {
    const jobTitle = c.job?.title || "Tin tuyển dụng";
    const peer =
      String(accountId) === String(c.applicant_account?.id)
        ? c.recruiter_account?.company?.name || "Nhà tuyển dụng"
        : c.applicant_account?.user?.full_name || "Ứng viên";
    return `${jobTitle} · ${peer}`;
  };

  const selectedConversation = selectedId
    ? conversations.find((c) => String(c.id) === String(selectedId))
    : null;

  const jobId = selectedConversation?.job?.id;
  const companyId = selectedConversation?.job?.company?.id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex gap-4 min-h-[calc(100vh-8rem)]">
      <aside className="w-full md:w-80 shrink-0 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col max-h-[70vh]">
        <div className="p-3 border-b border-slate-100 font-semibold text-slate-800">
          Hội thoại
        </div>
        {loadingList ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="animate-spin text-slate-400" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            Chưa có cuộc hội thoại. Ứng tuyển hoặc mở chat từ tin tuyển dụng.
          </p>
        ) : (
          <ul className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {conversations.map((c) => (
              <li key={String(c.id)}>
                <button
                  type="button"
                  onClick={() => openConversation(c.id)}
                  className={`w-full text-left px-3 py-3 hover:bg-slate-50 text-sm ${
                    String(selectedId) === String(c.id)
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="font-medium text-slate-800 line-clamp-2">
                    {titleForConv(c)}
                  </div>
                  {c.messages?.[0] && (
                    <div className="text-xs text-slate-500 truncate mt-1">
                      {c.messages[0].body}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="flex-1 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col min-h-[420px] max-h-[70vh]">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Chọn một cuộc hội thoại bên trái
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-slate-100 flex justify-between items-center gap-3">
              <div className="min-w-0">
                <div className="font-medium text-slate-800">Tin nhắn</div>
                {selectedConversation?.job?.title && (
                  <div className="text-xs text-slate-500 truncate">
                    {selectedConversation.job.title}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className={`text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md border ${
                    jobId
                      ? "border-slate-200 hover:bg-slate-50 text-slate-700"
                      : "border-slate-100 text-slate-300 cursor-not-allowed"
                  }`}
                  disabled={!jobId}
                  onClick={() => jobId && navigate(`/jobs/${jobId}`)}
                  title={jobId ? "Mở tin tuyển dụng" : "Không có thông tin job"}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Xem tin
                </button>

                <button
                  type="button"
                  className={`text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md border ${
                    companyId
                      ? "border-slate-200 hover:bg-slate-50 text-slate-700"
                      : "border-slate-100 text-slate-300 cursor-not-allowed"
                  }`}
                  disabled={!companyId}
                  onClick={() => companyId && navigate(`/companies/${companyId}`)}
                  title={
                    companyId ? "Mở hồ sơ công ty" : "Không có thông tin công ty"
                  }
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Công ty
                </button>

                {nextCursor && (
                  <button
                    type="button"
                    onClick={loadOlder}
                    className="text-xs text-blue-600 hover:underline"
                    disabled={loadingMsg}
                  >
                    Tải thêm
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {loadingMsg && messages.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-slate-400" />
                </div>
              ) : (
                messages.map((m) => {
                  const mine = String(m.sender_account_id) === String(accountId);
                  return (
                    <div
                      key={String(m.id)}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                          mine
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-slate-200 text-slate-800"
                        }`}
                      >
                        {m.body ? <div>{m.body}</div> : null}
                        {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                          <div className={`mt-2 space-y-2 ${mine ? "text-white" : "text-slate-700"}`}>
                            {m.attachments.map((attachment) => {
                              const isImage = attachment.type === "image";
                              return (
                                <div
                                  key={String(attachment.id)}
                                  className={`rounded-lg p-2 ${mine ? "bg-blue-500/60" : "bg-slate-100"}`}
                                >
                                  {isImage ? (
                                    <a
                                      href={attachment.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block"
                                    >
                                      <img
                                        src={attachment.file_url}
                                        alt={attachment.file_name}
                                        className="max-h-48 rounded-md object-cover"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={attachment.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-2 underline text-xs"
                                    >
                                      <FileText className="w-4 h-4" />
                                      {attachment.file_name}
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || selectedFiles.length >= ATTACHMENT_MAX_FILES}
                title="Đính kèm file"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <input
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Nhập tin nhắn..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={sending || (!text.trim() && selectedFiles.length === 0)}
                onClick={send}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {selectedFiles.length > 0 && (
              <div className="px-3 pb-3">
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs"
                    >
                      <span className="max-w-[220px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className="text-slate-500 hover:text-red-500"
                        aria-label="Xóa file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
