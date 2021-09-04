const fs = require('fs');
const ptp = require("pdf-to-printer");
const auth = require("./auth");
const {google} = require('googleapis');

const STORAGE_FILE = "storage.json";
const ATTACHMENT_FILE = "attachment.pdf";

const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const senders = fs.readFileSync('senders.txt', "utf-8").replace(/[,;]?\s+/, " ").split(" ");

console.log("Allowed senders (senders.txt):", senders);

const run = async auth => {
    const getMessageIds = async () => ((await gmail.users.messages.list({userId: 'me', includeSpamTrash: false})).data.messages || []).map(m => m.id);
    const getMessage = async messageId => (await gmail.users.messages.get({userId: 'me', id: messageId})).data;
    const getAttachmentIds = message => message.payload.parts.filter(part => /\.pdf/i.test(part.filename)).map(part => part.body.attachmentId);
    const getAttachmentData = async (messageId, attachmentId) => (await gmail.users.messages.attachments.get({userId: 'me', messageId: messageId, id: attachmentId})).data.data;
    const getSender = message => getHeader(message, "from").replace(/^.*<(.+?)>.*$/, "$1");
    const getSubject = message => getHeader(message, "subject");
    const getHeader = (message, headerName) => {
        for (const header of message.payload.headers) {
            if (header.name.toUpperCase() == headerName.toUpperCase()) {
                return header.value;
            }
        }
    };
    const saveAttachment = data => fs.writeFileSync(ATTACHMENT_FILE, data, "base64");
    const printAttachment = options => ptp.print(ATTACHMENT_FILE, options);

    const storage = fs.existsSync(STORAGE_FILE) ? JSON.parse(fs.readFileSync(STORAGE_FILE)) : {};
    if (!storage.messages) storage.messages = {};
    console.log("Storage:", storage);
    
    const gmail = google.gmail({version: 'v1', auth});

    // retrieve messages
    console.log("Retrieving messages...");
    const messageIds = await getMessageIds();
    console.log("Messages:", messageIds);
    
    for (const messageId of messageIds) {
        const message = await getMessage(messageId);
        // console.log(`Message ${messageId}:`, message);
        
        // ignore messages that were already processed
        if (storage.messages[messageId]) {
            console.log(`Message ${messageId} already processed.`);
            continue;
        }

        // save message so it won't be processed again
        storage.messages[messageId] = {processedDate: Date.now()};

        const sender = getSender(message);
        console.log("Sender:", sender);

        const subject = getSubject(message);
        console.log("Subject:", subject);
        
        // only process messages from allowed senders
        if (!senders.includes(sender)) {
            console.log(`Message ${messageId} is not from an allowed sender.`);
            continue;
        }
        
        // get attachments
        const attachmentsIds = getAttachmentIds(message);
        for (const attachmentId of attachmentsIds) {
            const attachmentData = await getAttachmentData(messageId, attachmentId);
            console.log("Saving attachment...");
            saveAttachment(attachmentData);
            const options = /^\d+(-\d+)?(,\d+(-\d+)?)*$/.test(subject) ? {win32: [`-print-settings "${subject}"`]} : {};
            console.log("Printing options:", options);
            console.log("Printing...");
            await printAttachment(options);
        }
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage));
    
    setTimeout(authorizeAndRun, 60000);
    
    // console.log("Printers:", await ptp.getPrinters());
};

const authorizeAndRun = () => auth.authorize(credentials, run);

authorizeAndRun();
