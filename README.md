# Product Authenticity Blockchain Network

## Overview
The **Product Authenticity Blockchain Network** is a **decentralized platform** built on **Hyperledger Fabric** that enables **product traceability and authenticity verification**. This network ensures that products can be traced from their origin (manufacturer) to the end consumer, providing transparency and assurance against counterfeit goods.

### **Key Features:**
- **Blockchain-based Verification**: Utilizes a private blockchain (Hyperledger Fabric) to securely store product data and ownership history.
- **Dual User Interfaces**: 
  - **Manufacturers & Sales Partners** (wholesalers, retailers) have functionalities to manage product ownership, create new products, and manage users.
  - **Customers** can scan barcodes to verify product authenticity and trace its supply chain journey.
- **CouchDB Storage**: All blockchain data, including product records and transactions, are securely stored using CouchDB, ensuring scalability and performance.
- **Separation of Channels**: The system uses a **dedicated channel for supply chain management**, ensuring secure and distinct data flow between different entities.

---

## **Tech Stack**

- **Frontend**: React, Node.js, Express, MongoDB
- **Backend**: Hyperledger Fabric, CouchDB
- **Blockchain**: Private Hyperledger Fabric network for secure transactions

---

## **System Architecture**

### 1. **Manufacturers and Sales Partners Platform:**
   - **Product Creation**: Manufacturers can create new product entries, which are then registered in the blockchain.
   - **Ownership Transfer**: Sales partners can transfer ownership of products, enabling a seamless supply chain process.
   - **User Management**: Manufacturers can add or remove sales partners, ensuring control over the supply chain network.

### 2. **Customer Platform:**
   - **Barcode Scanning**: Customers can scan the barcode of a product to verify its authenticity.
   - **Product Traceability**: Customers can trace the product’s supply chain from the manufacturer to the retailer, ensuring it is genuine.

---

## **How it Works**

1. **Creating a Product**: A manufacturer registers a product on the blockchain by creating a new product entry, which is stored securely in the Hyperledger Fabric network.
2. **Ownership Transfer**: As products move through the supply chain, ownership can be transferred via blockchain transactions, ensuring that each step of the product's journey is recorded.
3. **Customer Verification**: Customers can scan the product’s barcode to verify the origin and authenticity of the product by accessing the blockchain’s recorded transactions.

---

## **Why Hyperledger Fabric?**
Hyperledger Fabric provides a **permissioned blockchain** platform, which is ideal for business applications where privacy, security, and scalability are essential. The use of **CouchDB** as the storage layer ensures high-performance data handling, while **separate channels** help to manage data isolation for different parts of the supply chain.

---

## **Security Considerations**
- **Encryption**: All sensitive data exchanged between users is encrypted to ensure privacy and data integrity.
- **Permissioning**: The Hyperledger Fabric network is permissioned, ensuring only authorized entities (manufacturers, wholesalers, retailers) can participate in the network.

---

## **Contributing**
We welcome contributions! If you'd like to contribute, please fork this repository, make changes, and submit a pull request.

---

## 🌟 **Acknowledgments**
- **Hyperledger Fabric**: For providing a robust blockchain framework for secure, transparent transactions.
- **CouchDB**: For reliable and scalable blockchain storage.
- **React & Node.js**: For building the dynamic frontend and scalable backend.
