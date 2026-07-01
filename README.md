# Invoice & Estimate Automation

## A full stack application that automates invoice and estimate generation, tracks payment status, streamlines PDF storage, and handles automated email delivery and tracking.
---
## The Issue

There has been a lot of friction between my dad and the existing tools my siblings set up. We have repeatedly redone the Google Sheet, redone the storage of PDFs and Google Docs, and completely rebuilt the PDF structure for invoices and estimates. Over the years, this has led to constant bickering and to invoices and estimates not being tracked properly.

It has gotten so bad that one of my dad's clients has 11 missing invoice payments over the course of two years, amounting to more than ~$15,000 in unpaid invoices.

## Current Workflow

Below is my dad's current workflow for creating an invoice (creating estimates is similar):

1. Open up the Google Sheet that stores all invoices and estimates.
2. Create a new entry for the invoice, filling out:
   1. Current date
   2. Work date
   3. Due date for invoice
   4. Invoice number
   5. Payment status (PENDING)
   6. Estimate reference (optional)
   7. Property number (optional)
   8. Project description (optional)
   9. Desired client
   10. Cost to client
   11. Any labor, equipment, and material expenses (optional)
3. Make a Google Doc copy for the desired client.
4. Fill out and replace the copy:
   1. Date
   2. Description
   3. Payment amount
5. Export as PDF.
6. Open Gmail and create a new email to send:
   1. Fill out the client email
   2. Set up the subject for the client
   3. Fill out the invoice number(s)
   4. Set up the template
   5. Paste in the downloaded PDFs
7. Send the email.
8. Stay in the loop and track the payment when it comes through.

## Bottlenecks

This workflow is very prone to errors, especially when I am not home in Austin. It leads to my siblings not filling things in or forgetting entirely, missing payment status updates, losing track of which invoices have been paid, and leaving fields blank or incomplete.

On top of that, we have been paying $1.99 per month, roughly $24 per year, just to store the Google Docs and PDFs, plus the cost of the missing payments themselves.

## Solution

I built a streamlined agentic pipeline that creates, sends, and stores invoices and estimates end to end, while keeping full manual CRUD control for whoever's driving. Instead of stitching together a spreadsheet, Google Docs, and Gmail by hand, my dad describes the job and the agent handles the entire flow: pulling the right client, generating the PDF, logging the entry, sending the email, and tracking payment status.

## Features

- Automated pipeline that generates, sends, and stores invoices and estimates in one pass
- Full manual CRUD so any entry can be edited or corrected after the fact
- Payment status tracking so you always know what has been paid and what is still open
- One click PDF generation from a consistent template
- Automated email delivery with the right PDFs attached
- Version history and backups for every invoice and estimate
- Centralized storage instead of scattered Google Docs and PDFs

## Tech Stack

- **UI:** Next.js, the client my dad and siblings use to create and manage entries
- **Backend:** Spring Boot, handles the API, business logic, and CRUD operations
- **Agent:** LangGraph / LangChain, runs the pipeline that generates, sends, and logs each invoice or estimate
- **Storage:** Cloudflare R2, holds the generated PDFs and version history
- **Payment Log:** Stripe, tracks payment status and reconciles what has come through

## Agentic Workflow

![Agent Flow](Agentic%20Flow.png)

