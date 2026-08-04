const form = document.getElementById("loginForm");
const message = document.getElementById("loginMessage");
const passwordInput = document.getElementById("password");
const toggleBtn = document.getElementById("togglePass");

toggleBtn.innerHTML = Icons.eye;
toggleBtn.addEventListener("click", () => {
  const show = passwordInput.type === "password";
  passwordInput.type = show ? "text" : "password";
  toggleBtn.innerHTML = show ? Icons.eyeOff : Icons.eye;
});

function showError(text) {
  message.innerHTML = `${Icons.alert}<span>${esc(text)}</span>`;
  message.classList.remove("hidden");
  message.style.animation = "none";
  void message.offsetWidth;
  message.style.animation = "";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  message.classList.add("hidden");

  const username = document.getElementById("username").value.trim();
  const password = passwordInput.value;
  const users = DB.get("users", []);
  const user = users.find(
    (entry) => entry.username === username && entry.password === password,
  );

  if (user) {
    toast(`Welcome back, ${esc(user.username)}`, "success");
    setTimeout(() => {
      if (user.role === "admin") window.location.href = "admin.html";
      else if (user.role === "store") window.location.href = "store.html";
      else window.location.href = "kitchen.html";
    }, 400);
  } else {
    showError("Invalid username or password. Try the demo credentials below.");
  }
});
