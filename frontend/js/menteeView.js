const tableBody = document.getElementById("menteesTable");
const filterDept = document.getElementById("filterDept");
const filterSem = document.getElementById("filterSem");
const filterProgress = document.getElementById("filterProgress");
const searchName = document.getElementById("searchName");

let mentees = [];
let selectedRow = null; // keep track of highlighted row

// -----------------------------
// Fetch mentees from backend
// -----------------------------
async function loadMentees() {
  try {
    const res = await fetch("/api/mentees"); // adjust port if needed
    mentees = await res.json();
    displayMentees(mentees);
  } catch (err) {
    console.error("❌ Error loading mentees:", err);
    tableBody.innerHTML =
      "<tr><td colspan='4'>Failed to load mentees</td></tr>";
  }
}

// -----------------------------
// Display mentees in table
// -----------------------------
function displayMentees(data) {
  tableBody.innerHTML = "";
  selectedRow = null;

  if (data.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='4'>No mentees found</td></tr>";
    return;
  }

  data.forEach((m) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${m.name}</td>
      <td>
        <div class="bar" style="width:${m.avg_progress}%; background:${
      m.avg_progress > 80 ? "green" : m.avg_progress >= 60 ? "orange" : "red"
    }">
          ${Math.round(m.avg_progress)}%
        </div>
      </td>
      <td>${m.dept}</td>
      <td>${m.semester}</td>
    `;

    // Single click = highlight row
    row.addEventListener("click", () => {
      if (selectedRow) {
        selectedRow.classList.remove("selected-row");
      }
      row.classList.add("selected-row");
      selectedRow = row;
    });

    // Double click = open profile page
    row.addEventListener("dblclick", () => {
      if (!m.student_reg_num) {
        console.warn("⚠️ No student_reg_num for mentee:", m);
        return;
      }
      window.location.href = `studProfilePage.html?reg=${encodeURIComponent(
        m.student_reg_num
      )}`;
    });

    tableBody.appendChild(row);
  });
}

// -----------------------------
// Apply filters & search
// -----------------------------
function applyFilters() {
  let filtered = [...mentees];

  if (filterDept.value) {
    filtered = filtered.filter(
      (m) => m.dept.toLowerCase() === filterDept.value.toLowerCase()
    );
  }

  if (filterSem.value) {
    filtered = filtered.filter((m) => String(m.semester) === filterSem.value);
  }

  if (filterProgress.value) {
    filtered = filtered.filter((m) => {
      if (filterProgress.value === "low") return m.avg_progress < 60;
      if (filterProgress.value === "mid")
        return m.avg_progress >= 60 && m.avg_progress <= 80;
      if (filterProgress.value === "high") return m.avg_progress > 80;
    });
  }

  if (searchName.value) {
    filtered = filtered.filter((m) =>
      m.name.toLowerCase().includes(searchName.value.toLowerCase())
    );
  }

  displayMentees(filtered);
}

// -----------------------------
// Event listeners
// -----------------------------
filterDept.addEventListener("change", applyFilters);
filterSem.addEventListener("change", applyFilters);
filterProgress.addEventListener("change", applyFilters);
searchName.addEventListener("input", applyFilters);

// -----------------------------
// Init
// -----------------------------
loadMentees();
