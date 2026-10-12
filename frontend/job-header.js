// 직무 카드·직무 상세처럼 바뀌지 않는 데이터는 frontend/data 폴더의 JSON 파일에서 바로 읽어옴
const sfJhApiBaseUrl = "./data";

document.addEventListener("DOMContentLoaded", () => {
  sfJhInitJobHeader();
});

// 직무 헤더 초기화 — URL 쿼리스트링에서 직무 id를 읽어 태그/타이틀/역량 데이터를 불러옴
async function sfJhInitJobHeader() {
  const headerTextArea = document.querySelector(".detail-header-text-area");

  // detail-header-text-area가 없는 페이지라면(다른 페이지에 이 스크립트가 잘못 로드된 경우) 그냥 종료
  if (!headerTextArea) {
    return;
  }

  // 데이터를 받아오는 동안 사용자에게 로딩 중임을 보여줌
  headerTextArea.innerHTML = `<p class="sf-jh-check-text">직무 정보를 불러오는 중입니다...</p>`;

  const careerId = sfJhGetCareerIdFromUrl();

  try {
    // 태그는 cards 데이터, 타이틀/핵심 역량은 careers 데이터에 나뉘어 있어 두 번 요청
    const [cardResponse, careerResponse] = await Promise.all([
      fetch(`${sfJhApiBaseUrl}/cards.json`),
      fetch(`${sfJhApiBaseUrl}/careers/${careerId}.json`),
    ]);

    if (!cardResponse.ok || !careerResponse.ok) {
      throw new Error("직무 데이터를 찾을 수 없습니다.");
    }

    // cards.json은 전체 직무 카드 배열이므로 현재 직무 id와 같은 카드 하나를 찾음
    const cards = await cardResponse.json();
    const card = cards.find((item) => item.id === careerId) || {};
    const career = await careerResponse.json();

    sfJhRenderJobHeader(headerTextArea, card, career);
  } catch (error) {
    console.error(error);
    headerTextArea.innerHTML = `<p class="sf-jh-check-text">직무 정보를 불러오지 못했습니다.<br />잠시 후 다시 시도해주세요.</p>`;
  }
}

// 현재 페이지 URL의 쿼리스트링에서 직무 id를 추출 (예: detail.html?id=dev → "dev")
function sfJhGetCareerIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  // id 파라미터가 없으면 기본값으로 "admin" 직무를 보여줌
  return urlParams.get("id") || "admin";
}

// 전달받은 card(태그), career(타이틀/핵심 역량) 데이터로 직무 헤더 텍스트 영역을 렌더링
function sfJhRenderJobHeader(headerTextArea, card, career) {
  const tags = card.tags || [];
  const skills = career.skills || [];

  // 태그 배열을 순회하며 배지 HTML 문자열을 하나씩 만들어 이어붙임
  const tagRowHtml = tags
    .map((tag) => `<span class="sf-jh-tag-badge">${tag}</span>`)
    .join("");

  // 핵심 역량 중 상위 3개만 골라 체크리스트 항목으로 만들어 이어붙임
  const checklistHtml = skills
    .slice(0, 3)
    .map(
      (skill) => `
        <li class="sf-jh-checklist-item">
          <span class="sf-jh-check-icon">✓</span>
          <span class="sf-jh-check-text">${skill}</span>
        </li>
      `,
    )
    .join("");

  headerTextArea.innerHTML = `
    <div class="sf-jh-tag-row">${tagRowHtml}</div>
    <h2 class="sf-jh-title">직무: ${sfJhRemoveEnglishParenthesis(career.title)}</h2>
    <ul class="sf-jh-checklist">${checklistHtml}</ul>
  `;
}

// 타이틀 끝에 붙은 영문 괄호 표기를 제거 (예: "세일즈포스 개발자 (Salesforce Developer)" → "세일즈포스 개발자")
function sfJhRemoveEnglishParenthesis(title) {
  return title.replace(/\s*\([^)]*\)\s*$/, "");
}
