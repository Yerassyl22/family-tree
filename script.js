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
  btn.textContent = person.name;
  btn.dataset.name = person.name.toLowerCase();


  const childrenWrap = document.createElement("div");
  childrenWrap.className = "children";

  if (person.children && person.children.length > 0) {
    person.children.forEach((child) => {
      childrenWrap.appendChild(createNode(child));
    });

    btn.addEventListener("click", () => {
        childrenWrap.classList.toggle("open");
    });
  } else {
    btn.style.opacity = "0.9";
  }

  node.appendChild(btn);
  node.appendChild(childrenWrap);
  return node;
}

(async function init() {
  try {
    const family = await loadFamily();
    document.getElementById("tree").appendChild(createNode(family));
  } catch (e) {
    document.getElementById("tree").textContent =
      "Ошибка загрузки данных. Проверь family.json и запуск через Live Server/GitHub Pages.";
    console.error(e);
  }
})();


function expandAll() {
  document.querySelectorAll(".children").forEach((el) => {
    el.classList.add("open");
  });
}

function collapseAll() {
  document.querySelectorAll(".children").forEach((el) => {
    el.classList.remove("open");
  });
}

document.getElementById("expandAll").addEventListener("click", expandAll);
document.getElementById("collapseAll").addEventListener("click", collapseAll);


const searchInput = document.getElementById("search");

function applySearch(query) {
  const q = query.trim().toLowerCase();

  document.querySelectorAll(".person-btn").forEach((btn) => {
    const name = btn.dataset.name || "";
    const node = btn.closest(".node");
    const children = node.querySelector(":scope > .children");

    if (!q) {
      btn.style.outline = "none";
      return;
    }

    if (name.includes(q)) {
      btn.style.outline = "2px solid #999";
      // раскрываем путь вниз (чтобы было видно)
      if (children) children.classList.add("open");
    } else {
      btn.style.outline = "none";
    }
  });
}

searchInput.addEventListener("input", (e) => {
  applySearch(e.target.value);
});
