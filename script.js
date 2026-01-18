async function loadFamily() {
  const res = await fetch("family.json");
  if (!res.ok) throw new Error("Не удалось загрузить family.json");
  return await res.json();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function calcAge(dateStr) {
  if (!dateStr) return null;
  const dob = new Date(dateStr);
  if (isNaN(dob)) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function ageWord(age) {
  const n = Math.abs(age) % 100;
  const n1 = n % 10;
  if (n >= 11 && n <= 19) return "лет";
  if (n1 === 1) return "год";
  if (n1 >= 2 && n1 <= 4) return "года";
  return "лет";
}

function buildBirthLine(person) {
  if (!person.birth) return "";
  const dateText = formatDate(person.birth);
  const age = calcAge(person.birth);
  if (age === null) return dateText;
  return `${dateText} • ${age} ${ageWord(age)}`;
}

// --- Children source policy ---
function getPairChildren(person) {
  const partnerKids = person?.partner?.children;
  if (Array.isArray(partnerKids) && partnerKids.length > 0) return partnerKids;

  const ownKids = person?.children;
  if (Array.isArray(ownKids)) return ownKids;

  return [];
}

function closeAllInside(container) {
  container.querySelectorAll(".children.open").forEach((el) => el.classList.remove("open"));
}

function createCard(person, clickable) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.cursor = clickable ? "pointer" : "default";

  const birthLine = buildBirthLine(person);
  const cityLine = person.city || "";
  const descLine = person.desc || "";

  card.innerHTML = `
    <div class="card-top">
      <img class="photo" src="${person.photo || ""}" alt="">
      <div class="card-meta">
        <div class="name">${person.name || "Без имени"}</div>
        <div class="birth">${birthLine}</div>
        <div class="city">${cityLine}</div>
        <div class="info">${descLine}</div>
      </div>
    </div>
  `;
  return card;
}

function createPersonNode(person) {
  const wrap = document.createElement("div");
  wrap.className = "node";

  const kids = getPairChildren(person);
  const hasChildren = kids.length > 0;

  const couple = document.createElement("div");
  couple.className = "couple";
  couple.style.justifyContent = "center";

  const left = createCard(person, hasChildren);
  couple.appendChild(left);

  const right = person.partner ? createCard(person.partner, hasChildren) : null;
  if (right) couple.appendChild(right);

  const childrenWrap = document.createElement("div");
  childrenWrap.className = "children";

  if (hasChildren) {
    kids.forEach((child) => {
      const row = document.createElement("div");
      row.className = "child-row";
      row.appendChild(createPersonNode(child));
      childrenWrap.appendChild(row);
    });

    const toggle = () => {
      const isOpen = childrenWrap.classList.contains("open");
      if (isOpen) {
        childrenWrap.classList.remove("open");
        closeAllInside(childrenWrap);
      } else {
        childrenWrap.classList.add("open");
      }
      redrawLinesSafe();
    };

    left.addEventListener("click", toggle);
    if (right) right.addEventListener("click", toggle);
  } else {
    left.style.cursor = "default";
    if (right) right.style.cursor = "default";
  }

  wrap.appendChild(couple);
  wrap.appendChild(childrenWrap);
  return wrap;
}

function createCoupleRoot(root) {
  const container = document.createElement("div");
  container.className = "node";
  const couple = document.createElement("div");
  couple.className = "couple";

  const rootKids = getPairChildren(root);
  const hasChildren = rootKids.length > 0;

  const left = createCard(root, hasChildren);
  const right = root.partner ? createCard(root.partner, hasChildren) : null;

  const childrenWrap = document.createElement("div");
  childrenWrap.className = "children root-children";

  if (hasChildren) {
    rootKids.forEach((child) => {
      const row = document.createElement("div");
      row.className = "child-row";
      row.appendChild(createPersonNode(child));
      childrenWrap.appendChild(row);
    });

    const toggleRoot = () => {
      const isOpen = childrenWrap.classList.contains("open");
      if (isOpen) {
        childrenWrap.classList.remove("open");
        closeAllInside(childrenWrap);
      } else {
        childrenWrap.classList.add("open");
      }
      redrawLinesSafe();
    };

    left.addEventListener("click", toggleRoot);
    if (right) right.addEventListener("click", toggleRoot);
  }

  couple.appendChild(left);
  if (right) couple.appendChild(right);

  container.appendChild(couple);
  container.appendChild(childrenWrap);
  return container;
}

/* ===== Buttons ===== */
function expandAll() {
  document.querySelectorAll(".children").forEach((el) => el.classList.add("open"));
  redrawLinesSafe();
}

function collapseAll() {
  document.querySelectorAll(".children").forEach((el) => el.classList.remove("open"));
  redrawLinesSafe();
}

/* ===== SVG lines (partners + parent->children) ===== */
function svgLine(svg, x1, y1, x2, y2) {
  const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
  l.setAttribute("x1", x1);
  l.setAttribute("y1", y1);
  l.setAttribute("x2", x2);
  l.setAttribute("y2", y2);
  l.setAttribute("stroke", "#cfcfcf");
  l.setAttribute("stroke-width", "2");
  l.setAttribute("stroke-linecap", "round");
  svg.appendChild(l);
}

function rectInViewport(el) {
  const viewport = document.getElementById("viewport");
  const r = el.getBoundingClientRect();
  const vr = viewport.getBoundingClientRect();
  return {
    left: r.left - vr.left,
    top: r.top - vr.top,
    right: r.right - vr.left,
    bottom: r.bottom - vr.top,
    cx: (r.left + r.right) / 2 - vr.left,
    cy: (r.top + r.bottom) / 2 - vr.top,
  };
}

function redrawLines() {
  const svg = document.getElementById("lines");
  if (!svg) return;
  svg.innerHTML = "";

  // Couples inside closed `.children` are still in the DOM (just clipped by max-height).
  // Their bounding boxes can produce "floating" short dashes on first load.
  // We draw lines only for elements that are actually visible inside the viewport.
  const viewport = document.getElementById("viewport");
  const vr = viewport?.getBoundingClientRect();
  const isVisible = (el) => {
    if (!el || !vr) return false;

    // If element is inside a closed children container, it's not visible.
    const parentChildren = el.closest(".children");
    if (parentChildren && !parentChildren.classList.contains("open")) return false;

    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return false;

    // Must intersect viewport.
    if (r.bottom < vr.top || r.top > vr.bottom || r.right < vr.left || r.left > vr.right) return false;
    return true;
  };

  // 1) линия между партнёрами (для каждой пары)
  document.querySelectorAll(".couple").forEach((couple) => {
    if (!isVisible(couple)) return;
    const cards = couple.querySelectorAll(":scope > .card");
    if (cards.length >= 2) {
      const a = rectInViewport(cards[0]);
      const b = rectInViewport(cards[1]);
      svgLine(svg, a.right, a.cy, b.left, b.cy);
    }
  });

  // 2) линии "пара -> ряд детей" (только если дети открыты)
  document.querySelectorAll(".node").forEach((node) => {
    const couple = node.querySelector(":scope > .couple");
    const childrenWrap = node.querySelector(":scope > .children");
    if (!couple || !childrenWrap) return;
    if (!childrenWrap.classList.contains("open")) return;

    if (!isVisible(couple)) return;

    const parentCards = couple.querySelectorAll(":scope > .card");
    if (!parentCards.length) return;

    const parentRects = Array.from(parentCards).map(rectInViewport);
    const parentX = parentRects.reduce((s, r) => s + r.cx, 0) / parentRects.length;
    const parentBottom = Math.max(...parentRects.map((r) => r.bottom));

    const childCouples = childrenWrap.querySelectorAll(":scope > .child-row > .node > .couple");
    if (!childCouples.length) return;

    const visibleChildCouples = Array.from(childCouples).filter(isVisible);
    if (!visibleChildCouples.length) return;

    const childAnchors = visibleChildCouples.map((cc) => {
      const cards = cc.querySelectorAll(":scope > .card");
      const rects = Array.from(cards).map(rectInViewport);
      return {
        x: rects.reduce((s, r) => s + r.cx, 0) / rects.length,
        top: Math.min(...rects.map((r) => r.top)),
      };
    });

    const yMid = parentBottom + 24;

    svgLine(svg, parentX, parentBottom, parentX, yMid);

    const minX = Math.min(...childAnchors.map((k) => k.x));
    const maxX = Math.max(...childAnchors.map((k) => k.x));
    svgLine(svg, minX, yMid, maxX, yMid);

    childAnchors.forEach((k) => {
      svgLine(svg, k.x, yMid, k.x, k.top);
    });
  });
}

/* ===== Pan/Zoom ===== */
function setupPanZoom() {
  const viewport = document.getElementById("viewport");
  const board = document.getElementById("board");
  if (!viewport || !board) return;

  let x = 60, y = 40, scale = 1;

  let dragging = false;
  let startX = 0, startY = 0;

  function apply() {
    board.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    redrawLinesSafe();
  }

  apply();

  viewport.addEventListener("mousedown", (e) => {
    dragging = true;
    startX = e.clientX - x;
    startY = e.clientY - y;
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    x = e.clientX - startX;
    y = e.clientY - startY;
    apply();
  });

  window.addEventListener("mouseup", () => (dragging = false));

  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const zoom = e.deltaY < 0 ? 1.08 : 0.92;
      scale = Math.min(2.5, Math.max(0.5, scale * zoom));
      apply();
    },
    { passive: false }
  );

  let lastDist = null;
  let lastMid = null;

  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const mid = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });

  viewport.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) {
        dragging = true;
        startX = e.touches[0].clientX - x;
        startY = e.touches[0].clientY - y;
      } else if (e.touches.length === 2) {
        dragging = false;
        lastDist = dist(e.touches[0], e.touches[1]);
        lastMid = mid(e.touches[0], e.touches[1]);
      }
    },
    { passive: false }
  );

  viewport.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();

      if (e.touches.length === 1 && dragging) {
        x = e.touches[0].clientX - startX;
        y = e.touches[0].clientY - startY;
        apply();
      } else if (e.touches.length === 2) {
        const d = dist(e.touches[0], e.touches[1]);
        const m = mid(e.touches[0], e.touches[1]);

        if (lastDist) {
          scale = Math.min(2.5, Math.max(0.5, scale * (d / lastDist)));
        }
        if (lastMid) {
          x += m.x - lastMid.x;
          y += m.y - lastMid.y;
        }

        lastDist = d;
        lastMid = m;
        apply();
      }
    },
    { passive: false }
  );

  viewport.addEventListener("touchend", () => {
    dragging = false;
    lastDist = null;
    lastMid = null;
  });

  window.addEventListener("resize", () => apply());
}

function redrawLinesSafe() {
  requestAnimationFrame(() => {
    redrawLines();
    requestAnimationFrame(() => {
      redrawLines();
      setTimeout(redrawLines, 260);
    });
  });
}

/* ===== Init ===== */
(async function init() {
  try {
    const data = await loadFamily();
    const tree = document.getElementById("tree");
    tree.innerHTML = "";
    tree.appendChild(createCoupleRoot(data));

    document.getElementById("expandAll")?.addEventListener("click", expandAll);
    document.getElementById("collapseAll")?.addEventListener("click", collapseAll);

    setupPanZoom();
    redrawLinesSafe();
  } catch (e) {
    const tree = document.getElementById("tree");
    if (tree) tree.textContent = "Ошибка загрузки. Проверь family.json и фото.";
    console.error(e);
  }
})();
