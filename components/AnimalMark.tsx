export function AnimalMark({ slug }: { slug: string }) {
  if (slug === "cat") return <Cat />;
  if (slug === "small") return <Hamster />;
  if (slug === "bird") return <Bird />;
  if (slug === "reptile") return <Lizard />;
  if (slug === "fish") return <Fish />;
  return <Dog />;
}

function Dog() {
  return (
    <svg viewBox="0 0 80 80" className="h-14 w-14" aria-hidden>
      <ellipse cx="22" cy="28" rx="10" ry="14" fill="#e7a15a" />
      <ellipse cx="58" cy="28" rx="10" ry="14" fill="#e7a15a" />
      <circle cx="40" cy="42" r="22" fill="#f3c48a" />
      <ellipse cx="40" cy="50" rx="12" ry="9" fill="#fff7ee" />
      <ellipse cx="33" cy="40" rx="3" ry="3.4" fill="#2b2b2b" />
      <ellipse cx="47" cy="40" rx="3" ry="3.4" fill="#2b2b2b" />
      <ellipse cx="40" cy="48" rx="3" ry="2.2" fill="#3a2a22" />
      <path d="M36 52c2 2 6 2 8 0" fill="none" stroke="#c46a6a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Cat() {
  return (
    <svg viewBox="0 0 80 80" className="h-14 w-14" aria-hidden>
      <path d="M22 34 18 16l16 10" fill="#d9dde3" />
      <path d="M58 34 62 16 46 26" fill="#d9dde3" />
      <circle cx="40" cy="44" r="22" fill="#eef1f4" />
      <ellipse cx="32" cy="44" rx="3" ry="3.6" fill="#2b2b2b" />
      <ellipse cx="48" cy="44" rx="3" ry="3.6" fill="#2b2b2b" />
      <path d="M40 48v4" stroke="#c98484" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M28 50h8M44 50h8" stroke="#b9c0c8" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M36 56c2.2 2 5.8 2 8 0" fill="none" stroke="#c98484" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Hamster() {
  return (
    <svg viewBox="0 0 80 80" className="h-14 w-14" aria-hidden>
      <circle cx="24" cy="48" r="10" fill="#f6c9a4" />
      <circle cx="56" cy="48" r="10" fill="#f6c9a4" />
      <circle cx="40" cy="42" r="20" fill="#f4b56a" />
      <ellipse cx="40" cy="50" rx="10" ry="8" fill="#fff4e8" />
      <ellipse cx="33" cy="40" rx="2.6" ry="3" fill="#2b2b2b" />
      <ellipse cx="47" cy="40" rx="2.6" ry="3" fill="#2b2b2b" />
      <ellipse cx="40" cy="47" rx="2.4" ry="1.8" fill="#e28b8b" />
    </svg>
  );
}

function Bird() {
  return (
    <svg viewBox="0 0 80 80" className="h-14 w-14" aria-hidden>
      <ellipse cx="46" cy="42" rx="18" ry="16" fill="#7ec8e3" />
      <circle cx="34" cy="38" r="12" fill="#b7e3f2" />
      <path d="M22 40 10 36l12-2z" fill="#f0a35e" />
      <circle cx="30" cy="36" r="2.2" fill="#2b2b2b" />
      <path d="M40 54c6 8 16 8 20 2" fill="#f2d27a" />
    </svg>
  );
}

function Lizard() {
  return (
    <svg viewBox="0 0 80 80" className="h-14 w-14" aria-hidden>
      <ellipse cx="46" cy="44" rx="20" ry="12" fill="#8dce7a" />
      <circle cx="28" cy="40" r="12" fill="#b6e39a" />
      <circle cx="24" cy="38" r="2" fill="#2b2b2b" />
      <path d="M18 48c-6 4-8 10-4 12M34 54c-2 8 2 12 6 10M52 54c2 8 8 8 10 2M62 40c8-2 12 2 10 8" fill="none" stroke="#6eae5c" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Fish() {
  return (
    <svg viewBox="0 0 80 80" className="h-14 w-14" aria-hidden>
      <ellipse cx="38" cy="42" rx="20" ry="14" fill="#f08a3a" />
      <path d="M56 42 72 30v24z" fill="#f3b56a" />
      <circle cx="28" cy="40" r="2.4" fill="#2b2b2b" />
      <path d="M34 48c4 3 10 3 14 0" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
