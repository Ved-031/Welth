# 💸 Welth – AI-Powered Finance Management Platform

**Welth** is an intelligent personal finance management platform that helps users track, analyze, and optimize their spending using AI. From receipt scanning to personalized monthly insights, Welth makes managing your finances smarter and simpler.

---

![Website Preview](/ss.png)

## 🚀 Features

- 📊 **Dashboard & Analytics** – Visualize spending trends with interactive charts
- 🧾 **Receipt Scanning** – Scan physical receipts using AI (powered by Google Gemini)
- 🤖 **Expense Insights** – Generate monthly financial insights using LLMs
- 🔐 **Authentication & Security** – Auth via Clerk with Arcjet protection
- ⚙️ **Event-Driven Workflows** – Background jobs and async processing with Inngest
- 🧠 **AI Integration** – Powered by Google Gemini for NLP and vision-based tasks

---

## 🛠️ Tech Stack

| Technology       | Purpose                                      |
|------------------|----------------------------------------------|
| **Next.js**      | App framework for frontend & backend         |
| **Tailwind CSS** | Utility-first CSS framework for styling      |
| **Shadcn**       | Modern and accessible UI components          |
| **Prisma**       | ORM for type-safe database access            |
| **Supabase**     | Postgres database and file storage           |
| **Clerk**        | Authentication and user management           |
| **Arcjet**       | Rate-limiting and security layer             |
| **Recharts**     | Elegant and responsive data visualizations   |
| **Inngest**      | Serverless workflows and background jobs     |
| **Bun**          | Fast JavaScript runtime and bundler          |
| **Google Gemini API** | AI-powered features like receipt scanning & insights |

---

## 📦 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/welth.git
cd welth
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set up environment variables

Create a .env.local file and configure the following:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
DATABASE_URL=
DIRECT_URL=
RESEND_API_KEY=
GEMINI_API_KEY=
ARCJET_KEY=
```

### 4. Run the development server

```bash
bun run dev
```
Open http://localhost:3000 in your browser.

---

## 🧠 AI Capabilities

- **Receipt OCR & Parsing** – Upload a picture of your receipt, and Welth will extract the data.
- **Financial Insight Generator** – Personalized monthly summaries using LLMs.

---

## 🛡️ Security

- Authentication managed by Clerk
- API and route protection via Arcjet
- Sensitive actions are protected via middleware and rate-limiting

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to change.

---

## 📄 License

MIT License © 2025 Ved Tellawar

