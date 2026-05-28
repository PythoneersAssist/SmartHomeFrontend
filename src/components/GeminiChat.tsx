import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type FunctionCall = {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  function_calls?: FunctionCall[];
  loading?: boolean;
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function httpToWs(url: string) {
  if (!url) return url;
  if (url.startsWith("https://")) return url.replace(/^https:/, "wss:");
  if (url.startsWith("http://")) return url.replace(/^http:/, "ws:");
  return url;
}

export default function GeminiChat({ token }: { token: string }) {
  // In dev VITE_API_BASE is unset, so we talk to the backend directly on :8000.
  // In production it's set to "" (see .env.production) so every call is same-origin
  // and nginx reverse-proxies /api to the backend.
  const envApiBase = import.meta.env.VITE_API_BASE as string | undefined;
  const apiBase = envApiBase ?? "http://localhost:8000";
  const wsBase = apiBase
    ? httpToWs(apiBase)
    : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
  const wsUrl = `${wsBase}/api/gemini/ws/chat?token=${encodeURIComponent(
    token
  )}`;

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(500);
  const reconnectTimeout = useRef<number | null>(null);
  const pendingQueue = useRef<Record<string, unknown>[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [modalOptions, setModalOptions] = useState<unknown[] | null>(null);
  const [modalResolve, setModalResolve] = useState<((v: unknown) => void) | null>(
    null
  );

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) window.clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function connect() {
    if (!token) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;
    setConnecting(true);
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        backoffRef.current = 500;
        setConnecting(false);
        // flush queue
        while (pendingQueue.current.length) {
          const data = pendingQueue.current.shift();
          try {
            ws.send(JSON.stringify(data));
          } catch (e) {
            console.error("WS send error", e);
          }
        }
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          // expected { role: 'assistant', content: '...', function_calls: [...] }
          if (data && data.role === "assistant") {
            setMessages((prev) => {
              // find first assistant loading placeholder
              const idx = prev.findIndex((m) => m.role === "assistant" && m.loading);
              if (idx !== -1) {
                const copy = [...prev];
                copy[idx] = {
                  ...copy[idx],
                  loading: false,
                  content: data.content || "",
                  function_calls: data.function_calls || undefined,
                };
                return copy;
              }
              // otherwise append
              return [
                ...prev,
                {
                  id: generateId(),
                  role: "assistant",
                  content: data.content || "",
                  function_calls: data.function_calls || undefined,
                },
              ];
            });

            // handle multi-match function call result
            if (data.function_calls && Array.isArray(data.function_calls)) {
              data.function_calls.forEach((fc: FunctionCall) => {
                if (Array.isArray(fc.result) && fc.result.length > 1) {
                  // show modal to user to pick one
                  promptUserToPick(fc.result).then((pick) => {
                    if (pick) {
                      // send clarifying message back to backend
                      sendMessage(
                        `Selected: ${JSON.stringify(pick)}`,
                        false
                      );
                    }
                  });
                }
              });
            }
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onclose = () => {
        setConnecting(false);
        // exponential backoff reconnect
        const wait = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * 1.8, 30_000);
        reconnectTimeout.current = window.setTimeout(() => {
          connect();
        }, wait);
      };

      ws.onerror = (e) => {
        console.error("WebSocket error", e);
        ws.close();
      };
    } catch (e) {
      console.error("WS connect failed", e);
      setConnecting(false);
    }
  }

  function enqueue(data: Record<string, unknown>) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      pendingQueue.current.push(data);
      // try to connect if not
      connect();
    }
  }

  function sendMessage(text: string, addUserMsg = true) {
    if (!token) return;
    if (addUserMsg) {
      setMessages((m) => [...m, { id: generateId(), role: "user", content: text }]);
      // add assistant placeholder
      setMessages((m) => [...m, { id: generateId(), role: "assistant", content: "", loading: true }]);
    } else {
      // when sending clarifying messages from modal
      setMessages((m) => [...m, { id: generateId(), role: "user", content: text }]);
      setMessages((m) => [...m, { id: generateId(), role: "assistant", content: "", loading: true }]);
    }

    enqueue({ message: text });
  }

  async function clearHistory() {
    try {
      await fetch(`${apiBase}/api/gemini/clear-history?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      setMessages([]);
    } catch (e) {
      console.error("Clear history failed", e);
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch(`${apiBase}/api/gemini/history?token=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      // Expecting array of { role, content, function_calls }
      const parsed: ChatMessage[] = (data || []).map((d: Record<string, unknown>) => ({
        id: generateId(),
        role: d.role || "assistant",
        content: d.content || "",
        function_calls: d.function_calls || undefined,
      }));
      setMessages(parsed);
    } catch (e) {
      console.error("Load history failed", e);
    }
  }

  function promptUserToPick(options: unknown[]) {
    return new Promise((resolve) => {
      setModalOptions(options);
      setModalResolve(() => resolve);
    });
  }

  function pickOption(opt: unknown) {
    if (modalResolve) modalResolve(opt);
    setModalOptions(null);
    setModalResolve(null);
  }

  return (
    <div className="relative flex max-h-[72vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(61,220,151,0.14),_transparent_30%),linear-gradient(180deg,rgba(15,19,26,0.96),rgba(7,10,14,0.98))] text-slate-100 shadow-[0_28px_90px_rgba(0,0,0,0.62)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Gemini Assistant</p>
          <h2 className="mt-1 text-lg font-extrabold text-white">Smart home chat</h2>
          <p className="mt-1 text-sm text-slate-400">Ask about devices, rooms, scenes, and automations.</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${connecting ? "border-amber-400/30 bg-amber-500/10 text-amber-200" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"}`}>
            {connecting ? "Connecting" : "Ready"}
          </span>
          <button
            onClick={loadHistory}
            type="button"
            className="rounded-xl border border-white/15 bg-slate-800/70 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/45 hover:bg-slate-700/70"
          >
            Load history
          </button>
          <button
            onClick={clearHistory}
            type="button"
            className="rounded-xl border border-white/15 bg-slate-800/70 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-rose-300/35 hover:text-rose-200"
          >
            Clear history
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 px-5 py-8 text-center text-sm text-slate-400">
              Start a conversation with the assistant, or load your previous history.
            </div>
          ) : null}

          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[min(85%,46rem)] rounded-2xl border px-4 py-3 shadow-sm ${isUser ? "border-emerald-400/20 bg-emerald-500/12 text-emerald-50" : "border-white/10 bg-slate-900/80 text-slate-100"}`}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    <span className={isUser ? "text-emerald-200" : "text-cyan-200"}>{m.role}</span>
                    {m.loading ? <span className="animate-pulse text-emerald-300">Typing...</span> : null}
                  </div>
                  {m.loading ? (
                    <em className="text-slate-300">Waiting for the assistant...</em>
                  ) : isUser ? (
                    <div className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">{m.content}</div>
                  ) : (
                    <div className="prose prose-invert max-w-none text-sm prose-p:leading-6 prose-p:text-slate-100 prose-p:my-2 prose-a:text-emerald-300 prose-a:hover:text-emerald-200 prose-strong:text-slate-50 prose-em:text-slate-200 prose-code:bg-slate-950 prose-code:text-emerald-200 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-xs prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg prose-pre:p-3 prose-pre:text-xs prose-pre:text-slate-200 prose-ol:text-slate-100 prose-ul:text-slate-100 prose-li:marker:text-emerald-300">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}

                  {m.function_calls && m.function_calls.length > 0 ? (
                    <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Function calls</div>
                      {m.function_calls.map((fc, i) => (
                        <div key={i} className="rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-300">
                          <div className="font-semibold text-slate-100">{fc.name}</div>
                          <div className="mt-2">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Args</div>
                            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">{JSON.stringify(fc.args, null, 2)}</pre>
                          </div>
                          <div className="mt-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Result</div>
                            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">{JSON.stringify(fc.result, null, 2)}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/10 bg-slate-950/60 px-4 py-4 sm:px-6">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-12 flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/40 focus:ring-2 focus:ring-emerald-400/15"
            placeholder={connecting ? "Connecting to Gemini..." : "Type a message"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                e.preventDefault();
                sendMessage(input.trim());
                setInput("");
              }
            }}
          />
          <button
            onClick={() => {
              if (input.trim()) {
                sendMessage(input.trim());
                setInput("");
              }
            }}
            type="button"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      </div>

      {modalOptions ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => { setModalOptions(null); if (modalResolve) modalResolve(null); }} />
          <div className="relative z-10 w-full max-w-lg rounded-[24px] border border-white/10 bg-slate-950/95 p-5 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Multiple matches</div>
            <div className="mt-2 text-lg font-semibold text-white">Pick one result</div>
            <div className="mt-4 grid gap-3">
              {modalOptions.map((o, idx) => (
                <button
                  key={idx}
                  onClick={() => pickOption(o)}
                  type="button"
                  className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-emerald-300/35 hover:bg-slate-800/90"
                >
                  {typeof o === "string" ? o : JSON.stringify(o)}
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  setModalOptions(null);
                  if (modalResolve) modalResolve(null);
                }}
                type="button"
                className="rounded-xl border border-white/10 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
