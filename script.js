async function loadFamily() {
  const res = await fetch("family.json");
  if (!res.ok) throw new Error("Не удалось загрузить family.json");
  return await res.json();
}

function countDescendants(person) {
  if (!person.children || person.children.length === 0) return 0;
  let total = person.children.length;
  person.children.forEach((c) => (total += countDescendants(c)));
  return total;
}

function createCard(person, hasChildren) {
  const card = document.createElement("div");
  card.className = "card";

  const descendants = countDescendants(person);
  const subtitle = [
    person.birthYear ? `Год: ${person.birthYear}` : "",
    descendants ? `Потомков: ${descendants}` : ""
  ].filter(Boolean).join(" • ");

  card.innerHTML = `
    <div class="card-top">
      <img class="photo" src="${person.photo || ""}" alt="">
      <div class="card-meta">
        <div class="name">${person.name || "Без имени"}</div>
        <div class="birth">${subtitle || ""}</div>
        <div class="info">${person.info || ""}</div>
      </div>
    </div>
  `;

  if (!hasChildren) card.style.cursor = "default";
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
      childrenWrap.classList.toggle("open");
    });
  }

  wrap.appendChild(card);
  wrap.appendChild(childrenWrap);
  return wrap;
}

function createCoupleRoot(root) {
  // root = бабушка, root.partner = дедушка (или наоборот)
  const container = document.createElement("div");

  const couple = document.createElement("div");
  couple.className = "couple";

  const left = createCard(root, (root.children || []).length > 0);
  const right = root.partner ? createCard(root.partner, false) : null;

  // клик по “паре” раскрывает детей
  const childrenWrap = document.createElement("div");
  childrenWrap.className = "children";

  if (root.children && root.children.length > 0) {
    root.children.forEach((child) => {
      const row = document.createElement("div");
      row.className = "child-row";
      row.appendChild(createPersonNode(child));
      childrenWrap.appendChild(row);
    });

    left.addEventListener("click", () => childrenWrap.classList.toggle("open"));
    if (right) right.addEventListener("click", () => childrenWrap.classList.toggle("open"));
  }

  couple.appendChild(left);
  if (right) couple.appendChild(right);

  container.appendChild(couple);
  container.appendChild(childrenWrap);
  return container;
}

(async function init() {
  try {
    const data = await loadFamily();
    const tree = document.getElementById("tree");
    tree.innerHTML = "";
    tree.appendChild(createCoupleRoot(data));
  } catch (e) {
    document.getElementById("tree").textContent =
      "Ошибка загрузки. Проверь family.json и наличие фото.";
    console.error(e);
  }
})();
