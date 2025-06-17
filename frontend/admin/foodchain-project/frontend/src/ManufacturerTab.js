import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  createProduct,
  createUser,
  deleteUser,
  changeProductOwnership,
  getConflictProducts,
  resolveConflictProduct,
} from "./api";
import JsBarcode from "jsbarcode";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default icon path (required for Webpack/Vite setups)
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Custom Hook for Selecting Location
function LocationSelector({ setLatitude, setLongitude }) {
  useMapEvents({
    click(e) {
      setLatitude(e.latlng.lat);
      setLongitude(e.latlng.lng);
    },
  });

  return null;
}

const ManufacturerTab = ({ username }) => {
  const [productName, setProductName] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const [productID, setProductID] = useState(null);
  const barcodeRef = useRef(null);

  // Create User Fields
  const [newUsername, setNewUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [contactNo, setContactNo] = useState("");
  const [type, setType] = useState("owner");
  const [showMapModal, setShowMapModal] = useState(false);

  // Delete User
  const [delUsername, setDelUsername] = useState("");
  const [delReason, setDelReason] = useState("");

  // Change Product Ownership
  const [changeProductID, setChangeProductID] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");

  // Conflict Products
  const [conflictProducts, setConflictProducts] = useState([]);

  const [toast, setToast] = useState({ message: "", type: "", show: false });

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast({ ...toast, show: false });
    }, 4000);
  }, [toast]);

  const fetchConflictProducts = useCallback(async () => {
    try {
      const data = await getConflictProducts();
      setConflictProducts(data);
    } catch (error) {
      console.error("Error fetching conflict products:", error);
      showToast("Failed to fetch conflict products.", "danger");
    }
  }, [showToast]);

  useEffect(() => {
    fetchConflictProducts(); // Fetch conflict products on component mount
  }, [fetchConflictProducts]);

  const handleCreateProduct = async () => {
    if (!productName || !manufacturerId) {
      showToast("Please fill in both Product Name and Manufacturer ID.", "warning");
      return;
    }

    const args = [null, null, productName, manufacturerId, username];
    const response = await createProduct(username, args);
    if (response.success) {
      setProductID(response.productID);
      showToast(`✅ Product created successfully! Product ID: ${response.productID}`, "success");
    } else if (response.conflict) {
      showToast(`⚠️ ${response.message}`, "warning");
      fetchConflictProducts(); // Refresh conflict list
    } else {
      showToast(`⚠️ ${response.error || "Failed to create product."}`, "danger");
    }

    //clear feilds
    setProductName("");
    setManufacturerId("");
  };

  const handleCreateUser = async () => {
    if (!newUsername || !password || !gstNumber || !name || !contactNo || latitude === null || longitude === null) {
      showToast("Please fill all fields and select location.", "warning");
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
      const confirmAdd = window.confirm(
        `GST Number "${res.gst_number}" was previously deleted for reason:\n"${res.reason}".\nDo you want to continue?`
      );
      if (confirmAdd) {
        userData.override = true;
        const retry = await createUser(userData);
        if (retry.error) {
          showToast(`⚠️ ${retry.error}`, "danger");
        } else {
          showToast(`✅ User created successfully!`, "success");
          setNewUsername("");
          setPassword("");
          setGstNumber("");
          setName("");
          setContactNo("");
          setLatitude(null);
          setLongitude(null);
          setType("owner");
        }
      } else {
        showToast("🚫 Cancelled user creation.", "info");
      }
    } else if (res.error) {
      showToast(`⚠️ ${res.error}`, "danger");
    } else {
      showToast(`✅ User created successfully!`, "success");
      setNewUsername("");
      setPassword("");
      setGstNumber("");
      setName("");
      setContactNo("");
      setLatitude(null);
      setLongitude(null);
      setType("owner");
    }
  };

  const handleDeleteUser = async () => {
    if (!delUsername || !delReason) {
      showToast("Please provide both Username and Reason for deletion.", "warning");
      return;
    }
    const res = await deleteUser(delUsername, delReason);
    if (res.error) {
      showToast(`⚠️ ${res.error}`, "danger");
    } else {
      showToast(`🗑️ ${res.message || "User deleted successfully!"}`, "success");
      setDelUsername("");
      setDelReason("");
    }
  };

  const handleChangeProductOwnership = async () => {
    if (!changeProductID || !newOwnerName) {
      showToast("Please fill in both fields.", "warning");
      return;
    }

    const response = await changeProductOwnership(changeProductID, newOwnerName);
    if (response.error) {
      showToast(`⚠️ ${response.error}`, "danger");
    } else {
      showToast(`🔁 ${response.message || "Ownership changed successfully!"}`, "success");
      setChangeProductID("");
      setNewOwnerName("");
    }
  };

  const handleResolveConflict = async (productId) => {
    const response = await resolveConflictProduct(productId);
    if (response.success) {
      showToast(`✅ ${response.message}`, "success");
      fetchConflictProducts(); // Refresh conflict list
    } else {
      showToast(`⚠️ ${response.error || "Failed to resolve conflict."}`, "danger");
    }
  };

  const downloadBarcode = () => {
    const canvas = barcodeRef.current;
    if (canvas && typeof canvas.toDataURL === "function") {
      const dataUrl = canvas.toDataURL();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `product_${productID}_barcode.png`;
      a.click();
    } else {
      showToast("⚠️ Barcode rendering issue – try again.", "danger");
    }
  };

  useEffect(() => {
    if (productID && barcodeRef.current) {
      JsBarcode(barcodeRef.current, productID, { format: "CODE128" });
    }
  }, [productID]);

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: "#EDF4F2", minHeight: "100vh" }}>
      <div className="bg-dark text-white p-3 rounded mb-4 d-flex justify-content-between align-items-center">
        <h3 className="mb-0">Manufacturer Tab</h3>
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
        {/* Create Product */}
        <div className="col-lg-6">
          <div className="card shadow border-0">
            <div className="card-header text-white" style={{ backgroundColor: "#31473A" }}>
              <h5>Create New Product</h5>
            </div>
            <div className="card-body">
              <input
                className="form-control mb-2"
                placeholder="Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
              <input
                className="form-control mb-3"
                placeholder="Manufacturer ID"
                value={manufacturerId}
                onChange={(e) => setManufacturerId(e.target.value)}
              />
              <button className="btn btn-success w-100" onClick={handleCreateProduct}>
                Create Product
              </button>

              {productID && (
                <div className="mt-3 text-center">
                  <h6>Product ID: {productID}</h6>
                  <canvas ref={barcodeRef} style={{ maxWidth: "100%" }}></canvas>
                  <button className="btn btn-outline-dark mt-2" onClick={downloadBarcode}>
                    Download Barcode
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

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
                <option value="owner">Owner</option>
                <option value="wholesale">Wholesale</option>
                <option value="retail">Retail</option>
              </select>

              <button className="btn btn-outline-dark w-100 mb-3" onClick={() => setShowMapModal(true)}>
                Select Location on Map
              </button>

              {latitude && longitude && (
                <div className="mb-3">
                  <p className="mb-1"><strong>Latitude:</strong> {latitude ? latitude.toFixed(4) : ''}</p>
                  <p className="mb-1"><strong>Longitude:</strong> {longitude ? longitude.toFixed(4) : ''}</p>
                </div>
              )}

              <button className="btn btn-success w-100" onClick={handleCreateUser}>
                Create User
              </button>
            </div>
          </div>
        </div>

        {/* Delete User */}
        <div className="col-lg-6">
          <div className="card shadow border-0">
            <div className="card-header text-white" style={{ backgroundColor: "#31473A" }}>
              <h5>Delete User</h5>
            </div>
            <div className="card-body">
              <input
                className="form-control mb-2"
                placeholder="Username to Delete"
                value={delUsername}
                onChange={(e) => setDelUsername(e.target.value)}
              />
              <textarea
                className="form-control mb-3"
                placeholder="Reason for Deletion"
                value={delReason}
                onChange={(e) => setDelReason(e.target.value)}
              />
              <button className="btn btn-danger w-100" onClick={handleDeleteUser}>
                Delete User
              </button>
            </div>
          </div>
        </div>

        {/* Change Product Ownership */}
        <div className="col-lg-6">
          <div className="card shadow border-0">
            <div className="card-header text-white" style={{ backgroundColor: "#31473A" }}>
              <h5>Change Product Ownership</h5>
            </div>
            <div className="card-body">
              <input
                className="form-control mb-3"
                placeholder="Product ID"
                value={changeProductID}
                onChange={(e) => setChangeProductID(e.target.value)}
              />
              <input
                className="form-control mb-3"
                placeholder="New Owner Name"
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
              />
              <button className="btn btn-success w-100" onClick={handleChangeProductOwnership}>
                Change Ownership
              </button>
            </div>
          </div>
        </div>

        {/* Conflict Products Display */}
        <div className="col-12">
          <div className="card shadow border-0">
            <div className="card-header text-white" style={{ backgroundColor: "#FFA07A" }}>
              <div className="d-flex justify-content-between align-items-center">
                <h5>Conflict Product IDs</h5>
                <button className="btn btn-sm btn-outline-light" onClick={fetchConflictProducts}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417l.3.3a.5.5 0 0 1 -.416.908A5 5 0 0 1 8 3z"/>
                    <path d="M8 4.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1 0-1h4.5V5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M8 13a5 5 0 1 1-4.546-2.914.5.5 0 0 1-.908.417l-.3-.3a.5.5 0 0 1 .416-.908A5 5 0 0 0 8 13z"/>
                  </svg> Refresh
                </button>
              </div>
            </div>
            <div className="card-body">
              {conflictProducts.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Existing User (Gmail)</th>
                        <th>Conflicting User (Gmail)</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conflictProducts.map((conflict) => (
                        <tr key={conflict._id}>
                          <td>{conflict.productId}</td>
                          <td>{conflict.gmail1}</td>
                          <td>{conflict.gmail2}</td>
                          <td>{new Date(conflict.createdAt).toLocaleString()}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleResolveConflict(conflict.productId)}
                            >
                              Resolve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mb-0">No conflict product IDs found.</p>
              )}
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
                  center={[11.1224, 77.3462]} // India coordinates
                  zoom={7}
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

export default ManufacturerTab;
