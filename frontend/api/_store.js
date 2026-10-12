// ============================================================
// _store.js — 방명록/구독자 데이터를 Upstash Redis에 저장하는 공용 모듈
// 파일명이 밑줄(_)로 시작하면 Vercel이 API 주소로 만들지 않고, 다른 파일에서 불러 쓰는 용도로만 취급함
// ============================================================

const crypto = require("crypto");

// Vercel 대시보드 Storage 탭에서 Upstash Redis를 연결하면 자동으로 채워지는 환경 변수
const SF_API_REDIS_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const SF_API_REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// DB에 댓글이 하나도 없을 때 처음 한 번만 넣어 주는 기본 방명록
// (비밀번호가 없으므로 화면에서는 삭제할 수 없음)
const SF_API_SEED_COMMENTS = [
  {
    id: "1",
    author: "김민준",
    content:
      "세일즈포스는 처음이지만 밤새워서라도 완벽히 마스터해 올해 안에 꼭 취뽀하겠습니다!",
    created_at: "2026-06-26",
  },
  {
    id: "2",
    author: "이서연",
    content:
      "트레일헤드 왕초보 배지부터 시작해 기필코 당당한 주니어 개발자로 입사하겠습니다!",
    created_at: "2026-06-27",
  },
  {
    id: "3",
    author: "박진우",
    content:
      "Apex 코드 한 줄도 모르는 뉴비지만 끝까지 살아남아 세일즈포스 전문가가 되겠습니다!",
    created_at: "2026-06-28",
  },
  {
    id: "4",
    author: "최지아",
    content:
      "기초부터 독하게 배워서 무조건 6개월 안에 Admin 자격증 따고 취업 골인하겠습니다!",
    created_at: "2026-06-29",
  },
];

// Redis 연결 정보(환경 변수)가 들어와 있는지 확인
function sfApiIsStoreReady() {
  return Boolean(SF_API_REDIS_URL && SF_API_REDIS_TOKEN);
}

// Redis 명령 한 개를 실행 (예: sfApiRedis(["HVALS", "comments"]))
// Upstash는 명령을 JSON 배열로 POST하면 { result: ... } 형태로 돌려줌
async function sfApiRedis(command) {
  const response = await fetch(SF_API_REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${SF_API_REDIS_TOKEN}` },
    body: JSON.stringify(command),
  });
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(`Redis 오류: ${data.error || response.status}`);
  }

  return data.result;
}

// 기본 방명록을 DB에 처음 한 번만 넣는 함수
// "SET ... NX"는 키가 없을 때만 성공하므로, 여러 요청이 동시에 와도 한 번만 실행됨
async function sfApiEnsureSeeded() {
  const isFirstTime = await sfApiRedis(["SET", "comments:seeded", "1", "NX"]);
  if (!isFirstTime) return;

  const fields = [];
  SF_API_SEED_COMMENTS.forEach((comment) => {
    fields.push(comment.id, JSON.stringify(comment));
  });

  await sfApiRedis(["HSET", "comments", ...fields]);
  // 다음 댓글 id가 기본 방명록 뒤 번호부터 시작하도록 카운터를 맞춤
  await sfApiRedis([
    "SET",
    "comments:next_id",
    String(SF_API_SEED_COMMENTS.length),
  ]);
}

// 비밀번호를 그대로 저장하지 않기 위해 SHA-256 해시로 변환
function sfApiHashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

// 화면으로 내려보낼 때는 비밀번호 해시를 빼고 필요한 값만 남김
function sfApiToPublicComment(comment) {
  return {
    id: comment.id,
    author: comment.author,
    content: comment.content,
    created_at: comment.created_at,
  };
}

module.exports = {
  SF_API_SEED_COMMENTS,
  sfApiIsStoreReady,
  sfApiRedis,
  sfApiEnsureSeeded,
  sfApiHashPassword,
  sfApiToPublicComment,
};
