import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import fs from "fs";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
const envExamplePath = path.resolve(__dirname, "../../.env.example");

// Automatically ensure a JWT_SECRET is present and secure
const ensureJwtSecret = () => {
    // If already defined in the environment, use it (unless it's the placeholder)
    if (process.env.JWT_SECRET) {
        const val = process.env.JWT_SECRET.trim().replace(/^['"]|['"]$/g, "");
        if (val && val !== "your_jwt_secret_here") {
            return;
        }
    }

    let envContent = "";
    let fileExists = false;

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf8");
        fileExists = true;
    } else if (fs.existsSync(envExamplePath)) {
        envContent = fs.readFileSync(envExamplePath, "utf8");
    }

    const jwtSecretRegex = /^\s*JWT_SECRET\s*=\s*(.*)$/m;
    const match = envContent.match(jwtSecretRegex);

    const generateSecret = () => crypto.randomBytes(32).toString("hex");

    let needsUpdate = false;
    let newSecret = "";

    if (!match) {
        // JWT_SECRET is not in the file at all
        newSecret = generateSecret();
        const suffix = envContent.endsWith("\n") || envContent === "" ? "" : "\n";
        envContent = `${envContent}${suffix}JWT_SECRET=${newSecret}\n`;
        needsUpdate = true;
    } else {
        const rawValue = match[1].trim();
        // Remove quotes if present
        const value = rawValue.replace(/^['"]|['"]$/g, "");
        if (!value || value === "your_jwt_secret_here") {
            newSecret = generateSecret();
            envContent = envContent.replace(jwtSecretRegex, `JWT_SECRET=${newSecret}`);
            needsUpdate = true;
        }
    }

    if (needsUpdate || !fileExists) {
        fs.writeFileSync(envPath, envContent, "utf8");
        if (newSecret) {
            process.env.JWT_SECRET = newSecret;
        }
        console.log(`[Env Setup] Automatically generated secure JWT_SECRET and updated ${envPath}`);
    }
};

// Run ensureJwtSecret before loading dotenv config
ensureJwtSecret();

const result = dotenv.config({ path: envPath });

if (result.error && process.env.NODE_ENV !== "production") {
    console.warn(`Warning: .env file not found at ${envPath}`);
}

const envSchema = z.object({
    PORT: z
        .string()
        .default("3001")
        .transform((val) => parseInt(val, 10)),
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET must be set"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
}

export const config = parsed.data;
