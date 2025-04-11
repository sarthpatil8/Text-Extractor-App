# 📸 Text Extractor App

A **React Native** app built with **Expo** and **TypeScript** that allows users to **capture** or **upload images** and extract text using the **Mistral API**. The extracted text can be formatted as **Markdown** or structured into **JSON** for further use.

---

## 🚀 Purpose

This app aims to simplify the process of extracting text from images and turning it into a useful, structured format. Whether you're scanning notes, receipts, or documents, this tool makes it easy to digitize and organize content on the go.

---

## ✨ Features

- Capture photos using the device camera
- Upload images from the device gallery
- Extract text from images using the **Mistral API**
- Format extracted text as:
  - Markdown
  - Structured JSON
- Toggle between output formats
- Easy-to-use UI with responsive feedback

---

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/text-extractor-app.git
   cd text-extractor-app

2. **Install dependencies**
        npm install


3. **Create API key config**
        // config.tsx
        export const MISTRAL_API_KEY = 'your-mistral-api-key-here';


4. **Start the Expo development server**
        npx expo start

