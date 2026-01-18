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

  const childrenWrap = document.createElement("div");
  childrenWrap.className = "children";

  if (person.children && person.children.length > 0) {
    person.children.forEach((child) => {
      childrenWrap.appendChild(createNode(child));
    });

    btn.addEventListener("click", () => {
      const isOpen = childrenWrap.style.display === "block";
      childrenWrap.style.display = isOpen ? "none" : "block";
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
