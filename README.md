This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# pj_babas

## Editor Python

La herramienta `/model3d` incluye un editor Python multilínea (importación y conexión ya preparadas, código totalmente editable) con un botón **Ejecutar**. Ejecuta un subconjunto de `pymycobot` en un servicio Python local y los ángulos resultantes mueven el modelo 3D.

La secuencia y el editor comparten el mismo panel lateral derecho y se muestran por pestañas: **Secuencia** o **Código Python**. Solo una de las dos herramientas está visible a la vez. El botón **Expandir** del panel lo amplía para trabajar cómodamente con el código; el editor pasa a dos columnas y **Reducir** lo devuelve a su ancho habitual.

El botón **Pasar secuencia a código Python** convierte los pasos definidos a mano, incluidas las pausas, cambia a la pestaña del editor y carga el código para revisarlo o modificarlo antes de ejecutarlo. El resultado aparece en el panel lateral del editor y reproduce en el visor todos los movimientos y pausas, no solo la posición final.

Arranca el servicio y Next.js en terminales separadas:

```bash
npm run python:dev
npm run dev
```

Configuración y contrato: [python/README.md](python/README.md).

