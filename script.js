// =====================
// Load JSON
// =====================
async function loadFamily(file = "family1.json") {
  const res = await fetch(file);
  if (!res.ok) throw new Error("Не удалось загрузить " + file);
  return await res.json();
}

// =====================
// Date / Age helpers
// =====================
function ageWord(age) {
  if (age % 10 === 1 && age % 100 !== 11) return "год";
  if ([2, 3, 4].includes(age % 10) && ![12, 13, 14].includes(age % 100)) return "года";
  return "лет";
}

// "12 января 1977" + "48 лет" (2 строки)
function birthLine(p) {
  if (!p.birth) return "";

  const date = new Date(p.birth);
  if (isNaN(date)) return "";

  const fullDate = date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;

  return `
    <div class="birth-date">${fullDate}</div>
    <div class="birth-age">${age} ${ageWord(age)}</div>
  `;
}

// =====================
// Tree build
// =====================
function closeAllInside(container) {
  container.querySelectorAll(".children.open").forEach((el) => el.classList.remove("open"));
}

function personHTML(p) {
  const tagClass = p.tag ? ` tag-${p.tag}` : "";
  return `
    <div class="person${tagClass}">
      <img class="photo" src="${p.photo || ""}" alt="">
      <div class="card-meta">
        <div class="name">${p.name || ""}</div>
        <div class="birth">${birthLine(p)}</div>
        <div class="city">${p.city || ""}</div>
        <div class="info">${p.desc || ""}</div>
      </div>
    </div>
  `;
}

/* 1 карточка = семья (1 или 2 человека) */
function createFamilyCard(person, clickable) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.cursor = clickable ? "pointer" : "default";

  const hasPartner = !!person.partner;
  if (!hasPartner) card.classList.add("single");

  card.innerHTML = `
    <div class="family ${hasPartner ? "two" : "one"}">
      ${personHTML(person)}
      ${hasPartner ? `<div class="divider"></div>${personHTML(person.partner)}` : ``}
    </div>
  `;
  return card;
}

function createNode(person) {
  const wrap = document.createElement("div");
  wrap.className = "node";

  const hasChildren = Array.isArray(person.children) && person.children.length > 0;
  const card = createFamilyCard(person, hasChildren);

  const childrenWrap = document.createElement("div");
  childrenWrap.className = "children";

  if (hasChildren) {
    person.children.forEach((child) => {
      const row = document.createElement("div");
      row.className = "child-row";
      row.appendChild(createNode(child));
      childrenWrap.appendChild(row);
    });

    card.addEventListener("click", () => {
      const isOpen = childrenWrap.classList.contains("open");
      if (isOpen) {
        childrenWrap.classList.remove("open");
        closeAllInside(childrenWrap);
      } else {
        childrenWrap.classList.add("open");
      }
      redrawLinesSafe();
    });
  }

  wrap.appendChild(card);
  wrap.appendChild(childrenWrap);
  return wrap;
}

// =====================
// Buttons
// =====================
function expandAll() {
  document.querySelectorAll(".children").forEach((el) => el.classList.add("open"));
  redrawLinesSafe();
}

function collapseAll() {
  document.querySelectorAll(".children").forEach((el) => el.classList.remove("open"));
  redrawLinesSafe();
  requestAnimationFrame(() => window.__centerRoot && window.__centerRoot());
}

// =====================
// Lines (board coords)
// =====================
function redrawLines() {
  const svg = document.getElementById("lines");
  const board = document.getElementById("board");
  const tree = document.getElementById("tree");
  if (!svg || !board || !tree) return;

  svg.innerHTML = "";
  const svgNS = "http://www.w3.org/2000/svg";

  // растянуть svg под размеры дерева (чтобы ничего не обрезалось)
  const w = Math.max(tree.scrollWidth, 5000);
  const h = Math.max(tree.scrollHeight, 5000);
  svg.setAttribute("width", w);
  svg.setAttribute("height", h);
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

  function line(x1, y1, x2, y2) {
    const l = document.createElementNS(svgNS, "line");
    l.setAttribute("x1", x1);
    l.setAttribute("y1", y1);
    l.setAttribute("x2", x2);
    l.setAttribute("y2", y2);
    l.setAttribute("stroke", "#000");
    l.setAttribute("stroke-width", "2");
    l.setAttribute("stroke-linecap", "round");
    svg.appendChild(l);
  }

  function elbow(x1, y1, x2, y2, r = 10) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const sx = dx >= 0 ? 1 : -1;
    const sy = dy >= 0 ? 1 : -1;

    const rr = Math.min(r, Math.abs(dx), Math.abs(dy));
    const hx = x2 - sx * rr;
    const hy = y1 + sy * rr;

    const d = [
      `M ${x1} ${y1}`,
      `L ${hx} ${y1}`,
      `Q ${x2} ${y1} ${x2} ${hy}`,
      `L ${x2} ${y2}`,
    ].join(" ");

    const p = document.createElementNS(svgNS, "path");
    p.setAttribute("d", d);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#000");
    p.setAttribute("stroke-width", "2");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    svg.appendChild(p);
  }

  function posRelativeToBoard(el, boardEl) {
    let x = 0,
      y = 0;
    let cur = el;
    while (cur && cur !== boardEl) {
      x += cur.offsetLeft || 0;
      y += cur.offsetTop || 0;
      cur = cur.offsetParent;
    }
    return { x, y };
  }

  function anchorBottom(card) {
    const p = posRelativeToBoard(card, board);
    return { x: p.x + card.offsetWidth / 2, y: p.y + card.offsetHeight };
  }

  function anchorTop(card) {
    const p = posRelativeToBoard(card, board);
    return { x: p.x + card.offsetWidth / 2, y: p.y };
  }

  // линии: рисуем только для открытых children
  document.querySelectorAll(".node").forEach((node) => {
    const parentCard = node.querySelector(":scope > .card");
    const childrenWrap = node.querySelector(":scope > .children");
    if (!parentCard || !childrenWrap) return;
    if (!childrenWrap.classList.contains("open")) return;

    const childCards = childrenWrap.querySelectorAll(":scope > .child-row > .node > .card");
    if (!childCards.length) return;

    const p = anchorBottom(parentCard);
    const children = Array.from(childCards).map(anchorTop);

    const junctionY = p.y + 26; // длина вертикали
    const gapTop = 0;           // доходить до карточки
    const radius = 10;          // изгиб

    line(p.x, p.y, p.x, junctionY);
    children.forEach((c) => {
      const targetY = c.y - gapTop;
      elbow(p.x, junctionY, c.x, targetY, radius);
    });
  });
}

function redrawLinesSafe() {
  requestAnimationFrame(() => {
    redrawLines();
    requestAnimationFrame(() => {
      redrawLines();
      setTimeout(redrawLines, 120);
      setTimeout(redrawLines, 280);
    });
  });
}

// =====================
// Pan/Zoom + center root
// =====================
function setupPanZoom() {
  const viewport = document.getElementById("viewport");
  const board = document.getElementById("board");
  if (!viewport || !board) return;

  let x = 60,
    y = 80,
    scale = 1;

  let dragging = false;
  let startX = 0,
    startY = 0;

  function apply() {
    board.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    redrawLinesSafe();
  }

  function centerRoot() {
    const rootCard = document.querySelector("#tree > .node > .card");
    if (!rootCard) return;

    const vw = viewport.clientWidth;
    const cx = rootCard.offsetLeft + rootCard.offsetWidth / 2;

    x = vw / 2 - cx * scale;
    y = 90;
    apply();
  }

  apply();
  requestAnimationFrame(centerRoot);

  // mouse drag
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

  // wheel zoom
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

  // touch pinch/drag
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

        if (lastDist) scale = Math.min(2.5, Math.max(0.5, scale * (d / lastDist)));
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

  window.addEventListener("resize", () => centerRoot());

  window.__centerRoot = centerRoot;
}

// =====================
// Tabs: renderTree(file)
// =====================
async function renderTree(file) {
  const data = await loadFamily(file);

  const tree = document.getElementById("tree");
  tree.innerHTML = "";
  tree.appendChild(createNode(data));

  redrawLinesSafe();
  requestAnimationFrame(() => window.__centerRoot && window.__centerRoot());
}

// =====================
// Init
// =====================
(async function init() {
  try {
    // Кнопки разворачивания/сворачивания
    document.getElementById("expandAll")?.addEventListener("click", expandAll);
    document.getElementById("collapseAll")?.addEventListener("click", collapseAll);

    // Вкладки (если есть в HTML)
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", async () => {
        document.querySelectorAll(".tab").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        await renderTree(btn.dataset.file);
      });
    });

    // Загружаем первое дерево
    await renderTree("family1.json");

    // Pan/zoom и линии
    setupPanZoom();
    redrawLinesSafe();
  } catch (e) {
    const tree = document.getElementById("tree");
    if (tree) tree.textContent = "Ошибка загрузки. Проверь JSON и фото.";
    console.error(e);
  }
})();
