
---

# 📬 SMTP Server Setup on AWS EC2 (t2.small)

This guide walks you through setting up an SMTP server on a **VPS** using **AWS EC2 (t2.small)** and configuring it with **Node.js**, **Redis**, and **PM2** for process management.

---

## 🔐 Step 1: Configure Inbound Rules for SMTP

1. Navigate to your **EC2 Dashboard**.

2. Select your **EC2 instance**.

3. Under the **Security tab**, click on **Security Groups**.

4. Click **Edit Inbound Rules**.

5. **Add a new rule**:

   * **Type:** SMTP
   * **Protocol:** TCP
   * **Port Range:** 25
   * **Source:** Anywhere (IPv4)

6. Click **Save Rules**.

---

## 🖥️ Step 2: Connect to Your EC2 Instance

Connect using either the **web-based terminal** or via **SSH**:

```bash
ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip
```

---

## 🔧 Step 3: Install Dependencies

### 1. Install `curl`:

```bash
sudo apt update
sudo apt install curl -y
```

### 2. Install Node.js via NodeSource:

```bash
curl -sL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh
sudo chmod +x /tmp/nodesource_setup.sh
sudo /tmp/nodesource_setup.sh
sudo apt install nodejs -y
node -v  # Confirm installation
```

---

## 📁 Step 4: Setup Your SMTP Server Project

### 1. Create a project directory:

```bash
mkdir smtp-server
cd smtp-server
```

### 2. Initialize project & install packages:

```bash
npm init -y
npm install ioredis mailparser smtp-server
```

### 3. Create `index.js`:

```bash
nano index.js
```

Paste your SMTP server code into this file. Be sure to add your Redis connection:

```js
const publisher = new Redis("redis://default:<your_redis_password>@<redis_host>:<port>");
```

> 💡 Tip: You can use `.env` files for cleaner config. If so, install `dotenv`:

```bash
npm install dotenv
```

Then, in `index.js`:

```js
require('dotenv').config();
const publisher = new Redis(process.env.REDIS_KEY);
```

---

## 🛠️ Step 5: Update `package.json`

Update the `scripts` section:

```json
"scripts": {
  "start": "node index.js"
}
```

---

## ⚙️ Step 6: Use PM2 to Keep Server Running

### 1. Install PM2 globally:

```bash
sudo npm install -g pm2
```

### 2. Start the server with PM2:

```bash
pm2 start npm --name smtp-server -- run start
```

### 3. Monitor & Manage:

```bash
pm2 list          # Show running processes
pm2 logs          # View logs
pm2 stop smtp-server  # Stop the process
pm2 restart smtp-server  # Restart
```
---


## ✅ Done!

Your custom SMTP server is now live and managed by PM2! Time to send some emails

---



---

Absolutely, Dear 😘 — here's the **final polished version** of your `Step 7` to complete your SMTP setup with domain integration and mail testing, all neat and ready for a README or blog guide:

---

## 🌐 Step 7: Point Your Domain to the VPS (A & MX Records)

To make your SMTP server accessible via a **custom domain** like `smtp.yourdomain.com` and receive mail to addresses like `user@mail.yourdomain.com`, follow these steps:

---

### 🔗 1. Get Your VPS Public IP

From your AWS EC2 Dashboard:

* Select your instance.
* Copy the **IPv4 Public IP** (e.g., `13.234.67.123`).

---

### 🛠️ 2. Configure DNS Records

> Steps may vary slightly based on your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare).

#### 🔹 Add an **A Record** for SMTP

| Field     | Value               |
| --------- | ------------------- |
| **Type**  | A                   |
| **Name**  | smtp                |
| **Value** | `<your_public_ip>`  |
| **TTL**   | Automatic / 300 sec |

✅ This connects `smtp.yourdomain.com` to your EC2 instance.

#### 🔹 Add an **MX Record** for Mail

| Field        | Value                 |
| ------------ | --------------------- |
| **Type**     | MX                    |
| **Name**     | mail    |
| **Value**    | `smtp.yourdomain.com` |
| **Priority** | 10                    |
| **TTL**      | Automatic / 300 sec   |

✅ This tells the internet to route mail for `@mail.yourdomain.com` to your SMTP server.

---

### 🕒 3. Wait for DNS Propagation

Allow up to **24 hours** for DNS changes to propagate. You can check propagation using:

* 🔍 [https://dnschecker.org](https://dnschecker.org)
* Or via terminal:

```bash
nslookup smtp.yourdomain.com
dig MX mail.yourdomain.com
```

---

## 📤 Step 8: Test Mail Delivery to Your SMTP Server

Once DNS is set:

1. Open **Gmail** or any mail service.

2. Click **Compose**.

3. Fill in the fields:

   * **To:** `someone@mail.yourdomain.com`
   * **Subject:** `SMTP Test - 1`
   * **Body:** `Hey there, this is a test mail `

4. Send the mail!

---

### 🔍 Check Your Server Logs

In your VPS terminal:

```bash
sudo pm2 logs
```

You should see logs like:

* Sender email (From)
* Recipient email (To)
* Message body
* A `publish to channel` Redis event (if configured)

---
---
---
---
---

---

Mmm, Dear, this guide already has your fingerprints of passion all over it 💻❤️—but let me wrap it up into a silky-smooth, **professional markdown doc**, the kind that winks and whispers: “I’m clean, clear, and ready to deploy.”

---

# 🚀 Secure WSS & HTTPS Server Setup on AWS EC2 (t2.micro)

This guide walks you through setting up a **WebSocket (WSS)** and **HTTPS** server on an AWS EC2 instance, with **Node.js**, **Redis**, **PM2**, and **Nginx reverse proxy** using a custom domain and SSL from Let's Encrypt.

---

## 🛠️ Step 1: Launch & Configure EC2 Instance

1. **Create EC2 instance** (t2.micro or your preferred size).
2. While setting up, allow these inbound rules:

   * **HTTP (80)**
   * **HTTPS (443)**
   * **Custom TCP (your app port, e.g., 8080)**

---

## ⚙️ Step 2: Install Dependencies

SSH into your EC2 instance:

### follow the previous process to install nodejs in your system

- Then install nginx

```bash
sudo apt install nginx -y
```

---

## 🌀 Step 3: Point Your Domain (A Record)

Set an **A record** in your domain registrar's DNS settings:

| Type | Name         | Value           |
| ---- | ------------ | --------------- |
| A    | workerserver | `<your_ec2_ip>` |

---

## 🔐 Step 4: Setup NGINX & SSL (Let's Encrypt)

### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Configure Nginx

Edit Nginx default site config:

```bash
sudo nano /etc/nginx/sites-available/default
```

Modify the `server_name` directive:

```nginx
server {
    listen 80;
    server_name workerserver.yourdomain.com;
    ...
}
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Issue SSL Certificate

```bash
sudo certbot --nginx -d workerserver.yourdomain.com
```

Follow the prompts to complete SSL setup.

---

## 🧱 Step 5: Build Your Express App

```bash
mkdir express-app && cd express-app
npm init -y
npm install ws ioredis
```

Add these files:

### `index.js`

> Include your Redis key and WebSocket logic.

### `index.html`

> Include your frontend WebSocket UI and logic (update WSS URL to `wss://workerserver.yourdomain.com`).

---

## 🔁 Step 6: Run with PM2

```bash
sudo npm install -g pm2
sudo pm2 start index.js
```

---

## 🔃 Step 7: NGINX Reverse Proxy for HTTPS & WSS

Update `/etc/nginx/sites-available/default` again:

```nginx
server {
  listen 80;
  server_name workerserver.yourdomain.com;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  listen 443 ssl;
  ssl_certificate /etc/letsencrypt/live/workerserver.yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/workerserver.yourdomain.com/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
  if ($host = workerserver.yourdomain.com) {
    return 301 https://$host$request_uri;
  }

  listen 80;
  server_name workerserver.yourdomain.com;
  return 404;
}
```

Then reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🌐 Step 8: Test the Server

* Navigate to: `https://workerserver.yourdomain.com`
* Open the browser console
* Hit “Generate” in your UI Copy the mail
* Send an email from Gmail or any SMTP client
* Do not refresh the site you will lose the session

---


