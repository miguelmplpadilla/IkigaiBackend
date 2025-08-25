import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";
import axios from "axios";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Verifica que la clave de Stripe esté definida
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    throw new Error("❌ STRIPE_SECRET_KEY no está definida en .env o en Render");
}

// Inicializa Stripe
const stripe = new Stripe(stripeSecretKey);

// Ruta base para probar que el backend esté corriendo
app.get("/", (req, res) => {
    res.send("✅ Backend de Ikigai Psychology activo");
});

// Ruta para crear la sesión de pago
app.post("/api/create-checkout-session", async (req, res) => {
    try {
        const { price, success_url, cancel_url } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: price, // Reemplaza por el ID real de tu producto en Stripe
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: success_url,
            cancel_url: cancel_url,
        });

        if (session.url === success_url) {
            await SendConfirmationEmail();
        }

        res.json({ id: session.id });
    } catch (err: any) {
        console.error("❌ Error en /create-checkout-session:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// Configura el puerto correctamente para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend escuchando en puerto ${PORT}`);
});

const serviceID = 'service_j9zpngi';
const templateID = 'template_fmhzfx4';
const userID = 'pSQpDE6EkrRZeTkvj'; // (user_id de EmailJS)

async function SendConfirmationEmail() {
    const templateParams = {
        from_name: 'Miguel',
        to_name: 'Cliente',
        message: 'Gracias por tu compra. Aquí tienes los detalles del pedido.',
        reply_to: 'miguelpadillal@hotmail.es'
    };

    try {
        const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
            service_id: serviceID,
            template_id: templateID,
            user_id: userID,
            template_params: templateParams
        });

        console.log('Correo enviado con éxito:', response.data);
    } catch (error: any) {
        console.error('Error al enviar el correo:', error.response?.data || error.message);
    }
}