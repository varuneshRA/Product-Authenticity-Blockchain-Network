import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const LoginPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [shake, setShake] = useState(false);

  const onSuccess = (credentialResponse) => {
    try {
      const decodedToken = jwtDecode(credentialResponse.credential);
      console.log('Decoded JWT:', decodedToken);
      setUser(decodedToken);
      navigate('/user');
    } catch (error) {
      console.error('Error decoding JWT:', error);
      alert('Login process encountered an issue. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500); // Trigger shake animation
    }
  };

  const onFailure = () => {
    alert('Google login failed. Please try again.');
    setShake(true);
    setTimeout(() => setShake(false), 500); // Trigger shake animation
  };

  const containerStyle = {
    textAlign: 'center',
    marginTop: '120px',
    padding: '30px',
    border: '2px solid #4CAF50', // Stylish border
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // More pronounced shadow
    backgroundColor: '#f4f4f4',
    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out', // Smooth transitions
    transform: isHovered ? 'scale(1.05)' : 'scale(1)', // Hover animation
  };

  const headingStyle = {
    color: '#2E7D32', // Vibrant color
    marginBottom: '30px',
    fontSize: '2.5em',
    fontWeight: 'bold',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)', // Text shadow
    letterSpacing: '1px', // Slightly spaced letters
  };

  const googleButtonStyle = {
    filter: isHovered ? 'brightness(1.1)' : 'brightness(1)', // Hover effect on button
    transition: 'filter 0.3s ease-in-out',
  };

  const shakeClass = shake ? 'shake' : '';

  const keyframesShake = `
    @keyframes shake {
      10%, 90% {
        transform: translate3d(-1px, 0, 0) scale(1.05);
      }
      20%, 80% {
        transform: translate3d(2px, 0, 0) scale(1.05);
      }
      30%, 50%, 70% {
        transform: translate3d(-4px, 0, 0) scale(1.05);
      }
      40%, 60% {
        transform: translate3d(4px, 0, 0) scale(1.05);
      }
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.textContent = keyframesShake;
  document.head.appendChild(styleElement);

  return (
    <div
      className={`login-page ${shakeClass}`} // Apply shake class conditionally
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2 style={headingStyle}>Welcome!</h2>
      <p style={{ color: '#777', marginBottom: '20px', fontStyle: 'italic' }}>
        Sign in to explore the product details.
      </p>
      <div style={googleButtonStyle}>
        <GoogleLogin onSuccess={onSuccess} onError={onFailure} />
      </div>
      {/* You can add more animated elements or styles here */}
      <div
        style={{
          marginTop: '20px',
          fontSize: '0.8em',
          color: '#999',
          opacity: isHovered ? 0.8 : 0.6,
          transition: 'opacity 0.3s ease-in-out',
        }}
      >
        Powered by React & Google OAuth
      </div>
    </div>
  );
};

export default LoginPage;