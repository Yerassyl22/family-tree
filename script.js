// Пока просто “данные в коде” (следующий шаг — вынесем в JSON)
const family = {
  name: "👵 Бабушка + 👴 Дедушка",
  children: [
    {
      name: "👨 Ребёнок 1",
      children: [
        { name: "👶 Внук 1", children: [] },
        { name: "👶 Внук 2", children: [] },
      ],
    },
    { name: "👩 Ребёнок 2", children: [] },
    { name: "👨 Ребёнок 3", children: [] },
    { name: "👩 Ребёнок 4", children: [] },
  ],
};

function createNode(person) {
  const node = document.createElement("div");
  node.className = "node";

  const btn = document.createElement("button");
  btn.className = "person-btn";
  btn.type = "button";
  btn.textContent = person.name;

  const childrenWrap = document.createElement("div");
  childrenWrap.className = "children";

  // Рисуем детей рекурсивно
  if (person.children && person.children.length > 0) {
    person.children.forEach((child) => {
      childrenWrap.appendChild(createNode(child));
    });

    btn.addEventListener("click", () => {
      const isOpen = childrenWrap.style.display === "block";
      childrenWrap.style.display = isOpen ? "none" : "block";
    });
  } else {
    // если детей нет — кнопку можно сделать “без раскрытия”
    btn.style.opacity = "0.9";
  }

  node.appendChild(btn);
  node.appendChild(childrenWrap);
  return node;
}

document.getElementById("tree").appendChild(createNode(family));
