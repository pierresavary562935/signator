Next js project

run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Steps to Run
Build and start the containers:
docker-compose up --build

Apply Prisma migrations:
docker-compose exec app npx prisma migrate deploy

Access your application: Open your browser and navigate to http://localhost:3000.