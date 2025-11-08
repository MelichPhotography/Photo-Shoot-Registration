<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Photo Shoot Check-In</title>
<meta http-equiv="cache-control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="expires" content="0">
<meta http-equiv="pragma" content="no-cache">
<style>
body {
  font-family: 'Arial', sans-serif;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 20px;
}

header img {
  max-width: 180px;
  margin-bottom: 10px;
}

h1 {
  margin: 0;
  font-size: 2em;
  color: #333;
}

form {
  width: 90%;
  max-width: 400px;
  padding: 20px 30px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

label {
  margin-top: 10px;
  font-weight: bold;
  color: #555;
}

input[type="text"],
input[type="email"],
input[type="number"] {
  padding: 12px;
  margin-top: 5px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1.1em;
  width: 100%;
  box-sizing: border-box;
}

.order-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
}

.order-container input {
  width: 60px;
}

button {
  margin-top: 20px;
  padding: 14px 20px;
  background: #0077b6;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.3s;
  font-size: 1.1em;
}

button:hover {
  background: #005f86;
}

#qr {
  margin-top: 20px;
}

#total-price {
  font-weight: bold;
  margin-top: 15px;
}

@media (max-width: 400px) {
  h1 {
    font-size: 1.5em;
  }
  button {
    padding: 12px 16px;
    font-size: 1em;
  }
}
</style>
</head>
<body>
<header>
  <img src="melich_logo.png" alt="Melich Photography Logo">
  <h1 id="title">Loading Form...</h1>
</header>

<form id="qrForm">
  <button type="submit">Generate QR</button>
</form>

<div id="total-price">Total: $0.00</div>
<div id="qr"></div>

<script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script
