# Prince Marriage Portal

Create a premium, modern, responsive web application for "Prince Group of Companies" named:

PRINCE GROUP SMART MARRIAGE REGISTRATION PORTAL

Theme:

- Primary Color: Olive Green (#556B2F)

- Secondary Color: Cream (#F8F5E9)

- Accent: Gold (#C8A951)

- Background: Soft Cream

- Cards: White with subtle shadow

- Buttons: Olive Green with Cream text

- Border Radius: 14px

- Premium government-service look

- Elegant typography

- Smooth animations

- Mobile-first responsive design

Overall Style:

A premium legal/documentation portal that builds trust and looks professional. The UI should feel clean, minimal, and luxurious, inspired by Prince Group branding.

-----------------------------------

HOME PAGE

-----------------------------------

Hero Section

Title:

Marriage Registration Made Simple

Subtitle:

Complete your marriage registration process online with expert guidance from Prince Group.

Features:

✔ Trusted Since 2010

✔ 22+ Branches Across Kanyakumari

✔ Secure Registration

✔ Professional Documentation Support

✔ Fast Customer Assistance

Large CTA Button:

Start Registration

Below Hero

Why Choose Prince Group?

• Trusted Documentation Experts

• Transparent Process

• Secure Data Handling

• Professional Support Team

• Easy Online Submission

-----------------------------------

MULTI STEP REGISTRATION

-----------------------------------

Create a progress bar.

Example:

Step 1

Basic Details

↓

Step 2

Payment

↓

Step 3

Marriage Details

↓

Step 4

Document Upload

↓

Step 5

Review & Submit

Each completed step should automatically save data to Supabase.

-----------------------------------

STEP 1

BASIC DETAILS

-----------------------------------

Fields:

Bride Name

Groom Name

Mobile Number

WhatsApp Number

District

Location / City

Checkbox

☐ Mobile Number and WhatsApp Number are the same

Button

Continue

Validation:

All fields mandatory.

-----------------------------------

STEP 2

PAYMENT

-----------------------------------

Registration Fee

₹99

Display:

UPI QR Placeholder

OR

Online Payment Button

Integrate Razorpay later.

Payment Status

Pending

↓

After successful payment

Show

Payment Successful

Continue

Payment receipt should be stored in database.

-----------------------------------

STEP 3

MARRIAGE DETAILS

-----------------------------------

Bride Details

Bride Name

Father Name

Mother Name

Date of Birth

Age (Auto Calculate)

Address

Groom Details

Groom Name

Father Name

Mother Name

Date of Birth

Age (Auto Calculate)

Address

Marriage Type

Dropdown

• Hindu Marriage

• Christian Marriage

• Muslim Marriage

• Special Marriage

If Special Marriage selected

Display

Marriage Category

• Love Marriage

• Inter Caste Marriage

• Inter Religion Marriage

-----------------------------------

STEP 4

DOCUMENT CENTER

-----------------------------------

Premium Document Upload Dashboard

For every required document show:

Document Name

Sample Preview Image

Download Sample PDF Button

Upload Document Button

Documents

Bride Aadhaar

Groom Aadhaar

Bride Birth Certificate

Groom Birth Certificate

Bride Passport Photo

Groom Passport Photo

Address Proof

Marriage Invitation (Optional)

Witness 1 Aadhaar

Witness 2 Aadhaar

Additional Documents

Accepted Files

PDF

JPG

PNG

Maximum Size

10 MB

Display upload status for every document.

Example

✔ Uploaded

Pending

Missing

-----------------------------------

STEP 5

REVIEW & SUBMIT

-----------------------------------

Show complete summary.

Basic Details

Marriage Details

Uploaded Documents

Payment Status

Checkbox

☐ I confirm all information is correct.

Submit Button

-----------------------------------

SUCCESS PAGE

-----------------------------------

Large Success Animation

Title

Registration Submitted Successfully

Message

Thank you for choosing Prince Group.

Our Executive will verify your documents and contact you shortly.

Buttons

Download Acknowledgement

Back to Home

-----------------------------------

ADMIN DASHBOARD

-----------------------------------

Login Protected

Dashboard Cards

Total Registrations

Today's Registrations

Pending Payments

Pending Documents

Completed Cases

Recent Registrations Table

Columns

Registration ID

Bride Name

Groom Name

District

Marriage Type

Payment Status

Document Status

Assigned Staff

Current Status

Actions

View

Edit

Download PDF

Assign Executive

Status Workflow

New

↓

Payment Completed

↓

Documents Uploaded

↓

Verification

↓

Processing

↓

Completed

-----------------------------------

WHATSAPP AUTOMATION

-----------------------------------

After final submission automatically send notification.

Admin WhatsApp

New Marriage Registration

Bride:

Groom:

District:

Marriage Type:

Payment:

Registration ID:

Customer WhatsApp

Thank you for registering with Prince Group.

Your Registration ID:

Our executive will contact you soon.

-----------------------------------

SUPABASE DATABASE

-----------------------------------

Create tables

customers

payments

marriage_details

documents

registration_status

staff

notifications

Store uploaded files securely.

-----------------------------------

EXTRA FEATURES

-----------------------------------

• Save and Continue Later

• Auto-generated Registration ID

• Download Acknowledgement PDF

• Progress Indicator

• Mobile Responsive

• Dark Mode Ready

• Search Registrations

• Filter by District

• Filter by Marriage Type

• Export Excel

• Print Registration Details

• Secure Authentication

• Form Auto Save

• Loading Animations

• Premium Icons

• Elegant Olive Green + Cream UI

• Fast Performance

• Professional Government-Service Design

• SEO Optimized

The final result should feel like a premium digital documentation portal with a trustworthy, elegant, and luxurious Olive Green and Cream theme that perfectly represents Prince Group of Companies.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://prince-marry-bright.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6c0d030c-7186-4d87-853f-65229a6135d9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
