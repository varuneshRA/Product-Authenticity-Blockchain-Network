import React, { useState } from "react";
import { createUser, changeProductOwnership } from "./api";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// Component to capture map click
function LocationSelector({ setLatitude, setLongitude }) {
  useMapEvents({
    click(e) {
      setLatitude(e.latlng.lat);
      setLongitude(e.latlng.lng);
    },
  });
  return null;
}

const SalesPartnerTab = ({ username }) => {
  const [newUsername, setNewUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [type, setType] = useState("wholesale");

  const [changeProductID, setChangeProductID] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "", show: false });

  const showToast = (message, type = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast({ ...toast, show: false });
    }, 4000);
  };

  const handleCreateUser = async () => {
    if (!newUsername || !password || !gstNumber || !name || !contactNo || latitude === null || longitude === null) {
      showToast("Please fill all fields and select location.", "danger");
      return;
    }

    const userData = {
      username: newUsername,
      password,
      gst_number: gstNumber,
      name,
      latitude,
      longitude,
      contact_no: contactNo,
      type,
      created_by: username,
    };

    const res = await createUser(userData);

    if (res.deleted) {
      showToast("❌ You do not have permission to register this user. Please contact the manufacturer.", "danger");
    } 
    else if(res.error){
        showToast(`⚠️ ${res.error}`, "danger");
    }
    else {
      showToast(`✅ ${res.message || "User created successfully!"}`, "success");
      
      // Clear the form fields
      setNewUsername("");
      setPassword("");
      setGstNumber("");
      setName("");
      setContactNo("");
      setLatitude(null);
      setLongitude(null);
      setType("wholesale");
    }
  };

  const handleChangeProductOwnership = async () => {
    if (!changeProductID || !newOwnerName) {
      showToast("Please fill both fields.", "warning");
      return;
    }

    const res = await changeProductOwnership(changeProductID, newOwnerName);

    // Check if the response contains an error message and display accordingly
    if (res.error) {
      showToast(`⚠️ ${res.error}`, "danger");
    } else {
      showToast(`🔁 ${res.message || "Ownership changed successfully!"}`, "success");
    }

    //clear
    setChangeProductID("");
    setNewOwnerName("");
  };

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: "#EDF4F2", minHeight: "100vh" }}>
      <div className="bg-dark text-white p-3 rounded mb-4 d-flex justify-content-between align-items-center">
        <h3 className="mb-0">Sales Partner Tab</h3>
        <span className="fs-5">Welcome, <strong>{username}</strong></span>
      </div>

      {/* Toast */}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
        <div className={`toast align-items-center text-white bg-${toast.type} ${toast.show ? "show" : "hide"}`} role="alert">
          <div className="d-flex">
            <div className="toast-body">{toast.message}</div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Create User */}
        <div className="col-lg-6">
          <div className="card shadow border-0">
            <div className="card-header text-white" style={{ backgroundColor: "#31473A" }}>
              <h5>Create New User</h5>
            </div>
            <div className="card-body">
              <input className="form-control mb-2" placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
              <input className="form-control mb-2" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input className="form-control mb-2" placeholder="GST Number" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
              <input className="form-control mb-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="form-control mb-2" placeholder="Contact Number" value={contactNo} onChange={(e) => setContactNo(e.target.value)} />
              <select className="form-select mb-2" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="wholesale">Wholesale</option>
                <option value="retail">Retail</option>
              </select>

              <button className="btn btn-outline-dark w-100 mb-3" onClick={() => setShowMapModal(true)}>
                Select Location on Map
              </button>

              {latitude && longitude && (
                <div className="mb-3">
                  <p className="mb-1"><strong>Latitude:</strong> {latitude.toFixed(4)}</p>
                  <p className="mb-1"><strong>Longitude:</strong> {longitude.toFixed(4)}</p>
                </div>
              )}

              <button className="btn btn-success w-100" onClick={handleCreateUser}>
                Create User
              </button>
            </div>
          </div>
        </div>

        {/* Change Ownership */}
        <div className="col-lg-6">
          <div className="card shadow border-0">
            <div className="card-header text-white" style={{ backgroundColor: "#31473A" }}>
              <h5>Change Product Ownership</h5>
            </div>
            <div className="card-body">
              <input className="form-control mb-3" placeholder="Product ID" value={changeProductID} onChange={(e) => setChangeProductID(e.target.value)} />
              <input className="form-control mb-3" placeholder="New Owner Name" value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} />
              <button className="btn btn-success w-100" onClick={handleChangeProductOwnership}>
                Change Ownership
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header text-white" style={{ backgroundColor: "#31473A" }}>
                <h5 className="modal-title">Select Location</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowMapModal(false)}></button>
              </div>
              <div className="modal-body p-0">
                <MapContainer
                  center={[20.5937, 78.9629]} // India coordinates
                  zoom={5}
                  style={{ height: "400px", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {latitude && longitude && <Marker position={[latitude, longitude]} />}
                  <LocationSelector setLatitude={setLatitude} setLongitude={setLongitude} />
                </MapContainer>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowMapModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPartnerTab;
