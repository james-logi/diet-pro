const STORAGE_KEY = "fitpath-demo-v1";

const products = [
  { id: "meal-green", type: "식단", kind: "meal", art: "🥗", badge: "ADAPTATION", name: "그린볼 5일 식단 박스", desc: "채소와 곡물의 균형을 가볍게 시작해요.", price: 39800, note: "냉장 배송 · 5식" },
  { id: "meal-protein", type: "식단", kind: "meal two", art: "🍱", badge: "PROGRESS", name: "프로틴 키친 7일 식단", desc: "바쁜 날에도 든든한 한 끼를 준비했어요.", price: 52000, note: "냉장 배송 · 7식" },
  { id: "supp-daily", type: "건강기능식품", kind: "supp", art: "✦", badge: "OPTIONAL", name: "데일리 밸런스 멀티", desc: "기본 영양을 챙기고 싶은 날의 선택.", price: 29000, note: "30일분 · 선택 사항" },
  { id: "supp-omega", type: "건강기능식품", kind: "supp two", art: "◒", badge: "OPTIONAL", name: "오메가 밸런스", desc: "식단과 생활에 맞춰 검토하는 작은 루틴.", price: 23500, note: "30일분 · 라벨 확인" }
];

const defaultState = {
  profile: { name: "지우", age: "30", gender: "female", height: 168, weight: 72 },
  goal: { months: 6, target: 64 },
  cart: [],
  snapshots: [],
  orders: [],
  checkins: []
};

let state = loadState();
let updateTimer;
let toastTimer;
let accountMode = "signup";
let accountUser = null;

const $ = (id) => document.getElementById(id);
const money = (amount) => `₩${Number(amount).toLocaleString("ko-KR")}`;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved ? { ...defaultState, ...saved, profile: { ...defaultState.profile, ...saved.profile }, goal: { ...defaultState.goal, ...saved.goal } } : structuredClone(defaultState);
  } catch { return structuredClone(defaultState); }
}

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function getInputs() {
  const gender = document.querySelector('input[name="gender"]:checked')?.value || "none";
  return {
    profile: {
      name: ($("nameInput").value || "친구").trim().slice(0, 20),
      age: $("ageInput").value,
      gender,
      height: Number($("heightInput").value),
      weight: Number($("weightInput").value)
    },
    goal: { months: Number($("monthsInput").value), target: Number($("goalInput").value) }
  };
}

function hydrateInputs() {
  $("nameInput").value = state.profile.name;
  $("ageInput").value = state.profile.age;
  $("heightInput").value = state.profile.height;
  $("weightInput").value = state.profile.weight;
  $("monthsInput").value = state.goal.months;
  $("goalInput").value = state.goal.target;
  const radio = document.querySelector(`input[name="gender"][value="${state.profile.gender}"]`);
  if (radio) radio.checked = true;
}

function calculate(input) {
  const height = Number(input.profile.height);
  const weight = Number(input.profile.weight);
  const target = Number(input.goal.target);
  const months = Number(input.goal.months);
  const valid = Number.isFinite(height) && height >= 130 && height <= 220 && Number.isFinite(weight) && weight >= 35 && weight <= 250 && Number.isFinite(target) && target >= 35 && target <= 250;
  const heightM = height / 100;
  const currentBmi = valid ? weight / (heightM * heightM) : 0;
  const targetBmi = valid ? target / (heightM * heightM) : 0;
  const weeks = Math.max(1, months * 4.345);
  const delta = weight - target;
  const pace = delta / weeks;
  const checkins = Math.max(4, Math.round(weeks));
  let safety = "safe";
  let safetyTitle = "무리 없는 목표 속도예요.";
  let safetyText = `주당 평균 ${Math.abs(pace || 0).toFixed(2)}kg 변화를 기준으로 안내할게요.`;
  if (!valid) { safety = "danger"; safetyTitle = "입력값을 한 번 확인해 주세요."; safetyText = "키와 체중은 안내된 범위 안에서 입력해 주세요."; }
  else if (target > weight) { safety = "warn"; safetyTitle = "감량보다 다른 목표가 필요해요."; safetyText = "현재 플랜은 감량 중심이라 목표를 유지하거나 상담을 권해요."; }
  else if (target === weight) { safety = "safe"; safetyTitle = "유지 플랜으로 시작할 수 있어요."; safetyText = "현재 체중을 유지하며 생활 리듬을 만드는 구성으로 안내할게요."; }
  else if (targetBmi < 18.5) { safety = "danger"; safetyTitle = "목표를 전문가와 먼저 확인해 주세요."; safetyText = "목표 체중이 낮을 수 있어 자동 감량 플랜을 잠시 멈췄어요."; }
  else if (pace > 0.9) { safety = "warn"; safetyTitle = "조금 빠른 목표예요."; safetyText = "기간을 늘리거나 목표를 조정하면 더 편안하게 이어갈 수 있어요."; }
  return { ...input, valid, heightM, currentBmi, targetBmi, weeks, delta, pace, checkins, safety, safetyTitle, safetyText };
}

function renderPreview() {
  const input = getInputs();
  const result = calculate(input);
  state.profile = input.profile;
  state.goal = input.goal;
  persist();
  $("helloName").textContent = input.profile.name || "친구";
  $("monthsReadout").textContent = `${input.goal.months}개월`;
  $("monthsRangeLabel").textContent = `${input.goal.months}개월`;
  $("goalReadout").textContent = Number.isFinite(input.goal.target) ? input.goal.target.toFixed(1) : "—";
  $("lossReadout").textContent = `${result.delta >= 0 ? "−" : "+"}${Math.abs(result.delta || 0).toFixed(1)} kg`;
  $("currentWeightModel").textContent = Number.isFinite(input.profile.weight) ? input.profile.weight.toFixed(1) : "—";
  $("targetWeightModel").textContent = Number.isFinite(input.goal.target) ? input.goal.target.toFixed(1) : "—";
  $("targetMonthsModel").textContent = `${input.goal.months}개월`;
  $("bmiReadout").innerHTML = result.valid ? `${result.currentBmi.toFixed(1)} <small>→ ${result.targetBmi.toFixed(1)}</small>` : "—";
  $("checkinReadout").textContent = result.valid ? `${result.checkins}회` : "—";
  $("paceReadout").textContent = result.valid ? `${Math.abs(result.pace).toFixed(2)}kg` : "—";
  $("safetyBanner").className = `safety-banner ${result.safety}`;
  $("safetyTitle").textContent = result.safetyTitle;
  $("safetyText").textContent = result.safetyText;
  $("draftState").textContent = "자동 저장됨";
  const currentScale = result.valid ? clamp(1 + (result.currentBmi - 21) * 0.018, .87, 1.18) : 1;
  const targetScale = result.valid ? clamp(1 + (result.targetBmi - 21) * 0.018, .82, 1.13) : .95;
  $("currentAvatar").style.setProperty("--body-scale", currentScale.toFixed(2));
  $("targetAvatar").style.setProperty("--body-scale", targetScale.toFixed(2));
  window.currentResult = result;
  updateProgress(result);
}

function updateProgress(result) {
  const current = state.checkins.length ? state.checkins[state.checkins.length - 1].weight : result.profile.weight;
  const total = result.profile.weight - result.goal.target;
  const achieved = total > 0 ? clamp((result.profile.weight - current) / total, 0, 1) : 0;
  const ring = $("progressRing");
  ring.style.strokeDashoffset = String(314 - Math.round(314 * achieved));
  $("progressValue").textContent = `${Math.round(achieved * 100)}%`;
}

function renderProducts() {
  $("productGrid").innerHTML = products.map((product) => {
    const added = state.cart.includes(product.id);
    return `<article class="product-card"><div class="product-art ${product.kind}"><span class="product-badge">${product.badge}</span><span class="product-emoji">${product.art}</span></div><div class="product-info"><span class="product-type">${product.type.toUpperCase()}</span><h3>${product.name}</h3><p>${product.desc}</p><div class="product-foot"><div class="product-price">${money(product.price)}<small>${product.note}</small></div><button class="add-product ${added ? "added" : ""}" data-product="${product.id}" aria-label="${product.name} ${added ? "담기 취소" : "장바구니에 담기"}">${added ? "✓" : "+"}</button></div>${product.type === "건강기능식품" ? `<div class="warning-note">ⓘ 복용 중인 약이 있다면 전문가와 상담하세요.</div>` : ""}</div></article>`;
  }).join("");
  document.querySelectorAll(".add-product").forEach((button) => button.addEventListener("click", () => toggleCart(button.dataset.product)));
}

function toggleCart(id) {
  if (state.cart.includes(id)) state.cart = state.cart.filter((item) => item !== id);
  else state.cart.push(id);
  persist(); renderProducts(); renderCart(); showToast(state.cart.includes(id) ? "장바구니에 담았어요." : "장바구니에서 뺐어요.");
}

function renderCart() {
  const items = state.cart.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  $("cartCount").textContent = items.length;
  $("cartTotal").textContent = money(items.reduce((sum, item) => sum + item.price, 0));
  $("cartItems").innerHTML = items.length ? items.map((item) => `<div class="cart-row"><div class="cart-thumb">${item.art}</div><div><h4>${item.name}</h4><small>${item.type} · ${money(item.price)}</small></div><button class="cart-remove" data-remove="${item.id}" aria-label="${item.name} 삭제">×</button></div>`).join("") : `<div class="empty-state">아직 담은 상품이 없어요.<br /><button class="text-btn" data-scroll="#store">상품 보러 가기 →</button></div>`;
  document.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => toggleCart(button.dataset.remove)));
  bindScrollButtons();
}

function saveSnapshot() {
  const result = window.currentResult || calculate(getInputs());
  if (!result.valid) { showToast("입력값을 먼저 확인해 주세요."); return; }
  const snapshot = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), createdAt: new Date().toISOString(), profile: { ...result.profile }, goal: { ...result.goal }, currentBmi: result.currentBmi, targetBmi: result.targetBmi, pace: result.pace, selectedProducts: [...state.cart] };
  state.snapshots.unshift(snapshot); state.snapshots = state.snapshots.slice(0, 12); persist(); renderSnapshots(); if (accountUser) apiRequest("/api/records/snapshot", { method: "POST", body: JSON.stringify({ snapshot }) }).catch(() => {}); showToast(accountUser ? "D1에 기록을 저장했어요." : "기록을 저장했어요.");
}

function renderSnapshots() {
  const list = $("snapshotList");
  if (!state.snapshots.length) { list.innerHTML = `<div class="empty-state">아직 저장한 기록이 없어요.<br /><button class="text-btn" data-scroll="#plan">첫 기록 남기기 →</button></div>`; bindScrollButtons(); return; }
  list.innerHTML = state.snapshots.slice(0, 4).map((item, index) => `<div class="snapshot-item"><div class="snapshot-meta"><strong>${item.profile.name || "나의"}의 ${index === 0 ? "최근 기록" : "플랜 기록"}</strong><span>${formatDate(item.createdAt)} · ${item.goal.months}개월 목표</span></div><div class="snapshot-weight"><strong>${item.profile.weight.toFixed(1)} → ${item.goal.target.toFixed(1)}kg</strong><small>BMI ${item.currentBmi.toFixed(1)} → ${item.targetBmi.toFixed(1)}</small></div></div>`).join("");
}

function renderOrders() {
  $("orderCount").textContent = `${state.orders.length}건`;
  $("ordersList").innerHTML = state.orders.length ? state.orders.map((order) => `<div class="order-row"><div><strong>${order.number}</strong><small>${formatDate(order.createdAt)}</small></div><div><strong>${order.items.map((item) => item.name).join(", ")}</strong><small>${order.items.length}개 상품 · ${order.planLabel}</small></div><div><strong>${money(order.total)}</strong><small>결제 금액</small></div><div><span class="order-status">${order.status}</span></div><button class="text-btn small">상세 보기 ↗</button></div>`).join("") : `<div class="empty-state">아직 구매 내역이 없어요.<br /><button class="text-btn" data-scroll="#store">스토어 둘러보기 →</button></div>`;
  bindScrollButtons();
}

function addCheckin() {
  const weight = Number($("checkinWeight").value);
  if (!weight || weight < 35 || weight > 250) { showToast("체중을 확인해 주세요."); $("checkinWeight").focus(); return; }
  state.checkins.push({ id: Date.now(), weight, mood: $("checkinMood").value, createdAt: new Date().toISOString() });
  const checkin = state.checkins[state.checkins.length - 1]; persist(); if (accountUser) apiRequest("/api/records/checkin", { method: "POST", body: JSON.stringify({ checkin }) }).catch(() => {}); $("checkinMessage").textContent = "오늘의 기록을 남겼어요. 꾸준함이 가장 멋진 변화예요."; $("checkinWeight").value = ""; renderPreview(); updateGiftProgress(); showToast(accountUser ? "D1에 체크인을 저장했어요." : "체크인을 저장했어요.");
}

async function apiRequest(path, options = {}) { const response = await fetch(path, { headers: { "content-type": "application/json", ...(options.headers || {}) }, credentials: "include", ...options }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "요청을 처리하지 못했어요."); return data; }
function openAccount() { $("accountModal").classList.add("show"); $("modalBackdrop").classList.add("show"); document.body.style.overflow = "hidden"; renderAccount(); }
function closeAccount() { $("accountModal").classList.remove("show"); if (!$('giftModal').classList.contains('show')) $("modalBackdrop").classList.remove("show"); document.body.style.overflow = ""; }
function renderAccount() { const loggedIn = Boolean(accountUser); $("accountIntro").textContent = loggedIn ? `${accountUser.name}님, 로그인된 계정의 기록을 관리하고 있어요.` : "회원가입하면 다른 기기에서도 목표와 체크인 기록을 이어볼 수 있어요."; $("accountForm").hidden = loggedIn; $("accountLogout").hidden = !loggedIn; document.querySelectorAll(".account-tab").forEach((tab) => tab.hidden = loggedIn); if (!loggedIn) { $("accountName").parentElement.hidden = accountMode !== "signup"; $("accountSubmit").innerHTML = accountMode === "signup" ? "회원가입하고 기록 연결하기 <span>→</span>" : "로그인하고 기록 불러오기 <span>→</span>"; } }
async function submitAccount(event) { event.preventDefault(); const status = $("accountStatus"); status.textContent = "처리 중…"; status.className = "account-status"; try { const data = await apiRequest(accountMode === "signup" ? "/api/auth/signup" : "/api/auth/login", { method: "POST", body: JSON.stringify({ name: $("accountName").value, username: $("accountUsername").value, password: $("accountPassword").value }) }); accountUser = data.user; const records = await apiRequest("/api/records"); if (records.snapshots?.length) state.snapshots = records.snapshots; if (records.checkins?.length) state.checkins = records.checkins; persist(); renderSnapshots(); updateGiftProgress(); $("profileButton").querySelector(".profile-name").textContent = accountUser.name; status.textContent = `${accountUser.name}님으로 연결됐어요.`; status.className = "account-status success"; renderAccount(); showToast("D1 기록을 불러왔어요."); } catch (error) { status.textContent = error.message; } }
async function loadAccount() { try { const data = await apiRequest("/api/auth/me", { method: "GET" }); accountUser = data.user; const records = await apiRequest("/api/records"); if (records.snapshots?.length) state.snapshots = records.snapshots; if (records.checkins?.length) state.checkins = records.checkins; renderSnapshots(); updateGiftProgress(); $("profileButton").querySelector(".profile-name").textContent = accountUser.name; } catch {} }

function updateGiftProgress() {
  const count = Math.min(4, state.checkins.length);
  $("giftCheckins").textContent = `${count} / 4`;
  $("giftProgressBar").style.width = `${count * 25}%`;
}

function checkout() {
  const items = state.cart.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  if (!items.length) { showToast("상품을 먼저 담아 주세요."); return; }
  const result = window.currentResult || calculate(getInputs());
  if (!result.valid || result.safety === "danger") { showToast("안전 안내를 확인한 뒤 주문해 주세요."); closeCart(); return; }
  const order = { id: Date.now(), number: `FP-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`, createdAt: new Date().toISOString(), items: items.map(({ id, name, price }) => ({ id, name, price })), total: items.reduce((sum, item) => sum + item.price, 0), planLabel: `${result.goal.months}개월 맞춤 플랜`, status: "주문 완료" };
  state.orders.unshift(order); state.cart = []; persist(); renderProducts(); renderCart(); renderOrders(); closeCart(); showToast("데모 주문을 기록했어요.");
}

function formatDate(value) { return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(value)); }
function showToast(message) { $("toastText").textContent = message; $("toast").classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2400); }
function openCart() { $("cartDrawer").classList.add("open"); $("drawerBackdrop").classList.add("show"); document.body.style.overflow = "hidden"; }
function closeCart() { $("cartDrawer").classList.remove("open"); $("drawerBackdrop").classList.remove("show"); document.body.style.overflow = ""; }
function openGift() { updateGiftProgress(); $("giftModal").classList.add("show"); $("modalBackdrop").classList.add("show"); document.body.style.overflow = "hidden"; }
function closeGift() { $("giftModal").classList.remove("show"); $("modalBackdrop").classList.remove("show"); document.body.style.overflow = ""; }
function bindScrollButtons() { document.querySelectorAll("[data-scroll]").forEach((button) => button.onclick = () => document.querySelector(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth" })); }

function init() {
  hydrateInputs(); renderPreview(); renderProducts(); renderCart(); renderSnapshots(); renderOrders(); updateGiftProgress(); bindScrollButtons();
  ["nameInput", "ageInput", "heightInput", "weightInput", "goalInput", "monthsInput"].forEach((id) => $(id).addEventListener("input", () => { clearTimeout(updateTimer); $("draftState").textContent = "업데이트 중…"; updateTimer = setTimeout(renderPreview, 220); }));
  document.querySelectorAll('input[name="gender"]').forEach((radio) => radio.addEventListener("change", renderPreview));
  $("saveSnapshot").addEventListener("click", saveSnapshot); $("addCheckin").addEventListener("click", addCheckin); $("cartButton").addEventListener("click", openCart); $("closeCart").addEventListener("click", closeCart); $("drawerBackdrop").addEventListener("click", closeCart); $("checkoutButton").addEventListener("click", checkout); $("giftButton").addEventListener("click", openGift); $("closeGift").addEventListener("click", closeGift); $("closeGiftCta").addEventListener("click", closeGift); $("modalBackdrop").addEventListener("click", () => { closeGift(); closeAccount(); }); $("profileButton").addEventListener("click", openAccount); $("closeAccount").addEventListener("click", closeAccount); $("accountForm").addEventListener("submit", submitAccount); $("accountLogout").addEventListener("click", async () => { await apiRequest("/api/auth/logout", { method: "POST" }).catch(() => {}); accountUser = null; $("profileButton").querySelector(".profile-name").textContent = "내 플랜"; renderAccount(); showToast("로그아웃했어요."); }); document.querySelectorAll(".account-tab").forEach((tab) => tab.addEventListener("click", () => { accountMode = tab.dataset.accountTab; document.querySelectorAll(".account-tab").forEach((item) => item.classList.toggle("active", item === tab)); renderAccount(); }));
  $("clearSnapshots").addEventListener("click", () => document.querySelector("#records")?.scrollIntoView({ behavior: "smooth" }));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeCart(); closeGift(); closeAccount(); } }); loadAccount();
}

init();
