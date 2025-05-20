# Blog Application

A full-stack blog application with auto-save draft feature, built with React, Express, and MongoDB.

## Features

- Create, edit, and publish blog posts
- Auto-save drafts
- Rich text editor
- Tag support
- Separate views for published and draft posts

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Setup

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/blog-app
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the client directory with the following content:
   ```
   VITE_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/blogs/save-draft` - Save or update a draft
- `POST /api/blogs/publish` - Save and publish a blog post
- `GET /api/blogs` - Get all blogs (published and drafts)
- `GET /api/blogs/:id` - Get a specific blog post

## Technologies Used

- Frontend:
  - React
  - React Router
  - TinyMCE Editor
  - Axios
  - React Hot Toast
  - Tailwind CSS

- Backend:
  - Node.js
  - Express
  - MongoDB
  - Mongoose

## Development

The application uses:
- Auto-save functionality with a 5-second debounce
- Rich text editor for blog content
- Responsive design
- Toast notifications for user feedback 