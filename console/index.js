const WebSocket = require("ws");
const Redis = require("ioredis");
const http = require("http")
const fs = require("fs");
const path = require("path");

const httpServer = http.createServer((req, res) => {
  if (req.url === "/") {
    const filePath = path.join(__dirname, "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end("Error loading index.html");
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  }
});



const subscriber = new Redis(process.env.REDIS_KEY);
const wss = new WebSocket.Server({ server: httpServer });


console.log("✅ WebSocket server running on wss://localhost:8080");

let mailToSocket = {};

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (request) => {
    try {
      let data = JSON.parse(request);
      console.log("Received message:", data);

      if (data.method === "generate:mail") {
        let mail = randomMail();
        
        // Store WebSocket connection mapped to this email
        mailToSocket[mail] = ws;
        
        console.log(`Generated email: ${mail}`);
        console.log(`Current active emails: ${Object.keys(mailToSocket)}`);
        
        let payLoad = {
          method: "generated:mail",
          email: mail,
        };
        ws.send(JSON.stringify(payLoad));
      }
    } catch (error) {
      console.error("Error processing client message:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    // Remove disconnected client's emails from mapping
    for (const [email, socket] of Object.entries(mailToSocket)) {
      if (socket === ws) {
        delete mailToSocket[email];
        console.log(`Removed email: ${email}`);
      }
    }
  });
});

function randomMail() {
  let str = [...Array(8)]
    .map(function () {
      return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
        Math.floor(Math.random() * 62)
      );
    })
    .join("");
  return str + "@mx.novoworm.com";
}

// Subscribe to pattern
subscriber.psubscribe("email:*", (err, count) => {
  if (err) {
    console.error("Failed to subscribe:", err);
    process.exit(1);
  }
  console.log(`Subscribed to pattern: email:*`);
  console.log(`Waiting for incoming emails...`);
});

subscriber.on("pmessage", async (pattern, channel, message) => {
  try {
    const recipientEmail = channel.split(":")[1]; // Extract email from channel name
    console.log(`Received email for: ${recipientEmail}`);

    // Parse the email data
    const emailData = JSON.parse(message);
    
    // Process the email
    processEmail(recipientEmail, emailData);
  } catch (error) {
    console.error("Error processing message:", error);
  }
});

function processEmail(recipientEmail, emailData) {
  console.log(`Processing email for ${recipientEmail}`);
  
  const { from, subject, html } = emailData;
  console.log(html)
  
  // Extract the actual email address without the recipient's name
  const toEmail = recipientEmail;
  
  if (mailToSocket[toEmail]) {
    console.log(`Found WebSocket connection for ${toEmail}, sending email`);
    sendMailToClient(toEmail, from.text, html, subject);
  } else {
    console.log(`No WebSocket connection found for ${toEmail}`);
    console.log(`Available connections: ${Object.keys(mailToSocket)}`);
  }
}

function sendMailToClient(to, from, html, subject) {
  try {
    const socket = mailToSocket[to];
    
    if (!socket) {
      console.error(`No socket found for email: ${to}`);
      return;
    }
    
    // Create the payload with the expected structure
    let payLoad = {
      method: "send:mail",
      data:{
        from: from,
        subject: subject,
        html:html
      }
    };
    
    // Send to client
    socket.send(JSON.stringify(payLoad));
    console.log(`Email sent to client for ${to}`);
  } catch (error) {
    console.error(`Error sending email to client: ${error}`);
  }
}

// Keep the WebSocket server alive
process.on('SIGINT', () => {   // SIGINT --->  Signal Interrupt (when we hit ctrl+c)
  console.log('Closing WebSocket server');
  wss.close();
  subscriber.punsubscribe();
  subscriber.quit();
  process.exit(0);
});

httpServer.listen(8080, () => {
  console.log("🧡 HTTP server serving index.html on http://localhost:8080");
});