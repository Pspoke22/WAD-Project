// Helper: Handle fetch responses safely
async function handleResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Invalid JSON response:", text);
    return { success: false, message: "Invalid server response" };
  }
}

// -------------------- REGISTER --------------------
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const errorMessage = document.getElementById("errorMessage");

    if (password !== confirmPassword) {
      errorMessage.textContent = "Passwords do not match";
      errorMessage.style.display = "block";
      return;
    }

    if (password.length < 6) {
      errorMessage.textContent = "Password must be at least 6 characters";
      errorMessage.style.display = "block";
      return;
    }

    try {
      const response = await fetch("api/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await handleResponse(response);

      if (data.success) {
        alert("Registration successful! Please login.");
        window.location.href = "login.html";
      } else {
        errorMessage.textContent = data.message || "Registration failed.";
        errorMessage.style.display = "block";
      }
    } catch (error) {
      console.error(error);
      errorMessage.textContent = "Network error. Please try again.";
      errorMessage.style.display = "block";
    }
  });
}

// -------------------- LOGIN --------------------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMessage = document.getElementById("errorMessage");

    try {
      const response = await fetch("api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await handleResponse(response);

      if (data.success) {
        // Save user session in localStorage
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect to dashboard
        window.location.href = "dashboard.html";
      } else {
        errorMessage.textContent = data.message || "Invalid credentials.";
        errorMessage.style.display = "block";
      }
    } catch (error) {
      console.error(error);
      errorMessage.textContent = "Server connection failed.";
      errorMessage.style.display = "block";
    }
  });
}

// -------------------- LOGOUT --------------------
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
}
