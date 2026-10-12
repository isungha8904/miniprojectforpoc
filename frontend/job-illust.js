// 직무 카드·직무 상세처럼 바뀌지 않는 데이터는 frontend/data 폴더의 JSON 파일에서 바로 읽어옴
const sfJiApiBaseUrl = "./data";

// 직무 id별 마스코트 이미지 파일명 매핑
// (assets/images 폴더 안의 파일명에 직무가 그대로 들어있어 id 기준으로 연결)
const sfJiMascotImageMap = {
  admin: "floAdminBusiness Analyst.webp",
  dev: "Code dev.webp",
  consultant: "astros Consultant.webp",
  pu: "Einstein power user.webp",
};

document.addEventListener("DOMContentLoaded", () => {
  sfJiInitJobIllust();
});

// 마스코트 일러스트 초기화 — URL 쿼리스트링에서 직무 id를 읽어 직무명(alt 텍스트)과 이미지를 매칭
async function sfJiInitJobIllust() {
  const illustArea = document.querySelector(".detail-header-illust-area");

  // detail-header-illust-area가 없는 페이지라면(다른 페이지에 이 스크립트가 잘못 로드된 경우) 그냥 종료
  if (!illustArea) {
    return;
  }

  const careerId = sfJiGetCareerIdFromUrl();
  const imageFileName =
    sfJiMascotImageMap[careerId] || sfJiMascotImageMap.admin;

  try {
    // 이미지의 대체 텍스트(alt)에 사용할 직무 타이틀을 서버에서 조회
    const response = await fetch(`${sfJiApiBaseUrl}/careers/${careerId}.json`);

    if (!response.ok) {
      throw new Error("직무 데이터를 찾을 수 없습니다.");
    }

    const career = await response.json();
    sfJiRenderMascotImage(illustArea, imageFileName, career.title);
  } catch (error) {
    console.error(error);
    // alt 텍스트 조회에 실패해도 이미지 자체는 보여줄 수 있도록 기본 문구로 렌더링
    sfJiRenderMascotImage(
      illustArea,
      imageFileName,
      "세일즈포스 직무 마스코트",
    );
  }
}

// 현재 페이지 URL의 쿼리스트링에서 직무 id를 추출 (예: detail.html?id=dev → "dev")
function sfJiGetCareerIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  // id 파라미터가 없으면 기본값으로 "admin" 직무를 보여줌
  return urlParams.get("id") || "admin";
}

// 원형 배경 안에 직무별 마스코트 이미지를 렌더링
function sfJiRenderMascotImage(illustArea, imageFileName, altText) {
  // 파일명에 공백이 포함되어 있어 URL로 사용 가능하도록 인코딩
  const imageUrl = encodeURI(`./assets/images/${imageFileName}`);

  illustArea.innerHTML = `
    <div class="sf-ji-illust-wrapper">
      <img class="sf-ji-mascot-img" src="${imageUrl}" alt="${altText} 마스코트 일러스트" />
    </div>
  `;
}
