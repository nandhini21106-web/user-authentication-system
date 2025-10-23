const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(bodyParser.json());
// ==== Dummy users ====
const users = [
 { email: "admin@ibm.com", password: "123456" },
 { email: "user@ibm.com", password: "password123" },
 { email: "test@ibm.com", password: "test1234" },
];
// ==== Temporary OTP store ====
let otpStore = {};
function generateOTP() {
 return Math.floor(100000 + Math.random() * 900000).toString();
}
// ==== Serve HTML frontend ====
app.get("/", (req, res) => {
 res.send(`
 <!DOCTYPE html>
 <html lang="en">
 <head>
 <meta charset="UTF-8">
 <title>IBM User Authentication & Dashboard</title>
 <style>
 body {
 font-family: "IBM Plex Sans", Arial, sans-serif;
 background-color: #f4f4f4;
 margin: 0; padding: 0;
 }
 .auth-container {
 width: 400px; background: #fff; border-radius: 12px;
 padding: 40px 30px; text-align: center;
 box-shadow: 0px 4px 15px rgba(0,0,0,0.1);
 position: absolute; top: 50%; left: 50%;
 transform: translate(-50%, -50%);
 }
 .auth-logo { font-size: 50px; color: #0f62fe; margin-bottom: 20px; }
 h2 { font-weight: 600; margin-bottom: 25px; color: #161616; }
 .input-group { margin-bottom: 20px; text-align: left; }
 label { display: block; margin-bottom: 6px; font-size: 14px; color: #525252; }
 input[type="email"], input[type="password"] {
 width: 100%; padding: 10px 12px; border: 1px solid #c6c6c6;
 border-radius: 6px; font-size: 14px; transition: border 0.2s;
 }
 input:focus { border-color: #0f62fe; outline: none; }
 .btn {
 width: 100%; padding: 12px; background-color: #0f62fe; color: #fff;
 border: none; border-radius: 6px; font-size: 16px; font-weight: 600;
 cursor: pointer; transition: background 0.2s;
 }
 .btn:hover { background-color: #0353e9; }
 .link { display: block; margin-top: 15px; font-size: 14px; color: #0f62fe; text-decoration:
none; }
 .link:hover { text-decoration: underline; }
 .success-msg { margin-top: 15px; color: #24a148; font-weight: bold; display: none; }
 .error-msg { margin-top: 15px; color: #da1e28; font-weight: bold; display: none; }
 .dashboard { display: none; padding: 40px; text-align: center; }
 .header { background-color: #0f62fe; color: #fff; padding: 20px 40px; font-size: 20px;
font-weight: 600; }
 h1 { font-size: 28px; color: #161616; margin-top: 30px; }
 p { font-size: 16px; color: #393939; margin-top: 10px; }
 .btn-logout {
 margin-top: 30px; background-color: #da1e28; color: #fff;
 border: none; border-radius: 6px; padding: 12px 25px;
 font-size: 16px; cursor: pointer; transition: background 0.2s;
 }
 .btn-logout:hover { background-color: #a2191f; }
 </style>
 </head>
 <body>
 <!-- Login Section -->
 <div class="auth-container" id="loginSection">
 <div class="auth-logo"> </div>
 <h2>Login to Your Account</h2>
 <div class="input-group">
 <label for="email">Email</label>
 <input type="email" id="email" placeholder="Enter your email">
 </div>
 <div class="input-group">
 <label for="password">Password</label>
 <input type="password" id="password" placeholder="Enter your password">
 </div>
 <button class="btn" id="loginBtn">Login</button>
 <a href="#" class="link">Forgot Password?</a>
 <div class="success-msg" id="successMsg"> Login Successful!</div>
 <div class="error-msg" id="errorMsg"> Invalid credentials!</div>
 </div>
 <!-- Dashboard Section -->
 <div class="dashboard" id="dashboardSection">
 <div class="header">IBM Dashboard</div>
 <h1>Welcome to IBM Dashboard</h1>
 <p>You have successfully logged in!</p>
 <button class="btn-logout" id="logoutBtn">Logout</button>
 </div>
 <script>
 const loginBtn = document.getElementById("loginBtn");
 const logoutBtn = document.getElementById("logoutBtn");
 const loginSection = document.getElementById("loginSection");
 const dashboardSection = document.getElementById("dashboardSection");
 const successMsg = document.getElementById("successMsg");
 const errorMsg = document.getElementById("errorMsg");
 let currentEmail = "";
 loginBtn.addEventListener("click", async () => {
 const email = document.getElementById("email").value.trim();
 const password = document.getElementById("password").value;
 const res = await fetch("/login", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email, password })
 });
 const data = await res.json();
 if (data.success) {
 currentEmail = email;
 const otp = prompt("Enter the OTP shown in terminal:");
 await verifyOTP(otp);
 } else {
 showError(data.message);
 }
 });
 async function verifyOTP(otp) {
 const res = await fetch("/verify-otp", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email: currentEmail, otp })
 });
 const data = await res.json();
 if (data.success) {
 showSuccess(" Login Successful!");
 setTimeout(() => {
 loginSection.style.display = "none";
 dashboardSection.style.display = "block";
 }, 1000);
 } else {
 showError(" Invalid OTP!");
 }
 }
 function showSuccess(msg) {
 successMsg.textContent = msg;
 successMsg.style.display = "block";
 errorMsg.style.display = "none";
 }
 function showError(msg) {
 errorMsg.textContent = msg;
 errorMsg.style.display = "block";
 successMsg.style.display = "none";
 }
 logoutBtn.addEventListener("click", () => {
 dashboardSection.style.display = "none";
 loginSection.style.display = "block";
 document.getElementById("email").value = "";
 document.getElementById("password").value = "";
 successMsg.style.display = "none";
 errorMsg.style.display = "none";
 });
 </script>
 </body>
 </html>
 `);
});
// ==== Login Route ====
app.post("/login", (req, res) => {
 const { email, password } = req.body;
 const user = users.find(
 (u) => u.email === email && u.password === password
 );
 if (!user) {
 return res.status(401).json({ success: false, message: "Invalid credentials!" });
 }
 const otp = generateOTP();
 otpStore[email] = otp;
 console.log(` OTP for ${email}: ${otp}`);
 return res.json({ success: true, message: "OTP sent successfully!" });
});
// ==== OTP Verification ====
app.post("/verify-otp", (req, res) => {
 const { email, otp } = req.body;
 if (otpStore[email] && otpStore[email] === otp) {
 delete otpStore[email];
 return res.json({ success: true, message: "Login successful!" });
 } else {
 return res.status(400).json({ success: false, message: "Invalid OTP!" });
 }
});
// ==== Start Server ====
const PORT = 5000;
app.listen(PORT, () => console.log
