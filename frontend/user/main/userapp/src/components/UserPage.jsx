import React, { useState } from 'react';
import { getProductDetails, checkProductOwnership, addConflictProduct } from '../api';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icon
const roundMarker = L.divIcon({
    className: 'custom-round-marker',
    iconSize: [12, 12], // Increased size
    iconAnchor: [7, 7],
    html: '<div style="background-color: red; width: 12x; height: 12px; border-radius: 50%;"></div>', // Added background color and styling for roundness
});

function UserPage({ user }) {
    const [productId, setProductId] = useState('');
    const [productDetails, setProductDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mapData, setMapData] = useState([]);
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default center
    const [billingMessage, setBillingMessage] = useState('');
    const [ownershipMessage, setOwnershipMessage] = useState('');
    const [toast, setToast] = useState({ message: '', type: '', show: false });

    const showToast = (message, type = 'info') => {
        setToast({ message, type, show: true });
        setTimeout(() => {
            setToast({ ...toast, show: false });
        }, 4000);
    };

    const fetchProductDetails = async () => {
        if (!productId) {
            showToast('Please enter a product ID.', 'warning');
            return;
        }

        setLoading(true);
        setError(null);
        setBillingMessage('');
        setOwnershipMessage('');
        setMapCenter([20.5937, 78.9629]); // Reset map center
        setProductDetails(null); // Clear previous product details
        setMapData([]); // Clear previous map data

        try {
            const response = await getProductDetails(productId);
            if (!response) {
                showToast('Enter a valid product ID.', 'danger');
                setLoading(false);
                return;
            }
            setProductDetails(response);

            const validProductHistoryMapData = response.productHistory
                ?.map((item, index) => ({
                    lat: parseFloat(item.Value.latitude),
                    lon: parseFloat(item.Value.longitude),
                    label: `Product ${index + 1}`,
                    owner: item.Value.owner,
                }))
                ?.filter((data) => !isNaN(data.lat) && !isNaN(data.lon)) || [];

            const validUserMapData = response.userDetails
                ?.map((user, index) => ({
                    lat: parseFloat(user.latitude),
                    lon: parseFloat(user.longitude),
                    label: `User ${index + 1}`,
                    owner: user.name,
                    type: user.type,
                }))
                ?.filter((data) => !isNaN(data.lat) && !isNaN(data.lon)) || [];

            const allMapPoints = [...validProductHistoryMapData, ...validUserMapData].reverse();
            setMapData(allMapPoints);

            if (allMapPoints.length > 0) {
                setMapCenter([allMapPoints[0].lat, allMapPoints[0].lon]);
            }

            const firstOwner = response.productHistory[0]?.Value.owner;
            if (firstOwner === 'customer') {
                setBillingMessage('Product is billed');

                const ownershipResponse = await checkProductOwnership(productId, user.email, user.name);
                setOwnershipMessage(ownershipResponse.message);

                if (ownershipResponse.conflict) {
                    const Conflictresponse = await addConflictProduct(productId, ownershipResponse.existingOwnerGmail, user.email);
                    console.log(Conflictresponse);
                }

            } else {
                setBillingMessage('Please bill this product');
            }
        } catch (err) {
            console.error('Error fetching product details:', err);
            showToast('Enter correct product ID', 'danger');
            setError('Failed to fetch product details. Enter correct product ID');
            setProductDetails(null); // Ensure product details are cleared on error
            setMapData([]); // Ensure map data is cleared on error
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchProductDetails();
    };

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: "#EDF4F2", minHeight: "100vh" }}>
            <div className="bg-dark text-white p-3 rounded mb-4">
                <h3 className="mb-0">Product Details</h3>
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

            <div className="card shadow border-0 mb-4">
                <div className="card-header text-white" style={{ backgroundColor: "#31473A" }}>
                    <h5>Fetch Product Information</h5>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="productId" className="form-label">Enter Product ID:</label>
                            <input
                                type="text"
                                className="form-control"
                                id="productId"
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-success">
                            Fetch Details
                        </button>
                    </form>
                    {error && <p className="mt-2 text-danger">{error}</p>}
                    {loading && <div className="mt-2">Loading...</div>}
                    {billingMessage && <p className="mt-2 fw-bold">{billingMessage}</p>}
                    {ownershipMessage && <p className="mt-2 fw-bold text-primary">{ownershipMessage}</p>}
                </div>
            </div>

            {productDetails && !loading ? (
                <div className="mt-4">
                    <div className="card shadow border-0 mb-4">
                        <div className="card-header text-white" style={{ backgroundColor: "#31473A" }}>
                            <h5>User Details</h5>
                        </div>
                        <div className="card-body">
                            {productDetails?.userDetails?.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Username</th>
                                                <th>Name</th>
                                                <th>GST Number</th>
                                                <th>Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productDetails.userDetails
                                                ?.slice()
                                                ?.reverse()
                                                ?.map((user, index) => (
                                                    <tr key={index}>
                                                        <td>{user?.username}</td>
                                                        <td>{user?.name}</td>
                                                        <td>{user?.gst_number}</td>
                                                        <td>{user?.type}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>No user details available for the product owners.</p>
                            )}
                        </div>
                    </div>

                    <div className="card shadow border-0">
                        <div className="card-header text-white" style={{ backgroundColor: "#31473A" }}>
                            <h5>Product Flow and User Locations Map</h5>
                        </div>
                        <div className="card-body">
                            {mapData?.length > 0 ? (
                                <MapContainer center={mapCenter} zoom={5} style={{ height: '500px', width: '100%' }}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    {mapData?.slice()?.reverse()?.map((data, index, reversedMapData) => (
                                        <Marker key={index} position={[data.lat, data.lon]} icon={roundMarker}>
                                            <Popup>
                                                <strong>Owner:</strong> {data?.owner} <br />
                                                <strong>Type:</strong> {data?.type}
                                            </Popup>
                                            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                                                {`User ${reversedMapData.length - index}`}
                                            </Tooltip>
                                        </Marker>
                                    ))}

                                    {mapData?.length > 1 &&
                                        mapData?.slice()?.reverse()?.map((data, index, reversedMapData) => {
                                            if (index < reversedMapData.length - 1) {
                                                const nextData = reversedMapData[index + 1];
                                                const latlngs = [
                                                    [data?.lat, data?.lon],
                                                    [nextData?.lat, nextData?.lon],
                                                ];
                                                return (
                                                    <Polyline
                                                        key={index}
                                                        positions={latlngs}
                                                        color="blue"
                                                        weight={4}
                                                        opacity={0.7}
                                                        dashArray="10,10"
                                                    >
                                                        <Popup>{`Flow from User ${reversedMapData.length - index} to User ${reversedMapData.length - (index + 1)}`}</Popup>
                                                    </Polyline>
                                                );
                                            }
                                            return null;
                                        })}
                                </MapContainer>
                            ) : (
                                <p>No location data available for this product.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default UserPage;