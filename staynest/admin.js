const adminState = {
  module: "guides",
};

const reviewState = {
  applications: [],
  selectedId: "",
  filter: "待审核",
};

const productState = {
  products: [],
  selectedId: "",
  isCreating: false,
};

const orderState = {
  orders: [],
};

const userState = {
  users: [],
  selectedId: "",
};

const moduleTitles = {
  guides: "导游审核",
  products: "旅游产品",
  orders: "订单管理",
  users: "用户管理",
};

async function initAdmin() {
  const [applications, products, orders, users] = await Promise.all([loadApplications(), loadProducts(), loadOrders(), loadUsers()]);
  reviewState.applications = applications;
  productState.products = products;
  orderState.orders = orders;
  userState.users = users;
  reviewState.selectedId = getFilteredApplications()[0]?.id || reviewState.applications[0]?.id || "";
  productState.selectedId = productState.products[0]?.id || "";
  userState.selectedId = userState.users[0]?.id || "";

  document.querySelectorAll("[data-admin-module]").forEach((button) => {
    button.addEventListener("click", () => setAdminModule(button.dataset.adminModule));
  });

  document.querySelector("#reviewFilter").addEventListener("change", (event) => {
    reviewState.filter = event.target.value;
    reviewState.selectedId = getFilteredApplications()[0]?.id || "";
    renderAdmin();
  });
  document.querySelector("#newProductButton").addEventListener("click", () => {
    productState.isCreating = true;
    productState.selectedId = "";
    renderAdmin();
  });
  document.querySelector("#refreshOrdersButton").addEventListener("click", refreshOrders);
  document.querySelector("#refreshUsersButton").addEventListener("click", refreshUsers);
  document.querySelector("#clearAllDataButton").addEventListener("click", openClearAllDialog);
  document.querySelector("#cancelClearAllButton").addEventListener("click", closeClearAllDialog);
  document.querySelector("#confirmClearAllButton").addEventListener("click", clearAllData);
  document.querySelector("#clearAllDialog").addEventListener("click", (event) => {
    if (event.target.id === "clearAllDialog") closeClearAllDialog();
  });
  renderAdmin();
}

function setAdminModule(module) {
  adminState.module = module;
  document.querySelector("#adminPageTitle").textContent = moduleTitles[module] || "平台管理";
  document.querySelector("#guideAdminView").classList.toggle("hidden", module !== "guides");
  document.querySelector("#productAdminView").classList.toggle("hidden", module !== "products");
  document.querySelector("#orderAdminView").classList.toggle("hidden", module !== "orders");
  document.querySelector("#userAdminView").classList.toggle("hidden", module !== "users");
  document.querySelectorAll("[data-admin-module]").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminModule === module);
  });
  if (module === "orders") {
    loadOrders().then((orders) => {
      orderState.orders = orders;
      if (adminState.module === "orders") renderAdmin();
    });
  } else if (module === "users") {
    loadUsers().then((users) => {
      userState.users = users;
      if (!userState.users.some((user) => user.id === userState.selectedId)) {
        userState.selectedId = userState.users[0]?.id || "";
      }
      if (adminState.module === "users") renderAdmin();
    });
  }
  renderAdmin();
}

async function loadApplications() {
  try {
    const result = await getJson("/api/admin/guides/applications");
    return result.applications.map(normalizeApplication);
  } catch {
    return [];
  }
}

async function loadProducts() {
  try {
    const result = await getJson("/api/admin/products");
    return result.products.map(normalizeProduct);
  } catch {
    return [];
  }
}

async function loadOrders() {
  try {
    const result = await getJson("/api/admin/orders");
    return result.orders.map(normalizeOrder);
  } catch {
    return [];
  }
}

async function loadUsers() {
  try {
    const result = await getJson("/api/admin/users");
    return result.users.map(normalizeUser);
  } catch {
    return [];
  }
}

async function refreshOrders() {
  const button = document.querySelector("#refreshOrdersButton");
  if (button) {
    button.disabled = true;
    button.textContent = "刷新中...";
  }
  try {
    orderState.orders = await loadOrders();
    renderOrderAdmin();
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "刷新订单";
    }
    refreshAdminIcons();
  }
}

async function refreshUsers() {
  const button = document.querySelector("#refreshUsersButton");
  if (button) {
    button.disabled = true;
    button.textContent = "刷新中...";
  }
  try {
    userState.users = await loadUsers();
    if (!userState.users.some((user) => user.id === userState.selectedId)) {
      userState.selectedId = userState.users[0]?.id || "";
    }
    renderUserAdmin();
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "刷新用户";
    }
    refreshAdminIcons();
  }
}

function normalizeApplication(application) {
  return {
    id: application.id || `guide-${Date.now()}`,
    applicantName: application.applicantName || "StayNest 用户",
    realName: application.realName || application.applicantName || "StayNest 用户",
    gender: application.gender || "",
    phone: application.phone || "",
    avatar: application.avatar || "teal",
    city: application.city || "未填写",
    specialty: application.specialty || "未填写",
    englishLevel: application.englishLevel || "",
    intro: application.intro || "未填写个人介绍。",
    idCardFront: application.idCardFront || null,
    idCardBack: application.idCardBack || null,
    profilePhoto: application.profilePhoto || null,
    englishCertificates: Array.isArray(application.englishCertificates) ? application.englishCertificates : [],
    guideCertificates: Array.isArray(application.guideCertificates) ? application.guideCertificates : [],
    status: application.status || "审核中",
    reviewStatus: application.reviewStatus || (application.status === "审核中" ? "待审核" : application.status),
    submittedAt: application.submittedAt || new Date().toISOString(),
    reviewedAt: application.reviewedAt || "",
    rejectReason: application.rejectReason || "",
  };
}

function normalizeUser(user) {
  return {
    id: user.id || `user-${Date.now()}`,
    name: user.name || user.nickname || "StayNest 用户",
    nickname: user.nickname || user.name || "StayNest 用户",
    gender: user.gender || "",
    bio: user.bio || "",
    method: user.method || "手机号",
    phone: user.phone || "",
    email: user.email || "",
    appleSub: user.appleSub || "",
    role: user.role || "游客",
    guideStatus: user.guideStatus || "未申请",
    createdAt: user.created_at || user.createdAt || "",
  };
}

function normalizeProduct(product = {}) {
  return {
    id: product.id || "",
    title: product.title || "",
    destination: product.destination || "成都",
    preference: product.preference || "城市景观",
    duration: product.duration || "一日游",
    price: Number(product.price) || 399,
    image: product.image || "",
    spots: Array.isArray(product.spots) ? product.spots : [],
    intro: product.intro || "",
    highlights: Array.isArray(product.highlights) ? product.highlights : [],
    bodyBlocks: Array.isArray(product.bodyBlocks) ? product.bodyBlocks : [],
    bodyImages: Array.isArray(product.bodyImages) ? product.bodyImages : [],
    itinerary: Array.isArray(product.itinerary) ? product.itinerary : [],
    attractionDetails: Array.isArray(product.attractionDetails) ? product.attractionDetails : [],
    tip: product.tip || "",
    status: product.status || "draft",
    createdAt: product.createdAt || "",
    updatedAt: product.updatedAt || "",
  };
}

function normalizeOrder(order = {}) {
  return {
    id: order.id || `order-${Date.now()}`,
    productId: order.productId || "",
    productTitle: order.productTitle || "未命名路线",
    productImage: order.productImage || "",
    destination: order.destination || "",
    preference: order.preference || "",
    duration: order.duration || "",
    travelDate: order.travelDate || "",
    price: Number(order.price) || 0,
    travelerName: order.travelerName || "游客",
    travelerPhone: order.travelerPhone || "",
    status: order.status || "待确认",
    createdAt: order.createdAt || "",
    updatedAt: order.updatedAt || "",
  };
}

function emptyProduct() {
  return normalizeProduct({
    destination: "成都",
    preference: "城市景观",
    duration: "一日游",
    price: 399,
    spots: ["", ""],
    highlights: [""],
    bodyBlocks: [{ type: "text", text: "" }],
    bodyImages: [["", ""]],
    itinerary: [["09:00", "", ""]],
    attractionDetails: [["", ""]],
    status: "draft",
  });
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function openClearAllDialog() {
  document.querySelector("#clearAllDialog").showModal();
  refreshAdminIcons();
}

function closeClearAllDialog() {
  document.querySelector("#clearAllDialog").close();
}

async function clearAllData() {
  const button = document.querySelector("#confirmClearAllButton");
  button.disabled = true;
  button.textContent = "正在清空...";
  try {
    await postJson("/api/admin/guides/clear", {});
  } catch {
    // Local cleanup below still keeps the browser prototype consistent.
  }
  clearLocalPrototypeData();
  reviewState.applications = [];
  reviewState.selectedId = "";
  productState.products = [];
  productState.selectedId = "";
  productState.isCreating = false;
  orderState.orders = [];
  closeClearAllDialog();
  button.disabled = false;
  button.textContent = "确认清空";
  renderAdmin();
}

function clearLocalPrototypeData() {
  [
    "staynestGuideApplications",
    "staynestGuideApplication",
    "staynestProducts",
    "staynestOrders",
    "staynestUser",
    "staynestToken",
    "staynestSaved",
  ].forEach((key) => localStorage.removeItem(key));

  Object.keys(localStorage)
    .filter((key) => key.startsWith("staynestGuideApplication:"))
    .forEach((key) => localStorage.removeItem(key));
}

function getFilteredApplications() {
  if (reviewState.filter === "全部") return reviewState.applications;
  return reviewState.applications.filter((item) => item.reviewStatus === reviewState.filter);
}

function renderAdmin() {
  if (adminState.module === "products") {
    renderProductAdmin();
  } else if (adminState.module === "orders") {
    renderOrderAdmin();
  } else if (adminState.module === "users") {
    renderUserAdmin();
  } else {
    renderGuideAdmin();
  }
  refreshAdminIcons();
}

function renderGuideAdmin() {
  renderMetrics();
  renderReviewList();
  renderReviewDetail();
}

function renderMetrics() {
  document.querySelector("#pendingCount").textContent = countByStatus("待审核");
  document.querySelector("#approvedCount").textContent = countByStatus("已通过");
  document.querySelector("#rejectedCount").textContent = countByStatus("已驳回");
}

function countByStatus(status) {
  return reviewState.applications.filter((item) => item.reviewStatus === status).length;
}

function renderOrderAdmin() {
  const pending = orderState.orders.filter((order) => order.status === "待确认").length;
  const active = orderState.orders.filter((order) => order.status === "进行中").length;
  const done = orderState.orders.filter((order) => order.status === "已完成").length;
  document.querySelector("#orderPendingCount").textContent = pending;
  document.querySelector("#orderActiveCount").textContent = active;
  document.querySelector("#orderDoneCount").textContent = done;
  document.querySelector("#orderTotalCount").textContent = `${orderState.orders.length} 条订单`;

  const list = document.querySelector("#orderList");
  if (!orderState.orders.length) {
    list.innerHTML = `
      <div class="admin-empty">
        <i data-lucide="clipboard-list"></i>
        <strong>还没有旅游产品订单</strong>
        <span>用户在探索详情页选择日期下单后，会显示在这里。</span>
      </div>
    `;
    return;
  }

  list.innerHTML = orderState.orders
    .map(
      (order) => `
        <article class="admin-order-card">
          <img src="${escapeHtml(order.productImage)}" alt="${escapeHtml(order.productTitle)}" />
          <div>
            <div class="admin-order-head">
              <strong>${escapeHtml(order.productTitle)}</strong>
              <span class="review-status pending">${escapeHtml(order.status)}</span>
            </div>
            <p>${escapeHtml(order.destination)} · ${escapeHtml(order.preference)} · ${escapeHtml(order.duration)}</p>
            <div class="admin-order-meta">
              <span><i data-lucide="calendar-days"></i>${escapeHtml(order.travelDate || "未选日期")}</span>
              <span><i data-lucide="user-round"></i>${escapeHtml(order.travelerName)}</span>
              ${order.travelerPhone ? `<span><i data-lucide="phone"></i>${escapeHtml(order.travelerPhone)}</span>` : ""}
            </div>
          </div>
          <strong class="admin-order-price">¥${formatMoney(order.price)}</strong>
        </article>
      `,
    )
    .join("");
}

function renderUserAdmin() {
  const users = userState.users;
  if (!users.some((user) => user.id === userState.selectedId)) {
    userState.selectedId = users[0]?.id || "";
  }
  const guideUsers = users.filter((user) => user.role === "导游").length;
  const appleUsers = users.filter((user) => user.method === "Apple ID").length;
  const visitorUsers = users.length - guideUsers;
  document.querySelector("#visitorUserCount").textContent = visitorUsers;
  document.querySelector("#guideUserCount").textContent = guideUsers;
  document.querySelector("#appleUserCount").textContent = appleUsers;
  document.querySelector("#userTotalCount").textContent = `${users.length} 位用户`;

  const list = document.querySelector("#userList");
  if (!users.length) {
    list.innerHTML = `
      <div class="admin-empty">
        <i data-lucide="users"></i>
        <strong>还没有已注册用户</strong>
        <span>游客完成首次注册，或使用 Apple ID 登录后，会显示在这里。</span>
      </div>
    `;
    renderUserDetail();
    return;
  }

  list.innerHTML = users
    .map(
      (user) => `
        <button class="admin-user-card ${user.id === userState.selectedId ? "active" : ""}" type="button" data-user-id="${escapeHtml(user.id)}">
          <span class="large-avatar avatar-teal">${escapeHtml(user.name.slice(0, 1).toUpperCase())}</span>
          <div class="admin-user-main">
            <div class="admin-order-head">
              <strong>${escapeHtml(user.name)}</strong>
              <span class="review-status ${user.role === "导游" ? "approved" : "pending"}">${escapeHtml(user.role)}</span>
            </div>
            <p>${escapeHtml(user.bio || "暂无个人介绍")}</p>
            <div class="admin-order-meta">
              <span><i data-lucide="shield-check"></i>${escapeHtml(user.method)}</span>
              ${user.phone ? `<span><i data-lucide="phone"></i>${escapeHtml(user.phone)}</span>` : ""}
              ${user.email ? `<span><i data-lucide="mail"></i>${escapeHtml(user.email)}</span>` : ""}
              ${user.gender ? `<span><i data-lucide="user-round"></i>${escapeHtml(user.gender)}</span>` : ""}
            </div>
          </div>
          <div class="admin-user-side">
            <span>导游状态</span>
            <strong>${escapeHtml(user.guideStatus)}</strong>
            <small>${escapeHtml(formatDateTime(user.createdAt) || "注册时间未知")}</small>
          </div>
        </button>
      `,
    )
    .join("");

  list.querySelectorAll("[data-user-id]").forEach((button) => {
    button.addEventListener("click", () => {
      userState.selectedId = button.dataset.userId;
      renderUserAdmin();
      refreshAdminIcons();
    });
  });
  renderUserDetail();
}

function renderUserDetail() {
  const detail = document.querySelector("#userDetail");
  if (!detail) return;

  const selected = userState.users.find((user) => user.id === userState.selectedId);
  if (!selected) {
    detail.innerHTML = `
      <div class="admin-empty detail-empty">
        <i data-lucide="user-round-search"></i>
        <strong>选择一个用户查看详情</strong>
      </div>
    `;
    return;
  }

  const matchedOrders = getOrdersForUser(selected);
  const guideApplication = getGuideApplicationForUser(selected);
  const activeOrders = matchedOrders.filter((order) => order.status === "进行中").length;
  const finishedOrders = matchedOrders.filter((order) => order.status === "已完成").length;

  detail.innerHTML = `
    <div class="detail-head">
      <span class="large-avatar avatar-teal">${escapeHtml(selected.name.slice(0, 1).toUpperCase())}</span>
      <div>
        <p class="eyebrow">用户详情</p>
        <h2>${escapeHtml(selected.name)}</h2>
        <p>${escapeHtml(selected.phone || selected.email || "暂无联系方式")}</p>
      </div>
      <span class="review-status ${selected.role === "导游" ? "approved" : "pending"}">${escapeHtml(selected.role)}</span>
    </div>

    <div class="detail-grid user-detail-grid">
      <div><span>登录方式</span><strong>${escapeHtml(selected.method)}</strong></div>
      <div><span>手机号</span><strong>${escapeHtml(selected.phone || "未绑定")}</strong></div>
      <div><span>邮箱</span><strong>${escapeHtml(selected.email || "未绑定")}</strong></div>
      <div><span>性别</span><strong>${escapeHtml(selected.gender || "未填写")}</strong></div>
      <div><span>导游状态</span><strong>${escapeHtml(selected.guideStatus || "未申请")}</strong></div>
      <div><span>注册时间</span><strong>${escapeHtml(formatDateTime(selected.createdAt) || "未记录")}</strong></div>
      <div><span>关联订单</span><strong>${matchedOrders.length} 单</strong></div>
      <div><span>进行中</span><strong>${activeOrders} 单</strong></div>
      <div><span>已完成</span><strong>${finishedOrders} 单</strong></div>
    </div>

    <section class="detail-section">
      <h3>个人信息介绍</h3>
      <p>${escapeHtml(selected.bio || "用户暂未填写个人介绍。")}</p>
    </section>

    <section class="detail-section">
      <h3>导游申请</h3>
      ${renderUserGuideSummary(guideApplication)}
    </section>

    <section class="detail-section">
      <h3>关联订单</h3>
      ${renderUserOrderSummary(matchedOrders)}
    </section>

    <section class="detail-section">
      <h3>系统信息</h3>
      <div class="detail-grid system-detail-grid">
        <div><span>用户 ID</span><strong>${escapeHtml(selected.id)}</strong></div>
        <div><span>昵称</span><strong>${escapeHtml(selected.nickname || selected.name)}</strong></div>
        <div><span>Apple 标识</span><strong>${escapeHtml(selected.appleSub || "无")}</strong></div>
      </div>
    </section>
  `;
}

function renderUserGuideSummary(application) {
  if (!application) {
    return `<div class="attachment-empty">该用户还没有提交导游申请。</div>`;
  }
  return `
    <div class="user-summary-card">
      <div class="admin-order-head">
        <strong>${escapeHtml(application.realName || application.applicantName)}</strong>
        <span class="review-status ${statusClass(application.reviewStatus)}">${escapeHtml(application.reviewStatus)}</span>
      </div>
      <p>${escapeHtml(application.city)} · ${escapeHtml(application.specialty)} · 英文水平：${escapeHtml(application.englishLevel || "未填写")}</p>
      <div class="admin-order-meta">
        <span><i data-lucide="calendar-days"></i>${escapeHtml(formatDateTime(application.submittedAt) || "提交时间未知")}</span>
        ${application.phone ? `<span><i data-lucide="phone"></i>${escapeHtml(application.phone)}</span>` : ""}
      </div>
    </div>
  `;
}

function renderUserOrderSummary(orders) {
  if (!orders.length) {
    return `<div class="attachment-empty">暂时没有匹配到该用户的订单。</div>`;
  }
  return `
    <div class="user-order-mini-list">
      ${orders
        .slice(0, 6)
        .map(
          (order) => `
            <div class="user-order-mini">
              <div>
                <strong>${escapeHtml(order.productTitle)}</strong>
                <p>${escapeHtml(order.travelDate || "未选日期")} · ${escapeHtml(order.destination || "未填写目的地")}</p>
              </div>
              <span class="review-status ${order.status === "已完成" ? "approved" : "pending"}">${escapeHtml(order.status)}</span>
              <b>¥${formatMoney(order.price)}</b>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function getOrdersForUser(user) {
  const phone = normalizeDigits(user.phone);
  const name = normalizeText(user.name);
  const nickname = normalizeText(user.nickname);
  return orderState.orders.filter((order) => {
    const travelerPhone = normalizeDigits(order.travelerPhone);
    const travelerName = normalizeText(order.travelerName);
    return (phone && travelerPhone === phone) || (name && travelerName === name) || (nickname && travelerName === nickname);
  });
}

function getGuideApplicationForUser(user) {
  const phone = normalizeDigits(user.phone);
  const name = normalizeText(user.name);
  const nickname = normalizeText(user.nickname);
  return reviewState.applications.find((application) => {
    const applicationPhone = normalizeDigits(application.phone);
    const applicantName = normalizeText(application.realName || application.applicantName);
    return (phone && applicationPhone === phone) || (name && applicantName === name) || (nickname && applicantName === nickname);
  });
}

function renderReviewList() {
  const list = document.querySelector("#reviewList");
  const applications = getFilteredApplications();

  if (!applications.length) {
    list.innerHTML = `<div class="admin-empty">当前没有${escapeHtml(reviewState.filter)}的导游申请。</div>`;
    return;
  }

  list.innerHTML = applications
    .map(
      (item) => `
        <button class="review-item ${item.id === reviewState.selectedId ? "active" : ""}" type="button" data-application-id="${escapeHtml(item.id)}">
          <span class="large-avatar avatar-${escapeHtml(item.avatar)}">${escapeHtml(item.applicantName.slice(0, 1))}</span>
          <span>
            <strong>${escapeHtml(item.applicantName)}</strong>
            <small>${escapeHtml(item.city)} · ${escapeHtml(item.specialty)}</small>
          </span>
          <em class="review-status ${statusClass(item.reviewStatus)}">${escapeHtml(item.reviewStatus)}</em>
        </button>
      `,
    )
    .join("");

  list.querySelectorAll("[data-application-id]").forEach((button) => {
    button.addEventListener("click", () => {
      reviewState.selectedId = button.dataset.applicationId;
      renderAdmin();
    });
  });
}

function renderReviewDetail() {
  const detail = document.querySelector("#reviewDetail");
  const selected = reviewState.applications.find((item) => item.id === reviewState.selectedId);

  if (!selected) {
    detail.innerHTML = `
      <div class="admin-empty detail-empty">
        <i data-lucide="badge-check"></i>
        <strong>选择一个申请查看详情</strong>
      </div>
    `;
    return;
  }

  detail.innerHTML = `
    <div class="detail-head">
      <span class="large-avatar avatar-${escapeHtml(selected.avatar)}">${escapeHtml(selected.applicantName.slice(0, 1))}</span>
      <div>
        <p class="eyebrow">申请人</p>
        <h2>${escapeHtml(selected.realName || selected.applicantName)}</h2>
        <p>${escapeHtml(selected.phone || "未绑定手机号")}</p>
      </div>
      <span class="review-status ${statusClass(selected.reviewStatus)}">${escapeHtml(selected.reviewStatus)}</span>
    </div>

    <div class="detail-grid">
      <div><span>服务城市</span><strong>${escapeHtml(selected.city)}</strong></div>
      <div><span>服务方向</span><strong>${escapeHtml(selected.specialty)}</strong></div>
      <div><span>性别</span><strong>${escapeHtml(selected.gender || "未填写")}</strong></div>
      <div><span>英文水平</span><strong>${escapeHtml(selected.englishLevel || "未填写")}</strong></div>
      <div><span>提交时间</span><strong>${formatDate(selected.submittedAt)}</strong></div>
    </div>

    <section class="detail-section">
      <h3>个人介绍</h3>
      <p>${escapeHtml(selected.intro)}</p>
    </section>

    <section class="detail-section">
      <h3>身份与形象资料</h3>
      <div class="attachment-grid">
        ${renderAttachment(selected.idCardFront, "身份证正面")}
        ${renderAttachment(selected.idCardBack, "身份证反面")}
        ${renderAttachment(selected.profilePhoto, "形象照片")}
      </div>
    </section>

    <section class="detail-section">
      <h3>审核附件</h3>
      <div class="attachment-grid">
        ${
          [...selected.englishCertificates, ...selected.guideCertificates].length
            ? [...selected.englishCertificates, ...selected.guideCertificates].map((attachment) => renderAttachment(attachment, attachment.label || "审核附件")).join("")
            : `<div class="attachment-empty">未提交英文证书或导游证书。</div>`
        }
      </div>
    </section>

    ${selected.rejectReason ? `<section class="detail-section reject-note"><h3>驳回原因</h3><p>${escapeHtml(selected.rejectReason)}</p></section>` : ""}

    <div class="review-actions">
      <button class="ghost-button" id="rejectGuideButton" type="button" ${selected.reviewStatus !== "待审核" ? "disabled" : ""}>驳回</button>
      <button class="primary-button" id="approveGuideButton" type="button" ${selected.reviewStatus !== "待审核" ? "disabled" : ""}>通过审核</button>
    </div>
  `;

  document.querySelector("#approveGuideButton").addEventListener("click", () => updateApplication(selected.id, "已通过"));
  document.querySelector("#rejectGuideButton").addEventListener("click", () => {
    const reason = window.prompt("请输入驳回原因", "资料不完整，请补充导游资质或服务说明。");
    if (reason === null) return;
    updateApplication(selected.id, "已驳回", reason.trim() || "资料不完整，请补充后再次提交。");
  });
}

function renderAttachment(attachment, fallbackLabel) {
  if (!attachment?.dataUrl) {
    return `<div class="attachment-empty">${escapeHtml(fallbackLabel)}未上传</div>`;
  }
  const label = attachment.label || fallbackLabel;
  const name = attachment.name || label;
  const isImage = String(attachment.type || "").startsWith("image/") || attachment.dataUrl.startsWith("data:image/");
  return `
    <a class="attachment-card" href="${escapeHtml(attachment.dataUrl)}" target="_blank" rel="noreferrer">
      ${isImage ? `<img src="${escapeHtml(attachment.dataUrl)}" alt="${escapeHtml(label)}" />` : `<span><i data-lucide="file-text"></i></span>`}
      <strong>${escapeHtml(label)}</strong>
      <small>${escapeHtml(name)}</small>
    </a>
  `;
}

async function updateApplication(id, reviewStatus, rejectReason = "") {
  try {
    const result = await postJson("/api/admin/guides/review", { id, reviewStatus, rejectReason });
    reviewState.applications = reviewState.applications.map((item) => (item.id === id ? normalizeApplication(result.application) : item));
  } catch {
    reviewState.applications = reviewState.applications.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        reviewStatus,
        status: reviewStatus,
        rejectReason,
        reviewedAt: new Date().toISOString(),
      };
    });
  }
  if (reviewState.filter !== "全部" && reviewStatus !== reviewState.filter) {
    reviewState.selectedId = getFilteredApplications()[0]?.id || "";
  }
  renderAdmin();
}

function renderProductAdmin() {
  document.querySelector("#productTotalCount").textContent = productState.products.length;
  document.querySelector("#productPublishedCount").textContent = productState.products.filter((product) => product.status === "published").length;
  document.querySelector("#productDraftCount").textContent = productState.products.filter((product) => product.status !== "published").length;
  renderProductList();
  renderProductEditor();
}

function renderProductList() {
  const list = document.querySelector("#productList");
  if (!productState.products.length) {
    list.innerHTML = `<div class="admin-empty">还没有旅游产品，点击“新增产品”开始发布。</div>`;
    return;
  }

  list.innerHTML = productState.products
    .map(
      (product) => `
        <button class="review-item product-item ${product.id === productState.selectedId && !productState.isCreating ? "active" : ""}" type="button" data-product-id="${escapeHtml(product.id)}">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" />
          <span>
            <strong>${escapeHtml(product.title || "未命名产品")}</strong>
            <small>${escapeHtml(product.destination)} · ${escapeHtml(product.preference)} · ${escapeHtml(product.duration)} · ¥${formatMoney(product.price)}</small>
          </span>
          <em class="review-status ${product.status === "published" ? "approved" : "pending"}">${product.status === "published" ? "已发布" : "草稿"}</em>
        </button>
      `,
    )
    .join("");

  list.querySelectorAll("[data-product-id]").forEach((button) => {
    button.addEventListener("click", () => {
      productState.selectedId = button.dataset.productId;
      productState.isCreating = false;
      renderAdmin();
    });
  });
}

function renderProductEditor() {
  const editor = document.querySelector("#productEditor");
  const product = productState.isCreating
    ? emptyProduct()
    : productState.products.find((item) => item.id === productState.selectedId);

  if (!product) {
    editor.innerHTML = `
      <div class="admin-empty detail-empty">
        <i data-lucide="map"></i>
        <strong>选择一个产品查看或编辑</strong>
      </div>
    `;
    return;
  }

  editor.innerHTML = `
    <div class="product-publisher">
      <form class="product-form" id="productForm">
        <input type="hidden" id="productIdInput" value="${escapeHtml(product.id)}" />
        <div class="product-form-head">
          <div>
            <p class="eyebrow">推文式发布</p>
            <h2>${productState.isCreating ? "新增旅游产品" : escapeHtml(product.title || "编辑产品")}</h2>
          </div>
          <span class="review-status ${product.status === "published" ? "approved" : "pending"}">${product.status === "published" ? "已发布" : "草稿"}</span>
        </div>

        <section class="publisher-section">
          <div class="publisher-section-head">
            <strong>路线名称</strong>
            <span>用户在探索首页和详情页看到的标题</span>
          </div>
          <label>
            <span>路线名称</span>
            <input id="productTitleInput" maxlength="40" value="${escapeHtml(product.title)}" placeholder="例如：成都茶馆小吃一日游" />
          </label>
        </section>

        <section class="publisher-section">
          <div class="publisher-section-head">
            <strong>路线亮点</strong>
            <span>每行一个亮点，会展示为标签</span>
          </div>
          <label>
            <span>路线亮点</span>
            <textarea id="productHighlightsInput" rows="4" placeholder="近距离看熊猫&#10;老成都茶馆体验&#10;城市街巷慢游">${escapeHtml(product.highlights.join("\n"))}</textarea>
          </label>
        </section>

        <section class="publisher-section">
          <div class="publisher-section-head">
            <strong>正文介绍</strong>
            <span>直接写文字，也可以从本地插入图片</span>
          </div>
          <label>
            <span>正文内容</span>
            <textarea id="productBodyContentInput" rows="12" placeholder="上午先去熊猫基地，看熊猫进食和活动。&#10;&#10;图片：https://...｜熊猫基地上午游览场景&#10;&#10;下午转入文殊院和宽窄巷子，感受老成都街巷。">${escapeHtml(formatBodyBlocks(product))}</textarea>
          </label>
          <div class="publisher-inline-actions">
            <input class="visually-hidden-file" id="productLocalBodyImageInput" type="file" accept="image/*" />
            <button class="ghost-button" id="insertBodyImageButton" type="button">插入图片地址</button>
            <button class="ghost-button" id="uploadBodyImageButton" type="button">本地插入图片</button>
            <span id="productImageUploadHint">图片会自动压缩到 3MB 内</span>
          </div>
        </section>

        <section class="publisher-section secondary-publish-settings">
          <div class="publisher-section-head">
            <strong>发布设置</strong>
            <span>用于探索页筛选和卡片展示</span>
          </div>
          <div class="product-form-grid">
            <label>
              <span>封面图片地址</span>
              <input id="productImageInput" value="${escapeHtml(product.image)}" placeholder="可选，默认使用正文第一张图片" />
            </label>
            <label>
              <span>目的地</span>
              <select id="productDestinationInput">
                ${["北京", "上海", "成都", "广州"].map((city) => `<option value="${city}" ${product.destination === city ? "selected" : ""}>${city}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>行程偏好</span>
              <select id="productPreferenceInput">
                ${["城市景观", "自然风光", "本地美食"].map((preference) => `<option value="${preference}" ${product.preference === preference ? "selected" : ""}>${preference}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>行程时长</span>
              <input id="productDurationInput" value="${escapeHtml(product.duration)}" placeholder="一日游" />
            </label>
            <label>
              <span>价格（元/人）</span>
              <input id="productPriceInput" type="number" min="1" max="999999" step="1" value="${escapeHtml(product.price)}" placeholder="399" />
            </label>
          </div>
        </section>

        <p class="auth-message" id="productMessage" role="status" aria-live="polite"></p>
        <div class="review-actions product-actions">
          ${
            productState.isCreating
              ? ""
              : `<button class="ghost-button danger-button" id="deleteProductButton" type="button">删除产品</button>`
          }
          <button class="ghost-button" type="submit" data-product-status="draft">保存草稿</button>
          <button class="primary-button" type="submit" data-product-status="published">发布产品</button>
        </div>
      </form>

      <aside class="publisher-preview" aria-label="产品推文预览">
        <div class="publisher-preview-head">
          <span>手机预览</span>
          <strong>发布效果</strong>
        </div>
        <article class="article-preview" id="productPreview"></article>
      </aside>
    </div>
  `;

  const form = document.querySelector("#productForm");
  form.addEventListener("submit", saveProduct);
  form.addEventListener("input", renderProductPreview);
  form.addEventListener("change", renderProductPreview);
  document.querySelector("#insertBodyImageButton").addEventListener("click", insertBodyImageBlock);
  document.querySelector("#uploadBodyImageButton").addEventListener("click", () => {
    document.querySelector("#productLocalBodyImageInput").click();
  });
  document.querySelector("#productLocalBodyImageInput").addEventListener("change", insertLocalBodyImageBlock);
  const deleteButton = document.querySelector("#deleteProductButton");
  if (deleteButton) {
    deleteButton.addEventListener("click", () => deleteProduct(product.id));
  }
  renderProductPreview();
}

function insertBodyImageBlock() {
  insertBodyImageText("图片：https://example.com/image.jpg｜图片说明");
}

const PRODUCT_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
const PRODUCT_IMAGE_MAX_EDGE = 1600;
const PRODUCT_IMAGE_MIN_QUALITY = 0.48;

async function insertLocalBodyImageBlock(event) {
  const fileInput = event.target;
  const file = fileInput.files?.[0];
  if (!file) return;

  const hint = document.querySelector("#productImageUploadHint");
  const uploadButton = document.querySelector("#uploadBodyImageButton");
  const previousHint = hint?.textContent || "";
  if (hint) hint.textContent = "正在压缩图片...";
  if (uploadButton) uploadButton.disabled = true;

  try {
    const image = await productImageFileToDataUrl(file);
    insertBodyImageText(`图片：${image.dataUrl}｜${image.caption}`);
    if (hint) {
      hint.textContent = image.compressed
        ? `已插入并压缩：${formatBytes(image.size)}`
        : `已插入：${formatBytes(image.size)}`;
    }
  } catch (error) {
    if (hint) hint.textContent = error.message || "图片插入失败，请换一张图片。";
  } finally {
    fileInput.value = "";
    if (uploadButton) uploadButton.disabled = false;
    window.setTimeout(() => {
      if (hint && hint.textContent && hint.textContent !== previousHint) {
        hint.textContent = previousHint || "图片会自动压缩到 3MB 内";
      }
    }, 3200);
  }
}

async function productImageFileToDataUrl(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("请选择图片文件。");
  }
  const image = await loadProductImageFromFile(file);
  const scale = Math.min(1, PRODUCT_IMAGE_MAX_EDGE / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.82;
  let blob = await canvasToJpegBlob(canvas, quality);
  while (blob.size > PRODUCT_IMAGE_MAX_BYTES && quality > PRODUCT_IMAGE_MIN_QUALITY) {
    quality = Math.max(PRODUCT_IMAGE_MIN_QUALITY, quality - 0.08);
    blob = await canvasToJpegBlob(canvas, quality);
  }
  if (blob.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error(`图片压缩后仍超过 3MB，请换一张更小的图片。`);
  }

  const dataUrl = await blobToDataUrl(blob);
  const caption = file.name.replace(/\.[^.]+$/, "") || "正文图片";
  return {
    dataUrl,
    caption,
    size: blob.size,
    compressed: blob.size < file.size || scale < 1,
  };
}

function loadProductImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败，请换一张图片。"));
    };
    image.src = url;
  });
}

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("图片压缩失败，请换一张图片。"));
      },
      "image/jpeg",
      quality,
    );
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("图片读取失败，请重试。"));
    reader.readAsDataURL(blob);
  });
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function insertBodyImageText(insertion) {
  const input = document.querySelector("#productBodyContentInput");
  const prefix = input.value && !input.value.endsWith("\n") ? "\n\n" : "";
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = `${input.value.slice(0, start)}${prefix}${insertion}${input.value.slice(end)}`;
  const cursor = start + prefix.length + insertion.length;
  input.focus();
  input.setSelectionRange(cursor, cursor);
  renderProductPreview();
}

function renderProductPreview() {
  const preview = document.querySelector("#productPreview");
  if (!preview) return;

  const product = collectProductForm("draft");
  preview.innerHTML = `
    ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title || "产品封面")}" />` : `<div class="preview-image-empty">封面图</div>`}
    <div class="article-preview-body">
      <h1>${escapeHtml(product.title || "未命名旅游产品")}</h1>
      <p class="article-preview-meta">${escapeHtml(product.destination)} · ${escapeHtml(product.preference)} · ${escapeHtml(product.duration)}</p>
      <strong class="article-preview-price">¥${formatMoney(product.price)} / 人</strong>
      ${renderPreviewTags("路线亮点", product.highlights)}
      ${renderPreviewBodyBlocks(product.bodyBlocks)}
    </div>
  `;
}

function renderPreviewBodyBlocks(blocks) {
  if (!blocks.length) {
    return `<p class="article-preview-intro">正文介绍会在这里实时预览。</p>`;
  }
  return blocks
    .map((block) => {
      if (block.type === "image") {
        return `
          <section class="article-preview-images">
            <figure>
              <img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.caption || "正文图片")}" />
              ${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}
            </figure>
          </section>
        `;
      }
      return `<p class="article-preview-intro">${escapeHtml(block.text)}</p>`;
    })
    .join("");
}

function renderPreviewBodyImages(rows) {
  if (!rows.length) return "";
  return `
    <section class="article-preview-images">
      ${rows
        .map(
          ([src, caption]) => `
            <figure>
              <img src="${escapeHtml(src)}" alt="${escapeHtml(caption || "正文图片")}" />
              ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}
            </figure>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderPreviewTags(title, items) {
  if (!items.length) return "";
  return `
    <section>
      <h2>${escapeHtml(title)}</h2>
      <div class="article-preview-tags">
        ${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    </section>
  `;
}

function renderPreviewTimeline(rows) {
  if (!rows.length) return "";
  return `
    <section>
      <h2>详细行程</h2>
      <div class="article-preview-timeline">
        ${rows
          .map(
            ([time, title, description]) => `
              <div>
                <time>${escapeHtml(time)}</time>
                <strong>${escapeHtml(title)}</strong>
                <p>${escapeHtml(description)}</p>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderPreviewAttractions(rows) {
  if (!rows.length) return "";
  return `
    <section>
      <h2>景点介绍</h2>
      ${rows.map(([name, description]) => `<p><strong>${escapeHtml(name)}</strong> ${escapeHtml(description)}</p>`).join("")}
    </section>
  `;
}

async function saveProduct(event) {
  event.preventDefault();
  const status = event.submitter?.dataset.productStatus || "draft";
  const message = document.querySelector("#productMessage");
  const payload = collectProductForm(status);

  event.submitter.disabled = true;
  event.submitter.textContent = status === "published" ? "发布中..." : "保存中...";
  message.textContent = "";
  message.classList.remove("error", "success");

  try {
    const result = await postJson("/api/admin/products/save", payload);
    const product = normalizeProduct(result.product);
    upsertProduct(product);
    localStorage.setItem("staynestProducts", JSON.stringify(productState.products));
    productState.selectedId = product.id;
    productState.isCreating = false;
    renderAdmin();
    const nextMessage = document.querySelector("#productMessage");
    nextMessage.textContent = status === "published" ? "产品已发布，用户端探索页可见。" : "草稿已保存。";
    nextMessage.classList.add("success");
  } catch (error) {
    message.textContent = error.message || "产品保存失败，请检查填写内容。";
    message.classList.add("error");
    event.submitter.disabled = false;
    event.submitter.textContent = status === "published" ? "发布产品" : "保存草稿";
  }
}

function collectProductForm(status) {
  const payload = {
    id: document.querySelector("#productIdInput").value.trim(),
    title: document.querySelector("#productTitleInput").value.trim(),
    image: document.querySelector("#productImageInput").value.trim(),
    destination: document.querySelector("#productDestinationInput").value,
    preference: document.querySelector("#productPreferenceInput").value,
    duration: document.querySelector("#productDurationInput").value.trim() || "一日游",
    price: Number(document.querySelector("#productPriceInput").value) || 0,
    highlights: parseLineList(document.querySelector("#productHighlightsInput").value),
    bodyBlocks: parseBodyBlocks(document.querySelector("#productBodyContentInput").value),
    status,
  };
  const firstText = payload.bodyBlocks.find((block) => block.type === "text")?.text || "";
  const imageBlocks = payload.bodyBlocks.filter((block) => block.type === "image");
  if (!payload.image && imageBlocks.length) {
    payload.image = imageBlocks[0].src;
  }
  payload.intro = firstText.slice(0, 220);
  payload.spots = payload.highlights.length ? payload.highlights : [payload.destination, payload.preference].filter(Boolean);
  payload.bodyImages = imageBlocks.map((block) => [block.src, block.caption || ""]);
  payload.itinerary = [];
  payload.attractionDetails = [];
  payload.tip = "";
  return payload;
}

async function deleteProduct(id) {
  if (!id) return;
  const selected = productState.products.find((product) => product.id === id);
  const confirmed = window.confirm(`确定删除「${selected?.title || "这个旅游产品"}」吗？删除后用户端将不再显示。`);
  if (!confirmed) return;

  const button = document.querySelector("#deleteProductButton");
  const message = document.querySelector("#productMessage");
  button.disabled = true;
  button.textContent = "删除中...";
  message.textContent = "";
  message.classList.remove("error", "success");

  try {
    await postJson("/api/admin/products/delete", { id });
    productState.products = productState.products.filter((product) => product.id !== id);
    localStorage.setItem("staynestProducts", JSON.stringify(productState.products));
    productState.selectedId = productState.products[0]?.id || "";
    productState.isCreating = false;
    renderAdmin();
  } catch (error) {
    message.textContent = error.message || "产品删除失败，请稍后重试。";
    message.classList.add("error");
    button.disabled = false;
    button.textContent = "删除产品";
  }
}

function parseLineList(value) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDelimitedRows(value, count) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[|｜]/).map((item) => item.trim()).slice(0, count))
    .filter((items) => items.length === count && items.every(Boolean));
}

function parseBodyBlocks(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const imageMatch = line.match(/^(?:图片|image)[:：](.+)$/i);
      if (!imageMatch) {
        return { type: "text", text: line };
      }
      const [src = "", caption = ""] = imageMatch[1].split(/[|｜]/).map((item) => item.trim());
      return { type: "image", src, caption };
    })
    .filter((block) => (block.type === "image" ? block.src : block.text));
}

function formatItinerary(rows) {
  return rows.map((row) => `${row[0] || ""}｜${row[1] || ""}｜${row[2] || ""}`).join("\n");
}

function formatAttractions(rows) {
  return rows.map((row) => `${row[0] || ""}｜${row[1] || ""}`).join("\n");
}

function formatBodyImages(rows) {
  return rows.map((row) => `${row[0] || ""}｜${row[1] || ""}`).join("\n");
}

function formatBodyBlocks(product) {
  const blocks = Array.isArray(product.bodyBlocks) && product.bodyBlocks.length
    ? product.bodyBlocks
    : [
        ...(product.intro ? [{ type: "text", text: product.intro }] : []),
        ...product.bodyImages.map(([src, caption]) => ({ type: "image", src, caption })),
      ];
  return blocks
    .map((block) => {
      if (block.type === "image") return `图片：${block.src || ""}｜${block.caption || ""}`;
      return block.text || "";
    })
    .join("\n\n");
}

function upsertProduct(product) {
  const index = productState.products.findIndex((item) => item.id === product.id);
  if (index >= 0) {
    productState.products[index] = product;
  } else {
    productState.products.unshift(product);
  }
}

async function getJson(url) {
  const response = await fetch(apiUrl(url), { headers: { Accept: "application/json" } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok === false) {
    throw new Error(result.error || "请求失败。");
  }
  return result;
}

async function postJson(url, payload) {
  const response = await fetch(apiUrl(url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok === false) {
    throw new Error(result.error || "请求失败。");
  }
  return result;
}

function apiUrl(path) {
  const base = String(window.STAYNEST_API_BASE || "").replace(/\/+$/, "");
  if (!base || /^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function statusClass(status) {
  if (status === "已通过") return "approved";
  if (status === "已驳回") return "rejected";
  return "pending";
}

function formatMoney(value) {
  return new Intl.NumberFormat("zh-CN").format(Number(value) || 0);
}

function formatDate(value) {
  const normalized = typeof value === "number" && value < 100000000000 ? value * 1000 : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "未记录";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "";
  return formatDate(value);
}

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeText(value) {
  return String(value || "").trim();
}

function refreshAdminIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}

initAdmin();
