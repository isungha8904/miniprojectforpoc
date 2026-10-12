// ============================================================
// /api/subscribers — 직무 요약 메일 신청자 등록(POST)
// 이메일이 외부에 노출되지 않도록 목록 조회(GET)는 만들지 않음
// (신청자 목록은 Upstash 콘솔에서 subscribers 키로 확인)
// ============================================================

const { sfApiIsStoreReady, sfApiRedis } = require("./_store");

const SF_API_CAREER_IDS = ["admin", "dev", "consultant", "pu"];

module.exports = async function sfApiSubscribersHandler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ message: "허용되지 않는 요청입니다." });
    }

    if (!sfApiIsStoreReady()) {
      return res
        .status(503)
        .json({ message: "저장소가 아직 연결되지 않았습니다." });
    }

    const body = req.body || {};
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const interestedCareer = String(body.interested_career || "");

    // 화면(form-container-box.js)과 같은 규칙으로 한 번 더 검증
    const isValid =
      /^[a-zA-Z가-힣]{1,30}$/.test(name) &&
      /^[a-zA-Z0-9]+@[a-zA-Z0-9.]+$/.test(email) &&
      email.length <= 100 &&
      SF_API_CAREER_IDS.includes(interestedCareer);

    if (!isValid) {
      return res.status(400).json({ message: "입력값을 다시 확인해주세요." });
    }

    const nextId = await sfApiRedis(["INCR", "subscribers:next_id"]);
    const newSubscriber = {
      id: String(nextId),
      name,
      email,
      interested_career: interestedCareer,
    };

    await sfApiRedis([
      "HSET",
      "subscribers",
      newSubscriber.id,
      JSON.stringify(newSubscriber),
    ]);

    return res.status(201).json({ id: newSubscriber.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};
