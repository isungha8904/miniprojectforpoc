// ============================================================
// /api/comments/:id — 방명록 삭제(DELETE)
// 파일명의 [id]는 주소의 마지막 값(예: /api/comments/5 → "5")을 req.query.id로 받겠다는 뜻
// ============================================================

const {
  sfApiIsStoreReady,
  sfApiRedis,
  sfApiHashPassword,
} = require("../_store");

module.exports = async function sfApiCommentItemHandler(req, res) {
  try {
    if (req.method !== "DELETE") {
      res.setHeader("Allow", "DELETE");
      return res.status(405).json({ message: "허용되지 않는 요청입니다." });
    }

    if (!sfApiIsStoreReady()) {
      return res
        .status(503)
        .json({ message: "저장소가 아직 연결되지 않았습니다." });
    }

    const id = String(req.query.id);
    const password = String((req.body || {}).password || "");

    const rawComment = await sfApiRedis(["HGET", "comments", id]);
    if (!rawComment) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    // 비밀번호 대조는 화면이 아니라 서버에서 함 (화면에는 비밀번호를 내려보내지 않음)
    const comment = JSON.parse(rawComment);
    if (
      !comment.password_hash ||
      comment.password_hash !== sfApiHashPassword(password)
    ) {
      return res.status(403).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    await sfApiRedis(["HDEL", "comments", id]);
    return res.status(200).json({ id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};
