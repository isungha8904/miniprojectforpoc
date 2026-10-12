// ============================================================
// job-postings.js — 채용 공고 슬라이더 컴포넌트 (접두사: sf-jp-)
// data/careers/:id.json 에서 job_postings 배열을 가져와 슬라이더 카드 렌더링
// ============================================================

const SF_JP_API_BASE = './data';
const SF_JP_LOGO_BASE = './assets/icons/';

// 슬라이더 상수·상태
const SF_JP_VISIBLE = 4;   // 한 번에 보이는 카드 수
const SF_JP_GAP = 16;      // var(--space-4) 픽셀값 (카드 사이 gap)
let sfJpCurrentIndex = 0;


// ----------------------------------------------------------
// 1. 유틸 — URL 파라미터에서 현재 직무 ID 읽기
// ----------------------------------------------------------

function sfJpGetCareerId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || 'dev';
}


// ----------------------------------------------------------
// 2. 데이터 패칭 — 정적 JSON 파일에서 채용 공고 목록 가져오기
// ----------------------------------------------------------

async function sfJpFetchPostings(careerId) {
  try {
    const response = await fetch(`${SF_JP_API_BASE}/careers/${careerId}.json`);
    if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
    const careerData = await response.json();
    return careerData.job_postings || [];
  } catch (error) {
    console.error('[sf-jp] 채용 공고 로드 실패:', error);
    return [];
  }
}


// ----------------------------------------------------------
// 3. 렌더링 — 카드 DOM 요소 생성
// ----------------------------------------------------------

function sfJpCreateCard(posting) {
  const card = document.createElement('div');
  card.className = 'job-posting-card-box';

  // logo_url 예: "/frontend/assets/icons/03_securebit.svg" → 파일명만 추출
  const logoFilename = posting.logo_url.split('/').pop();
  const logoSrc = `${SF_JP_LOGO_BASE}${logoFilename}`;

  card.innerHTML = `
    <p class="sf-jp-company-label">${posting.company}</p>

    <div class="sf-jp-card-main">
      <img
        src="${logoSrc}"
        alt="${posting.company} 로고"
        class="sf-jp-company-logo"
      />
      <h4 class="sf-jp-job-title">${posting.actual_title}</h4>
    </div>

    <p class="sf-jp-job-desc">${posting.summary}</p>

    <div class="sf-jp-tag-row">
      <div class="sf-jp-tags-left">
        <span class="sf-jp-tag">${posting.city}</span>
        <span class="sf-jp-tag">${posting.expYears}</span>
      </div>
      <span class="sf-jp-days-ago">${posting.daysAgo}</span>
    </div>
  `;

  // 카드 전체 클릭 → 공고 링크 새 탭 열기
  card.addEventListener('click', () => {
    window.open(posting.link, '_blank', 'noopener,noreferrer');
  });

  return card;
}


// ----------------------------------------------------------
// 4. 슬라이더 — 상태 업데이트 (카드 이동 + 버튼 + 도트 동기화)
// ----------------------------------------------------------

function sfJpUpdateSlider(total) {
  const cardList = document.getElementById('sf-jp-card-list');
  const prevBtn  = document.getElementById('sf-jp-arrow-prev');
  const nextBtn  = document.getElementById('sf-jp-arrow-next');
  const pagination = document.getElementById('sf-jp-pagination');
  const maxIndex = total - SF_JP_VISIBLE;

  // 첫 번째 카드 너비 기준으로 이동 거리 계산 후 translateX 적용
  const card = cardList.querySelector('.job-posting-card-box');
  if (card) {
    const step = card.offsetWidth + SF_JP_GAP;
    cardList.style.transform = `translateX(-${sfJpCurrentIndex * step}px)`;
  }

  // 양 끝에서 버튼 비활성화
  prevBtn.disabled = sfJpCurrentIndex <= 0;
  nextBtn.disabled = sfJpCurrentIndex >= maxIndex;

  // 도트 활성 상태 동기화
  pagination.querySelectorAll('.sf-jp-dot').forEach((dot, i) => {
    dot.classList.toggle('sf-jp-dot--active', i === sfJpCurrentIndex);
  });
}


// ----------------------------------------------------------
// 5. 슬라이더 — 초기화 (너비 고정 + 도트 생성 + 이벤트 바인딩)
// ----------------------------------------------------------

function sfJpInitSlider(total) {
  const cardList   = document.getElementById('sf-jp-card-list');
  const prevBtn    = document.getElementById('sf-jp-arrow-prev');
  const nextBtn    = document.getElementById('sf-jp-arrow-next');
  const pagination = document.getElementById('sf-jp-pagination');
  const wrapper    = document.querySelector('.sf-jp-slider-wrapper');
  const maxIndex   = total - SF_JP_VISIBLE;

  // wrapper 너비 기준으로 카드 4등분 너비 고정
  const wrapperWidth = wrapper.offsetWidth;
  const cardWidth = Math.floor((wrapperWidth - (SF_JP_VISIBLE - 1) * SF_JP_GAP) / SF_JP_VISIBLE);
  cardList.querySelectorAll('.job-posting-card-box').forEach(card => {
    card.style.flex  = 'none';
    card.style.width = `${cardWidth}px`;
  });

  // 도트 생성 — 슬라이딩 가능 포지션 수(= maxIndex + 1)만큼
  pagination.innerHTML = '';
  for (let i = 0; i <= maxIndex; i++) {
    const dot = document.createElement('button');
    dot.className = `sf-jp-dot${i === 0 ? ' sf-jp-dot--active' : ''}`;
    dot.setAttribute('aria-label', `${i + 1}번 슬라이드로 이동`);
    dot.addEventListener('click', () => {
      sfJpCurrentIndex = i;
      sfJpUpdateSlider(total);
    });
    pagination.appendChild(dot);
  }

  // onclick으로 등록해 재초기화 시 중복 핸들러 방지
  prevBtn.onclick = () => {
    if (sfJpCurrentIndex > 0) {
      sfJpCurrentIndex--;
      sfJpUpdateSlider(total);
    }
  };
  nextBtn.onclick = () => {
    if (sfJpCurrentIndex < maxIndex) {
      sfJpCurrentIndex++;
      sfJpUpdateSlider(total);
    }
  };

  // 초기 상태 적용
  sfJpUpdateSlider(total);
}


// ----------------------------------------------------------
// 6. 렌더링 진입점 — 카드 전체 렌더링 후 슬라이더 바인딩
// ----------------------------------------------------------

function sfJpRenderCards(postings) {
  const cardList = document.getElementById('sf-jp-card-list');
  if (!cardList) {
    console.error('[sf-jp] id="sf-jp-card-list" 요소를 찾을 수 없습니다. HTML을 확인하세요.');
    return;
  }

  sfJpCurrentIndex = 0;
  cardList.style.transform = 'translateX(0)';
  cardList.innerHTML = '';

  if (postings.length === 0) {
    cardList.innerHTML = '<p class="sf-jp-empty-msg">등록된 채용 공고가 없습니다.</p>';
    return;
  }

  // 전체 공고 카드 렌더링 (슬라이더로 탐색하므로 slice 없음)
  postings.forEach(posting => cardList.appendChild(sfJpCreateCard(posting)));

  if (postings.length > SF_JP_VISIBLE) {
    sfJpInitSlider(postings.length);
  } else {
    // 카드가 4개 이하면 화살표 숨김, 도트 생략
    const prevBtn = document.getElementById('sf-jp-arrow-prev');
    const nextBtn = document.getElementById('sf-jp-arrow-next');
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
  }
}


// ----------------------------------------------------------
// 7. 초기화 — 페이지 로드 시 자동 실행
// ----------------------------------------------------------

async function sfJpInit() {
  const careerId = sfJpGetCareerId();
  const postings = await sfJpFetchPostings(careerId);
  sfJpRenderCards(postings);
}

document.addEventListener('DOMContentLoaded', sfJpInit);