// 직무 카드·직무 상세처럼 바뀌지 않는 데이터는 frontend/data 폴더의 JSON 파일에서 바로 읽어옴
const JOB_API = "./data";

// 직무 id별 캐릭터 이미지 경로
const sfJcImageMap = {
  admin: "assets/images/floAdminBusiness Analyst.webp",
  dev: "assets/images/Code dev.webp",
  consultant: "assets/images/astros Consultant.webp",
  pu: "assets/images/Einstein power user.webp",
};

document.addEventListener("DOMContentLoaded", () => {
  sfJcRenderCards();
});

// data/cards.json의 cards 데이터를 가져와 각 직무 카드(.job-card-box)에 채워 넣는 함수
async function sfJcRenderCards() {
  try {
    const response = await fetch(`${JOB_API}/cards.json`);
    const cards = await response.json();

    // id(admin/dev/consultant/pu)가 같은 HTML 박스를 찾아 내용을 채움
    cards.forEach((card) => {
      const cardBox = document.getElementById(card.id);
      if (!cardBox) return;

      // 태그 배열을 "#태그" 형태의 span 목록으로 변환
      const tagsHtml = card.tags
        .map((tag) => `<span class="sf-jc-tag">#${tag}</span>`)
        .join("");

      cardBox.innerHTML = `
        <img class="sf-jc-image" src="${sfJcImageMap[card.id]}" alt="${card.title} 캐릭터 이미지" />
        <h3 class="sf-jc-title">${card.title}</h3>
        <p class="sf-jc-oneliner">${card.oneliner}</p>
        <div class="sf-jc-tags">${tagsHtml}</div>
        <a class="sf-jc-detail-btn" href="detail.html?id=${card.id}">상세 페이지 보기 →</a>
      `;
    });
  } catch (error) {
    console.error(error);
    alert(
      "직무 카드 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    );
  }
}
