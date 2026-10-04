import type { Database } from "@/lib/database.types";

type Enums = Database["public"]["Enums"];

export const SIDO = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
] as const;

export const SEX_LABEL: Record<Enums["pet_sex"], string> = {
  male: "수컷",
  female: "암컷",
  unknown: "성별 모름",
};

export const SIZE_LABEL: Record<Enums["pet_size"], string> = {
  small: "소형",
  medium: "중형",
  large: "대형",
};

export const TRI_LABEL: Record<Enums["tri_state"], string> = {
  yes: "예",
  no: "아니요",
  unknown: "모름",
};

export function ageLabel(birthDate: string) {
  const birth = new Date(birthDate);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()) -
    (now.getDate() < birth.getDate() ? 1 : 0);
  if (months < 1) return "1개월 미만";
  if (months < 12) return `${months}개월`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years}살 ${rest}개월` : `${years}살`;
}

export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

export function dateLabel(iso: string, withTime = false) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export function daysLeft(dateStr: string) {
  const todayKst = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  return Math.round((Date.parse(dateStr) - Date.parse(todayKst)) / 86400000);
}
