// loginReq.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("input[type=email]").value.trim();
    const password = document
      .querySelector("input[type=password]")
      .value.trim();
    const role = document.querySelector("select").value;

    if (!email || !password || !role) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ " + data.message);

        if (role === "mentor") {
          // ✅ Save mentor info in localStorage (used by profile page & meetings)
          //localStorage.setItem("mentorUser", JSON.stringify(data.user));
          localStorage.setItem(
            "mentorUser",
            JSON.stringify({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: "mentor",
            })
          );
          // Redirect to mentor dashboard
          window.location.href = "dashboardPage.html";
        } else {
          alert("⚠️ Only mentors can log in here.");
        }
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("⚠️ Server error. Please try again later.");
    }
  });
});
