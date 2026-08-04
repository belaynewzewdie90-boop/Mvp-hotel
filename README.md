# Hotel Management System

A React.js (Vite) web app providing a QR-based customer ordering experience
plus admin, kitchen, and store dashboards. Data is stored in localStorage and
shared live across tabs.

## Run locally

```sh
cd react-app
npm install
npm run dev        # start dev server
npm run build      # production build (outputs to react-app/dist)
npm run preview    # preview the production build
```

Routes:

- `/` — Customer QR menu, cart, and order tracking
- `/track` — Dedicated order tracker (add `?table=N`)
- `/login` — Staff login (admin/admin123, kitchen/kitchen123)
- `/admin` — Dashboard, menu management, order management, order history
- `/kitchen` — Kitchen board with live order status
- `/store` — Inventory and consumption history

## Features

- Customer QR menu and cart
- Admin menu and order management
- Kitchen order status progression
- Store inventory management
