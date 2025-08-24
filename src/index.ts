import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const app = express();
app.use(cors());
app.use(express.json());

console.log("🔑 Stripe Key:", process.env.STRIPE_SECRET_KEY); // Solo para debug

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("❌ STRIPE_SECRET_KEY no está definida");
}

app.post("/api/create-checkout-session", async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: "price_1RzcHCGWqmRF2kGUkUuuvhfC", // ID del precio desde el dashboard
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: "https://ikigaipsychology.com/#contact",
            cancel_url: "https://ikigaipsychology.com/#team",
        });

        res.json({ id: session.id });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});
