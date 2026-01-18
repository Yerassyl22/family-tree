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
  // 1 год, 2 года, 5 лет
  const n = Math.abs(age) % 100;
  const n1 = n % 10;
  if (n >= 11 && n <= 19) return "лет";
  if (n1 === 1) return "год";
  if (n1 >= 2 && n1 <= 4) return "года";
  return "лет";
}

function closeAllInside(container) {
  container.querySelectorAll(".children.open").forEach((el) => {
    el.classList.remove("open");
  });
}

function buildBirthLine(person) {
  const dateText = person.birth ? formatDate(person.birth) : "";
  const age = person.birth ? calcAge(person.birth) : null;

  if (!dateText) return "";
  if (age === null) return dateText;

  return `${dateText} • ${age} ${ageWord(age)}`;
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

  const hasChildren = Array.isArray(person.children) && person.children.length > 0;
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
        childrenWrap.classList.remove("open");
        closeAllInside(childrenWrap); // закрыть всё внутри
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

  const hasChildren = Array.isArray(root.children) && root.children.length > 0;

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



(async function init() {
  try {
    const data = await loadFamily();

    const tree = document.getElementById("tree");
    tree.innerHTML = "";
    tree.appendChild(createCoupleRoot(data));

    document.getElementById("expandAll")?.addEventListener("click", expandAll);
    document.getElementById("collapseAll")?.addEventListener("click", collapseAll);


  } catch (e) {
    const tree = document.getElementById("tree");
    if (tree) tree.textContent = "Ошибка загрузки. Проверь family.json и фото.";
    console.error(e);
  }
})();
