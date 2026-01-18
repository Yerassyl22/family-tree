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
    year: "numeric"
  });
}

// Закрыть все вложенные .children внутри конкретного блока
function closeAllInside(container) {
  container.querySelectorAll(".children.open").forEach((el) => el.classList.remove("open"));
}

function createCard(person, clickable) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.cursor = clickable ? "pointer" : "default";

const birthLine = person.birth ? formatDate(person.birth) : "";
  const cityLine = person.city ? person.city : "";
  const descLine = person.desc ? person.desc : "";

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

  const hasChildren = person.children && person.children.length > 0;
  const card = createCard(person, hasChildren);

  const childrenWrap = document.createElement("div");
  childrenWrap.className = "children";

  if (hasChildren) {
    person.children.forEach((child) => {
      const row = document.createElement("div");
      row.className = "child-row";
      row.appendChild(createPersonNode(child));
      childrenWrap.appendChild(row);
    });

    card.addEventListener("click", () => {
      const isOpen = childrenWrap.classList.contains("open");

      if (isOpen) {
        // Закрываем себя + всё внутри
        childrenWrap.classList.remove("open");
        closeAllInside(childrenWrap);
      } else {
        childrenWrap.classList.add("open");
      }
    });
  }

  wrap.appendChild(card);
  wrap.appendChild(childrenWrap);
  return wrap;
}

function createCoupleRoot(root) {
  const container = document.createElement("div");

  const couple = document.createElement("div");
  couple.className = "couple";

  const hasChildren = root.children && root.children.length > 0;

  const left = createCard(root, hasChildren);
  const right = root.partner ? createCard(root.partner, hasChildren) : null;

  const childrenWrap = document.createElement("div");
  childrenWrap.className = "children";

  if (hasChildren) {
    root.children.forEach((child) => {
      const row = document.createElement("div");
      row.className = "child-row";
      row.appendChild(createPersonNode(child));
      childrenWrap.appendChild(row);
    });

    const toggleRoot = () => {
      const isOpen = childrenWrap.classList.contains("open");

      if (isOpen) {
        childrenWrap.classList.remove("open");
        closeAllInside(childrenWrap); // закрыть всё внутри
      } else {
        childrenWrap.classList.add("open");
      }
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

function expandAll() {
  document.querySelectorAll(".children").forEach((el) => el.classList.add("open"));
}

function collapseAll() {
  document.querySelectorAll(".children").forEach((el) => el.classList.remove("open"));
}

function applySearch(query) {
  const q = query.trim().toLowerCase();

  document.querySelectorAll(".card").forEach((card) => {
    card.style.outline = "none";
  });

  if (!q) return;

  document.querySelectorAll(".name").forEach((nameEl) => {
    const text = (nameEl.textContent || "").toLowerCase();
    if (text.includes(q)) {
      const card = nameEl.closest(".card");
      if (card) card.style.outline = "2px solid #999";

      // раскрываем путь вверх (минимально): просто раскроем ближайший children
      const node = nameEl.closest(".node");
      if (node) {
        const children = node.querySelector(":scope > .children");
        if (children) children.classList.add("open");
      }
    }
  });
}

(async function init() {
  try {
    const data = await loadFamily();
    const tree = document.getElementById("tree");
    tree.innerHTML = "";
    tree.appendChild(createCoupleRoot(data));

    document.getElementById("expandAll")?.addEventListener("click", expandAll);
    document.getElementById("collapseAll")?.addEventListener("click", collapseAll);

    const search = document.getElementById("search");
    if (search) {
      search.addEventListener("input", (e) => applySearch(e.target.value));
    }
  } catch (e) {
    document.getElementById("tree").textContent =
      "Ошибка загрузки. Проверь family.json и фото.";
    console.error(e);
  }
})();
