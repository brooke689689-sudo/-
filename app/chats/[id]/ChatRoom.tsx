"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ChatMessage = {
  id: number;
  sender_id: string | null;
  body: string | null;
  image_path: string | null;
  is_blocked: boolean;
  flag_reason: string | null;
  created_at: string;
};

const SEND_ERRORS: Record<string, string> = {
  BLOCKED: "차단 관계라 메시지를 보낼 수 없어요.",
  ACCOUNT_RESTRICTED: "이용이 제한된 계정이에요.",
  NOT_PARTICIPANT: "이 채팅방의 참여자가 아니에요.",
  EMPTY_MESSAGE: "메시지를 입력해 주세요.",
};

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "numeric", minute: "2-digit" });
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short" });
}

export function ChatRoom({
  roomId,
  userId,
  initial,
  disabled,
}: {
  roomId: string;
  userId: string;
  initial: ChatMessage[];
  disabled: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ tone: "red" | "amber"; text: string } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const merge = (incoming: ChatMessage[]) =>
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, m);
      return [...map.values()].sort((a, b) => a.id - b.id);
    });

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getSession().then(({ data }) => {
      supabase.realtime.setAuth(data.session?.access_token ?? null);
      channel = supabase
        .channel(`room:${roomId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
          (payload) => {
            merge([payload.new as ChatMessage]);
            if ((payload.new as ChatMessage).sender_id !== userId) supabase.rpc("mark_room_read", { p_room_id: roomId });
          },
        )
        .subscribe();
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setNotice(null);
    const supabase = supabaseRef.current ?? createClient();
    const { data, error } = await supabase.rpc("send_message", { p_room_id: roomId, p_body: body });
    setSending(false);
    if (error) {
      setNotice({ tone: "red", text: SEND_ERRORS[error.message] ?? "메시지를 보내지 못했어요. 다시 시도해 주세요." });
      return;
    }
    const result = data as { status: "sent" | "warned" | "blocked"; id: number; label?: string };
    setText("");
    merge([
      {
        id: result.id,
        sender_id: userId,
        body,
        image_path: null,
        is_blocked: result.status === "blocked",
        flag_reason: result.label ?? null,
        created_at: new Date().toISOString(),
      },
    ]);
    if (result.status === "blocked") {
      setNotice({ tone: "red", text: `보낼 수 없는 내용이 있어 전송되지 않았어요 (${result.label}). 계좌번호·금전 요구는 금지돼요.` });
    } else if (result.status === "warned") {
      setNotice({ tone: "amber", text: `주의가 필요한 표현이 있어요 (${result.label}). 무료 분양 원칙을 지켜주세요.` });
    }
  }

  return (
    <>
      <div className="flex-1 space-y-2 overflow-y-auto bg-stone-50 px-3 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-stone-400">
            첫 인사를 건네보세요. 아이의 성격, 생활 환경, 만날 장소 등을 편하게 이야기해요.
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === userId;
          const showDay = i === 0 || dayLabel(messages[i - 1].created_at) !== dayLabel(m.created_at);
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-xs text-stone-400">{dayLabel(m.created_at)}</p>}
              <div className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : ""}`}>
                <div
                  className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-6 ${
                    m.is_blocked
                      ? "border border-red-200 bg-red-50 text-red-400 line-through"
                      : mine
                        ? "bg-ink text-white"
                        : "bg-white text-stone-800 shadow-sm"
                  }`}
                >
                  {m.body ?? "사진"}
                </div>
                <div className={`flex flex-col text-[11px] text-stone-400 ${mine ? "items-end" : "items-start"}`}>
                  {m.is_blocked && <span className="font-semibold text-red-500">전송 안 됨</span>}
                  {!mine && (
                    <Link href={`/report?message=${m.id}&room=${roomId}`} className="hover:text-red-500">
                      신고
                    </Link>
                  )}
                  <span>{timeLabel(m.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      {notice && (
        <p className={`px-4 py-2 text-xs leading-5 ${notice.tone === "red" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
          {notice.text}
        </p>
      )}

      {disabled ? (
        <p className="border-t border-stone-100 p-4 text-center text-sm text-stone-500">{disabled}</p>
      ) : (
        <form
          className="flex items-end gap-2 border-t border-stone-100 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="메시지를 입력하세요"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="h-11 rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:bg-stone-300"
          >
            보내기
          </button>
        </form>
      )}
    </>
  );
}
