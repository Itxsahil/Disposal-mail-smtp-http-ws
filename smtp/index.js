const Redis = require("ioredis");
const SMTPServer = require("smtp-server").SMTPServer;
const simpleParser = require("mailparser").simpleParser;




const publisher = new Redis(process.env.REDIS_KEY);

const server = new SMTPServer({
  allowInsecureAuth: true,
  authOptional: true,
  onConnect(session, callback) {
    return callback(); // Accept the connection
  },

  onMailFrom(address, session, callback) {
  
    return callback();
  },

  onRcptTo(address, session, callback) {
    
    return callback();
  },

  onData(stream, session, callback) {
  

    let mailData = "";

    stream.on("data", (chunk) => {
        mailData += chunk.toString(); // Collect chunks of data
    });

    stream.on("end", async () => {
      const parsed_mail = await simpleParser(mailData)
      let receverMail = session.envelope.rcptTo[0].address;
      publishToRedis(receverMail, parsed_mail);
      callback(); 
    });

    stream.on("error", (err) => {
      console.error("Error reading stream:", err);
      callback(err); // Signal an error occurred
    });
  },
});

server.listen(25, () => {
  console.log(`SMTP server is running on port 25`);
});


async function publishToRedis(key, mail) {
  try {
    // Create a channel name based on the receiver's email
    const channel = `email:${key}`;
    
    // Prepare the mail data for publishing
    // We need to convert it to a string for Redis
    const mailData = JSON.stringify({
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: mail.attachments,
      date: mail.date,
      messageId: mail.messageId,
      headers: mail.headers
    });
    
    // Publish to Redis using the pattern mechanism
    await publisher.publish(channel, mailData);
    
    console.log(`Published email to ${channel}, received by subscribers`);
  } catch (error) {
    console.error("Error publishing to Redis:", error);
    throw error;
  }
}