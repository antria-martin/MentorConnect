// studprofile.js
// Usage: open mentee_profile.html?reg=REGNUM

const urlParams = new URLSearchParams(window.location.search);
const regNum = urlParams.get("reg") || "";

// ✅ Get logged-in mentor from localStorage
let mentorId = null;
try {
  const stored = localStorage.getItem("mentorUser");
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.role === "mentor") mentorId = parsed.id;
  }
} catch (err) {
  console.warn("⚠️ Could not parse stored user:", err);
}

const els = {
  name: document.getElementById("student-name"),
  meta: document.getElementById("student-meta"),
  overallProgress: document.getElementById("overall-progress"),
  academicProgress: document.getElementById("academic-progress"),
  personalProgress: document.getElementById("personal-progress"),
  upcomingList: document.getElementById("meetings-upcoming"),
  pastList: document.getElementById("meetings-past"),
  extracurricularList: document.getElementById("extracurricular-list"),
  marksRow: document.getElementById("marks-row"),
  chartCanvas: document.getElementById("progressChart"),
  noteForm: document.getElementById("note-form"),
  noteTextarea: document.getElementById("mentor-note"),
  notesList: document.getElementById("notes-list"),
  profilePhoto: document.getElementById("profile-photo"),
  studentRole: document.getElementById("student-role"),
};

let chartInstance = null;

// -----------------------------
// Fetch student profile
// -----------------------------
async function fetchProfile() {
  try {
    const res = await fetch(`/api/student/${encodeURIComponent(regNum)}`);
    if (!res.ok) {
      const msg = await res.json();
      alert("Error: " + (msg.message || res.statusText));
      return;
    }
    const data = await res.json();
    renderProfile(data);
  } catch (err) {
    console.error(err);
    //alert("Network error while fetching profile");
  }
}

// -----------------------------
// Render profile
// -----------------------------
function renderProfile(data) {
  const {
    student,
    performances,
    extracurricular,
    meetingsPast,
    meetingsUpcoming,
    notes,
  } = data;
  els.name.textContent = student.name;
  els.meta.textContent = `Year ${student.year || "-"}, ${student.dept || "-"}`;
  els.studentRole.textContent = "Mentee";
  els.profilePhoto.src = "assets/profileplaceholder.png";

  // Extracurricular
  els.extracurricularList.innerHTML = "";
  (extracurricular || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    els.extracurricularList.appendChild(li);
  });

  // Utility to format date as YYYY-MM-DD
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // or `${dd}/${mm}/${yyyy}` for DD/MM/YYYY
  }

  // Meetings upcoming
  els.upcomingList.innerHTML = "";
  meetingsUpcoming.forEach((m) => {
    const li = document.createElement("li");
    li.innerHTML = `<div class="meeting-time">${formatDate(m.meeting_date)} ${
      m.time_slot || ""
    }</div><div class="meeting-reason">${m.reason || ""}</div>`;
    els.upcomingList.appendChild(li);
  });

  // Meetings past
  els.pastList.innerHTML = "";
  meetingsPast.forEach((m) => {
    const li = document.createElement("li");
    li.innerHTML = `<div class="meeting-time">${formatDate(m.meeting_date)} ${
      m.time_slot || ""
    }</div><div class="meeting-reason">${
      m.reason || ""
    }</div><div class="muted small">Feedback: ${m.feedback || "—"}</div>`;
    els.pastList.appendChild(li);
  });

  // Marks + chart
  if (performances && performances.length > 0) {
    const latest = performances[performances.length - 1];
    els.marksRow.innerHTML = `<td>${latest.cia1 ?? "-"}</td><td>${
      latest.cia2 ?? "-"
    }</td><td>${latest.cia3 ?? "-"}</td><td>${latest.ese ?? "-"}</td>`;

    const labels = performances.map((p) => "Sem " + p.semester);
    const dataPoints = performances.map((p) => {
      const vals = [
        Number(p.cia1 || 0),
        Number(p.cia2 || 0),
        Number(p.cia3 || 0),
        Number(p.ese || 0),
      ];
      return (
        Math.round(
          (vals.reduce((a, b) => a + b, 0) / (vals.length || 1)) * 100
        ) / 100
      );
    });

    renderChart(labels, dataPoints);

    const overall =
      Math.round(
        (dataPoints.reduce((a, b) => a + b, 0) / (dataPoints.length || 1)) * 100
      ) / 100;
    els.overallProgress.textContent = (overall || "-") + "%";
    els.academicProgress.textContent =
      (dataPoints[dataPoints.length - 1] || "-") + "%";
    els.personalProgress.textContent = "80%"; // placeholder
  } else {
    els.marksRow.innerHTML = `<td>-</td><td>-</td><td>-</td><td>-</td>`;
    renderChart(["No data"], [0]);
  }

  renderNotes(notes);
}

// -----------------------------
// Chart.js
// -----------------------------
function renderChart(labels, dataPoints) {
  if (chartInstance) chartInstance.destroy();
  const ctx = els.chartCanvas.getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Average (%)",
          data: dataPoints,
          borderWidth: 2,
          tension: 0.3,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, max: 100 } },
    },
  });
}

// -----------------------------
// Notes
// -----------------------------
function renderNotes(notes) {
  els.notesList.innerHTML = "";
  if (!notes || notes.length === 0) {
    els.notesList.innerHTML = "<div class='muted small'>No notes yet.</div>";
    return;
  }
  notes.forEach((n) => {
    const div = document.createElement("div");
    div.className = "note-item";
    div.innerHTML = `<div class="muted small">By Mentor ${
      n.mentor_id
    } · ${new Date(n.created_at).toLocaleString()}</div><div>${escapeHtml(
      n.note
    )}</div>`;
    els.notesList.appendChild(div);
  });
}

function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// -----------------------------
// Save note
// -----------------------------
els.noteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const note = els.noteTextarea.value.trim();
  if (!note) return alert("Please type a note first");
  if (!mentorId) return alert("⚠️ Mentor ID not found. Please log in again.");

  try {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mentor_id: mentorId,
        student_reg_num: regNum,
        note,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || res.statusText);
    }
    els.noteTextarea.value = "";
    await fetchProfile();
  } catch (err) {
    console.error(err);
    alert("Error saving note: " + err.message);
  }
});

// -----------------------------
// Boot
// -----------------------------
fetchProfile();
