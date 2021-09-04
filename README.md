# print-from-gmail

Automatically print PDFs sent to a Gmail account.

I have this script running on an old computer connected to a USB printer so I can easily print PDFs from my phone by sending them to a Gmail account.

## Features

* Configure which e-mail addresses are allowed to print.
* Configure which pages to print on the e-mail subject.

## How to install

 `npm install`
 
 # How to setup
 
 1. Follow these [instructions to setup the Gmail account](https://www.fullstacklabs.co/blog/access-mailbox-using-gmail-node).
 1. Download the `credentials.json` file to the project folder.
 1. Add your authorized senders to `senders.txt`.
 1. Run the script and follow the instructions.
 
 ## How to run
 
 `node .`
 
 The script will be checking the Gmail inbox every minute and print to the default printer any PDFs sent from an authorized sender.