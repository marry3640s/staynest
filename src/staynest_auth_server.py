from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import sqlite3
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, quote, unquote
from urllib.request import Request, urlopen
from wsgiref.simple_server import make_server
from wsgiref.util import setup_testing_defaults


ROOT = Path(__file__).resolve().parents[1]
STATIC_DIR = ROOT / "staynest"
DB_PATH = Path(os.environ.get("STAYNEST_DB_PATH", ROOT / "staynest.sqlite3"))
CODE_TTL_SECONDS = 300
RESEND_SECONDS = 60
MAX_ATTEMPTS = 5
DEV_SMS = os.environ.get("STAYNEST_DEV_SMS", "1") != "0"
SMS_PROVIDER = os.environ.get("STAYNEST_SMS_PROVIDER", "aliyun").lower()
APPLE_CLIENT_ID = os.environ.get("APPLE_CLIENT_ID", "").strip()
APPLE_NATIVE_CLIENT_ID = os.environ.get("APPLE_NATIVE_CLIENT_ID", "com.staynest.app").strip()
APPLE_ALLOWED_CLIENT_IDS = [
    item.strip()
    for item in os.environ.get(
        "APPLE_ALLOWED_CLIENT_IDS",
        ",".join(item for item in [APPLE_CLIENT_ID, APPLE_NATIVE_CLIENT_ID] if item),
    ).split(",")
    if item.strip()
]
APPLE_REDIRECT_URI = os.environ.get("APPLE_REDIRECT_URI", "").strip()
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"


@dataclass
class CodeRecord:
    code: str
    expires_at: float
    last_sent_at: float
    attempts: int = 0


codes: dict[str, CodeRecord] = {}
sessions: dict[str, dict[str, Any]] = {}
users: dict[str, dict[str, Any]] = {}
guide_applications: list[dict[str, Any]] = []
products: list[dict[str, Any]] = []
orders: list[dict[str, Any]] = []
chat_messages: list[dict[str, Any]] = []

DEFAULT_PRODUCTS: list[dict[str, Any]] = [
    {
        "id": "chengdu-panda-old-town",
        "title": "熊猫基地与老成都慢生活",
        "destination": "成都",
        "preference": "城市景观",
        "duration": "一日游",
        "price": 399,
        "image": "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=900&q=80",
        "spots": ["成都大熊猫繁育研究基地", "文殊院", "宽窄巷子", "人民公园"],
        "intro": "上午看熊猫进食和活动，午后转入文殊院与宽窄巷子，最后在人民公园喝盖碗茶，适合第一次到成都的轻松路线。",
        "highlights": ["近距离看熊猫", "寺院与老街慢逛", "盖碗茶体验"],
        "itinerary": [
            ["08:30", "成都大熊猫繁育研究基地", "赶在熊猫活跃时段入园，看幼年熊猫、成年熊猫活动区和科普展馆。"],
            ["12:00", "文殊院周边午餐", "安排钟水饺、甜水面或豆花等成都小吃，午后进入文殊院感受老成都禅意。"],
            ["15:00", "宽窄巷子城市漫步", "走宽巷子、窄巷子和井巷子，适合拍照、买伴手礼和体验街巷生活。"],
            ["17:00", "人民公园茶馆", "在鹤鸣茶社喝盖碗茶，也可以体验采耳，慢慢结束一天行程。"],
        ],
        "attractionDetails": [
            ["成都大熊猫繁育研究基地", "成都代表性景点，适合上午游览，能看到熊猫进食、攀爬和休息的自然状态。"],
            ["文殊院", "市区内安静的寺院片区，周边小吃多，适合把行程节奏放慢。"],
            ["宽窄巷子", "保留川西民居街巷肌理，适合第一次到成都的游客建立城市印象。"],
            ["人民公园", "成都慢生活的典型场景，茶馆、湖边和市井氛围都很集中。"],
        ],
        "tip": "熊猫基地建议早到，节假日可提前预约门票；这条路线步行较多，穿舒适鞋更轻松。",
        "status": "published",
    },
    {
        "id": "chengdu-wuhou-jinli-food",
        "title": "武侯祠锦里与川味夜游",
        "destination": "成都",
        "preference": "本地美食",
        "duration": "一日游",
        "price": 459,
        "image": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
        "spots": ["武侯祠", "锦里古街", "玉林路", "成都火锅"],
        "intro": "从三国文化进入成都街巷烟火，下午逛锦里与玉林路，晚上安排火锅或串串，重点体验成都的市井味道。",
        "highlights": ["三国文化", "锦里夜景", "火锅串串"],
        "itinerary": [
            ["09:30", "武侯祠", "从刘备殿、诸葛亮殿和红墙竹影开始，了解成都三国文化。"],
            ["12:00", "锦里古街午餐", "在古街里品尝凉粉、锅盔、兔头等本地小吃，节奏轻松。"],
            ["15:00", "玉林路街区", "逛咖啡店、街边小店和生活街巷，感受成都年轻人的日常。"],
            ["18:30", "成都火锅或串串", "晚餐安排川味火锅、串串或冒菜，适合想把美食作为主线的游客。"],
        ],
        "attractionDetails": [
            ["武侯祠", "成都三国文化核心景点，红墙夹道也很适合拍照。"],
            ["锦里古街", "夜晚灯光和街边小吃集中，适合衔接晚餐前后的轻松游览。"],
            ["玉林路", "本地生活气息强，有小酒馆、咖啡店和社区街巷。"],
            ["成都火锅", "建议根据口味选择微辣或鸳鸯锅，第一次吃川味可以先从温和锅底开始。"],
        ],
        "tip": "这条路线美食较多，午餐和晚餐可以适当错峰；不能吃辣的游客可提前备注口味。",
        "status": "published",
    },
    {
        "id": "chengdu-dujiangyan-qingcheng",
        "title": "都江堰青城山清氧一日",
        "destination": "成都",
        "preference": "自然风光",
        "duration": "一日游",
        "price": 699,
        "image": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
        "spots": ["都江堰景区", "南桥", "青城山", "山间茶歇"],
        "intro": "上午看都江堰水利工程，午后去青城山感受林木、石阶和道观清幽，适合想离开市区亲近自然的旅行者。",
        "highlights": ["世界遗产", "山林徒步", "清爽自然"],
        "itinerary": [
            ["08:00", "从成都出发", "乘车前往都江堰，途中介绍岷江水系和川西平原。"],
            ["10:00", "都江堰景区", "游览鱼嘴、飞沙堰、宝瓶口，理解古代水利工程如何改变成都平原。"],
            ["13:00", "南桥与午餐", "在南桥附近午餐，顺路看古城水岸景观。"],
            ["15:00", "青城山前山", "选择轻徒步路线，看林木、石阶和道观，傍晚返回成都。"],
        ],
        "attractionDetails": [
            ["都江堰景区", "两千多年仍在使用的水利工程，兼具历史、工程和自然景观。"],
            ["南桥", "都江堰古城附近的地标桥梁，夜景和水岸氛围都不错。"],
            ["青城山", "以幽静山林和道教文化闻名，适合喜欢自然风光的人。"],
            ["山间茶歇", "把徒步节奏放慢，在山间茶铺休息，体验川西慢生活。"],
        ],
        "tip": "这条路线离市区较远，建议早出发；青城山有台阶，老人儿童可选择更轻松的游览段。",
        "status": "published",
    },
    {
        "id": "chengdu-taikooli-city",
        "title": "太古里春熙路城市封面",
        "destination": "成都",
        "preference": "城市景观",
        "duration": "一日游",
        "price": 369,
        "image": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80",
        "spots": ["太古里", "大慈寺", "IFS", "九眼桥夜景"],
        "intro": "把成都的现代商业、寺院静谧和夜色桥景串在一起，适合喜欢拍照、购物和城市漫游的轻量行程。",
        "highlights": ["城市拍照", "潮流购物", "九眼桥夜景"],
        "itinerary": [
            ["10:00", "太古里与大慈寺", "从现代街区走入古寺院，体验成都新旧并置的城市气质。"],
            ["12:30", "春熙路午餐", "选择川菜、小吃或轻食，午餐后逛春熙路商圈。"],
            ["15:00", "IFS 与城市地标", "打卡熊猫爬墙装置，逛设计店、买伴手礼或安排下午茶。"],
            ["19:00", "九眼桥夜景", "傍晚前往九眼桥，沿河散步，拍成都夜色和酒吧街氛围。"],
        ],
        "attractionDetails": [
            ["太古里", "成都代表性开放式商业街区，建筑尺度舒适，适合城市漫游。"],
            ["大慈寺", "位于商圈中的寺院，安静感和周边现代街区形成鲜明对比。"],
            ["IFS", "春熙路地标综合体，熊猫装置是游客常拍的城市符号。"],
            ["九眼桥", "成都夜生活和河岸夜景集中区域，适合晚上收尾。"],
        ],
        "tip": "这条路线适合不想太早出门的游客；夜游九眼桥时注意保管随身物品。",
        "status": "published",
    },
    {
        "id": "chengdu-tea-snacks",
        "title": "茶馆小吃与市井成都",
        "destination": "成都",
        "preference": "本地美食",
        "duration": "一日游",
        "price": 329,
        "image": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80",
        "spots": ["人民公园", "鹤鸣茶社", "奎星楼街", "宽窄巷子夜色"],
        "intro": "从茶馆、采耳、小吃街到夜晚巷子，把节奏放慢，适合想用一天感受成都日常生活和本地小吃的人。",
        "highlights": ["茶馆体验", "街巷小吃", "市井慢游"],
        "itinerary": [
            ["10:00", "人民公园", "从湖边、相亲角和老茶馆开始，观察成都本地人的日常。"],
            ["11:00", "鹤鸣茶社", "坐下来喝盖碗茶，可按需体验采耳，把上午节奏放慢。"],
            ["13:30", "奎星楼街", "午后安排小吃巡游，适合尝试冰粉、冒菜、串串和甜品。"],
            ["18:00", "宽窄巷子夜色", "夜晚回到老街区散步，适合拍照和补充小吃。"],
        ],
        "attractionDetails": [
            ["人民公园", "最能感受成都松弛感的市区公园，茶馆文化非常集中。"],
            ["鹤鸣茶社", "传统茶馆氛围明显，适合第一次体验盖碗茶。"],
            ["奎星楼街", "本地年轻人也常去的小吃街，口味选择丰富。"],
            ["宽窄巷子夜色", "夜晚灯光和街巷氛围更明显，适合作为轻松收尾。"],
        ],
        "tip": "这条路线吃喝较多，建议少量多次；热门小吃店可能排队，可以灵活替换。",
        "status": "published",
    },
]


def _connect_db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def _init_db() -> None:
    with _connect_db() as connection:
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS staynest_records (
                collection TEXT NOT NULL,
                record_key TEXT NOT NULL,
                payload TEXT NOT NULL,
                position INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (collection, record_key)
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS staynest_meta (
                collection TEXT PRIMARY KEY,
                initialized_at TEXT NOT NULL
            )
            """
        )


def _collection_initialized(collection: str) -> bool:
    with _connect_db() as connection:
        row = connection.execute(
            "SELECT 1 FROM staynest_meta WHERE collection = ? LIMIT 1",
            (collection,),
        ).fetchone()
    return row is not None


def _load_collection(collection: str) -> list[tuple[str, dict[str, Any]]]:
    records: list[tuple[str, dict[str, Any]]] = []
    with _connect_db() as connection:
        rows = connection.execute(
            """
            SELECT record_key, payload
            FROM staynest_records
            WHERE collection = ?
            ORDER BY position ASC, updated_at DESC
            """,
            (collection,),
        ).fetchall()
    for row in rows:
        try:
            payload = json.loads(str(row["payload"]))
        except json.JSONDecodeError:
            continue
        if isinstance(payload, dict):
            records.append((str(row["record_key"]), payload))
    return records


def _replace_collection(collection: str, items: Any) -> None:
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    rows = [(str(key), value) for key, value in items if isinstance(value, dict)]
    with _connect_db() as connection:
        connection.execute("DELETE FROM staynest_records WHERE collection = ?", (collection,))
        connection.executemany(
            """
            INSERT INTO staynest_records (collection, record_key, payload, position, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            [
                (collection, key, json.dumps(value, ensure_ascii=False), index, now)
                for index, (key, value) in enumerate(rows)
            ],
        )
        connection.execute(
            """
            INSERT INTO staynest_meta (collection, initialized_at)
            VALUES (?, ?)
            ON CONFLICT(collection) DO NOTHING
            """,
            (collection, now),
        )


def _load_users() -> dict[str, dict[str, Any]]:
    rows = _load_collection("users")
    if rows:
        return {key: value for key, value in rows}
    if not _collection_initialized("users"):
        _replace_collection("users", [])
    return {}


def _save_users() -> None:
    _replace_collection("users", users.items())


def _load_guide_applications() -> list[dict[str, Any]]:
    rows = _load_collection("guide_applications")
    if rows:
        return [value for _, value in rows]
    if not _collection_initialized("guide_applications"):
        _replace_collection("guide_applications", [])
    return []


def _save_guide_applications() -> None:
    _replace_collection(
        "guide_applications",
        ((str(item.get("id") or f"guide-{index}"), item) for index, item in enumerate(guide_applications)),
    )


def _load_products() -> list[dict[str, Any]]:
    rows = _load_collection("products")
    if rows:
        return [value for _, value in rows]
    if _collection_initialized("products"):
        return []

    fallback = [dict(product) for product in DEFAULT_PRODUCTS]
    _replace_collection("products", ((str(item.get("id") or f"product-{index}"), item) for index, item in enumerate(fallback)))
    return fallback


def _save_products() -> None:
    _replace_collection("products", ((str(item.get("id") or f"product-{index}"), item) for index, item in enumerate(products)))


def _load_orders() -> list[dict[str, Any]]:
    rows = _load_collection("orders")
    if rows:
        return [value for _, value in rows]
    if not _collection_initialized("orders"):
        _replace_collection("orders", [])
    return []


def _save_orders() -> None:
    _replace_collection("orders", ((str(item.get("id") or f"order-{index}"), item) for index, item in enumerate(orders)))


def _load_chat_messages() -> list[dict[str, Any]]:
    rows = _load_collection("chat_messages")
    if rows:
        return [value for _, value in rows]
    if not _collection_initialized("chat_messages"):
        _replace_collection("chat_messages", [])
    return []


def _save_chat_messages() -> None:
    _replace_collection(
        "chat_messages",
        ((str(item.get("id") or f"chat-{index}"), item) for index, item in enumerate(chat_messages)),
    )


def _ensure_order_chat_starters() -> None:
    changed = False
    existing_order_ids = {str(message.get("orderId") or "") for message in chat_messages}
    for order in orders:
        order_id = str(order.get("id") or "")
        guide_name = str(order.get("guideName") or "").strip()
        guide_phone = str(order.get("guidePhone") or "").strip()
        if not order_id or not (guide_name or guide_phone) or order_id in existing_order_ids:
            continue
        created_at = str(order.get("claimedAt") or order.get("updatedAt") or dt.datetime.now(dt.timezone.utc).isoformat())
        chat_messages.append(
            {
                "id": f"chat-{int(time.time() * 1000)}-{secrets.token_hex(3)}",
                "orderId": order_id,
                "senderName": guide_name or "导游",
                "senderPhone": guide_phone,
                "senderRole": "guide",
                "text": f"{guide_name or '导游'}已接单，稍后与你确认集合地点和行程细节。",
                "createdAt": created_at,
            }
        )
        existing_order_ids.add(order_id)
        changed = True
    if changed:
        _save_chat_messages()


_init_db()
users.update(_load_users())
guide_applications.extend(_load_guide_applications())
products.extend(_load_products())
orders.extend(_load_orders())
chat_messages.extend(_load_chat_messages())
_ensure_order_chat_starters()


def _json_response(start_response, status: str, payload: dict, headers: list[tuple[str, str]] | None = None):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    response_headers = [
        ("Content-Type", "application/json; charset=utf-8"),
        ("Content-Length", str(len(body))),
        ("Cache-Control", "no-store"),
        ("Access-Control-Allow-Origin", "*"),
        ("Access-Control-Allow-Methods", "GET, POST, OPTIONS"),
        ("Access-Control-Allow-Headers", "Content-Type, Authorization"),
    ]
    if headers:
        response_headers.extend(headers)
    start_response(status, response_headers)
    return [body]


def _error(start_response, status: str, message: str):
    return _json_response(start_response, status, {"ok": False, "error": message})


def _public_user(profile: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": str(profile.get("name") or profile.get("nickname") or "StayNest 用户"),
        "nickname": str(profile.get("nickname") or profile.get("name") or "StayNest 用户"),
        "gender": str(profile.get("gender") or ""),
        "bio": str(profile.get("bio") or ""),
        "method": str(profile.get("method") or "手机号"),
        "phone": str(profile.get("phone") or ""),
        "email": str(profile.get("email") or ""),
        "appleSub": str(profile.get("appleSub") or ""),
        "created_at": profile.get("created_at") or "",
    }


def _is_registered_user_complete(profile: dict[str, Any]) -> bool:
    return bool(
        str(profile.get("name") or profile.get("nickname") or "").strip()
        and str(profile.get("gender") or "").strip()
        and str(profile.get("bio") or "").strip()
    )


def _create_session(user: dict[str, Any], extra: dict[str, Any] | None = None) -> str:
    token = secrets.token_urlsafe(32)
    sessions[token] = {"user": user, "created_at": time.time(), **(extra or {})}
    return token


def _read_json(environ) -> tuple[dict[str, Any] | None, str | None]:
    try:
        length = int(environ.get("CONTENT_LENGTH") or "0")
    except ValueError:
        return None, "请求体长度无效。"

    if length > 32 * 1024 * 1024:
        return None, "请求体过大。"

    raw = environ["wsgi.input"].read(length) if length else b"{}"
    try:
        data = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        return None, "请求 JSON 无效。"

    if not isinstance(data, dict):
        return None, "请求 JSON 必须是对象。"
    return data, None


def _normalize_phone(value: Any) -> str:
    phone = str(value or "").strip()
    prefix = "+" if phone.startswith("+") else ""
    digits = "".join(ch for ch in phone if ch.isdigit())
    return f"{prefix}{digits}"


def _valid_phone(phone: str) -> bool:
    digits = "".join(ch for ch in phone if ch.isdigit())
    return 8 <= len(digits) <= 15


def _generate_code() -> str:
    return "123456"


def _cleanup(now: float) -> None:
    expired_phones = [phone for phone, record in codes.items() if record.expires_at <= now]
    for phone in expired_phones:
        codes.pop(phone, None)


def _send_sms(phone: str, code: str) -> None:
    if DEV_SMS:
        print(f"[StayNest dev SMS] phone={phone} code={code}", flush=True)
        return

    if SMS_PROVIDER == "aliyun":
        _send_sms_with_aliyun(phone, code)
        return

    raise RuntimeError(f"不支持的短信服务商：{SMS_PROVIDER}")


def _aliyun_percent_encode(value: Any) -> str:
    return quote(str(value), safe="-_.~")


def _format_aliyun_phone(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    if phone.startswith("+86") and len(digits) == 13:
        return digits[2:]
    return digits


def _send_sms_with_aliyun(phone: str, code: str) -> None:
    access_key_id = os.environ.get("ALIYUN_ACCESS_KEY_ID", "").strip()
    access_key_secret = os.environ.get("ALIYUN_ACCESS_KEY_SECRET", "").strip()
    sign_name = os.environ.get("ALIYUN_SMS_SIGN_NAME", "").strip()
    template_code = os.environ.get("ALIYUN_SMS_TEMPLATE_CODE", "").strip()
    region_id = os.environ.get("ALIYUN_SMS_REGION_ID", "cn-hangzhou").strip()
    endpoint = os.environ.get("ALIYUN_SMS_ENDPOINT", "dysmsapi.aliyuncs.com").strip()
    code_param_name = os.environ.get("ALIYUN_SMS_CODE_PARAM", "code").strip()

    missing = [
        name
        for name, value in [
            ("ALIYUN_ACCESS_KEY_ID", access_key_id),
            ("ALIYUN_ACCESS_KEY_SECRET", access_key_secret),
            ("ALIYUN_SMS_SIGN_NAME", sign_name),
            ("ALIYUN_SMS_TEMPLATE_CODE", template_code),
        ]
        if not value
    ]
    if missing:
        raise RuntimeError(f"阿里云短信配置缺失：{', '.join(missing)}")

    params = {
        "AccessKeyId": access_key_id,
        "Action": "SendSms",
        "Format": "JSON",
        "PhoneNumbers": _format_aliyun_phone(phone),
        "RegionId": region_id,
        "SignName": sign_name,
        "SignatureMethod": "HMAC-SHA1",
        "SignatureNonce": secrets.token_hex(16),
        "SignatureVersion": "1.0",
        "TemplateCode": template_code,
        "TemplateParam": json.dumps({code_param_name: code}, separators=(",", ":"), ensure_ascii=False),
        "Timestamp": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "Version": "2017-05-25",
    }
    canonical_query = "&".join(
        f"{_aliyun_percent_encode(key)}={_aliyun_percent_encode(params[key])}" for key in sorted(params)
    )
    string_to_sign = f"GET&%2F&{_aliyun_percent_encode(canonical_query)}"
    digest = hmac.new(
        f"{access_key_secret}&".encode("utf-8"),
        string_to_sign.encode("utf-8"),
        hashlib.sha1,
    ).digest()
    signature = base64.b64encode(digest).decode("utf-8")
    signed_query = f"Signature={_aliyun_percent_encode(signature)}&{canonical_query}"
    request = Request(f"https://{endpoint}/?{signed_query}", method="GET")

    try:
        with urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise RuntimeError(f"调用阿里云短信失败：{exc}") from exc

    if result.get("Code") != "OK":
        message = result.get("Message") or result.get("Code") or "未知错误"
        raise RuntimeError(f"阿里云短信发送失败：{message}")


def _handle_send_code(environ, start_response):
    data, error = _read_json(environ)
    if error:
        return _error(start_response, "400 Bad Request", error)

    phone = _normalize_phone(data.get("phone"))
    if not _valid_phone(phone):
        return _error(start_response, "400 Bad Request", "请输入有效手机号。")

    now = time.time()
    _cleanup(now)
    existing = codes.get(phone)
    if existing and now - existing.last_sent_at < RESEND_SECONDS:
        retry_after = int(RESEND_SECONDS - (now - existing.last_sent_at))
        return _json_response(
            start_response,
            "429 Too Many Requests",
            {"ok": False, "error": f"请等待 {retry_after} 秒后再发送。", "retryAfter": retry_after},
            [("Retry-After", str(retry_after))],
        )

    code = _generate_code()
    try:
        _send_sms(phone, code)
    except RuntimeError as exc:
        return _error(start_response, "503 Service Unavailable", str(exc))

    codes[phone] = CodeRecord(code=code, expires_at=now + CODE_TTL_SECONDS, last_sent_at=now)
    payload = {
        "ok": True,
        "expiresIn": CODE_TTL_SECONDS,
        "retryAfter": RESEND_SECONDS,
        "message": "验证码已发送。",
    }
    if DEV_SMS:
        payload["devCode"] = code
    return _json_response(start_response, "200 OK", payload)


def _handle_verify_code(environ, start_response):
    data, error = _read_json(environ)
    if error:
        return _error(start_response, "400 Bad Request", error)

    phone = _normalize_phone(data.get("phone"))
    code = "".join(ch for ch in str(data.get("code") or "") if ch.isdigit())
    if not _valid_phone(phone):
        return _error(start_response, "400 Bad Request", "请输入有效手机号。")
    if len(code) != 6:
        return _error(start_response, "400 Bad Request", "请输入 6 位验证码。")

    now = time.time()
    _cleanup(now)
    record = codes.get(phone)
    if not record:
        return _error(start_response, "400 Bad Request", "验证码已过期，请重新发送。")
    if record.attempts >= MAX_ATTEMPTS:
        codes.pop(phone, None)
        return _error(start_response, "429 Too Many Requests", "错误次数过多，请重新发送验证码。")
    if not secrets.compare_digest(record.code, code):
        record.attempts += 1
        return _error(start_response, "400 Bad Request", "验证码不正确。")

    codes.pop(phone, None)
    if phone not in users:
        registration_token = _create_session(
            {"name": "", "method": "手机号", "phone": phone},
            {"pending_registration": True, "phone": phone},
        )
        return _json_response(
            start_response,
            "200 OK",
            {
                "ok": True,
                "requiresRegistration": True,
                "registrationToken": registration_token,
                "phone": phone,
            },
        )

    user = _public_user(users[phone])
    token = _create_session(user)
    return _json_response(start_response, "200 OK", {"ok": True, "token": token, "user": user})


def _handle_register(environ, start_response):
    data, error = _read_json(environ)
    if error:
        return _error(start_response, "400 Bad Request", error)

    auth = environ.get("HTTP_AUTHORIZATION", "")
    token = auth.removeprefix("Bearer ").strip() or str(data.get("registrationToken") or "").strip()
    session = sessions.get(token)
    if not token or not session or not session.get("pending_registration"):
        return _error(start_response, "401 Unauthorized", "注册会话已失效，请重新验证手机号。")

    registration_method = str(session.get("registration_method") or session.get("method") or "手机号")
    phone = _normalize_phone(session.get("phone"))
    name = str(data.get("name") or "").strip()
    gender = str(data.get("gender") or "").strip()
    bio = str(data.get("bio") or "").strip()
    if not 1 <= len(name) <= 24:
        return _error(start_response, "400 Bad Request", "姓名长度需要在 1-24 个字符之间。")
    if gender not in {"女", "男", "其他", "不便透露"}:
        return _error(start_response, "400 Bad Request", "请选择性别。")
    if not 1 <= len(bio) <= 160:
        return _error(start_response, "400 Bad Request", "个人信息介绍需要在 1-160 个字符之间。")

    user_key = str(session.get("user_key") or phone).strip()
    if registration_method == "Apple ID":
        user_key = user_key or f"apple:{session.get('appleSub') or session.get('email') or secrets.token_urlsafe(8)}"
        stored_user = users.get(user_key, {})
        profile = {
            **stored_user,
            "name": name,
            "nickname": name,
            "gender": gender,
            "bio": bio,
            "avatar": stored_user.get("avatar") or "ink",
            "method": "Apple ID",
            "phone": str(stored_user.get("phone") or ""),
            "email": str(session.get("email") or stored_user.get("email") or ""),
            "appleSub": str(session.get("appleSub") or stored_user.get("appleSub") or ""),
            "created_at": stored_user.get("created_at") or int(time.time()),
        }
    else:
        if not _valid_phone(phone):
            return _error(start_response, "400 Bad Request", "注册会话缺少有效手机号，请重新验证手机号。")
        user_key = phone
        profile = {
            "name": name,
            "nickname": name,
            "gender": gender,
            "bio": bio,
            "method": "手机号",
            "phone": phone,
            "created_at": int(time.time()),
        }
    users[user_key] = profile
    _save_users()
    user = _public_user(profile)
    sessions[token] = {"user": user, "created_at": time.time()}
    return _json_response(start_response, "200 OK", {"ok": True, "token": token, "user": user})


def _handle_session(environ, start_response):
    auth = environ.get("HTTP_AUTHORIZATION", "")
    token = auth.removeprefix("Bearer ").strip()
    session = sessions.get(token)
    if not token or not session:
        return _error(start_response, "401 Unauthorized", "登录已失效。")
    return _json_response(start_response, "200 OK", {"ok": True, "user": session["user"]})


def _handle_auth_config(environ, start_response):
    return _json_response(
        start_response,
        "200 OK",
        {
            "ok": True,
            "appleClientId": APPLE_CLIENT_ID,
            "appleNativeClientId": APPLE_NATIVE_CLIENT_ID,
            "appleRedirectUri": APPLE_REDIRECT_URI,
        },
    )


def _verify_apple_identity_token(identity_token: str) -> dict[str, Any]:
    if not APPLE_ALLOWED_CLIENT_IDS:
        raise RuntimeError("Apple 登录未配置：缺少 APPLE_CLIENT_ID。")

    try:
        import jwt
        from jwt import PyJWKClient
    except ImportError as exc:
        raise RuntimeError("Apple 登录依赖未安装，请执行 pip install -r requirements.staynest.txt。") from exc

    try:
        signing_key = PyJWKClient(APPLE_JWKS_URL).get_signing_key_from_jwt(identity_token)
        return jwt.decode(
            identity_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=APPLE_ALLOWED_CLIENT_IDS,
            issuer="https://appleid.apple.com",
        )
    except Exception as exc:
        raise RuntimeError(f"Apple 登录验证失败：{exc}") from exc


def _handle_apple_login(environ, start_response):
    data, error = _read_json(environ)
    if error:
        return _error(start_response, "400 Bad Request", error)

    identity_token = str(data.get("identityToken") or "").strip()
    if not identity_token:
        return _error(start_response, "400 Bad Request", "缺少 Apple identityToken。")

    try:
        payload = _verify_apple_identity_token(identity_token)
    except RuntimeError as exc:
        return _error(start_response, "401 Unauthorized", str(exc))

    now = time.time()
    apple_sub = payload.get("sub")
    email = payload.get("email", "")
    name = str(data.get("name") or "").strip() or email or "Apple 用户"
    user_key = f"apple:{apple_sub or email or secrets.token_urlsafe(8)}"
    stored_user = users.get(user_key, {})
    if stored_user and _is_registered_user_complete(stored_user):
        user = _public_user(stored_user)
        token = _create_session(user, {"created_at": now})
        return _json_response(start_response, "200 OK", {"ok": True, "token": token, "user": user})

    registration_token = _create_session(
        {
            "name": name,
            "nickname": name,
            "avatar": "ink",
            "method": "Apple ID",
            "phone": "",
            "appleSub": apple_sub,
            "email": email,
        },
        {
            "pending_registration": True,
            "registration_method": "Apple ID",
            "user_key": user_key,
            "appleSub": apple_sub,
            "email": email,
        },
    )
    suggested_name = str(stored_user.get("name") or stored_user.get("nickname") or name or "").strip()
    return _json_response(
        start_response,
        "200 OK",
        {
            "ok": True,
            "requiresRegistration": True,
            "registrationToken": registration_token,
            "provider": "Apple ID",
            "registrationLabel": "Apple ID 已验证",
            "name": "" if "@" in suggested_name else suggested_name,
        },
    )


def _get_session_user(environ) -> dict[str, Any] | None:
    auth = environ.get("HTTP_AUTHORIZATION", "")
    token = auth.removeprefix("Bearer ").strip()
    session = sessions.get(token)
    if not token or not session:
        return None
    user = session.get("user")
    return user if isinstance(user, dict) else None


def _public_guide_application(application: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(application.get("id") or ""),
        "applicantName": str(application.get("applicantName") or "StayNest 用户"),
        "realName": str(application.get("realName") or application.get("applicantName") or "StayNest 用户"),
        "gender": str(application.get("gender") or ""),
        "phone": str(application.get("phone") or ""),
        "avatar": str(application.get("avatar") or "teal"),
        "city": str(application.get("city") or "未填写"),
        "specialty": str(application.get("specialty") or "未填写"),
        "englishLevel": str(application.get("englishLevel") or ""),
        "intro": str(application.get("intro") or "未填写个人介绍。"),
        "idCardFront": _public_attachment(application.get("idCardFront")),
        "idCardBack": _public_attachment(application.get("idCardBack")),
        "profilePhoto": _public_attachment(application.get("profilePhoto")),
        "englishCertificates": _attachment_list(application.get("englishCertificates"), 4),
        "guideCertificates": _attachment_list(application.get("guideCertificates"), 4),
        "status": str(application.get("status") or "审核中"),
        "reviewStatus": str(application.get("reviewStatus") or "待审核"),
        "submittedAt": str(application.get("submittedAt") or ""),
        "reviewedAt": str(application.get("reviewedAt") or ""),
        "rejectReason": str(application.get("rejectReason") or ""),
    }


def _public_attachment(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    name = str(value.get("name") or "").strip()
    data_url = str(value.get("dataUrl") or "").strip()
    if not data_url:
        return None
    return {
        "label": str(value.get("label") or "").strip(),
        "name": name,
        "type": str(value.get("type") or "").strip(),
        "size": int(value.get("size") or 0),
        "dataUrl": data_url,
    }


def _attachment_list(value: Any, limit: int = 4) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    attachments = []
    for item in value:
        attachment = _public_attachment(item)
        if attachment:
            attachments.append(attachment)
        if len(attachments) >= limit:
            break
    return attachments


def _string_list(value: Any, limit: int = 12) -> list[str]:
    if isinstance(value, str):
        items = value.replace("\r", "\n").replace("，", ",").split("\n")
        if len(items) == 1:
            items = value.replace("，", ",").split(",")
    elif isinstance(value, list):
        items = value
    else:
        items = []
    return [str(item).strip() for item in items if str(item).strip()][:limit]


def _pair_list(value: Any, limit: int = 12) -> list[list[str]]:
    pairs: list[list[str]] = []
    if not isinstance(value, list):
        return pairs
    for item in value:
        if isinstance(item, list) and len(item) >= 3:
            first, second, third = item[0], item[1], item[2]
            pairs.append([str(first).strip(), str(second).strip(), str(third).strip()])
        elif isinstance(item, dict):
            pairs.append(
                [
                    str(item.get("time") or item.get("name") or "").strip(),
                    str(item.get("title") or "").strip(),
                    str(item.get("description") or "").strip(),
                ]
            )
        if len(pairs) >= limit:
            break
    return [pair for pair in pairs if all(pair)]


def _detail_pair_list(value: Any, limit: int = 12) -> list[list[str]]:
    pairs: list[list[str]] = []
    if not isinstance(value, list):
        return pairs
    for item in value:
        if isinstance(item, list) and len(item) >= 2:
            pairs.append([str(item[0]).strip(), str(item[1]).strip()])
        elif isinstance(item, dict):
            pairs.append([str(item.get("name") or "").strip(), str(item.get("description") or "").strip()])
        if len(pairs) >= limit:
            break
    return [pair for pair in pairs if all(pair)]


def _body_blocks(value: Any, limit: int = 40) -> list[dict[str, str]]:
    blocks: list[dict[str, str]] = []
    if not isinstance(value, list):
        return blocks
    for item in value:
        if isinstance(item, dict):
            block_type = str(item.get("type") or "").strip()
            if block_type == "image":
                src = str(item.get("src") or "").strip()
                caption = str(item.get("caption") or "").strip()
                if src:
                    blocks.append({"type": "image", "src": src, "caption": caption})
            else:
                text = str(item.get("text") or "").strip()
                if text:
                    blocks.append({"type": "text", "text": text})
        elif isinstance(item, list) and len(item) >= 2:
            block_type = str(item[0] or "").strip()
            if block_type == "image":
                src = str(item[1] or "").strip()
                caption = str(item[2] if len(item) > 2 else "").strip()
                if src:
                    blocks.append({"type": "image", "src": src, "caption": caption})
            else:
                text = str(item[1] or "").strip()
                if text:
                    blocks.append({"type": "text", "text": text})
        if len(blocks) >= limit:
            break
    return blocks


def _body_blocks_with_fallback(product: dict[str, Any]) -> list[dict[str, str]]:
    blocks = _body_blocks(product.get("bodyBlocks"))
    if blocks:
        return blocks
    fallback_blocks: list[dict[str, str]] = []
    intro = str(product.get("intro") or "").strip()
    if intro:
        fallback_blocks.append({"type": "text", "text": intro})
    for src, caption in _detail_pair_list(product.get("bodyImages")):
        fallback_blocks.append({"type": "image", "src": src, "caption": caption})
    return fallback_blocks


def _valid_product_image_src(value: Any) -> bool:
    src = str(value or "").strip()
    if not src:
        return True
    if src.startswith(("http://", "https://", "./", "/")):
        return True
    if not src.startswith("data:image/"):
        return False
    header, separator, payload = src.partition(",")
    if not separator or ";base64" not in header or len(payload) > 4 * 1024 * 1024:
        return False
    return header.lower().startswith(("data:image/jpeg", "data:image/jpg", "data:image/png", "data:image/webp"))


def _public_product(product: dict[str, Any]) -> dict[str, Any]:
    try:
        price = int(float(product.get("price") or 399))
    except (TypeError, ValueError):
        price = 399
    return {
        "id": str(product.get("id") or ""),
        "title": str(product.get("title") or ""),
        "destination": str(product.get("destination") or ""),
        "preference": str(product.get("preference") or ""),
        "duration": str(product.get("duration") or "一日游"),
        "price": max(price, 1),
        "image": str(product.get("image") or ""),
        "spots": _string_list(product.get("spots")),
        "intro": str(product.get("intro") or ""),
        "highlights": _string_list(product.get("highlights")),
        "bodyBlocks": _body_blocks_with_fallback(product),
        "bodyImages": _detail_pair_list(product.get("bodyImages")),
        "itinerary": _pair_list(product.get("itinerary")),
        "attractionDetails": _detail_pair_list(product.get("attractionDetails")),
        "tip": str(product.get("tip") or ""),
        "status": str(product.get("status") or "draft"),
        "updatedAt": str(product.get("updatedAt") or ""),
        "createdAt": str(product.get("createdAt") or ""),
    }


def _handle_list_products(environ, start_response):
    published_products = [_public_product(product) for product in products if product.get("status") == "published"]
    return _json_response(start_response, "200 OK", {"ok": True, "products": published_products})


def _handle_admin_list_products(environ, start_response):
    return _json_response(
        start_response,
        "200 OK",
        {"ok": True, "products": [_public_product(product) for product in products]},
    )


def _handle_save_product(environ, start_response):
    data, error = _read_json(environ)
    if error:
        return _error(start_response, "400 Bad Request", error)

    product_id = str(data.get("id") or "").strip() or f"product-{int(time.time() * 1000)}"
    title = str(data.get("title") or "").strip()
    destination = str(data.get("destination") or "").strip()
    preference = str(data.get("preference") or "").strip()
    duration = str(data.get("duration") or "一日游").strip()
    try:
        price = int(float(data.get("price") or 0))
    except (TypeError, ValueError):
        price = 0
    image = str(data.get("image") or "").strip()
    intro = str(data.get("intro") or "").strip()
    tip = str(data.get("tip") or "").strip()
    status = str(data.get("status") or "draft").strip()
    spots = _string_list(data.get("spots"), 16)
    highlights = _string_list(data.get("highlights"), 16)
    body_blocks = _body_blocks(data.get("bodyBlocks"), 80)
    body_images = _detail_pair_list(data.get("bodyImages"), 16)
    itinerary = _pair_list(data.get("itinerary"), 16)
    attraction_details = _detail_pair_list(data.get("attractionDetails"), 16)
    first_text = next((block["text"] for block in body_blocks if block.get("type") == "text"), "")
    first_image = next((block["src"] for block in body_blocks if block.get("type") == "image"), "")
    if not intro:
        intro = first_text[:220] or "查看路线正文介绍。"
    if not image:
        image = first_image or (DEFAULT_PRODUCTS[0]["image"] if DEFAULT_PRODUCTS else "")
    if not spots:
        spots = highlights[:4]
    if not body_images:
        body_images = [
            [block["src"], block.get("caption", "")]
            for block in body_blocks
            if block.get("type") == "image"
        ][:16]

    if not 1 <= len(title) <= 40:
        return _error(start_response, "400 Bad Request", "路线名称需要在 1-40 个字符之间。")
    if destination not in {"北京", "上海", "成都", "广州"}:
        return _error(start_response, "400 Bad Request", "请选择有效目的地。")
    if preference not in {"城市景观", "自然风光", "本地美食"}:
        return _error(start_response, "400 Bad Request", "请选择有效行程偏好。")
    if price < 1 or price > 999999:
        return _error(start_response, "400 Bad Request", "请填写 1-999999 之间的产品价格。")
    if not _valid_product_image_src(image):
        return _error(start_response, "400 Bad Request", "请填写有效图片地址。")
    invalid_body_image = next(
        (
            block.get("src", "")
            for block in body_blocks
            if block.get("type") == "image"
            and not _valid_product_image_src(block.get("src", ""))
        ),
        "",
    )
    if invalid_body_image:
        return _error(start_response, "400 Bad Request", "正文图片地址无效。")
    if len(highlights) < 1:
        return _error(start_response, "400 Bad Request", "请至少填写 1 个路线亮点。")
    if len(body_blocks) < 1:
        return _error(start_response, "400 Bad Request", "请填写正文介绍，或插入至少 1 张正文图片。")
    if status not in {"draft", "published"}:
        return _error(start_response, "400 Bad Request", "产品状态无效。")

    now = dt.datetime.now(dt.timezone.utc).isoformat()
    existing_index = next((index for index, item in enumerate(products) if item.get("id") == product_id), -1)
    created_at = products[existing_index].get("createdAt") if existing_index >= 0 else now
    product = {
        "id": product_id,
        "title": title,
        "destination": destination,
        "preference": preference,
        "duration": duration or "一日游",
        "price": price,
        "image": image,
        "spots": spots,
        "intro": intro,
        "highlights": highlights,
        "bodyBlocks": body_blocks,
        "bodyImages": body_images,
        "itinerary": itinerary,
        "attractionDetails": attraction_details,
        "tip": tip,
        "status": status,
        "createdAt": created_at,
        "updatedAt": now,
    }
    if existing_index >= 0:
        products[existing_index] = product
    else:
        products.insert(0, product)
    _save_products()
    return _json_response(start_response, "200 OK", {"ok": True, "product": _public_product(product)})


def _handle_delete_product(environ, start_response):
    data, error = _read_json(environ)
    if error:
        return _error(start_response, "400 Bad Request", error)

    product_id = str(data.get("id") or "").strip()
    if not product_id:
        return _error(start_response, "400 Bad Request", "缺少产品 ID。")

    for index, product in enumerate(products):
        if str(product.get("id") or "") != product_id:
            continue
        deleted = products.pop(index)
        _save_products()
        return _json_response(
            start_response,
            "200 OK",
            {
                "ok": True,
                "deletedId": product_id,
                "product": _public_product(deleted),
                "products": [_public_product(item) for item in products],
            },
        )

    return _error(start_response, "404 Not Found", "没有找到这个旅游产品。")


def _public_order(order: dict[str, Any]) -> dict[str, Any]:
    try:
        price = int(float(order.get("price") or 0))
    except (TypeError, ValueError):
        price = 0
    return {
        "id": str(order.get("id") or ""),
        "productId": str(order.get("productId") or ""),
        "productTitle": str(order.get("productTitle") or ""),
        "productImage": str(order.get("productImage") or ""),
        "destination": str(order.get("destination") or ""),
        "preference": str(order.get("preference") or ""),
        "duration": str(order.get("duration") or ""),
        "travelDate": str(order.get("travelDate") or ""),
        "price": price,
        "travelerName": str(order.get("travelerName") or ""),
        "travelerPhone": str(order.get("travelerPhone") or ""),
        "guideName": str(order.get("guideName") or ""),
        "guidePhone": str(order.get("guidePhone") or ""),
        "claimedAt": str(order.get("claimedAt") or ""),
        "status": str(order.get("status") or "待确认"),
        "createdAt": str(order.get("createdAt") or ""),
        "updatedAt": str(order.get("updatedAt") or ""),
    }


def _order_chat_identity(environ, data: dict[str, Any] | None = None) -> dict[str, str]:
    params = parse_qs(environ.get("QUERY_STRING") or "")
    user = _get_session_user(environ) or {}
    data = data or {}
    return {
        "name": str(data.get("senderName") or params.get("name", [""])[0] or user.get("nickname") or user.get("name") or "").strip(),
        "phone": str(data.get("senderPhone") or params.get("phone", [""])[0] or user.get("phone") or "").strip(),
    }


def _find_order(order_id: str) -> dict[str, Any] | None:
    return next((order for order in orders if str(order.get("id") or "") == order_id), None)


def _is_order_participant(order: dict[str, Any], identity: dict[str, str]) -> bool:
    phone = "".join(ch for ch in str(identity.get("phone") or "") if ch.isdigit())
    name = str(identity.get("name") or "").strip()
    traveler_phone = "".join(ch for ch in str(order.get("travelerPhone") or "") if ch.isdigit())
    guide_phone = "".join(ch for ch in str(order.get("guidePhone") or "") if ch.isdigit())
    traveler_name = str(order.get("travelerName") or "").strip()
    guide_name = str(order.get("guideName") or "").strip()
    return bool(
        (phone and phone in {traveler_phone, guide_phone})
        or (name and name in {traveler_name, guide_name})
    )


def _chat_role_for_order(order: dict[str, Any], identity: dict[str, str]) -> str:
    phone = "".join(ch for ch in str(identity.get("phone") or "") if ch.isdigit())
    name = str(identity.get("name") or "").strip()
    traveler_phone = "".join(ch for ch in str(order.get("travelerPhone") or "") if ch.isdigit())
    guide_phone = "".join(ch for ch in str(order.get("guidePhone") or "") if ch.isdigit())
    if phone and guide_phone and phone == guide_phone:
        return "guide"
    if phone and traveler_phone and phone == traveler_phone:
        return "traveler"
    if name and name == str(order.get("guideName") or "").strip():
        return "guide"
    return "traveler"


def _public_chat_message(message: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(message.get("id") or ""),
        "orderId": str(message.get("orderId") or ""),
        "senderName": str(message.get("senderName") or ""),
        "senderPhone": str(message.get("senderPhone") or ""),
        "senderRole": str(message.get("senderRole") or ""),
        "text": str(message.get("text") or ""),
        "createdAt": str(message.get("createdAt") or ""),
    }


def _handle_list_order_chat(environ, start_response):
    params = parse_qs(environ.get("QUERY_STRING") or "")
    order_id = str(params.get("orderId", [""])[0] or "").strip()
    if not order_id:
        return _error(start_response, "400 Bad Request", "缺少订单 ID。")

    order = _find_order(order_id)
    if not order:
        return _error(start_response, "404 Not Found", "没有找到这条订单。")
    identity = _order_chat_identity(environ)
    if not _is_order_participant(order, identity):
        return _error(start_response, "403 Forbidden", "你不能查看这条订单的聊天。")

    messages = [
        _public_chat_message(message)
        for message in chat_messages
        if str(message.get("orderId") or "") == order_id
    ]
    messages.sort(key=lambda item: item.get("createdAt") or "")
    return _json_response(start_response, "200 OK", {"ok": True, "messages": messages})


def _handle_send_order_chat(environ, start_response):
    data, error = _read_json(environ)
    if error:
        return _error(start_response, "400 Bad Request", error)

    order_id = str(data.get("orderId") or "").strip()
    text = str(data.get("text") or "").strip()
    if not order_id:
        return _error(start_response, "400 Bad Request", "缺少订单 ID。")
    if not text:
        return _error(start_response, "400 Bad Request", "消息内容不能为空。")
    if len(text) > 1000:
        return _error(start_response, "400 Bad Request", "消息内容不能超过 1000 字。")

    order = _find_order(order_id)
    if not order:
        return _error(start_response, "404 Not Found", "没有找到这条订单。")
    identity = _order_chat_identity(environ, data)
    if not _is_order_participant(order, identity):
        return _error(start_response, "403 Forbidden", "你不能给这条订单发消息。")

    now = dt.datetime.now(dt.timezone.utc).isoformat()
    message = {
        "id": f"chat-{int(time.time() * 1000)}-{secrets.token_hex(3)}",
        "orderId": order_id,
        "senderName": identity.get("name") or "StayNest 用户",
        "senderPhone": identity.get("phone") or "",
        "senderRole": _chat_role_for_order(order, identity),
        "text": text[:1000],
        "createdAt": now,
    }
    chat_messages.append(message)
    _save_chat_messages()
    return _json_response(start_response, "200 OK", {"ok": True, "message": _public_chat_message(message)})


def _handle_create_order(environ, start_response):
    data, error = _read_json(environ)
    if error:
        return _error(start_response, "400 Bad Request", error)

    product_id = str(data.get("productId") or "").strip()
    travel_date = str(data.get("travelDate") or "").strip()
    product = next(
        (
            item
            for item in products
            if str(item.get("id") or "") == product_id and str(item.get("status") or "") == "published"
        ),
        None,
    )
    if not product:
        return _error(start_response, "404 Not Found", "没有找到可下单的旅游产品。")

    try:
        selected_date = dt.date.fromisoformat(travel_date)
    except ValueError:
        return _error(start_response, "400 Bad Request", "请选择有效的出行日期。")
    if selected_date < dt.date.today():
        return _error(start_response, "400 Bad Request", "出行日期不能早于今天。")

    user = _get_session_user(environ) or {}
    traveler_name = str(
        data.get("travelerName") or user.get("nickname") or user.get("name") or "StayNest 用户"
    ).strip()
    traveler_phone = str(data.get("travelerPhone") or user.get("phone") or "").strip()
    try:
        price = int(float(product.get("price") or 399))
    except (TypeError, ValueError):
        price = 399

    now = dt.datetime.now(dt.timezone.utc).isoformat()
    order = {
        "id": f"order-{int(time.time() * 1000)}",
        "productId": product_id,
        "productTitle": str(product.get("title") or "未命名路线"),
        "productImage": str(product.get("image") or ""),
        "destination": str(product.get("destination") or ""),
        "preference": str(product.get("preference") or ""),
        "duration": str(product.get("duration") or "一日游"),
        "travelDate": travel_date,
        "price": max(price, 1),
        "travelerName": traveler_name[:40],
        "travelerPhone": traveler_phone[:32],
        "status": "待确认",
        "createdAt": now,
        "updatedAt": now,
    }
    orders.insert(0, order)
    _save_orders()
    return _json_response(start_response, "200 OK", {"ok": True, "order": _public_order(order)})


def _order_from_payload(data: dict[str, Any]) -> dict[str, Any] | None:
    product_id = str(data.get("productId") or "").strip()
    travel_date = str(data.get("travelDate") or "").strip()
    try:
        dt.date.fromisoformat(travel_date)
    except ValueError:
        return None

    product = next((item for item in products if str(item.get("id") or "") == product_id), None)
    try:
        price = int(float(data.get("price") or (product or {}).get("price") or 399))
    except (TypeError, ValueError):
        price = 399

    now = dt.datetime.now(dt.timezone.utc).isoformat()
    order_id = str(data.get("id") or f"order-{int(time.time() * 1000)}").strip()
    return {
        "id": order_id,
        "productId": product_id,
        "productTitle": str(data.get("productTitle") or (product or {}).get("title") or "未命名路线"),
        "productImage": str(data.get("productImage") or (product or {}).get("image") or ""),
        "destination": str(data.get("destination") or (product or {}).get("destination") or ""),
        "preference": str(data.get("preference") or (product or {}).get("preference") or ""),
        "duration": str(data.get("duration") or (product or {}).get("duration") or "一日游"),
        "travelDate": travel_date,
        "price": max(price, 1),
        "travelerName": str(data.get("travelerName") or "游客")[:40],
        "travelerPhone": str(data.get("travelerPhone") or "")[:32],
        "status": str(data.get("status") or "待确认"),
        "createdAt": str(data.get("createdAt") or now),
        "updatedAt": now,
    }


def _handle_order_pixel(environ, start_response):
    params = parse_qs(environ.get("QUERY_STRING") or "")
    payload = params.get("payload", [""])[0]
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        data = {}
    order = _order_from_payload(data) if isinstance(data, dict) else None
    if order and not any(item.get("id") == order["id"] for item in orders):
        orders.insert(0, order)
        _save_orders()

    body = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==")
    start_response(
        "200 OK",
        [
            ("Content-Type", "image/gif"),
            ("Content-Length", str(len(body))),
            ("Cache-Control", "no-store"),
        ],
    )
    return [body]


def _handle_list_orders(environ, start_response):
    user = _get_session_user(environ)
    if not user:
        return _json_response(start_response, "200 OK", {"ok": True, "orders": []})

    phone = str(user.get("phone") or "")
    name = str(user.get("nickname") or user.get("name") or "")
    matched_orders = [
        _public_order(order)
        for order in orders
        if (phone and str(order.get("travelerPhone") or "") == phone)
        or (phone and str(order.get("guidePhone") or "") == phone)
        or (name and str(order.get("travelerName") or "") == name)
        or (name and str(order.get("guideName") or "") == name)
    ]
    return _json_response(start_response, "200 OK", {"ok": True, "orders": matched_orders})


def _handle_admin_list_orders(environ, start_response):
    return _json_response(start_response, "200 OK", {"ok": True, "orders": [_public_order(order) for order in orders]})


def _guide_status_for_user(user: dict[str, Any]) -> str:
    phone = "".join(ch for ch in str(user.get("phone") or "") if ch.isdigit())
    name = str(user.get("nickname") or user.get("name") or "").strip()
    for application in guide_applications:
        application_phone = "".join(ch for ch in str(application.get("phone") or "") if ch.isdigit())
        application_name = str(application.get("realName") or application.get("applicantName") or "").strip()
        if (phone and application_phone == phone) or (name and application_name == name):
            return str(application.get("reviewStatus") or application.get("status") or "审核中")
    return "未申请"


def _public_admin_user(record_key: str, profile: dict[str, Any]) -> dict[str, Any]:
    public_user = _public_user(profile)
    guide_status = _guide_status_for_user(public_user)
    return {
        "id": record_key,
        **public_user,
        "role": "导游" if guide_status == "已通过" else "游客",
        "guideStatus": guide_status,
    }


def _handle_admin_list_users(environ, start_response):
    admin_users = [
        _public_admin_user(key, profile)
        for key, profile in users.items()
        if isinstance(profile, dict)
    ]
    admin_users.sort(key=lambda item: str(item.get("created_at") or ""), reverse=True)
    return _json_response(start_response, "200 OK", {"ok": True, "users": admin_users})


def _handle_available_orders(environ, start_response):
    available_orders = [
        _public_order(order)
        for order in orders
        if str(order.get("status") or "") == "待确认" and not str(order.get("guidePhone") or "")
    ]
    return _json_response(start_response, "200 OK", {"ok": True, "orders": available_orders})


def _handle_grab_order(environ, start_response):
    data, error = _read_json(environ)
    if error:
        return _error(start_response, "400 Bad Request", error)

    order_id = str(data.get("orderId") or "").strip()
    if not order_id:
        return _error(start_response, "400 Bad Request", "缺少订单 ID。")

    user = _get_session_user(environ) or {}
    guide_name = str(data.get("guideName") or user.get("nickname") or user.get("name") or "导游").strip()
    guide_phone = str(data.get("guidePhone") or user.get("phone") or "").strip()
    now = dt.datetime.now(dt.timezone.utc).isoformat()

    for order in orders:
        if str(order.get("id") or "") != order_id:
            continue
        if str(order.get("status") or "") != "待确认" or str(order.get("guidePhone") or ""):
            return _error(start_response, "409 Conflict", "这条订单已被其他导游抢走。")
        order["status"] = "进行中"
        order["guideName"] = guide_name[:40]
        order["guidePhone"] = guide_phone[:32]
        order["claimedAt"] = now
        order["updatedAt"] = now
        chat_messages.append(
            {
                "id": f"chat-{int(time.time() * 1000)}-{secrets.token_hex(3)}",
                "orderId": order_id,
                "senderName": guide_name[:40] or "导游",
                "senderPhone": guide_phone[:32],
                "senderRole": "guide",
                "text": f"{guide_name[:40] or '导游'}已接单，稍后与你确认集合地点和行程细节。",
                "createdAt": now,
            }
        )
        _save_orders()
        _save_chat_messages()
        return _json_response(start_response, "200 OK", {"ok": True, "order": _public_order(order)})

    return _error(start_response, "404 Not Found", "没有找到这条订单。")


def _handle_create_guide_application(environ, start_response):
    data, error = _read_json(environ)
    if error:
        return _error(start_response, "400 Bad Request", error)

    user = _get_session_user(environ) or {
        "nickname": str(data.get("applicantName") or data.get("name") or "StayNest 用户"),
        "name": str(data.get("applicantName") or data.get("name") or "StayNest 用户"),
        "phone": str(data.get("phone") or ""),
        "avatar": str(data.get("avatar") or "teal"),
    }
    real_name = str(data.get("realName") or data.get("applicantName") or data.get("name") or "").strip()
    gender = str(data.get("gender") or "").strip()
    city = str(data.get("city") or "").strip()
    specialty = str(data.get("specialty") or "").strip()
    english_level = str(data.get("englishLevel") or "").strip()
    intro = str(data.get("intro") or "").strip()
    id_card_front = _public_attachment(data.get("idCardFront"))
    id_card_back = _public_attachment(data.get("idCardBack"))
    profile_photo = _public_attachment(data.get("profilePhoto"))
    english_certificates = _attachment_list(data.get("englishCertificates"), 4)
    guide_certificates = _attachment_list(data.get("guideCertificates"), 4)
    if not 1 <= len(real_name) <= 24:
        return _error(start_response, "400 Bad Request", "请填写 1-24 个字符的真实姓名。")
    if gender not in {"女", "男", "其他", "不便透露"}:
        return _error(start_response, "400 Bad Request", "请选择性别。")
    if not city or len(city) > 20:
        return _error(start_response, "400 Bad Request", "请填写 1-20 个字符的服务城市。")
    if not specialty or len(specialty) > 24:
        return _error(start_response, "400 Bad Request", "请选择服务方向。")
    if english_level not in {"基础沟通", "日常交流", "流利讲解", "专业同传/高阶商务"}:
        return _error(start_response, "400 Bad Request", "请选择英文水平。")
    if not intro or len(intro) > 300:
        return _error(start_response, "400 Bad Request", "请填写 1-300 个字符的个人介绍。")
    if not id_card_front or not id_card_back or not profile_photo:
        return _error(start_response, "400 Bad Request", "请上传身份证正反面和形象照片。")

    phone = str(user.get("phone") or "")
    existing_index = next((index for index, item in enumerate(guide_applications) if item.get("phone") == phone and phone), -1)
    application = {
        "id": str(guide_applications[existing_index].get("id") if existing_index >= 0 else f"guide-{int(time.time() * 1000)}"),
        "applicantName": real_name,
        "realName": real_name,
        "gender": gender,
        "phone": phone,
        "avatar": str(user.get("avatar") or "teal"),
        "city": city,
        "specialty": specialty,
        "englishLevel": english_level,
        "intro": intro,
        "idCardFront": id_card_front,
        "idCardBack": id_card_back,
        "profilePhoto": profile_photo,
        "englishCertificates": english_certificates,
        "guideCertificates": guide_certificates,
        "status": "审核中",
        "reviewStatus": "待审核",
        "submittedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "reviewedAt": "",
        "rejectReason": "",
    }
    if existing_index >= 0:
        guide_applications[existing_index] = application
    else:
        guide_applications.insert(0, application)
    _save_guide_applications()
    return _json_response(start_response, "200 OK", {"ok": True, "application": _public_guide_application(application)})


def _handle_list_guide_applications(environ, start_response):
    applications = [_public_guide_application(application) for application in guide_applications]
    return _json_response(start_response, "200 OK", {"ok": True, "applications": applications})


def _handle_review_guide_application(environ, start_response):
    data, error = _read_json(environ)
    if error:
        return _error(start_response, "400 Bad Request", error)

    application_id = str(data.get("id") or "").strip()
    review_status = str(data.get("reviewStatus") or "").strip()
    reject_reason = str(data.get("rejectReason") or "").strip()
    if review_status not in {"已通过", "已驳回"}:
        return _error(start_response, "400 Bad Request", "审核状态无效。")

    for application in guide_applications:
        if application.get("id") != application_id:
            continue
        application["reviewStatus"] = review_status
        application["status"] = review_status
        application["reviewedAt"] = dt.datetime.now(dt.timezone.utc).isoformat()
        application["rejectReason"] = reject_reason if review_status == "已驳回" else ""
        _save_guide_applications()
        return _json_response(
            start_response,
            "200 OK",
            {"ok": True, "application": _public_guide_application(application)},
        )

    return _error(start_response, "404 Not Found", "没有找到这条导游申请。")


def _handle_clear_guide_applications(environ, start_response):
    guide_applications.clear()
    products.clear()
    orders.clear()
    chat_messages.clear()
    users.clear()
    sessions.clear()
    codes.clear()
    _save_guide_applications()
    _save_products()
    _save_orders()
    _save_chat_messages()
    _save_users()
    return _json_response(start_response, "200 OK", {"ok": True, "applications": [], "products": [], "orders": [], "messages": [], "users": 0})


def _serve_static(environ, start_response):
    path = unquote(environ.get("PATH_INFO") or "/")
    if path == "/":
        path = "/index.html"
    safe_parts = [part for part in path.split("/") if part and part not in {".", ".."}]
    file_path = STATIC_DIR.joinpath(*safe_parts).resolve()
    if not str(file_path).startswith(str(STATIC_DIR.resolve())) or not file_path.is_file():
        return _error(start_response, "404 Not Found", "Not found")

    content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    body = file_path.read_bytes()
    start_response(
        "200 OK",
        [
            ("Content-Type", content_type),
            ("Content-Length", str(len(body))),
            ("Cache-Control", "no-cache" if file_path.name.endswith((".html", ".js", ".css")) else "public, max-age=3600"),
        ],
    )
    return [body]


def app(environ, start_response):
    setup_testing_defaults(environ)
    method = environ.get("REQUEST_METHOD", "GET").upper()
    path = environ.get("PATH_INFO") or "/"

    if method == "OPTIONS":
        start_response(
            "204 No Content",
            [
                ("Allow", "GET, POST, OPTIONS"),
                ("Access-Control-Allow-Origin", "*"),
                ("Access-Control-Allow-Methods", "GET, POST, OPTIONS"),
                ("Access-Control-Allow-Headers", "Content-Type, Authorization"),
                ("Content-Length", "0"),
            ],
        )
        return [b""]

    if path == "/api/auth/send-code" and method == "POST":
        return _handle_send_code(environ, start_response)
    if path == "/api/auth/verify-code" and method == "POST":
        return _handle_verify_code(environ, start_response)
    if path == "/api/auth/register" and method == "POST":
        return _handle_register(environ, start_response)
    if path == "/api/auth/session" and method == "GET":
        return _handle_session(environ, start_response)
    if path == "/api/auth/config" and method == "GET":
        return _handle_auth_config(environ, start_response)
    if path == "/api/auth/apple" and method == "POST":
        return _handle_apple_login(environ, start_response)
    if path == "/api/products" and method == "GET":
        return _handle_list_products(environ, start_response)
    if path == "/api/orders" and method == "GET":
        return _handle_list_orders(environ, start_response)
    if path == "/api/orders" and method == "POST":
        return _handle_create_order(environ, start_response)
    if path == "/api/orders/track.gif" and method == "GET":
        return _handle_order_pixel(environ, start_response)
    if path == "/api/orders/available" and method == "GET":
        return _handle_available_orders(environ, start_response)
    if path == "/api/orders/grab" and method == "POST":
        return _handle_grab_order(environ, start_response)
    if path == "/api/orders/chat" and method == "GET":
        return _handle_list_order_chat(environ, start_response)
    if path == "/api/orders/chat" and method == "POST":
        return _handle_send_order_chat(environ, start_response)
    if path == "/api/guides/applications" and method == "POST":
        return _handle_create_guide_application(environ, start_response)
    if path == "/api/admin/guides/applications" and method == "GET":
        return _handle_list_guide_applications(environ, start_response)
    if path == "/api/admin/guides/review" and method == "POST":
        return _handle_review_guide_application(environ, start_response)
    if path == "/api/admin/guides/clear" and method == "POST":
        return _handle_clear_guide_applications(environ, start_response)
    if path == "/api/admin/products" and method == "GET":
        return _handle_admin_list_products(environ, start_response)
    if path == "/api/admin/products/save" and method == "POST":
        return _handle_save_product(environ, start_response)
    if path in {"/api/admin/products/create", "/api/admin/products/update"} and method == "POST":
        return _handle_save_product(environ, start_response)
    if path == "/api/admin/products/delete" and method == "POST":
        return _handle_delete_product(environ, start_response)
    if path == "/api/admin/orders" and method == "GET":
        return _handle_admin_list_orders(environ, start_response)
    if path == "/api/admin/users" and method == "GET":
        return _handle_admin_list_users(environ, start_response)
    if path.startswith("/api/"):
        return _error(start_response, "404 Not Found", "API not found")
    if method == "GET":
        return _serve_static(environ, start_response)
    return _error(start_response, "405 Method Not Allowed", "Method not allowed")


def main() -> None:
    parser = argparse.ArgumentParser(description="StayNest auth backend and static server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4174)
    args = parser.parse_args()

    with make_server(args.host, args.port, app) as server:
        mode = "dev SMS" if DEV_SMS else "configured SMS"
        print(f"StayNest backend running at http://{args.host}:{args.port} ({mode})", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
