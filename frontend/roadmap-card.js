// 직무 카드·직무 상세처럼 바뀌지 않는 데이터는 frontend/data 폴더의 JSON 파일에서 바로 읽어옴
const sfRmApiBaseUrl = "./data";

document.addEventListener("DOMContentLoaded", () => {
  sfRmInitRoadmapCard();
});

// 로드맵 카드 초기화 — URL 쿼리스트링에서 직무 id를 읽어 해당 직무의 자격증 데이터를 불러옴
async function sfRmInitRoadmapCard() {
  const roadmapBox = document.querySelector(".roadmap-card-box");

  // roadmap-card-box가 없는 페이지라면(다른 페이지에 이 스크립트가 잘못 로드된 경우) 그냥 종료
  if (!roadmapBox) {
    return;
  }

  // 데이터를 받아오는 동안 사용자에게 로딩 중임을 보여줌
  roadmapBox.innerHTML = `<p class="sf-rm-status-text">자격증 로드맵을 불러오는 중입니다...</p>`;

  const careerId = sfRmGetCareerIdFromUrl();

  try {
    // URL의 ?id=dev 같은 파라미터로 해당 직무의 상세 데이터를 요청
    const response = await fetch(`${sfRmApiBaseUrl}/careers/${careerId}.json`);

    if (!response.ok) {
      throw new Error("직무 데이터를 찾을 수 없습니다.");
    }

    const career = await response.json();
    sfRmRenderRoadmap(roadmapBox, career);
  } catch (error) {
    console.error(error);
    roadmapBox.innerHTML = `<p class="sf-rm-status-text">로드맵 정보를 불러오지 못했습니다.<br />잠시 후 다시 시도해주세요.</p>`;
  }
}

// 현재 페이지 URL의 쿼리스트링에서 직무 id를 추출 (예: detail.html?id=dev → "dev")
function sfRmGetCareerIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  // id 파라미터가 없으면 기본값으로 "admin" 직무를 보여줌
  return urlParams.get("id") || "admin";
}

// 전달받은 직무(career) 데이터의 certifications 배열을 순번 배지가 있는 세로 로드맵으로 렌더링
function sfRmRenderRoadmap(roadmapBox, career) {
  const certifications = career.certifications || [];

  // 자격증 배열을 순회하며 스텝 아이템 HTML 문자열을 하나씩 만들어 이어붙임
  const stepListHtml = certifications
    .map((certName, index) => {
      const stepNumber = index + 1;
      return `
        <li class="sf-rm-step-item">
          <span class="sf-rm-step-badge sf-rm-step-${stepNumber}">${stepNumber}</span>
          <span class="sf-rm-step-title sf-rm-step-${stepNumber}">${certName}</span>
        </li>
      `;
    })
    .join("");

  roadmapBox.innerHTML = `
    <h3 class="sf-rm-title-text">추천 자격증 리스트</h3>
    <p class="sf-rm-subtitle-text">연관된 자격증을 취득하여 커리어를 성장시키세요.</p>
    <ul class="sf-rm-step-list">
      ${stepListHtml}
    </ul>
    <a
      href="https://trailhead.salesforce.com/ko"
      target="_blank"
      rel="noopener noreferrer"
      class="sf-rm-trailhead-banner"
      aria-label="Salesforce Trailhead 바로가기"
    >
      <img src="./assets/images/trailhead.jpg" alt="Salesforce Trailhead" />
    </a>
  `;
}
