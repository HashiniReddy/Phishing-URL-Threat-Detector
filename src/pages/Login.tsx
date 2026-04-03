const token =
  response?.token ||
  response?.access_token ||
  response?.data?.token ||
  response?.data?.access_token;

const user =
  response?.user ||
  response?.data?.user || {
    email: trimmedEmail,
    full_name: "User",
  };

if (token) {
  localStorage.setItem("token", token);
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userEmail", user.email || trimmedEmail);
  localStorage.setItem("userFullName", user.full_name || "");

  if (rememberMe) {
    localStorage.setItem("rememberMe", "true");
  } else {
    localStorage.removeItem("rememberMe");
  }

  localStorage.removeItem("pendingOtpEmail");
  sessionStorage.clear();

  toast({
    title: "Login Successful",
    description: "Welcome back! Redirecting to dashboard...",
    duration: 3000,
  });

  showBigPopup(
    "ACCESS GRANTED",
    "Authentication successful. Redirecting to command center...",
    "success"
  );
  speakMessage("Access granted");

  redirectTimeoutRef.current = window.setTimeout(() => {
    navigate("/dashboard", { replace: true });
  }, 1200);

  return;
}