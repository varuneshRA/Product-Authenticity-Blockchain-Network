import React, { useState } from "react";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState({ message: "", type: "", show: false });

  const showToast = (message, type = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast({ ...toast, show: false });
    }, 3000); // Slightly shorter duration for login
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onLogin(username, password);
    if (success) {
      showToast("Login successful!", "success");
      // Optionally redirect or clear form
    } else {
      showToast("Invalid username or password.", "danger");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4 rounded w-100" style={{ maxWidth: "400px" }}>
        <h2 className="text-center mb-3 w-100" style={{ color: "#31473A" }}>Login</h2>
        {/* Toast */}
        <div className="position-absolute top-0 start-50 translate-middle-x mt-3" style={{ zIndex: 9999 }}>
          <div className={`toast align-items-center text-white bg-${toast.type} ${toast.show ? "show" : "hide"}`} role="alert">
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ ...toast, show: false })}></button>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="mt-3 btn btn-success w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;