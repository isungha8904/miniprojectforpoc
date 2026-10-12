// ===== 핵심 역량 스텟 카드 – 데이터 연동 및 인터랙션 로직 =====
// 접두사 규칙: 함수명/변수명 앞에 'cc' (core-competencies) 접두사 사용

// 직무 카드·직무 상세처럼 바뀌지 않는 데이터는 frontend/data 폴더의 JSON 파일에서 바로 읽어옴
const CC_API_BASE = "./data";

// 체크리스트 전체 항목 수. 직무 데이터를 받아오기 전까지의 기본값이며,
// 실제 값은 ccRenderChecklist()에서 받아온 skills 배열 길이로 갱신됨
let CC_TOTAL = 6;

// SVG 원형 차트 둘레 = 2π × 반지름(38) ≈ 238.76
const CC_CIRC = 2 * Math.PI * 38;

/**
 * 현재 보고 있는 직무(id)를 URL 쿼리스트링에서 읽어오는 함수
 * - 예: detail.html?job=dev 로 접속하면 "dev"를 반환
 * - 값이 없으면 기본값으로 "admin"을 사용
 * - 직무 선택 메뉴(사이드바)가 이 쿼리스트링을 바꿔주면,
 *   페이지가 새로 열릴 때마다 이 함수가 바뀐 직무를 읽어서 아래 fetch에 사용됨
 */
function ccGetSelectedJobId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "admin";
}

/**
 * careers 데이터 중 현재 직무(jobId)에 해당하는 JSON 파일을 받아오는 함수
 * - 직무마다 data/careers 폴더에 "직무id.json" 파일이 하나씩 있음
 *   (예: GET ./data/careers/dev.json)
 * - 직무가 바뀔 때마다 이 함수를 새 jobId로 다시 호출해서 skills(핵심 역량 목록)만 꺼내 씀
 */
async function ccFetchCareerSkills(jobId) {
  const response = await fetch(`${CC_API_BASE}/careers/${jobId}.json`);

  // 응답이 실패(존재하지 않는 직무 id, 서버 다운 등)하면 에러를 던져서 호출부에서 처리하게 함
  if (!response.ok) {
    throw new Error(`careers/${jobId} 조회 실패 (status: ${response.status})`);
  }

  const career = await response.json();
  return career.skills; // 6개의 역량 설명 문자열이 담긴 배열
}

/**
 * 전달받은 역량(skills) 배열로 체크리스트 항목(.stat-item)들을 화면에 새로 그리는 함수
 * - 직무가 바뀔 때 이전 직무의 항목을 지우고, 새 직무의 항목으로 교체하기 위해 매번 새로 렌더링함
 * - 각 항목은 클릭하면 체크 상태가 토글되도록 이벤트 리스너를 함께 붙임
 */
function ccRenderChecklist(skills) {
  const listEl = document.getElementById("cc-stat-list");

  // 이전 직무의 체크리스트 항목을 모두 비움
  listEl.innerHTML = "";

  skills.forEach((skillText) => {
    const itemEl = document.createElement("div");
    itemEl.className = "stat-item";
    itemEl.innerHTML = `
			<span class="check-box"></span>
			<span class="item-text">${skillText}</span>
		`;

    // 항목 클릭 시 체크 토글 + 결과 갱신
    itemEl.addEventListener("click", () => ccToggleItem(itemEl));

    listEl.appendChild(itemEl);
  });

  // 직무마다 역량 개수가 다를 수 있으므로, 받아온 배열 길이로 전체 개수를 갱신
  CC_TOTAL = skills.length;
}

/**
 * 체크 항목 토글 함수
 * - stat-item 클릭 시 'is-checked' 클래스를 껐다 켜서 선택 상태를 변경
 * - 변경 후 ccUpdate()를 호출해 차트와 결과 텍스트를 즉시 갱신
 */
function ccToggleItem(el) {
  // 클릭한 항목의 'is-checked' 클래스를 추가/제거
  el.classList.toggle("is-checked");

  // 변경된 선택 상태를 반영하여 UI 전체 업데이트
  ccUpdate();
}

/**
 * 차트 및 결과 텍스트 업데이트 함수
 * - 현재 선택된 항목 수를 세어 퍼센트 계산 후 원형 차트와 문구를 갱신
 */
function ccUpdate() {
  // 현재 'is-checked' 상태인 항목의 수를 카운트
  const checked = document.querySelectorAll(".stat-item.is-checked").length;

  // 5개 이상 선택 시 만점(꽉 찬 원)으로 처리
  const isFull = checked >= 5;
  const displayChecked = isFull ? CC_TOTAL : checked;
  const pct = CC_TOTAL > 0 ? Math.round((displayChecked / CC_TOTAL) * 100) : 0;

  // 퍼센트 텍스트 업데이트
  document.getElementById("cc-ring-pct").textContent = pct + "%";

  // "N개 중 M개를 선택했어요!" 문구 업데이트
  document.getElementById("cc-result-selected").textContent =
    CC_TOTAL + "개 중 " + checked + "개를 선택했어요!";

  // 원형 차트 진행도 업데이트
  // strokeDashoffset이 0이면 꽉 찬 원, CC_CIRC이면 비어있는 원
  document.getElementById("cc-ring-progress").style.strokeDashoffset =
    CC_TOTAL > 0 ? CC_CIRC * (1 - displayChecked / CC_TOTAL) : CC_CIRC;

  // 선택 개수에 따른 적합도 문구 업데이트
  const descEl = document.getElementById("cc-result-desc");
  if (checked >= 5)
    descEl.textContent = "직무에 매우 높은 수준으로 적합해요. (만점)";
  else if (checked >= 4) descEl.textContent = "직무에 높은 수준으로 적합해요.";
  else if (checked >= 2)
    descEl.textContent = "직무에 좋은 중간 수준으로 적합해요.";
  else if (checked >= 1)
    descEl.textContent = "직무에 아직 낮은 수준으로 적합해요.";
  else descEl.textContent = "직무에 적합하지 않을 수 있어요.";
}

/**
 * 컴포넌트 초기화 함수
 * 1) URL에서 현재 선택된 직무 id를 확인
 * 2) 그 직무의 역량(skills) 데이터를 JSON 파일에서 fetch
 * 3) 받아온 데이터로 체크리스트를 그리고, 결과 섹션(차트/문구)도 초기 상태로 갱신
 * - 직무 선택이 바뀌면(= 사이드바에서 다른 직무를 눌러 job 쿼리스트링이 바뀐 채로 페이지가 열리면)
 *   이 초기화 함수가 다시 실행되면서 새 직무의 데이터로 전체가 갱신됨
 */
async function ccInit() {
  const jobId = ccGetSelectedJobId();

  try {
    const skills = await ccFetchCareerSkills(jobId);
    ccRenderChecklist(skills);
    ccUpdate(); // 전부 미선택 상태 기준으로 차트/문구 초기화
  } catch (error) {
    // 파일을 받아오지 못했거나, 존재하지 않는 직무 id로 접근한 경우를 대비한 안내 문구
    console.error(
      "[core-competencies] 역량 데이터를 불러오지 못했습니다:",
      error,
    );
    document.getElementById("cc-stat-list").innerHTML =
      '<div class="stat-item"><span class="item-text">역량 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</span></div>';
  }
}

// 페이지 로드 시 초기화 실행 (직무 데이터 fetch → 체크리스트 렌더링 → 결과 갱신)
ccInit();
