// LearnSphere – Syllabus Parser (Simplified + Multi-PDF Support + Save Progress)

const uploadInput = document.getElementById("pdfUpload");
const syllabusContainer = document.querySelector(".space-y-4");
const progressText = document.querySelector("p.text-gray-400.text-sm");
const progressBar = document.querySelector(".bg-purple-500");
const tabButtons = document.querySelectorAll(".mb-4.flex button");

// Store syllabus data per tab
let tabSyllabus = {
  "Python": [],
  "C Programming Language": [],
  "C++ Programming Language": []
};

let completedTopics = 0;
let totalTopics = 0;
let activeTab = "Python";

// 1. Multi-PDF Upload Handler
uploadInput.addEventListener("change", async (event) => {
  const files = event.target.files;
  if (!files.length) return;

  for (let file of files) {
    if (file.type !== "application/pdf") {
      alert(`${file.name} is not a valid PDF.`);
      continue;
    }

    try {
      const text = await extractTextFromPDF(file);
      parseSyllabusText(text, activeTab);
    } catch (err) {
      console.error("Error reading PDF:", err);
      alert(`Failed to read ${file.name}`);
    }
  }

  displaySyllabus();
  saveProgress(); // save after upload
});

// 2. Extract Text Using PDF.js
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    text += strings.join(" ") + "\n";
  }

  return text;
}

// 🧠 3. Brief Text Parser
function parseSyllabusText(text, tab) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // Keep only high-level info, avoid verbose details
  const briefLines = lines
    .filter(line => /Unit|Module|Chapter|Topic|Question/i.test(line))
    .map(line => line.replace(/\s+/g, " ").slice(0, 100)); // truncate long lines

  if (!tabSyllabus[tab]) tabSyllabus[tab] = [];
  tabSyllabus[tab] = tabSyllabus[tab].concat(briefLines);
  saveProgress(); // Save after parsing
}

//  4. Display Combined Brief Syllabus
function displaySyllabus() {
  syllabusContainer.innerHTML = "";
  totalTopics = 0;
  completedTopics = 0;

  const syllabusData = tabSyllabus[activeTab];
  if (!syllabusData.length) {
    syllabusContainer.textContent = "No syllabus data found.";
    updateProgress();
    return;
  }

  const ul = document.createElement("ul");
  ul.className = "list-disc ml-6 text-gray-400 space-y-1";

  const savedState = loadCheckboxState(); // load saved checkbox states

  syllabusData.forEach((topic, index) => {
    const li = document.createElement("li");
    li.className = "flex items-center gap-2";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "accent-purple-500 cursor-pointer";
    checkbox.dataset.index = index;

    // Restore saved checkbox state
    if (savedState[activeTab] && savedState[activeTab].includes(index)) {
      checkbox.checked = true;
      li.classList.add("line-through");
      completedTopics++;
    }

    checkbox.addEventListener("change", () => {
      li.classList.toggle("line-through", checkbox.checked);
      completedTopics += checkbox.checked ? 1 : -1;
      updateProgress();
      saveCheckboxState();
    });

    const span = document.createElement("span");
    span.textContent = topic;

    li.appendChild(checkbox);
    li.appendChild(span);
    ul.appendChild(li);
    totalTopics++;
  });

  syllabusContainer.appendChild(ul);
  updateProgress();
}

// 5. Update Progress Bar
function updateProgress() {
  if (totalTopics === 0) return;
  const percent = Math.round((completedTopics / totalTopics) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `Progress: ${completedTopics} / ${totalTopics}`;
  saveProgress();
}

// 💾 6. Save & Load Progress
function saveProgress() {
  const data = {
    tabSyllabus,
    activeTab
  };
  localStorage.setItem("syllabusProgress", JSON.stringify(data));
}


function loadProgress() {
  const saved = localStorage.getItem("syllabusProgress");
  if (!saved) return;
  const data = JSON.parse(saved);
  tabSyllabus = data.tabSyllabus || tabSyllabus;
  activeTab = data.activeTab || "Python";
  displaySyllabus();
  updateProgress();
}

//  7. Save & Load Checkbox States
function saveCheckboxState() {
  const checkboxes = document.querySelectorAll("input[type='checkbox']");
  const checkedIndexes = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => parseInt(cb.dataset.index));

  let state = loadCheckboxState();
  state[activeTab] = checkedIndexes;
  localStorage.setItem("checkboxState", JSON.stringify(state));
}

function loadCheckboxState() {
  const saved = localStorage.getItem("checkboxState");
  return saved ? JSON.parse(saved) : {};
}

//  8. Tab Switching
tabButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    tabButtons.forEach((b) => {
      b.classList.remove("text-purple-300", "border-purple-400", "border-b-2");
      b.classList.add("text-gray-400");
    });
    e.target.classList.add("text-purple-300", "border-b-2", "border-purple-400");
    activeTab = e.target.textContent.trim();
    displaySyllabus();
  });
});

//  9. Load Progress on Startup
window.addEventListener("load", () => {
  loadProgress();
});
