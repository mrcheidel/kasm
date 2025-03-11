# XML Validator UI

A graphical user interface for validating XML documents against XSD schemas.

## Features

- Upload or paste XML content
- Upload or paste XSD schema
- Validate XML against XSD
- View detailed validation errors
- Modern, responsive UI

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the validation server:
   ```
   node server.js
   ```

3. In a separate terminal, start the development server:
   ```
   npm run dev
   ```

4. Open your browser to the URL shown in the terminal (typically http://localhost:5173)

## Usage

1. Paste or upload your XML content in the left panel
2. Paste or upload your XSD schema in the right panel
3. Click "Validate XML against XSD"
4. View the validation results below

## Technologies Used

- React
- Vite
- Express
- libxmljs
- Tailwind CSS
- Lucide React icons