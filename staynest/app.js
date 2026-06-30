const listings = [
  {
    id: 1,
    title: "洱海边的白色露台屋",
    location: "大理, 云南",
    category: "湖畔",
    type: "整套民宿",
    guests: 4,
    beds: 2,
    baths: 1,
    price: 1280,
    rating: 4.96,
    host: "Lina",
    tag: "房客最爱",
    dates: "7月12日 - 17日",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=900&q=80",
    amenities: ["湖景露台", "投影", "洗衣机", "厨房", "免费停车"],
  },
  {
    id: 2,
    title: "法租界梧桐树下公寓",
    location: "上海",
    category: "城市",
    type: "设计公寓",
    guests: 2,
    beds: 1,
    baths: 1,
    price: 980,
    rating: 4.89,
    host: "Ming",
    tag: "新上线",
    dates: "8月3日 - 8日",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
    amenities: ["步行街区", "咖啡机", "高速 Wi-Fi", "浴缸"],
  },
  {
    id: 3,
    title: "海岸线玻璃泳池别墅",
    location: "三亚, 海南",
    category: "海边",
    type: "整栋别墅",
    guests: 8,
    beds: 4,
    baths: 3,
    price: 3680,
    rating: 4.94,
    host: "Annie",
    tag: "稀有房源",
    dates: "7月21日 - 26日",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    amenities: ["私人泳池", "海景", "烧烤区", "家庭影院", "管家"],
  },
  {
    id: 4,
    title: "莫干山竹林木屋",
    location: "湖州, 浙江",
    category: "山野",
    type: "独立木屋",
    guests: 3,
    beds: 2,
    baths: 1,
    price: 1460,
    rating: 4.91,
    host: "Chen",
    tag: "自然疗愈",
    dates: "9月1日 - 6日",
    image: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=900&q=80",
    amenities: ["壁炉", "山景", "露营桌椅", "宠物友好"],
  },
  {
    id: 5,
    title: "京都町屋庭院套房",
    location: "京都, 日本",
    category: "历史",
    type: "传统町屋",
    guests: 4,
    beds: 2,
    baths: 1,
    price: 2120,
    rating: 4.98,
    host: "Yuki",
    tag: "高评分",
    dates: "10月8日 - 13日",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80",
    amenities: ["庭院", "榻榻米", "茶具", "地暖", "浴缸"],
  },
  {
    id: 6,
    title: "清迈稻田旁泳池小院",
    location: "清迈, 泰国",
    category: "热带",
    type: "整套小院",
    guests: 5,
    beds: 3,
    baths: 2,
    price: 1680,
    rating: 4.93,
    host: "Mai",
    tag: "长住优惠",
    dates: "11月4日 - 10日",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
    amenities: ["泳池", "花园", "早餐", "瑜伽垫", "厨房"],
  },
];

const trips = [
  {
    id: 101,
    title: "三亚海岸线玻璃泳池别墅",
    date: "7月21日 - 26日",
    status: "已确认",
    image: listings[2].image,
    detail: "8 位房客 · 入住码 4829 · 房东 Annie",
  },
  {
    id: 102,
    title: "京都町屋庭院套房",
    date: "10月8日 - 13日",
    status: "待付款",
    image: listings[4].image,
    detail: "4 位房客 · 48 小时内完成付款",
  },
];

const messages = [];

const categories = [
  ["全部", "sparkles"],
  ["城市", "building-2"],
  ["海边", "waves"],
  ["湖畔", "ship-wheel"],
  ["山野", "mountain"],
  ["热带", "palm-tree"],
  ["历史", "landmark"],
];

const formatter = new Intl.NumberFormat("zh-CN");
const authScreen = document.querySelector("#authScreen");
const registrationScreen = document.querySelector("#registrationScreen");
const mobileApp = document.querySelector("#mobileApp");
const appContent = document.querySelector("#appContent");
const headerTitle = document.querySelector("#headerTitle");
const headerOverline = document.querySelector("#headerOverline");
const avatarInitial = document.querySelector("#avatarInitial");
const listingDialog = document.querySelector("#listingDialog");
const dialogBody = document.querySelector("#dialogBody");

const state = {
  tab: "search",
  category: "全部",
  query: "",
  exploreDestination: "",
  exploreDate: "",
  explorePreference: "",
  selectedExploreProductId: "",
  user: JSON.parse(localStorage.getItem("staynestUser") || "null"),
  saved: new Set(JSON.parse(localStorage.getItem("staynestSaved") || "[]")),
  orders: JSON.parse(localStorage.getItem("staynestOrders") || "[]"),
  activeChatOrderId: "",
  chatThreads: JSON.parse(localStorage.getItem("staynestChatThreads") || "{}"),
  chatPollTimer: null,
  availableOrders: [],
  guideOrderMessage: "",
  productOrderStatus: "",
  guideApplication: null,
  guideFormOpen: false,
  guideSyncing: false,
  guideStatusSyncing: false,
  guideSubmitting: false,
};

state.guideApplication = loadGuideApplicationForUser(state.user);

const exploreDestinations = ["北京", "上海", "成都", "广州"];
const explorePreferences = ["城市景观", "自然风光", "本地美食"];
let exploreProducts = [
  {
    id: "chengdu-panda-old-town",
    title: "熊猫基地与老成都慢生活",
    destination: "成都",
    preference: "城市景观",
    duration: "一日游",
    price: 399,
    image: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=900&q=80",
    spots: ["成都大熊猫繁育研究基地", "文殊院", "宽窄巷子", "人民公园"],
    intro: "上午看熊猫进食和活动，午后转入文殊院与宽窄巷子，最后在人民公园喝盖碗茶，适合第一次到成都的轻松路线。",
    highlights: ["近距离看熊猫", "寺院与老街慢逛", "盖碗茶体验"],
    itinerary: [
      ["08:30", "成都大熊猫繁育研究基地", "赶在熊猫活跃时段入园，看幼年熊猫、成年熊猫活动区和科普展馆。"],
      ["12:00", "文殊院周边午餐", "安排钟水饺、甜水面或豆花等成都小吃，午后进入文殊院感受老成都禅意。"],
      ["15:00", "宽窄巷子城市漫步", "走宽巷子、窄巷子和井巷子，适合拍照、买伴手礼和体验街巷生活。"],
      ["17:00", "人民公园茶馆", "在鹤鸣茶社喝盖碗茶，也可以体验采耳，慢慢结束一天行程。"],
    ],
    attractionDetails: [
      ["成都大熊猫繁育研究基地", "成都代表性景点，适合上午游览，能看到熊猫进食、攀爬和休息的自然状态。"],
      ["文殊院", "市区内安静的寺院片区，周边小吃多，适合把行程节奏放慢。"],
      ["宽窄巷子", "保留川西民居街巷肌理，适合第一次到成都的游客建立城市印象。"],
      ["人民公园", "成都慢生活的典型场景，茶馆、湖边和市井氛围都很集中。"],
    ],
    tip: "熊猫基地建议早到，节假日可提前预约门票；这条路线步行较多，穿舒适鞋更轻松。",
    status: "published",
  },
  {
    id: "chengdu-wuhou-jinli-food",
    title: "武侯祠锦里与川味夜游",
    destination: "成都",
    preference: "本地美食",
    duration: "一日游",
    price: 459,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
    spots: ["武侯祠", "锦里古街", "玉林路", "成都火锅"],
    intro: "从三国文化进入成都街巷烟火，下午逛锦里与玉林路，晚上安排火锅或串串，重点体验成都的市井味道。",
    highlights: ["三国文化", "锦里夜景", "火锅串串"],
    itinerary: [
      ["09:30", "武侯祠", "从刘备殿、诸葛亮殿和红墙竹影开始，了解成都三国文化。"],
      ["12:00", "锦里古街午餐", "在古街里品尝凉粉、锅盔、兔头等本地小吃，节奏轻松。"],
      ["15:00", "玉林路街区", "逛咖啡店、街边小店和生活街巷，感受成都年轻人的日常。"],
      ["18:30", "成都火锅或串串", "晚餐安排川味火锅、串串或冒菜，适合想把美食作为主线的游客。"],
    ],
    attractionDetails: [
      ["武侯祠", "成都三国文化核心景点，红墙夹道也很适合拍照。"],
      ["锦里古街", "夜晚灯光和街边小吃集中，适合衔接晚餐前后的轻松游览。"],
      ["玉林路", "本地生活气息强，有小酒馆、咖啡店和社区街巷。"],
      ["成都火锅", "建议根据口味选择微辣或鸳鸯锅，第一次吃川味可以先从温和锅底开始。"],
    ],
    tip: "这条路线美食较多，午餐和晚餐可以适当错峰；不能吃辣的游客可提前备注口味。",
    status: "published",
  },
  {
    id: "chengdu-dujiangyan-qingcheng",
    title: "都江堰青城山清氧一日",
    destination: "成都",
    preference: "自然风光",
    duration: "一日游",
    price: 699,
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
    spots: ["都江堰景区", "南桥", "青城山", "山间茶歇"],
    intro: "上午看都江堰水利工程，午后去青城山感受林木、石阶和道观清幽，适合想离开市区亲近自然的旅行者。",
    highlights: ["世界遗产", "山林徒步", "清爽自然"],
    itinerary: [
      ["08:00", "从成都出发", "乘车前往都江堰，途中介绍岷江水系和川西平原。"],
      ["10:00", "都江堰景区", "游览鱼嘴、飞沙堰、宝瓶口，理解古代水利工程如何改变成都平原。"],
      ["13:00", "南桥与午餐", "在南桥附近午餐，顺路看古城水岸景观。"],
      ["15:00", "青城山前山", "选择轻徒步路线，看林木、石阶和道观，傍晚返回成都。"],
    ],
    attractionDetails: [
      ["都江堰景区", "两千多年仍在使用的水利工程，兼具历史、工程和自然景观。"],
      ["南桥", "都江堰古城附近的地标桥梁，夜景和水岸氛围都不错。"],
      ["青城山", "以幽静山林和道教文化闻名，适合喜欢自然风光的人。"],
      ["山间茶歇", "把徒步节奏放慢，在山间茶铺休息，体验川西慢生活。"],
    ],
    tip: "这条路线离市区较远，建议早出发；青城山有台阶，老人儿童可选择更轻松的游览段。",
    status: "published",
  },
  {
    id: "chengdu-taikooli-city",
    title: "太古里春熙路城市封面",
    destination: "成都",
    preference: "城市景观",
    duration: "一日游",
    price: 369,
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80",
    spots: ["太古里", "大慈寺", "IFS", "九眼桥夜景"],
    intro: "把成都的现代商业、寺院静谧和夜色桥景串在一起，适合喜欢拍照、购物和城市漫游的轻量行程。",
    highlights: ["城市拍照", "潮流购物", "九眼桥夜景"],
    itinerary: [
      ["10:00", "太古里与大慈寺", "从现代街区走入古寺院，体验成都新旧并置的城市气质。"],
      ["12:30", "春熙路午餐", "选择川菜、小吃或轻食，午餐后逛春熙路商圈。"],
      ["15:00", "IFS 与城市地标", "打卡熊猫爬墙装置，逛设计店、买伴手礼或安排下午茶。"],
      ["19:00", "九眼桥夜景", "傍晚前往九眼桥，沿河散步，拍成都夜色和酒吧街氛围。"],
    ],
    attractionDetails: [
      ["太古里", "成都代表性开放式商业街区，建筑尺度舒适，适合城市漫游。"],
      ["大慈寺", "位于商圈中的寺院，安静感和周边现代街区形成鲜明对比。"],
      ["IFS", "春熙路地标综合体，熊猫装置是游客常拍的城市符号。"],
      ["九眼桥", "成都夜生活和河岸夜景集中区域，适合晚上收尾。"],
    ],
    tip: "这条路线适合不想太早出门的游客；夜游九眼桥时注意保管随身物品。",
    status: "published",
  },
  {
    id: "chengdu-tea-snacks",
    title: "茶馆小吃与市井成都",
    destination: "成都",
    preference: "本地美食",
    duration: "一日游",
    price: 329,
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80",
    spots: ["人民公园", "鹤鸣茶社", "奎星楼街", "宽窄巷子夜色"],
    intro: "从茶馆、采耳、小吃街到夜晚巷子，把节奏放慢，适合想用一天感受成都日常生活和本地小吃的人。",
    highlights: ["茶馆体验", "街巷小吃", "市井慢游"],
    itinerary: [
      ["10:00", "人民公园", "从湖边、相亲角和老茶馆开始，观察成都本地人的日常。"],
      ["11:00", "鹤鸣茶社", "坐下来喝盖碗茶，可按需体验采耳，把上午节奏放慢。"],
      ["13:30", "奎星楼街", "午后安排小吃巡游，适合尝试冰粉、冒菜、串串和甜品。"],
      ["18:00", "宽窄巷子夜色", "夜晚回到老街区散步，适合拍照和补充小吃。"],
    ],
    attractionDetails: [
      ["人民公园", "最能感受成都松弛感的市区公园，茶馆文化非常集中。"],
      ["鹤鸣茶社", "传统茶馆氛围明显，适合第一次体验盖碗茶。"],
      ["奎星楼街", "本地年轻人也常去的小吃街，口味选择丰富。"],
      ["宽窄巷子夜色", "夜晚灯光和街巷氛围更明显，适合作为轻松收尾。"],
    ],
    tip: "这条路线吃喝较多，建议少量多次；热门小吃店可能排队，可以灵活替换。",
    status: "published",
  },
];

const authState = {
  countdown: 0,
  timer: null,
  config: {},
  registrationToken: "",
  registrationPhone: "",
};

const tabMeta = {
  search: ["探索", "探索下一段旅程"],
  trips: ["行程", "即将出发"],
  messages: ["消息", "订单与聊天"],
  profile: ["我的资料", "账号中心"],
};

async function init() {
  loadAuthConfig();
  bindAuth();
  bindRegistration();
  bindAppShell();
  document.querySelector("#dialogClose").addEventListener("click", () => listingDialog.close());
  listingDialog.addEventListener("click", (event) => {
    if (event.target === listingDialog) listingDialog.close();
  });

  await loadExploreProducts();
  await loadRouteOrders();

  if (state.user) {
    enterApp();
  }
  refreshIcons();
  registerServiceWorker();
}

async function loadExploreProducts() {
  try {
    const result = await getJson("/api/products");
    if (Array.isArray(result.products)) {
      exploreProducts = result.products.map(normalizeExploreProduct);
    }
  } catch {
    // Keep built-in demo routes available when the backend is offline.
  }
}

async function loadRouteOrders() {
  const token = localStorage.getItem("staynestToken") || "";
  const applyOrders = (orders = []) => {
    state.orders = filterOrdersForCurrentUser(orders.map(normalizeRouteOrder));
    localStorage.setItem("staynestOrders", JSON.stringify(state.orders));
    return state.orders;
  };

  if (token) {
    try {
      const result = await getJson("/api/orders", { Authorization: `Bearer ${token}` });
      const matchedOrders = applyOrders(Array.isArray(result.orders) ? result.orders : []);
      if (matchedOrders.length) return;
    } catch {
      // Fall back to the admin order feed below.
    }
  }

  try {
    const result = await getJson("/api/admin/orders");
    applyOrders(Array.isArray(result.orders) ? result.orders : []);
  } catch {
    // Keep local orders available when the backend is offline.
  }
}

function filterOrdersForCurrentUser(ordersToFilter) {
  const userPhone = String(state.user?.phone || state.guideApplication?.phone || "").replace(/[^\d]/g, "");
  const userName = String(state.user?.nickname || state.user?.name || state.guideApplication?.realName || "").trim();
  return ordersToFilter.filter((order) => {
    const travelerPhone = String(order.travelerPhone || "").replace(/[^\d]/g, "");
    const guidePhone = String(order.guidePhone || "").replace(/[^\d]/g, "");
    const travelerName = String(order.travelerName || "").trim();
    const guideName = String(order.guideName || "").trim();
    return (
      (userPhone && (travelerPhone === userPhone || guidePhone === userPhone)) ||
      (userName && (travelerName === userName || guideName === userName))
    );
  });
}

function normalizeExploreProduct(product) {
  return {
    id: product.id || `product-${Date.now()}`,
    title: product.title || "未命名路线",
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
  };
}

function bindAuth() {
  document.querySelectorAll("[data-provider]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!document.querySelector("#termsInput").checked) {
        setAuthMessage("请先勾选服务条款和隐私政策。", "error");
        return;
      }

      const provider = button.dataset.provider;
      const providerName = provider === "apple" ? "Apple ID" : "Google";
      button.disabled = true;
      setAuthMessage(`正在连接 ${providerName}...`, "success");

      try {
        if (provider === "apple") {
          await signInWithApple();
        } else {
          window.setTimeout(() => {
            login({
              name: "Google 用户",
              method: providerName,
              phone: "",
            });
          }, 500);
        }
      } catch (error) {
        setAuthMessage(error.message || `${providerName} 登录失败。`, "error");
      } finally {
        button.disabled = false;
      }
    });
  });

  document.querySelector("#sendCodeButton").addEventListener("click", async () => {
    const phone = getFullPhoneNumber();
    if (!validatePhone(phone)) {
      setAuthMessage("请输入有效手机号。", "error");
      document.querySelector("#phoneInput").focus();
      return;
    }

    const button = document.querySelector("#sendCodeButton");
    button.disabled = true;
    button.textContent = "发送中...";
    setAuthMessage("正在发送验证码...", "success");

    try {
      const result = await postJson("/api/auth/send-code", { phone });
      const devTip = result.devCode ? ` 开发验证码：${result.devCode}` : "";
      setAuthMessage(`${result.message || "验证码已发送。"}${devTip}`, "success");
      startCodeCountdown(result.retryAfter || 60);
      document.querySelector("#codeInput").focus();
    } catch (error) {
      setAuthMessage(error.message || "验证码发送失败。", "error");
      updateSendCodeButton();
    }
  });

  document.querySelector("#phoneInput").addEventListener("input", () => {
    setAuthMessage("", "");
  });

  document.querySelector("#codeInput").addEventListener("input", (event) => {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 6);
    setAuthMessage("", "");
  });

  document.querySelector("#termsInput").addEventListener("change", () => {
    setAuthMessage("", "");
  });
  document.querySelector(".agree-row").addEventListener("click", (event) => {
    if (event.target.id === "termsInput") return;
    const checkbox = document.querySelector("#termsInput");
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
  });

  document.querySelector("#phoneLoginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const phone = getFullPhoneNumber();
    const code = document.querySelector("#codeInput").value.trim();

    if (!validatePhone(phone)) {
      setAuthMessage("请输入有效手机号。", "error");
      document.querySelector("#phoneInput").focus();
      return;
    }

    if (code.length !== 6) {
      setAuthMessage("请输入 6 位验证码。", "error");
      document.querySelector("#codeInput").focus();
      return;
    }

    if (!document.querySelector("#termsInput").checked) {
      setAuthMessage("请先勾选服务条款和隐私政策。", "error");
      document.querySelector("#termsInput").focus();
      return;
    }

    const loginButton = document.querySelector("#phoneLoginButton");
    loginButton.disabled = true;
    loginButton.textContent = "正在登录...";
    setAuthMessage("正在校验验证码...", "success");

    try {
      const result = await postJson("/api/auth/verify-code", { phone, code });
      if (result.requiresRegistration) {
        loginButton.disabled = false;
        loginButton.textContent = "手机号登录";
        showRegistration(result.registrationToken, result.phone);
        return;
      }

      localStorage.setItem("staynestToken", result.token);
      setAuthMessage("验证通过，正在进入 StayNest。", "success");
      loginButton.disabled = false;
      loginButton.textContent = "手机号登录";
      login(result.user);
    } catch (error) {
      loginButton.disabled = false;
      loginButton.textContent = "手机号登录";
      setAuthMessage(error.message || "登录失败，请稍后重试。", "error");
    }
  });
}

function bindRegistration() {
  document.querySelector("#registrationBackButton").addEventListener("click", () => {
    registrationScreen.classList.add("hidden");
    authScreen.classList.remove("hidden");
    refreshIcons();
  });

  document.querySelector("#registrationForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.querySelector("#nameInput").value.trim();
    const gender = document.querySelector("#genderInput").value;
    const bio = document.querySelector("#bioInput").value.trim();
    if (!name) {
      setRegistrationMessage("请输入姓名。", "error");
      document.querySelector("#nameInput").focus();
      return;
    }
    if (!gender) {
      setRegistrationMessage("请选择性别。", "error");
      document.querySelector("#genderInput").focus();
      return;
    }
    if (!bio) {
      setRegistrationMessage("请填写个人信息介绍。", "error");
      document.querySelector("#bioInput").focus();
      return;
    }

    const button = document.querySelector("#registrationSubmitButton");
    button.disabled = true;
    button.textContent = "正在创建...";
    setRegistrationMessage("正在创建你的资料...", "success");

    try {
      const result = await postJson(
        "/api/auth/register",
        {
          name,
          gender,
          bio,
        },
        {
          Authorization: `Bearer ${authState.registrationToken}`,
        },
      );
      localStorage.setItem("staynestToken", result.token);
      login(result.user);
    } catch (error) {
      setRegistrationMessage(error.message || "注册失败，请稍后重试。", "error");
    } finally {
      button.disabled = false;
      button.textContent = "完成注册";
    }
  });
}

function showRegistration(registrationToken, label, suggestedName = "") {
  authState.registrationToken = registrationToken || "";
  authState.registrationPhone = label || "";
  authScreen.classList.add("hidden");
  mobileApp.classList.add("hidden");
  registrationScreen.classList.remove("hidden");
  const verifiedLabel = label || "手机号";
  document.querySelector("#registrationPhoneText").textContent = verifiedLabel.endsWith("已验证") ? verifiedLabel : `${verifiedLabel} 已验证`;
  document.querySelector("#registrationForm").reset();
  if (suggestedName) {
    document.querySelector("#nameInput").value = suggestedName.slice(0, 24);
  }
  setRegistrationMessage("", "");
  document.querySelector("#nameInput").focus();
  refreshIcons();
}

function setRegistrationMessage(text, type) {
  const message = document.querySelector("#registrationMessage");
  message.textContent = text;
  message.classList.toggle("error", type === "error");
  message.classList.toggle("success", type === "success");
}

async function loadAuthConfig() {
  try {
    authState.config = await getJson("/api/auth/config");
  } catch {
    authState.config = {};
  }
}

function apiUrl(path) {
  const base = String(window.STAYNEST_API_BASE || "").replace(/\/+$/, "");
  if (!base || /^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function getJson(url, extraHeaders = {}) {
  const requestUrl = apiUrl(url);
  let response;
  try {
    response = await fetch(requestUrl, { headers: { Accept: "application/json", ...extraHeaders } });
  } catch (error) {
    throw new Error(`请求没有发出去：${error.message || error.name || "网络被阻止"}。地址：${requestUrl}`);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok === false) {
    throw new Error(`${result.error || `请求失败 ${response.status}`}。地址：${requestUrl}`);
  }
  return result;
}

async function signInWithApple() {
  const nativeApplePlugin = window.Capacitor?.Plugins?.SignInWithApple;
  if (nativeApplePlugin) {
    const nativeClientId = authState.config.appleNativeClientId || "com.staynest.app";
    const result = await nativeApplePlugin.authorize({
      clientId: nativeClientId,
      redirectURI: authState.config.appleRedirectUri || window.location.origin,
      scopes: "email name",
      state: makeNonce(),
      nonce: makeNonce(),
    });
    const appleResponse = result?.response || result || {};
    const identityToken = appleResponse.identityToken || appleResponse.identity_token;
    if (!identityToken) {
      throw new Error("Apple 未返回 identityToken。");
    }
    const fullName = [appleResponse.givenName, appleResponse.familyName].filter(Boolean).join(" ");
    await finishAppleSignIn(identityToken, fullName);
    return;
  }

  const clientId = authState.config.appleClientId;
  if (!clientId) throw new Error("Apple 登录未配置：请在后端设置 APPLE_CLIENT_ID。");
  if (!window.AppleID?.auth) {
    throw new Error("Apple 登录 SDK 未加载，请确认网络可访问 appleid.cdn-apple.com。");
  }

  const redirectURI = authState.config.appleRedirectUri || window.location.origin;
  window.AppleID.auth.init({
    clientId,
    scope: "name email",
    redirectURI,
    state: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    nonce: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    usePopup: true,
  });

  const response = await window.AppleID.auth.signIn();
  const identityToken = response?.authorization?.id_token;
  if (!identityToken) {
    throw new Error("Apple 未返回 identityToken。");
  }

  const fullName = response?.user?.name
    ? [response.user.name.firstName, response.user.name.lastName].filter(Boolean).join(" ")
    : "";
  await finishAppleSignIn(identityToken, fullName);
}

function makeNonce() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function finishAppleSignIn(identityToken, name = "") {
  const result = await postJson("/api/auth/apple", { identityToken, name });
  if (result.requiresRegistration) {
    showRegistration(result.registrationToken, result.registrationLabel || "Apple ID 已验证", result.name || name);
    setRegistrationMessage("请先完善资料，完成后即可进入 StayNest。", "success");
    return;
  }
  localStorage.setItem("staynestToken", result.token);
  login(result.user);
}

async function postJson(url, payload, extraHeaders = {}) {
  const requestUrl = apiUrl(url);
  let response;
  try {
    response = await fetch(requestUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(`请求没有发出去：${error.message || error.name || "网络被阻止"}。地址：${requestUrl}`);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok === false) {
    throw new Error(`${result.error || `请求失败 ${response.status}`}。地址：${requestUrl}`);
  }
  return result;
}

function getFullPhoneNumber() {
  const countryCode = document.querySelector("#countryCodeInput").value;
  const phone = document.querySelector("#phoneInput").value.replace(/[^\d]/g, "");
  return `${countryCode} ${phone}`;
}

function getTodayDate() {
  const date = new Date();
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return offsetDate.toISOString().slice(0, 10);
}

function validatePhone(value) {
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function setAuthMessage(text, type) {
  const message = document.querySelector("#authMessage");
  message.textContent = text;
  message.classList.toggle("error", type === "error");
  message.classList.toggle("success", type === "success");
}

function startCodeCountdown(seconds = 60) {
  authState.countdown = seconds;
  updateSendCodeButton();
  window.clearInterval(authState.timer);
  authState.timer = window.setInterval(() => {
    authState.countdown -= 1;
    updateSendCodeButton();
    if (authState.countdown <= 0) {
      window.clearInterval(authState.timer);
    }
  }, 1000);
}

function updateSendCodeButton() {
  const button = document.querySelector("#sendCodeButton");
  if (authState.countdown > 0) {
    button.disabled = true;
    button.textContent = `${authState.countdown}s`;
    return;
  }

  button.disabled = false;
  button.textContent = "发送验证码";
}

function resetAuthForm() {
  window.clearInterval(authState.timer);
  authState.countdown = 0;
  authState.timer = null;
  document.querySelector("#phoneLoginForm").reset();
  document.querySelector("#phoneLoginButton").disabled = false;
  document.querySelector("#phoneLoginButton").textContent = "手机号登录";
  updateSendCodeButton();
  setAuthMessage("", "");
}

function resetRegistrationForm() {
  authState.registrationToken = "";
  authState.registrationPhone = "";
  document.querySelector("#registrationForm").reset();
  setRegistrationMessage("", "");
}

function bindAppShell() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
  });

  document.querySelector("#quickProfile").addEventListener("click", () => setTab("profile"));
}

function login(user) {
  state.user = user;
  state.guideApplication = loadGuideApplicationForUser(user);
  state.guideFormOpen = false;
  localStorage.setItem("staynestUser", JSON.stringify(user));
  enterApp();
  loadRouteOrders().then(() => {
    if (state.tab === "trips") {
      renderTrips();
      refreshIcons();
    }
  });
}

function logout() {
  state.user = null;
  state.guideApplication = null;
  state.guideFormOpen = false;
  state.orders = [];
  localStorage.removeItem("staynestUser");
  localStorage.removeItem("staynestToken");
  localStorage.removeItem("staynestOrders");
  mobileApp.classList.add("hidden");
  registrationScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");
  resetAuthForm();
  resetRegistrationForm();
  refreshIcons();
}

function enterApp() {
  authScreen.classList.add("hidden");
  registrationScreen.classList.add("hidden");
  mobileApp.classList.remove("hidden");
  avatarInitial.textContent = (state.user?.nickname || state.user?.name || "Y").slice(0, 1).toUpperCase();
  setTab(state.tab);
  refreshGuideApplicationFromServer();
}

function getGuideStorageKey(user = state.user) {
  const phone = String(user?.phone || "").replace(/[^\d]/g, "");
  if (phone) return `staynestGuideApplication:${phone}`;
  const name = String(user?.nickname || user?.name || "").trim();
  return name ? `staynestGuideApplication:name:${name}` : "";
}

function loadGuideApplicationForUser(user = state.user) {
  const key = getGuideStorageKey(user);
  if (!key) return null;

  const scopedApplication = JSON.parse(localStorage.getItem(key) || "null");
  if (scopedApplication) return scopedApplication;

  const legacyApplication = JSON.parse(localStorage.getItem("staynestGuideApplication") || "null");
  const userPhone = String(user?.phone || "");
  if (legacyApplication?.phone && userPhone && legacyApplication.phone === userPhone) {
    localStorage.setItem(key, JSON.stringify(legacyApplication));
    return legacyApplication;
  }
  return null;
}

function saveGuideApplicationForUser(application) {
  const storedApplication = slimGuideApplicationForStorage(application);
  const key = getGuideStorageKey();
  if (key) localStorage.setItem(key, JSON.stringify(storedApplication));
  localStorage.setItem("staynestGuideApplication", JSON.stringify(storedApplication));
}

function clearGuideApplicationForUser() {
  const key = getGuideStorageKey();
  if (key) localStorage.removeItem(key);
  localStorage.removeItem("staynestGuideApplication");
}

function setTab(tab) {
  if (tab !== "messages") {
    stopChatPolling();
  }
  state.tab = tab;
  const [title, overline] = tabMeta[tab];
  headerTitle.textContent = title;
  headerOverline.textContent = overline;
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });

  const renderers = {
    search: renderSearch,
    trips: renderTrips,
    messages: renderMessages,
    profile: renderProfile,
  };
  renderers[tab]();
  refreshIcons();
}

function renderSearch() {
  refreshGuideApplicationFromServer();

  if (isApprovedGuide()) {
    renderGuideExplore();
    return;
  }

  const selectedProduct = exploreProducts.find((product) => product.id === state.selectedExploreProductId);
  if (selectedProduct) {
    renderExploreProductDetail(selectedProduct);
    return;
  }

  const products = getFilteredExploreProducts();
  appContent.innerHTML = `
    <section class="explore-filter-panel" aria-label="探索筛选">
      <label class="explore-field">
        <span>目的地</span>
        <select id="exploreDestinationInput">
          <option value="">选择城市</option>
          ${exploreDestinations
            .map((destination) => `<option value="${destination}" ${state.exploreDestination === destination ? "selected" : ""}>${destination}</option>`)
            .join("")}
        </select>
      </label>

      <label class="explore-field">
        <span>行程日期</span>
        <input id="exploreDateInput" type="date" value="${escapeHtml(state.exploreDate)}" />
      </label>

      <fieldset class="explore-preferences">
        <legend>行程偏好</legend>
        <div>
          ${explorePreferences
            .map(
              (preference) => `
                <button class="${state.explorePreference === preference ? "active" : ""}" type="button" data-preference="${preference}">
                  ${preference}
                </button>
              `,
            )
            .join("")}
        </div>
      </fieldset>
    </section>

    <section class="section-head">
      <h3>成都一日游路线</h3>
      <span>${products.length} 条路线</span>
    </section>

    <div class="explore-route-list">
      ${
        products.length
          ? products.map(renderExploreProductCard).join("")
          : `<section class="empty-state explore-empty"><strong>暂无匹配路线</strong><span>换一个目的地或行程偏好试试。</span></section>`
      }
    </div>
  `;

  document.querySelector("#exploreDestinationInput").addEventListener("change", (event) => {
    state.exploreDestination = event.target.value;
    state.selectedExploreProductId = "";
    renderSearch();
    refreshIcons();
  });

  document.querySelector("#exploreDateInput").addEventListener("change", (event) => {
    state.exploreDate = event.target.value;
  });

  document.querySelector(".explore-preferences").addEventListener("click", (event) => {
    const button = event.target.closest("[data-preference]");
    if (!button) return;
    state.explorePreference = state.explorePreference === button.dataset.preference ? "" : button.dataset.preference;
    state.selectedExploreProductId = "";
    renderSearch();
    refreshIcons();
  });

  document.querySelector(".explore-route-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-route-id]");
    if (!button) return;
    state.selectedExploreProductId = button.dataset.routeId;
    renderSearch();
    refreshIcons();
    appContent.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function isApprovedGuide() {
  const status = state.guideApplication?.reviewStatus || state.guideApplication?.status || "";
  return status === "已通过";
}

async function loadAvailableOrders() {
  try {
    const result = await getJson("/api/orders/available");
    state.availableOrders = Array.isArray(result.orders) ? result.orders.map(normalizeRouteOrder) : [];
  } catch {
    state.availableOrders = [];
  }
}

function renderGuideExplore() {
  loadAvailableOrders().then(() => {
    if (state.tab === "search" && isApprovedGuide()) {
      renderGuideExploreContent();
      refreshIcons();
    }
  });
  renderGuideExploreContent();
}

function renderGuideExploreContent() {
  appContent.innerHTML = `
    <section class="guide-order-head">
      <div>
        <span class="overline">导游抢单</span>
        <h3>游客下单信息</h3>
        <p>游客提交订单后会显示在这里，你可以根据目的地、日期和路线内容决定是否抢单。</p>
      </div>
      <button class="ghost-button" id="refreshGuideOrdersButton" type="button">
        <i data-lucide="refresh-cw"></i>
        刷新
      </button>
    </section>

    <p class="auth-message ${state.guideOrderMessage ? "success" : ""}" id="guideOrderMessage" role="status" aria-live="polite">${escapeHtml(state.guideOrderMessage)}</p>

    <div class="guide-order-list">
      ${
        state.availableOrders.length
          ? state.availableOrders.map(renderGuideOrderCard).join("")
          : `<section class="empty-state explore-empty"><strong>暂无可抢订单</strong><span>有游客下单后会出现在这里。</span></section>`
      }
    </div>
  `;

  document.querySelector("#refreshGuideOrdersButton").addEventListener("click", async () => {
    await loadAvailableOrders();
    state.guideOrderMessage = "";
    renderGuideExploreContent();
    refreshIcons();
  });

  document.querySelector(".guide-order-list").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-grab-order]");
    if (!button) return;
    await grabGuideOrder(button.dataset.grabOrder);
  });
}

function renderGuideOrderCard(order) {
  return `
    <article class="guide-order-card">
      <div class="guide-order-card-body">
        <div class="guide-order-main">
          <div class="guide-order-title-row">
            <h3>${escapeHtml(order.productTitle)}</h3>
            <strong>¥${formatter.format(order.price)} / 人</strong>
          </div>
          <div class="guide-order-meta">
            <span>${escapeHtml(order.destination || "目的地")} · ${escapeHtml(order.preference || "偏好")} · ${escapeHtml(order.duration || "行程")}</span>
            <span><i data-lucide="calendar-days"></i>${escapeHtml(order.travelDate || "未选日期")}</span>
          </div>
          <section class="guide-order-traveler">
            <span>下单人</span>
            <strong>${escapeHtml(order.travelerName || "游客")}</strong>
            <small>${escapeHtml(order.travelerPhone || "手机号未留")}</small>
          </section>
        </div>
        <button class="primary-button guide-grab-button" type="button" data-grab-order="${escapeHtml(order.id)}">抢单</button>
      </div>
    </article>
  `;
}

async function grabGuideOrder(orderId) {
  const order = state.availableOrders.find((item) => item.id === orderId);
  if (!order) return;
  const token = localStorage.getItem("staynestToken") || "";
  try {
    const result = await postJson(
      "/api/orders/grab",
      {
        orderId,
        guideName: state.guideApplication?.realName || state.user?.nickname || state.user?.name || "导游",
        guidePhone: state.user?.phone || state.guideApplication?.phone || "",
      },
      token ? { Authorization: `Bearer ${token}` } : {},
    );
    const grabbedOrder = normalizeRouteOrder(result.order || order);
    upsertRouteOrder(grabbedOrder);
    state.availableOrders = state.availableOrders.filter((item) => item.id !== orderId);
    state.guideOrderMessage = `已抢到「${order.productTitle}」订单。`;
  } catch (error) {
    state.guideOrderMessage = error.message || "抢单失败，请刷新后重试。";
  }
  renderGuideExploreContent();
  refreshIcons();
}

function getFilteredExploreProducts() {
  return exploreProducts.filter((product) => {
    const isPublished = product.status === "published";
    const matchesDestination = !state.exploreDestination || product.destination === state.exploreDestination;
    const matchesPreference = !state.explorePreference || product.preference === state.explorePreference;
    return isPublished && matchesDestination && matchesPreference;
  });
}

function renderExploreProductCard(product) {
  return `
    <button class="explore-route-card" type="button" data-route-id="${escapeHtml(product.id)}" aria-label="查看 ${escapeHtml(product.title)} 的详细行程">
      <img src="${product.image}" alt="${escapeHtml(product.title)}" />
      <div class="explore-route-copy">
        <div class="explore-route-head">
          <span class="pill">${escapeHtml(product.preference)}</span>
          <small>${escapeHtml(product.destination)} · ${escapeHtml(product.duration)}</small>
        </div>
        <h3>${escapeHtml(product.title)}</h3>
        <p>${escapeHtml(product.intro)}</p>
        <div class="route-card-footer">
          <strong>¥${formatter.format(product.price)} / 人</strong>
          <span>可选日期下单</span>
        </div>
        <div class="route-spot-list">
          ${product.spots.map((spot) => `<span>${escapeHtml(spot)}</span>`).join("")}
        </div>
      </div>
    </button>
  `;
}

function renderExploreProductDetail(product) {
  const selectedDate = state.exploreDate || getTodayDate();
  appContent.innerHTML = `
    <button class="back-button route-detail-back" id="exploreDetailBack" type="button">
      <i data-lucide="arrow-left"></i>
      返回探索
    </button>

    <article class="route-detail">
      <img class="route-detail-hero" src="${product.image}" alt="${escapeHtml(product.title)}" />
      <div class="route-detail-body">
        <div class="explore-route-head">
          <span class="pill">${escapeHtml(product.preference)}</span>
          <small>${escapeHtml(product.destination)} · ${escapeHtml(product.duration)}</small>
        </div>
        <h2>${escapeHtml(product.title)}</h2>

        <section class="route-detail-block">
          <h3>路线亮点</h3>
          <div class="route-spot-list">
            ${product.highlights.map((highlight) => `<span>${escapeHtml(highlight)}</span>`).join("")}
          </div>
        </section>

        <section class="route-detail-block route-body-content">
          <h3>正文介绍</h3>
          ${renderRouteBodyBlocks(product)}
        </section>

        ${!product.bodyBlocks?.length && product.itinerary.length ? `<section class="route-detail-block">
          <h3>详细行程</h3>
          <div class="route-timeline">
            ${product.itinerary
              .map(
                ([time, title, description]) => `
                  <div class="route-timeline-item">
                    <time>${escapeHtml(time)}</time>
                    <div>
                      <strong>${escapeHtml(title)}</strong>
                      <p>${escapeHtml(description)}</p>
                    </div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>` : ""}

        ${!product.bodyBlocks?.length && product.attractionDetails.length ? `<section class="route-detail-block">
          <h3>景点介绍</h3>
          <div class="route-place-list">
            ${product.attractionDetails
              .map(
                ([name, description]) => `
                  <div>
                    <strong>${escapeHtml(name)}</strong>
                    <p>${escapeHtml(description)}</p>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>` : ""}

        ${!product.bodyBlocks?.length && product.tip ? `<section class="route-tip">
          <strong>出行提示</strong>
          <p>${escapeHtml(product.tip)}</p>
        </section>` : ""}

        <form class="route-booking-panel" id="routeOrderForm">
          <div>
            <span>路线价格</span>
            <strong>¥${formatter.format(product.price)} / 人</strong>
            <small>${escapeHtml(product.duration)} · ${escapeHtml(product.destination)}</small>
          </div>
          <label>
            <span>指定出行日期</span>
            <input id="routeOrderDateInput" type="date" min="${getTodayDate()}" value="${escapeHtml(selectedDate)}" />
          </label>
          <button class="primary-button" id="routeOrderButton" type="submit">立即下单</button>
          <p class="auth-message" id="routeOrderMessage" role="status" aria-live="polite">${escapeHtml(state.productOrderStatus)}</p>
        </form>
      </div>
    </article>
  `;

  document.querySelector("#exploreDetailBack").addEventListener("click", () => {
    state.selectedExploreProductId = "";
    state.productOrderStatus = "";
    renderSearch();
    refreshIcons();
  });
  document.querySelector("#routeOrderForm").addEventListener("submit", (event) => createRouteOrder(event, product));
}

async function createRouteOrder(event, product) {
  event.preventDefault();
  const dateInput = document.querySelector("#routeOrderDateInput");
  const message = document.querySelector("#routeOrderMessage");
  const button = document.querySelector("#routeOrderButton");
  const travelDate = dateInput.value;

  if (!travelDate) {
    showRouteOrderMessage("请选择出行日期。", "error");
    return;
  }
  if (travelDate < getTodayDate()) {
    showRouteOrderMessage("出行日期不能早于今天。", "error");
    return;
  }

  state.exploreDate = travelDate;
  button.disabled = true;
  button.textContent = "下单中...";
  message.textContent = "";
  message.classList.remove("error", "success");

  try {
    const token = localStorage.getItem("staynestToken") || "";
    const result = await postJson(
      "/api/orders",
      {
        productId: product.id,
        travelDate,
        travelerName: state.user?.nickname || state.user?.name || "游客",
        travelerPhone: state.user?.phone || "",
      },
      token ? { Authorization: `Bearer ${token}` } : {},
    );
    const order = normalizeRouteOrder(result.order);
    upsertRouteOrder(order);
    state.productOrderStatus = "下单成功，订单已进入行程页，等待平台确认。";
    showRouteOrderMessage(state.productOrderStatus, "success");
  } catch (error) {
    const order = createLocalRouteOrder(product, travelDate);
    upsertRouteOrder(order);
    sendOrderPixel(order);
    state.productOrderStatus = "下单成功，订单已进入行程页，等待平台确认。";
    showRouteOrderMessage(state.productOrderStatus, "success");
  } finally {
    button.disabled = false;
    button.textContent = "立即下单";
  }
}

function createLocalRouteOrder(product, travelDate) {
  return normalizeRouteOrder({
    id: `local-order-${Date.now()}`,
    productId: product.id,
    productTitle: product.title,
    productImage: product.image,
    destination: product.destination,
    preference: product.preference,
    duration: product.duration,
    travelDate,
    price: product.price,
    travelerName: state.user?.nickname || state.user?.name || "游客",
    travelerPhone: state.user?.phone || "",
    status: "待确认",
    createdAt: new Date().toISOString(),
  });
}

function sendOrderPixel(order) {
  const image = new Image();
  image.src = apiUrl(`/api/orders/track.gif?payload=${encodeURIComponent(JSON.stringify(order))}&t=${Date.now()}`);
}

function normalizeRouteOrder(order = {}) {
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
    guideName: order.guideName || "",
    guidePhone: order.guidePhone || "",
    claimedAt: order.claimedAt || "",
    status: order.status || "待确认",
    createdAt: order.createdAt || "",
  };
}

function getChatIdentity() {
  return {
    name: String(state.user?.nickname || state.user?.name || state.guideApplication?.realName || "").trim(),
    phone: String(state.user?.phone || state.guideApplication?.phone || "").trim(),
  };
}

function isOwnChatMessage(message) {
  if (message.from) return message.from === "me";
  const identity = getChatIdentity();
  const senderPhone = String(message.senderPhone || "").replace(/[^\d]/g, "");
  const userPhone = String(identity.phone || "").replace(/[^\d]/g, "");
  const senderName = String(message.senderName || "").trim();
  return Boolean((userPhone && senderPhone === userPhone) || (identity.name && senderName === identity.name));
}

function normalizeChatMessage(message = {}) {
  return {
    id: message.id || `local-${Date.now()}`,
    orderId: message.orderId || "",
    senderName: message.senderName || "",
    senderPhone: message.senderPhone || "",
    senderRole: message.senderRole || "",
    text: message.text || "",
    createdAt: message.createdAt || "",
    isMine: isOwnChatMessage(message),
  };
}

async function loadOrderChat(orderId) {
  const identity = getChatIdentity();
  const params = new URLSearchParams({
    orderId,
    name: identity.name,
    phone: identity.phone,
  });
  const token = localStorage.getItem("staynestToken") || "";
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const result = await getJson(`/api/orders/chat?${params.toString()}`, headers);
  const thread = Array.isArray(result.messages) ? result.messages.map(normalizeChatMessage) : [];
  state.chatThreads[orderId] = thread;
  localStorage.setItem("staynestChatThreads", JSON.stringify(state.chatThreads));
  return thread;
}

async function sendOrderChat(order, text) {
  const identity = getChatIdentity();
  const token = localStorage.getItem("staynestToken") || "";
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const result = await postJson(
    "/api/orders/chat",
    {
      orderId: order.id,
      senderName: identity.name,
      senderPhone: identity.phone,
      text,
    },
    headers,
  );
  const message = normalizeChatMessage(result.message || { orderId: order.id, text });
  state.chatThreads[order.id] = [...(state.chatThreads[order.id] || []), message];
  localStorage.setItem("staynestChatThreads", JSON.stringify(state.chatThreads));
  return message;
}

function upsertRouteOrder(order) {
  const index = state.orders.findIndex((item) => item.id === order.id);
  if (index >= 0) {
    state.orders[index] = order;
  } else {
    state.orders.unshift(order);
  }
  localStorage.setItem("staynestOrders", JSON.stringify(state.orders));
}

function showRouteOrderMessage(text, type) {
  const message = document.querySelector("#routeOrderMessage");
  if (!message) return;
  message.textContent = text;
  message.classList.toggle("error", type === "error");
  message.classList.toggle("success", type === "success");
}

function renderRouteBodyBlocks(product) {
  const blocks = product.bodyBlocks?.length
    ? product.bodyBlocks
    : [
        ...(product.intro ? [{ type: "text", text: product.intro }] : []),
        ...(product.bodyImages || []).map(([src, caption]) => ({ type: "image", src, caption })),
      ];
  if (!blocks.length) return `<p>${escapeHtml(product.intro || "暂无正文介绍。")}</p>`;
  return blocks
    .map((block) => {
      if (block.type === "image") {
        return `
          <figure>
            <img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.caption || "路线图片")}" />
            ${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}
          </figure>
        `;
      }
      return `<p>${escapeHtml(block.text || "")}</p>`;
    })
    .join("");
}

function renderRouteBodyImages(images) {
  if (!images.length) return "";
  return `
    <section class="route-body-images">
      ${images
        .map(
          ([src, caption]) => `
            <figure>
              <img src="${escapeHtml(src)}" alt="${escapeHtml(caption || "路线图片")}" />
              ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}
            </figure>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderListingList(items) {
  const list = document.querySelector("#listingList");
  if (!items.length) {
    list.innerHTML = `<div class="empty-state">没有匹配的房源。换个目的地试试。</div>`;
    return;
  }

  list.innerHTML = items
    .map(
      (listing) => `
        <article class="listing-card">
          <button class="image-button" type="button" data-open="${listing.id}" aria-label="查看 ${listing.title}">
            <img src="${listing.image}" alt="${listing.title}" />
            <span class="badge">${listing.tag}</span>
          </button>
          <div class="listing-body">
            <button class="listing-title" type="button" data-open="${listing.id}">${listing.title}</button>
            <span>${listing.location} · ${listing.type} · ${listing.guests} 人</span>
            <div class="listing-row">
              <strong>¥${formatter.format(listing.price)} / 晚</strong>
              <span><i data-lucide="star"></i>${listing.rating.toFixed(2)}</span>
            </div>
          </div>
          <button class="save-button ${state.saved.has(listing.id) ? "saved" : ""}" type="button" data-save="${listing.id}" aria-label="收藏">
            <i data-lucide="heart"></i>
          </button>
        </article>
      `,
    )
    .join("");

  list.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => openListing(Number(button.dataset.open)));
  });

  list.querySelectorAll("[data-save]").forEach((button) => {
    button.addEventListener("click", () => toggleSaved(Number(button.dataset.save)));
  });
}

function renderTrips() {
  loadRouteOrders().then(() => {
    if (state.tab === "trips") {
      renderTripsContent();
      refreshIcons();
    }
  });
  renderTripsContent();
}

function renderTripsContent() {
  const routeOrders = state.orders.map(normalizeRouteOrder);
  const dynamicTrips = routeOrders
    .filter((order) => (isApprovedGuide() ? order.guideName || order.guidePhone : true))
    .map((order) => {
      const detail = isApprovedGuide()
        ? `${escapeHtml(order.travelerName || "游客")} · ${escapeHtml(order.travelerPhone || "手机号未留")} · ${escapeHtml(order.destination)}`
        : `¥${formatter.format(order.price)} / 人 · ${escapeHtml(order.destination)} · ${escapeHtml(order.duration)}${order.guideName ? ` · 导游 ${escapeHtml(order.guideName)}` : ""}`;
      return `
        <article class="trip-card">
          ${order.productImage ? `<img src="${order.productImage}" alt="${escapeHtml(order.productTitle)}" />` : ""}
          <div>
            <span class="pill">${escapeHtml(order.status)}</span>
            <h3>${escapeHtml(order.productTitle)}</h3>
            <p>${escapeHtml(order.travelDate)} 出行</p>
            <p>${detail}</p>
          </div>
        </article>
      `;
    });

  appContent.innerHTML = `
    <section class="status-card">
      <div>
        <span class="overline">下一站</span>
        <strong>${routeOrders[0] ? `${routeOrders[0].destination || "目的地"} · ${routeOrders[0].travelDate}` : "暂无新行程"}</strong>
      </div>
      <i data-lucide="plane"></i>
    </section>
    <div class="trip-list">
      ${dynamicTrips.length ? dynamicTrips.join("") : ""}
      ${!dynamicTrips.length && !isApprovedGuide() ? trips
        .map(
          (trip) => `
            <article class="trip-card">
              <img src="${trip.image}" alt="${trip.title}" />
              <div>
                <span class="pill">${trip.status}</span>
                <h3>${trip.title}</h3>
                <p>${trip.date}</p>
                <p>${trip.detail}</p>
              </div>
            </article>
          `,
        )
        .join("") : ""}
      ${!dynamicTrips.length && isApprovedGuide() ? `<section class="empty-state explore-empty"><strong>暂无已接行程</strong><span>抢单成功后会显示在这里。</span></section>` : ""}
    </div>
  `;
}

function renderMessages() {
  if (state.activeChatOrderId) {
    renderOrderChat();
    return;
  }

  stopChatPolling();
  loadRouteOrders().then(() => {
    if (state.tab === "messages") {
      renderMessagesContent();
      refreshIcons();
    }
  });
  renderMessagesContent();
}

function renderMessagesContent() {
  const orderMessages = state.orders
    .map(normalizeRouteOrder)
    .filter((order) => order.status !== "待确认" && (order.guideName || order.guidePhone))
    .map((order) => {
      if (isApprovedGuide()) {
        return {
          id: `guide-${order.id}`,
          orderId: order.id,
          name: order.travelerName || "游客",
          title: order.productTitle,
          body: `${order.travelDate} 出行，游客手机号：${order.travelerPhone || "未留"}。`,
          time: "刚刚",
          unread: 0,
        };
      }
      return {
        id: `traveler-${order.id}`,
        orderId: order.id,
        name: order.guideName || "导游",
        title: `${order.productTitle} 已接单`,
        body: `${order.guideName || "导游"} 已接单，导游手机号：${order.guidePhone || "待补充"}。`,
        time: "刚刚",
        unread: 1,
      };
    });
  const visibleMessages = [...orderMessages, ...messages];

  appContent.innerHTML = `
    <div class="message-list">
      ${
        visibleMessages.length
          ? visibleMessages
              .map(
                (message) => `
            <button class="message-row" type="button">
              ${message.orderId ? `<span class="hidden" data-chat-order-id="${escapeHtml(message.orderId)}"></span>` : ""}
              <span class="message-avatar">${message.name.slice(0, 1)}</span>
              <span class="message-copy">
                <span class="message-head">
                  <strong>${message.name}</strong>
                  <small>${message.time}</small>
                </span>
                <span>${message.title}</span>
                <small>${message.body}</small>
              </span>
              ${message.unread ? `<span class="unread">${message.unread}</span>` : ""}
            </button>
          `,
              )
              .join("")
          : `<section class="empty-state explore-empty"><strong>暂无消息</strong><span>订单接单后会在这里显示聊天入口。</span></section>`
      }
    </div>
  `;

  document.querySelector(".message-list").addEventListener("click", (event) => {
    const row = event.target.closest(".message-row");
    const orderId = row?.querySelector("[data-chat-order-id]")?.dataset.chatOrderId;
    if (!orderId) return;
    state.activeChatOrderId = orderId;
    renderOrderChat();
    refreshIcons();
  });
}

async function renderOrderChat() {
  const order = state.orders.map(normalizeRouteOrder).find((item) => item.id === state.activeChatOrderId);
  if (!order) {
    state.activeChatOrderId = "";
    renderMessagesContent();
    return;
  }

  const partnerName = isApprovedGuide() ? order.travelerName || "游客" : order.guideName || "导游";
  const partnerPhone = isApprovedGuide() ? order.travelerPhone || "手机号未留" : order.guidePhone || "手机号未留";
  let thread = (state.chatThreads[order.id] || []).map(normalizeChatMessage);
  try {
    thread = await loadOrderChat(order.id);
  } catch {
    // Keep the local cached thread visible if the backend is temporarily unavailable.
  }
  appContent.innerHTML = `
    <section class="chat-panel">
      <header class="chat-head">
        <button class="chat-back-button" id="chatBackButton" type="button" aria-label="返回消息">
          <i data-lucide="chevron-left"></i>
        </button>
        <span class="chat-avatar">${escapeHtml(partnerName.slice(0, 1) || "聊")}</span>
        <div class="chat-title-block">
          <strong>${escapeHtml(partnerName)}</strong>
          <small>${escapeHtml(partnerPhone)}</small>
        </div>
        <span class="chat-status">${escapeHtml(order.status)}</span>
      </header>
      <div class="chat-order-strip">
        <div>
          <span>${escapeHtml(order.productTitle)}</span>
          <small>${escapeHtml(order.travelDate)} · ${escapeHtml(order.destination || "目的地")}</small>
        </div>
        <strong>¥${formatter.format(order.price)}</strong>
      </div>
      <div class="chat-thread" id="chatThread"></div>
      <form class="chat-compose" id="chatComposeForm">
        <input id="chatInput" placeholder="给 ${escapeHtml(partnerName)} 发消息" autocomplete="off" />
        <button class="chat-send-button" type="submit" aria-label="发送消息">
          <i data-lucide="send-horizontal"></i>
        </button>
      </form>
    </section>
  `;
  renderChatThread(order, thread);
  startChatPolling(order);
  refreshIcons();

  document.querySelector("#chatBackButton").addEventListener("click", () => {
    state.activeChatOrderId = "";
    stopChatPolling();
    renderMessagesContent();
    refreshIcons();
  });
  document.querySelector("#chatComposeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#chatInput");
    const submitButton = event.currentTarget.querySelector("button[type='submit']");
    const text = input.value.trim();
    if (!text) return;
    submitButton.disabled = true;
    try {
      await sendOrderChat(order, text);
      input.value = "";
      await renderOrderChat();
      refreshIcons();
    } catch (error) {
      state.chatThreads[order.id] = [
        ...(state.chatThreads[order.id] || []),
        normalizeChatMessage({ from: "me", orderId: order.id, text, createdAt: new Date().toISOString() }),
      ];
      localStorage.setItem("staynestChatThreads", JSON.stringify(state.chatThreads));
      input.value = "";
      await renderOrderChat();
      refreshIcons();
      console.warn(error);
    }
  });
}

function renderChatThread(order, thread) {
  const chatThread = document.querySelector("#chatThread");
  if (!chatThread) return;
  chatThread.innerHTML = `
    <p class="chat-bubble system">${escapeHtml(order.travelDate)} 出行 · ${escapeHtml(order.destination)} · ${escapeHtml(order.status)}</p>
    ${thread
      .map(
        (item) => `
          <article class="chat-message-row ${item.isMine ? "me" : ""}">
            ${item.isMine ? "" : `<span class="chat-message-avatar">${escapeHtml((item.senderName || "对").slice(0, 1))}</span>`}
            <div class="chat-message-stack">
              <p class="chat-bubble">${escapeHtml(item.text)}</p>
              <small>${escapeHtml(item.isMine ? "你" : item.senderName || "对方")} · ${formatChatTime(item.createdAt)}</small>
            </div>
          </article>
        `,
      )
      .join("")}
  `;
  chatThread.scrollTop = chatThread.scrollHeight;
}

function formatChatTime(value) {
  if (!value) return "刚刚";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function startChatPolling(order) {
  stopChatPolling();
  state.chatPollTimer = window.setInterval(() => refreshActiveChat(order), 3000);
}

function stopChatPolling() {
  if (!state.chatPollTimer) return;
  window.clearInterval(state.chatPollTimer);
  state.chatPollTimer = null;
}

async function refreshActiveChat(order) {
  if (state.tab !== "messages" || state.activeChatOrderId !== order.id || !document.querySelector("#chatThread")) {
    stopChatPolling();
    return;
  }
  const previousThread = state.chatThreads[order.id] || [];
  try {
    const nextThread = await loadOrderChat(order.id);
    if (nextThread.length !== previousThread.length) {
      renderChatThread(order, nextThread);
    }
  } catch {
    // Ignore transient polling failures; the next interval will retry.
  }
}

function renderProfile() {
  const savedListings = listings.filter((listing) => state.saved.has(listing.id));
  const displayName = state.user?.nickname || state.user?.name || "游客";
  const avatar = state.user?.avatar || "teal";
  const guideApplication = state.guideApplication;
  refreshGuideApplicationFromServer();
  syncGuideApplicationToServer();
  const guideReviewStatus = guideApplication?.reviewStatus || guideApplication?.status || "";
  const guideTitle = guideApplication
    ? guideReviewStatus === "已通过"
      ? "导游身份已通过"
      : guideReviewStatus === "已驳回"
        ? "导游申请未通过"
        : "导游申请已提交"
    : state.guideFormOpen
      ? "填写导游资料"
      : "注册成为导游";
  const guideDescription = guideApplication
    ? guideReviewStatus === "已通过"
      ? "你已经可以为旅行者提供本地路线、陪同和体验服务。"
      : guideReviewStatus === "已驳回"
        ? "请根据平台反馈补充资料后再次提交。"
        : "平台会审核你的资料，通过后可以发布本地体验。"
    : state.guideFormOpen
      ? "提交后会进入审核，审核通过后可以发布本地体验。"
      : "成为导游后，可以为旅行者提供本地路线、陪同和体验服务。";
  appContent.innerHTML = `
    <section class="profile-card">
      <span class="large-avatar avatar-${avatar}">${displayName.slice(0, 1).toUpperCase()}</span>
      <div>
        <h3>${escapeHtml(displayName)}</h3>
        <p>${state.user?.method || "未登录"}${state.user?.phone ? ` · ${escapeHtml(state.user.phone)}` : ""}</p>
        ${state.user?.gender ? `<p>${escapeHtml(state.user.gender)}</p>` : ""}
        ${state.user?.bio ? `<p>${escapeHtml(state.user.bio)}</p>` : ""}
      </div>
    </section>

    <section class="profile-grid">
      <div><strong>${trips.length}</strong><span>行程</span></div>
      <div><strong>${savedListings.length}</strong><span>收藏</span></div>
      <div><strong>4.9</strong><span>评分</span></div>
    </section>

    <section class="guide-card">
      <div class="guide-card-head">
        <span class="guide-icon"><i data-lucide="map-pinned"></i></span>
        <div>
          <p class="eyebrow">导游服务</p>
          <h3>${guideTitle}</h3>
          <p>${guideDescription}</p>
        </div>
      </div>

      ${
        guideApplication
          ? `
            <div class="guide-status">
              <span><i data-lucide="badge-check"></i>${escapeHtml(guideApplication.status)}</span>
              <strong>${escapeHtml(guideApplication.realName || guideApplication.applicantName || "导游申请人")} · ${escapeHtml(guideApplication.englishLevel || "英文水平未填写")}</strong>
              <p>${escapeHtml(guideApplication.intro)}</p>
            </div>
          `
          : !state.guideFormOpen
            ? `
              <button class="primary-button guide-open-button" id="guideOpenButton" type="button">
                注册成为导游
              </button>
            `
          : `
            <form class="guide-form" id="guideRegisterForm" novalidate>
              <label>
                <span>姓名</span>
                <input id="guideNameInput" type="text" maxlength="24" value="${escapeHtml(state.user?.name || state.user?.nickname || "")}" placeholder="请输入真实姓名" />
              </label>
              <label>
                <span>性别</span>
                <select id="guideGenderInput">
                  <option value="">请选择</option>
                  ${["女", "男", "其他", "不便透露"].map((gender) => `<option value="${gender}" ${state.user?.gender === gender ? "selected" : ""}>${gender}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>服务城市</span>
                <input id="guideCityInput" type="text" maxlength="20" placeholder="例如：杭州" />
              </label>
              <label>
                <span>服务方向</span>
                <select id="guideSpecialtyInput">
                  <option value="城市漫游">城市漫游</option>
                  <option value="自然徒步">自然徒步</option>
                  <option value="美食探店">美食探店</option>
                  <option value="亲子行程">亲子行程</option>
                  <option value="旅拍陪同">旅拍陪同</option>
                </select>
              </label>
              <label>
                <span>英文水平</span>
                <select id="guideEnglishLevelInput">
                  <option value="">请选择</option>
                  <option value="基础沟通">基础沟通</option>
                  <option value="日常交流">日常交流</option>
                  <option value="流利讲解">流利讲解</option>
                  <option value="专业同传/高阶商务">专业同传/高阶商务</option>
                </select>
              </label>
              <label>
                <span>个人介绍</span>
                <textarea id="guideIntroInput" maxlength="300" rows="4" placeholder="介绍你的在地经验、语言能力、擅长路线和服务风格"></textarea>
              </label>
              <label>
                <span>身份证正面</span>
                <input id="guideIdFrontInput" type="file" accept="image/*" />
              </label>
              <label>
                <span>身份证反面</span>
                <input id="guideIdBackInput" type="file" accept="image/*" />
              </label>
              <label>
                <span>形象照片</span>
                <input id="guideProfilePhotoInput" type="file" accept="image/*" />
              </label>
              <label>
                <span>英文证书（选填，可提高通过率）</span>
                <input id="guideEnglishCertificateInput" type="file" accept="image/*,.pdf" multiple />
              </label>
              <label>
                <span>导游证书（选填，可提高通过率）</span>
                <input id="guideLicenseCertificateInput" type="file" accept="image/*,.pdf" multiple />
              </label>
              <p class="auth-message" id="guideMessage" role="status" aria-live="polite"></p>
              <div class="guide-form-actions">
                <button class="ghost-button" id="guideCancelButton" type="button">返回</button>
                <button class="primary-button" type="submit">提交导游申请</button>
              </div>
            </form>
          `
      }
    </section>

    <section class="settings-list">
      <button type="button"><i data-lucide="shield-check"></i><span>账号与安全</span><i data-lucide="chevron-right"></i></button>
      <button type="button"><i data-lucide="credit-card"></i><span>支付方式</span><i data-lucide="chevron-right"></i></button>
      <button type="button"><i data-lucide="bell"></i><span>通知</span><i data-lucide="chevron-right"></i></button>
      <button type="button" id="logoutButton"><i data-lucide="log-out"></i><span>退出登录</span><i data-lucide="chevron-right"></i></button>
    </section>
  `;

  const guideOpenButton = document.querySelector("#guideOpenButton");
  if (guideOpenButton) {
    guideOpenButton.addEventListener("click", () => {
      state.guideFormOpen = true;
      renderProfile();
      refreshIcons();
    });
  }

  const guideCancelButton = document.querySelector("#guideCancelButton");
  if (guideCancelButton) {
    guideCancelButton.addEventListener("click", () => {
      state.guideFormOpen = false;
      renderProfile();
      refreshIcons();
    });
  }

  const guideForm = document.querySelector("#guideRegisterForm");
  if (guideForm) {
    guideForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.guideSubmitting) return;
      const realName = document.querySelector("#guideNameInput").value.trim();
      const gender = document.querySelector("#guideGenderInput").value;
      const city = document.querySelector("#guideCityInput").value.trim();
      const specialty = document.querySelector("#guideSpecialtyInput").value;
      const englishLevel = document.querySelector("#guideEnglishLevelInput").value;
      const intro = document.querySelector("#guideIntroInput").value.trim();
      const message = document.querySelector("#guideMessage");
      const submitButton = guideForm.querySelector("button[type='submit']");

      if (!realName || !gender || !city || !englishLevel || !intro) {
        message.textContent = "请填写姓名、性别、服务城市、英文水平和个人介绍。";
        message.classList.add("error");
        message.classList.remove("success");
        return;
      }
      if (
        !document.querySelector("#guideIdFrontInput").files.length ||
        !document.querySelector("#guideIdBackInput").files.length ||
        !document.querySelector("#guideProfilePhotoInput").files.length
      ) {
        message.textContent = "请上传身份证正反面和形象照片。";
        message.classList.add("error");
        message.classList.remove("success");
        return;
      }

      state.guideSubmitting = true;
      submitButton.disabled = true;
      submitButton.textContent = "正在提交...";
      message.textContent = "正在压缩图片并提交导游申请...";
      message.classList.add("success");
      message.classList.remove("error");

      try {
        const token = localStorage.getItem("staynestToken") || "";
        const [idCardFront, idCardBack, profilePhoto, englishCertificates, guideCertificates] = await Promise.all([
          readGuideFile("#guideIdFrontInput", "身份证正面", true),
          readGuideFile("#guideIdBackInput", "身份证反面", true),
          readGuideFile("#guideProfilePhotoInput", "形象照片", true),
          readGuideFiles("#guideEnglishCertificateInput", "英文证书"),
          readGuideFiles("#guideLicenseCertificateInput", "导游证书"),
        ]);
        const result = await postJson(
          "/api/guides/applications",
          {
            applicantName: realName,
            realName,
            gender,
            phone: state.user?.phone || "",
            avatar: state.user?.avatar || "teal",
            city,
            specialty,
            englishLevel,
            intro,
            idCardFront,
            idCardBack,
            profilePhoto,
            englishCertificates,
            guideCertificates,
          },
          { Authorization: `Bearer ${token}` },
        );
        state.guideApplication = result.application;
        saveGuideApplicationForUser(state.guideApplication);
        upsertGuideApplication(state.guideApplication);
        state.guideFormOpen = false;
        renderProfile();
        refreshIcons();
      } catch (error) {
        message.textContent = error.message || "导游申请提交失败，请稍后重试。";
        message.classList.add("error");
        message.classList.remove("success");
      } finally {
        state.guideSubmitting = false;
        submitButton.disabled = false;
        submitButton.textContent = "提交导游申请";
      }
    });
  }
  document.querySelector("#logoutButton").addEventListener("click", logout);
}

function readGuideFile(selector, label, required = false) {
  const input = document.querySelector(selector);
  const file = input?.files?.[0];
  if (!file) {
    if (required) throw new Error(`请上传${label}。`);
    return null;
  }
  return fileToAttachment(file, label);
}

async function readGuideFiles(selector, label) {
  const input = document.querySelector(selector);
  const files = Array.from(input?.files || []);
  const attachments = [];
  for (const file of files.slice(0, 4)) {
    attachments.push(await fileToAttachment(file, label));
  }
  return attachments;
}

const GUIDE_ATTACHMENT_MAX_BYTES = 3 * 1024 * 1024;
const GUIDE_ATTACHMENT_MAX_LABEL = "3MB";
const GUIDE_IMAGE_MAX_EDGE = 1600;
const GUIDE_IMAGE_START_QUALITY = 0.82;
const GUIDE_IMAGE_MIN_QUALITY = 0.48;

async function fileToAttachment(file, label) {
  if (file.type.startsWith("image/")) {
    return imageFileToAttachment(file, label);
  }

  if (file.size > GUIDE_ATTACHMENT_MAX_BYTES) {
    throw new Error(`${label}「${file.name}」超过 ${GUIDE_ATTACHMENT_MAX_LABEL}，请压缩后上传。`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        label,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl: String(reader.result || ""),
      });
    };
    reader.onerror = () => reject(new Error(`${label}读取失败，请重新选择文件。`));
    reader.readAsDataURL(file);
  });
}

async function imageFileToAttachment(file, label) {
  const image = await loadImageFromFile(file, label);
  const scale = Math.min(1, GUIDE_IMAGE_MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(`${label}图片压缩失败，请重新选择。`);
  context.drawImage(image, 0, 0, width, height);

  let quality = GUIDE_IMAGE_START_QUALITY;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > GUIDE_ATTACHMENT_MAX_BYTES && quality > GUIDE_IMAGE_MIN_QUALITY) {
    quality = Math.max(GUIDE_IMAGE_MIN_QUALITY, quality - 0.1);
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > GUIDE_ATTACHMENT_MAX_BYTES) {
    throw new Error(`${label}「${file.name}」压缩后仍超过 ${GUIDE_ATTACHMENT_MAX_LABEL}，请换一张更小的图片。`);
  }

  return {
    label,
    name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    type: "image/jpeg",
    size: blob.size,
    originalSize: file.size,
    width,
    height,
    compressed: blob.size < file.size,
    dataUrl: await blobToDataUrl(blob, label),
  };
}

function loadImageFromFile(file, label) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${label}图片读取失败，请重新选择。`));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("图片压缩失败，请重新选择。"));
      },
      "image/jpeg",
      quality,
    );
  });
}

function blobToDataUrl(blob, label) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`${label}读取失败，请重新选择文件。`));
    reader.readAsDataURL(blob);
  });
}

function upsertGuideApplication(application) {
  const storedApplication = slimGuideApplicationForStorage(application);
  const applications = JSON.parse(localStorage.getItem("staynestGuideApplications") || "[]");
  const index = applications.findIndex((item) => item.id === storedApplication.id);
  if (index >= 0) {
    applications[index] = storedApplication;
  } else {
    applications.unshift(storedApplication);
  }
  localStorage.setItem("staynestGuideApplications", JSON.stringify(applications));
}

function slimGuideApplicationForStorage(application) {
  if (!application) return application;
  const stripAttachment = (attachment) => (attachment ? { ...attachment, dataUrl: "" } : attachment);
  return {
    ...application,
    idCardFront: stripAttachment(application.idCardFront),
    idCardBack: stripAttachment(application.idCardBack),
    profilePhoto: stripAttachment(application.profilePhoto),
    englishCertificates: (application.englishCertificates || []).map(stripAttachment),
    guideCertificates: (application.guideCertificates || []).map(stripAttachment),
  };
}

async function refreshGuideApplicationFromServer() {
  const application = state.guideApplication;
  const userPhone = state.user?.phone || application?.phone || "";
  if ((!application && !userPhone) || state.guideStatusSyncing) return;
  const normalizedUserPhone = String(userPhone).replace(/[^\d]/g, "");

  state.guideStatusSyncing = true;
  try {
    const result = await getJson("/api/admin/guides/applications");
    const matched = result.applications.find((item) => {
      const normalizedItemPhone = String(item.phone || "").replace(/[^\d]/g, "");
      const sameId = application?.id && item.id === application.id && (!normalizedUserPhone || !normalizedItemPhone || normalizedItemPhone === normalizedUserPhone);
      const samePhone = normalizedUserPhone && normalizedItemPhone === normalizedUserPhone;
      return sameId || samePhone;
    });
    if (!matched) {
      if (application) {
        removeLocalGuideApplication(application, userPhone);
      }
      if (application && state.tab === "profile") {
        renderProfile();
        refreshIcons();
      }
      return;
    }

    const previousStatus = application?.reviewStatus || application?.status || "";
    const nextStatus = matched.reviewStatus || matched.status || "";
    state.guideApplication = { ...matched, serverSynced: true };
    saveGuideApplicationForUser(state.guideApplication);
    upsertGuideApplication(state.guideApplication);

    if (nextStatus && nextStatus !== previousStatus && (state.tab === "profile" || state.tab === "search")) {
      if (state.tab === "profile") {
        renderProfile();
      } else {
        renderSearch();
      }
      refreshIcons();
    }
  } catch {
    // Keep local state when the backend is temporarily unavailable.
  } finally {
    state.guideStatusSyncing = false;
  }
}

function removeLocalGuideApplication(application, phone = "") {
  state.guideApplication = null;
  state.guideFormOpen = false;
  clearGuideApplicationForUser();

  const applications = JSON.parse(localStorage.getItem("staynestGuideApplications") || "[]");
  const nextApplications = applications.filter((item) => {
    const sameId = application.id && item.id === application.id;
    const samePhone = phone && item.phone === phone;
    return !sameId && !samePhone;
  });
  localStorage.setItem("staynestGuideApplications", JSON.stringify(nextApplications));
}

async function syncGuideApplicationToServer() {
  const application = state.guideApplication;
  if (!application || application.serverSynced || state.guideSyncing || state.guideSubmitting) return;
  const reviewStatus = application.reviewStatus || application.status;
  if (reviewStatus !== "待审核" && reviewStatus !== "审核中") return;
  const token = localStorage.getItem("staynestToken") || "";
  if (!token || !application.city || !application.specialty || !application.intro) return;

  state.guideSyncing = true;
  try {
    const result = await postJson(
      "/api/guides/applications",
      {
        applicantName: state.user?.nickname || state.user?.name || application.applicantName || "StayNest 用户",
        realName: application.realName || application.applicantName || state.user?.name || "",
        gender: application.gender || state.user?.gender || "",
        phone: state.user?.phone || application.phone || "",
        avatar: state.user?.avatar || application.avatar || "teal",
        city: application.city,
        specialty: application.specialty,
        englishLevel: application.englishLevel || "",
        intro: application.intro,
        idCardFront: application.idCardFront || null,
        idCardBack: application.idCardBack || null,
        profilePhoto: application.profilePhoto || null,
        englishCertificates: application.englishCertificates || [],
        guideCertificates: application.guideCertificates || [],
      },
      { Authorization: `Bearer ${token}` },
    );
    state.guideApplication = { ...result.application, serverSynced: true };
    saveGuideApplicationForUser(state.guideApplication);
    upsertGuideApplication(state.guideApplication);
  } catch {
    state.guideApplication = { ...application, serverSynced: false };
  } finally {
    state.guideSyncing = false;
  }
}

function getFilteredListings() {
  return listings.filter((listing) => {
    const matchesCategory = state.category === "全部" || listing.category === state.category;
    const haystack = `${listing.title} ${listing.location} ${listing.category}`.toLowerCase();
    const matchesQuery = !state.query || haystack.includes(state.query.toLowerCase());
    return matchesCategory && matchesQuery;
  });
}

function toggleSaved(id) {
  if (state.saved.has(id)) {
    state.saved.delete(id);
  } else {
    state.saved.add(id);
  }
  localStorage.setItem("staynestSaved", JSON.stringify([...state.saved]));
  renderSearch();
  refreshIcons();
}

function openListing(id) {
  const listing = listings.find((item) => item.id === id);
  if (!listing) return;
  const nights = 5;
  const total = listing.price * nights + Math.round(listing.price * 0.12);

  dialogBody.innerHTML = `
    <img class="dialog-image" src="${listing.image}" alt="${listing.title}" />
    <div class="dialog-detail">
      <p class="eyebrow">${listing.location}</p>
      <h2>${listing.title}</h2>
      <p>${listing.type} · ${listing.guests} 位房客 · ${listing.beds} 张床 · ${listing.baths} 间浴室</p>
      <p>房东 ${listing.host} 维护的精选住处，评分 ${listing.rating.toFixed(2)}。</p>
      <div class="amenities">${listing.amenities.map((item) => `<span>${item}</span>`).join("")}</div>
      <div class="booking-box">
        <span>预计总价</span>
        <strong>¥${formatter.format(total)}</strong>
        <button class="primary-button" type="button">申请预订</button>
      </div>
    </div>
  `;
  listingDialog.showModal();
  refreshIcons();
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
    return;
  }

  const fallbackIcons = {
    apple: "A",
    chrome: "G",
    search: "⌕",
    "calendar-days": "□",
    "message-circle": "○",
    "user-round": "U",
    sparkles: "✦",
    "building-2": "▥",
    waves: "≈",
    "ship-wheel": "◎",
    mountain: "△",
    "palm-tree": "♧",
    landmark: "▣",
    star: "★",
    heart: "♡",
    plane: "↗",
    "shield-check": "✓",
    "badge-check": "✓",
    "map-pinned": "⌖",
    "credit-card": "▭",
    bell: "!",
    "log-out": "↩",
    "chevron-left": "‹",
    "chevron-right": "›",
    x: "×",
  };

  document.querySelectorAll("[data-lucide]").forEach((icon) => {
    const name = icon.getAttribute("data-lucide");
    icon.classList.add("icon-fallback");
    icon.textContent = fallbackIcons[name] || "•";
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations?.().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    window.caches?.keys?.().then((keys) => {
      keys.forEach((key) => window.caches.delete(key));
    });
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}

init();
