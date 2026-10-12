// 구독자 등록 API 주소 — 로컬에서는 json-server, 배포 환경에서는 Vercel Function(/api)을 사용
const fcIsLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API = fcIsLocalhost
  ? "http://localhost:3000"
  : "/api";

// 직무 상세 데이터는 frontend/data 폴더의 JSON 파일에서 바로 읽어옴
const SF_FORM_DATA_BASE = "./data";

// 이메일 발송을 담당하는 Google Apps Script 배포 URL
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzUvmH8kDtkfKg1K5ERkchIsQ5tz6on2DMpdngSlHMWyQ7yOIM5ieuDqWmei3zPg5QIKA/exec";

function sfFormRender() {
  const formContainer = document.querySelector(".form-container-box");
  if (!formContainer) return;

  formContainer.innerHTML = `
  <h3 class="sf-form-title">직무 요약 메일 신청</h3>
  <p class="sf-form-desc">관심 있는 직무의 요약 정보를 이메일로 받아보세요</p>

  <form class="sf-form-box" id="sf-form">
    <input type="text" id="sf-name-input" class="sf-form-input" placeholder="이름" />
    <input type="email" id="sf-email-input" class="sf-form-input" placeholder="이메일" />

    <select id="sf-job-select" class="sf-form-select">
      <option value="" disabled selected hidden>관심 직무 선택</option>
      <option value="admin">Admin</option>
      <option value="dev">Developer</option>
      <option value="consultant">Consultant</option>
      <option value="pu">Power User</option>
    </select>

    <button type="submit" id="sf-submit-btn" class="sf-form-submit-btn">정보 받기</button>
  </form>
  `;

  // innerHTML 세팅 직후 즉시 submit 리스너 연결 — 타이밍 문제 원천 차단
  document
    .getElementById("sf-form")
    .addEventListener("submit", sfFormHandleSubmit);
}

document.addEventListener("DOMContentLoaded", sfFormRender);

function sfFormHandleSubmit(event) {
  event.preventDefault(); // 폼 제출 시 페이지 새로고침 방지

  const nameInput = document.getElementById("sf-name-input");
  const emailInput = document.getElementById("sf-email-input");
  const jobSelect = document.getElementById("sf-job-select");

  // 이름이 입력되었는지 확인
  if (nameInput.value.trim() === "") {
    alert("이름을 입력해주세요.");
    return;
  }

  // 이름에 영어, 한글 이외의 문자(숫자, 특수기호, 공백 등)가 있는지 확인
  const namePattern = /^[a-zA-Z가-힣]+$/;
  if (!namePattern.test(nameInput.value.trim())) {
    alert("이름은 영어와 한글만 입력할 수 있습니다.");
    return;
  }

  // 이메일이 입력되었는지 확인
  if (emailInput.value.trim() === "") {
    alert("이메일을 입력해주세요.");
    return;
  }

  // 이메일에 영어, 숫자, @, . 이외의 문자가 있는지 확인
  const emailPattern = /^[a-zA-Z0-9]+@[a-zA-Z0-9.]+$/;
  if (!emailPattern.test(emailInput.value.trim())) {
    alert("이메일은 영어, 숫자와 @, . 기호만 사용할 수 있습니다.");
    return;
  }

  // 관심 직무가 선택되었는지 확인 (placeholder 값은 빈 문자열)
  if (jobSelect.value === "") {
    alert("관심 직무를 선택해주세요.");
    return;
  }

  // 검증을 통과하면 서버 전송용 데이터로 정리해서 넘김
  const formData = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    interested_career: jobSelect.value,
  };

  sfFormSubmitData(formData);
}

async function sfFormSubmitData(data) {
  const apiUrl = `${API}/subscribers`;

  try {
    // 1. id는 서버가 정하므로 보내지 않음
    //    (다른 신청자의 이메일이 노출되지 않도록 구독자 목록은 조회하지 않음)
    const newSubscriber = { ...data };

    alert("신청이 완료되었습니다! 이메일 발송 예정입니다.");

    // 4. 관심 직무의 상세 정보(설명, 역량, 자격증, 채용 공고)를 조회
    const careerResponse = await fetch(
      `${SF_FORM_DATA_BASE}/careers/${data.interested_career}.json`,
    );
    const career = await careerResponse.json();

    // 5. 이름/이메일 + career 상세 정보를 합쳐서 Apps Script로 전송 (메일 발송 트리거)
    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // CORS preflight 회피용
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        career_title: career.title,
        career_description: career.description,
        career_skills: career.skills,
        career_certifications: career.certifications,
        career_job_postings: career.job_postings,
      }),
      mode: "no-cors", // 응답은 못 읽지만 요청은 정상 실행됨
    });

    // 3. 새 구독자 데이터를 서버에 등록
    const postResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSubscriber),
    });

    if (!postResponse.ok) {
      throw new Error("서버 등록에 실패했습니다.");
    }
  } catch (error) {
    console.error(error);
    alert("신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
}
