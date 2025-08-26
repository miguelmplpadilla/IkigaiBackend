import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";
import { Resend } from 'resend';
import bodyParser from "body-parser";

dotenv.config();

const app = express();
app.use(cors());

// 👇 Este middleware evita que express.json() se aplique al webhook
app.use((req, res, next) => {
    if (req.originalUrl === "/webhook") {
        next(); // salta express.json()
    } else {
        express.json()(req, res, next); // aplica JSON solo si no es el webhook
    }
});

// Verifica que la clave de Stripe esté definida
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    throw new Error("❌ STRIPE_SECRET_KEY no está definida en .env o en Render");
}

// Inicializa Stripe
const stripe = new Stripe(stripeSecretKey);

// Ruta base
app.get("/", (req, res) => {
    res.send("✅ Backend de Ikigai Psychology activo");
});

// Crear sesión de pago (NO TOCADA)
app.post("/api/create-checkout-session", async (req, res) => {
    try {
        const { price, success_url, cancel_url } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: price,
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: success_url,
            cancel_url: cancel_url,
        });

        res.json({ id: session.id });
    } catch (err: any) {
        console.error("❌ Error en /create-checkout-session:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// ✅ Webhook Stripe con body crudo
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = 'whsec_gcXNZHIkjaMbnEzYDY3oBsuCoVcLYFuK'; // ⚠️ Reemplaza si cambias de entorno

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } catch (err: any) {
        console.error('❌ Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('✅ Pago completado:', session.id);

        await SendConfirmationEmail();
    }

    res.status(200).send('ok');
});

// Puerto para Render u otros entornos
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend escuchando en puerto ${PORT}`);
});

const resend = new Resend('re_j4EWE2zR_6NvFsGzR6Rx4pEAUbUjbZwy9');

async function SendConfirmationEmail() {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Ikigai Psychology <onboarding@resend.dev>', // Usa tu dominio si ya lo verificaste
            to: ['psychologyikigai@gmail.com'], // Cambia esto al correo del cliente real
            subject: 'Gracias por tu compra 🧾',
            html: `
                <h1>Hola Cliente 👋</h1>
                <p>Gracias por tu compra en Ikigai Psychology.</p>
                <p>Estamos felices de tenerte con nosotros.</p>
            `,
        });

        if (error) {
            console.error('❌ Error al enviar correo con Resend:', error);
        } else {
            console.log('📧 Correo enviado con éxito:', data);
        }
    } catch (err) {
        console.error('❌ Error inesperado:', err);
    }
}

