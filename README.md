# ⛩️ PosterSensei - Backend API

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDev-Pavithan%2FPosterSensei_Backend)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The powerhouse behind **PosterSensei**, a premium anime poster e-commerce platform. Built with a focus on scalability, security, and performance.

---

## 🚀 Features

- **🔐 Advanced Auth**: Secure JWT-based authentication with cookie-based session management.
- **📦 Product Management**: Dynamic anime categories, inventory tracking, and search functionality.
- **🛒 Order System**: Seamless checkout flow with payment status tracking and coupon code support.
- **🖼️ Image Optimization**: Cloudinary integration for high-performance asset management.
- **🛠️ Admin Panel**: Dedicated endpoints for dashboard statistics and management.
- **🔍 SEO-Ready Architecture**: Structured data for optimal search engine visibility.

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) (via Mongoose)
- **Asset Management**: [Cloudinary](https://cloudinary.com/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🏁 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dev-Pavithan/PosterSensei_Backend.git
   cd PosterSensei_Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Fetch all products / search |
| `GET` | `/api/products/animes` | Get all anime categories |
| `POST` | `/api/users/login` | User authentication |
| `POST` | `/api/orders` | Place a new order |
| `GET` | `/api/upload` | Asset management (Admin) |

---

## 🏗️ Vercel Deployment

This backend is optimized for **Vercel Serverless Functions**. 

1. Connect your repository to Vercel.
2. Add environment variables in the Vercel Dashboard.
3. Deploy! The `vercel.json` and `tsconfig.json` are pre-configured.

---

## ⚖️ Copyright & License

**Copyright © 2026 PosterSensei. All rights reserved.**

This project is licensed under the **MIT License**. You are free to use, modify, and distribute this software, provided that the original copyright notice and this permission notice are included in all copies or substantial portions of the software.

*Crafted with ❤️ for the Anime Community.*
