// ============================================================
// /api/comments — 방명록 목록 조회(GET) · 등록(POST)
// ============================================================

const {
  SF_API_SEED_COMMENTS,
  sfApiIsStoreReady,
  sfApiRedis,
  sfApiEnsureSeeded,
  sfApiHashPassword,
  sfApiToPublicComment,
} = require("./_store");

// 입력값 최대 길이 (너무 긴 글이 저장되는 것을 막음)
const SF_API_MAX_AUTHOR = 20;
const SF_API_MAX_PASSWORD = 50;
const SF_API_MAX_CONTENT = 200;

module.exports = async function sfApiCommentsHandler(req, res) {
  try {
    if (req.method === "GET") {
      return await sfApiListComments(res);
    }
    if (req.method === "POST") {
      return await sfApiCreateComment(req, res);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ message: "허용되지 않는 요청입니다." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 방명록 목록 조회 — 비밀번호는 빼고 내려보냄
async function sfApiListComments(res) {
  // DB가 아직 연결되지 않았다면 기본 방명록만 보여줌 (첫 화면이 비어 보이지 않도록)
  if (!sfApiIsStoreReady()) {
    return res.status(200).json(SF_API_SEED_COMMENTS);
  }

  await sfApiEnsureSeeded();

  // comments 해시에 저장된 모든 댓글(JSON 문자열)을 꺼내 객체로 변환
  const rawComments = await sfApiRedis(["HVALS", "comments"]);
  const comments = rawComments
    .map((raw) => JSON.parse(raw))
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map(sfApiToPublicComment);

  return res.status(200).json(comments);
}

// 방명록 등록 — id와 작성일은 서버에서 정함
async function sfApiCreateComment(req, res) {
  if (!sfApiIsStoreReady()) {
    return res
      .status(503)
      .json({ message: "저장소가 아직 연결되지 않았습니다." });
  }

  const body = req.body || {};
  const author = String(body.author || "").trim();
  const password = String(body.password || "").trim();
  const content = String(body.content || "").trim();

  if (author === "" || password === "" || content === "") {
    return res
      .status(400)
      .json({ message: "이름, 비밀번호, 내용을 모두 입력해주세요." });
  }

  if (
    author.length > SF_API_MAX_AUTHOR ||
    password.length > SF_API_MAX_PASSWORD ||
    content.length > SF_API_MAX_CONTENT
  ) {
    return res.status(400).json({ message: "입력한 내용이 너무 깁니다." });
  }

  await sfApiEnsureSeeded();

  // INCR은 숫자를 1 올리고 그 값을 돌려주므로, 동시에 등록해도 id가 겹치지 않음
  const nextId = await sfApiRedis(["INCR", "comments:next_id"]);
  const newComment = {
    id: String(nextId),
    author,
    content,
    created_at: new Date().toISOString().slice(0, 10), // YYYY-MM-DD 형식의 오늘 날짜
    password_hash: sfApiHashPassword(password),
  };

  await sfApiRedis([
    "HSET",
    "comments",
    newComment.id,
    JSON.stringify(newComment),
  ]);

  return res.status(201).json(sfApiToPublicComment(newComment));
}
