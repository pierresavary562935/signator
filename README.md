# Signator

Signator is a Next.js application that enables secure document signing with PDF handling capabilities. Built with Next.js, Prisma, and shadcn UI, it provides a modern, responsive interface for document management and digital signatures.

## Features

- **Document Management**: Upload, view, delete and prepare PDF by placing fields documents
- **Digital Signatures**: Sign documents with typed name & signatures
- **Signing Requests**: Send documents to others for signatures
- **Document Summary**: AI-powered document summarization
- **User Authentication**: Secure login with multiple authentication options
- **Role-Based Access**: User and admin roles with appropriate permissions

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn UI (based on Radix UI)
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js 5
- **PDF Processing**: pdf-lib, pdf-parse
- **Containerization**: Docker, Docker Compose

## Getting Started

### Development Environment

1. Clone the repository:

```bash
git clone https://github.com/yourusername/signator.git
cd signator
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Configure environment variables by creating a `.env.local` file based on `.env.example`.

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

### Using Docker

1. Build and start the containers:

```bash
docker-compose up --build
```

2. Apply Prisma migrations:

```bash
docker-compose exec app npx prisma migrate deploy
```

3. Access the application at [http://localhost:3000](http://localhost:3000).

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [shadcn UI](https://ui.shadcn.com/)
- [NextAuth.js](https://next-auth.js.org/)
- [pdf-lib](https://pdf-lib.js.org/)