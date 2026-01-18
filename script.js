async function loadFamily() {
  const res = await fetch("family.json");
  if (!res.ok) throw new Error("Не удалось загрузить family.json");
  return await res.json();
}

function createNode(person) {
  const node = document.createElement("div");
  node.className = "node";

  const btn = document.createElement("button");
  btn.className = "person-btn";
  btn.type = "button";

  // Имя + стрелка
  btn.innerHTML = `<span>${person.name}</span><span class="arrow">▶</span>`;
  btn.dataset.name = (person.name || "").toLowerCase();

  const childrenWrap = document.createElement("div");
  childrenWrap.className = "children";

  if (person.children && person.children.length > 0) {
    person.children.forEach((child) => {
      childrenWrap.appendChild(createNode(child));
    });

    btn.addEventListener("click", () => {
      childrenWrap.classList.toggle("open");
      const arrow = btn.querySelector(".arrow");
      arrow.textContent = childrenWrap.classList.contains("open") ? "▼" : "▶";
    });
  } else {
    // Если детей нет — убираем стрелку
    const arrow = btn.querySelector(".arrow");
    if (arrow) arrow.textContent = "";
    btn.style.opacity = "0.95";
  }

  node.appendChild(btn);
  node.appendChild(childrenWrap);
  return node;
}

async function init() {
  try {
    const family = await loadFamily();

    const tree = document.getElementById("tree");
    tree.innerHTML = "";
    tree.appendChild(createNode(family));

    // Кнопки "развернуть/свернуть всё"
    const expandBtn = document.getElementById("expandAll");
    const collapseBtn = document.getElementById("collapseAll");

    if (expandBtn) {
      expandBtn.addEventListener("click", () => {
        document.querySelectorAll(".children").forEach((el) => el.classList.add("open"));
        document.querySelectorAll(".person-btn .arrow").forEach((a) => {
          if (a.textContent) a.textContent = "▼";
        });
      });
    }

    if (collapseBtn) {
      collapseBtn.addEventListener("click", () => {
        document.querySelectorAll(".children").forEach((el) => el.classList.remove("open"));
        document.querySelectorAll(".person-btn .arrow").forEach((a) => {
          if (a.textContent) a.textContent = "▶";
        });
      });
    }

    // Поиск по имени
    const searchInput = document.getElementById("search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const q = e.target.value.trim().toLowerCase();

        document.querySelectorAll(".person-btn").forEach((btn) => {
          const name = btn.dataset.name || "";
          const match = q && name.includes(q);

          // подсветка совпадений
          btn.style.outline = match ? "2px solid #999" : "none";

          // раскрываем ветку, где есть совпадение (чтобы было видно)
          if (match) {
            const children = btn.closest(".node")?.querySelector(":scope > .children");
            if (children) {
              children.classList.add("open");
              const arrow = btn.querySelector(".arrow");
              if (arrow && arrow.textContent) arrow.textContent = "▼";
            }
          }

          // если поиск пустой — убираем подсветку
          if (!q) btn.style.outline = "none";
        });
      });
    }
  } catch (e) {
    const tree = document.getElementById("tree");
    if (tree) {
      tree.textContent =
        "Ошибка загрузки данных. Проверь family.json и запуск через Live Server/GitHub Pages.";
    }
    console.error(e);
  }
}

init();
