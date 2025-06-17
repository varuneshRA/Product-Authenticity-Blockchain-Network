import React, { useState } from "react";
import Login from "./Login";
import ManufacturerTab from "./ManufacturerTab";
import SalesPartnerTab from "./SalesPartnerTab"; // Import the new SalesPartnerTab component
import { loginUser } from "./api";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';


const App = () => {
  const [user, setUser] = useState(null);

  const handleLogin = async (username, password) => {
    const res = await loginUser(username, password);
    if (res.token) {
      setUser({ username, type: res.type });
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Conditional rendering based on user.type
  if (user.type === "owner") {
    return <ManufacturerTab username={user.username} />;
  } else if (user.type === "wholesale" || user.type === "retail") {
    return <SalesPartnerTab username={user.username} />;
  }

  return null; // This is just a fallback if no valid user type is found
};

export default App;
