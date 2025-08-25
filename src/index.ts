import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";

// Cargar variables de entorno
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
