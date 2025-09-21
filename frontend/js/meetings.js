let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Render calendar
function renderCalendar(month, year) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  document.getElementById("monthYear").textContent =
    monthNames[month] + " " + year;

  let firstDay = new Date(year, month).getDay();
  let daysInMonth = 32 - new Date(year, month, 32).getDate();

  const days = ["S", "M", "T", "W", "T", "F", "S"];
  let tbl = "<tr>" + days.map((d) => `<th>${d}</th>`).join("") + "</tr><tr>";

  let i;
  for (i = 0; i < firstDay; i++) tbl += "<td></td>";

  for (let d = 1; d <= daysInMonth; d++) {
    if (i % 7 === 0 && d !== 1) tbl += "</tr><tr>";
    let dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    tbl += `<td data-date="${dateStr}">${d}</td>`;
    i++;
  }
  tbl += "</tr>";
  document.getElementById("calendarTable").innerHTML = tbl;

  document.querySelectorAll("#calendarTable td[data-date]").forEach((cell) => {
    cell.addEventListener("click", () => {
      document.getElementById("popupDate").textContent = cell.dataset.date;
      loadMeetingsForDate(cell.dataset.date);
      openPopup();
    });
  });
}

document.getElementById("prevMonth").addEventListener("click", () => {
  if (--currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentMonth, currentYear);
});
document.getElementById("nextMonth").addEventListener("click", () => {
  if (++currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentMonth, currentYear);
});

function openPopup() {
  document.querySelector(".overlay").style.display = "block";
  document.getElementById("dayPopup").style.display = "block";
}
function closePopup() {
  document.querySelector(".overlay").style.display = "none";
  document.getElementById("dayPopup").style.display = "none";
}
function openAddPopup() {
  document.querySelector(".overlay").style.display = "block";
  document.getElementById("addMeetingPopup").style.display = "block";
}
function closeAddPopup() {
  document.querySelector(".overlay").style.display = "none";
  document.getElementById("addMeetingPopup").style.display = "none";
}

document
  .getElementById("addMeetingBtn")
  .addEventListener("click", openAddPopup);

// Utility to format date as YYYY-MM-DD
function formatDateTimeLocal(dateStr, timeStr = "00:00") {
  if (!dateStr) return "Invalid date";

  // Split time into hours & minutes
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(dateStr);
  if (isNaN(d)) return "Invalid date";

  d.setHours(hours || 0, minutes || 0, 0, 0);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const sec = String(d.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
}
// Load meetings for a date
async function loadMeetingsForDate(date) {
  const res = await fetch(`/api/meetings?date=${date}`);
  const data = await res.json();
  let html =
    data.length === 0
      ? "<li>No meetings</li>"
      : data
          .map(
            (m) =>
              `<li>${formatDateTimeLocal(m.meeting_date, m.time_slot)} - ${
                m.student_name
              }: ${m.reason}</li>`
          )
          .join("");
  document.getElementById("dayMeetingsList").innerHTML = html;
}

// Load upcoming meetings
async function loadUpcomingMeetings(query = "") {
  const res = await fetch(`/api/upcoming-meetings?search=${query}`);
  const data = await res.json();
  let rows = data
    .map((m) => {
      const dateTime = formatDateTimeLocal(m.meeting_date, m.time_slot);
      const [datePart, timePart] = dateTime.split(" ");
      return `
      <tr data-id="${m.meeting_id}">
        <td>${datePart}</td>
        <td>${timePart}</td>
        <td>${m.student_name}</td>
        <td>${m.reason}</td>
      </tr>`;
    })
    .join("");
  document.getElementById("upcomingMeetingsBody").innerHTML = rows;

  document.querySelectorAll("#upcomingMeetingsBody tr").forEach((row) => {
    row.addEventListener("contextmenu", async (e) => {
      e.preventDefault();
      const id = row.dataset.id;
      if (confirm("Are you sure you want to delete this meeting?")) {
        await fetch(`/api/meetings/${id}`, {
          method: "DELETE",
        });
        loadUpcomingMeetings();
      }
    });
  });
}

// Add meeting
document
  .getElementById("addMeetingForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      student_reg_num: document.getElementById("studentSelect").value,
      meeting_date: document.getElementById("meetingDate").value,
      time_slot: document.getElementById("meetingTime").value,
      reason: document.getElementById("meetingReason").value,
    };
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    closeAddPopup();
    loadUpcomingMeetings();
    renderCalendar(currentMonth, currentYear);
  });

// Search
document.getElementById("searchInput").addEventListener("keyup", (e) => {
  loadUpcomingMeetings(e.target.value);
});

// Load student list
async function loadStudents() {
  const res = await fetch("/api/students");
  const data = await res.json();
  let options = data
    .map((s) => `<option value="${s.student_reg_num}">${s.name}</option>`)
    .join("");
  document.getElementById("studentSelect").innerHTML = options;
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  renderCalendar(currentMonth, currentYear);
  loadUpcomingMeetings();
  loadStudents();
});
