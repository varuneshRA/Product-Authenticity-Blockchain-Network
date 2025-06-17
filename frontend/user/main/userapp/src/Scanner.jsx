// Scanner.jsx

import { QrReader } from 'react-qr-reader';
import React, { useState } from 'react';

function Scanner() {
  const [data, setData] = useState('No result');

  return (
    <div>
      <h2>QR / Barcode Scanner</h2>
      <QrReader
        onResult={(result, error) => {
          if (!!result) {
            setData(result?.text);
          }
          if (!!error) {
            console.error(error);
          }
        }}
        constraints={{ facingMode: 'environment' }} // Use back camera
        style={{ width: '100%' }}
      />
      <p>Scanned Data: {data}</p>
    </div>
  );
}

export default Scanner;
clear