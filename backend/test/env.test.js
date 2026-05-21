import assert from "assert";
import test from "node:test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");
const envBackupPath = path.resolve(__dirname, "../.env.test-backup");

// Helper to back up and restore env
const backupEnv = () => {
    if (fs.existsSync(envPath)) {
        fs.copyFileSync(envPath, envBackupPath);
    }
};

const restoreEnv = () => {
    if (fs.existsSync(envBackupPath)) {
        fs.copyFileSync(envBackupPath, envPath);
        if (fs.existsSync(envBackupPath)) {
            fs.unlinkSync(envBackupPath);
        }
    } else if (fs.existsSync(envPath)) {
        fs.unlinkSync(envPath);
    }
};

test.describe("env.js automatic secret generation", () => {
    test.beforeEach(() => {
        backupEnv();
        // Clear process.env.JWT_SECRET
        delete process.env.JWT_SECRET;
    });

    test.afterEach(() => {
        restoreEnv();
    });

    test("should generate new .env file with JWT_SECRET if it does not exist", async () => {
        if (fs.existsSync(envPath)) {
            fs.unlinkSync(envPath);
        }

        // Import env.js dynamically with cache buster
        const modulePath = `../src/config/env.js?t=${Date.now()}`;
        await import(modulePath);

        assert.ok(fs.existsSync(envPath), ".env file was not created");
        const envContent = fs.readFileSync(envPath, "utf8");
        assert.ok(envContent.includes("JWT_SECRET="), "JWT_SECRET was not added to .env");
        assert.ok(process.env.JWT_SECRET, "JWT_SECRET was not loaded in process.env");
        assert.notStrictEqual(process.env.JWT_SECRET, "your_jwt_secret_here");
    });

    test("should replace placeholder JWT_SECRET value with a generated key", async () => {
        // Write .env with placeholder
        fs.writeFileSync(envPath, "PORT=3001\nJWT_SECRET=your_jwt_secret_here\n", "utf8");

        const modulePath = `../src/config/env.js?t=${Date.now()}`;
        await import(modulePath);

        assert.ok(fs.existsSync(envPath), ".env file should exist");
        const envContent = fs.readFileSync(envPath, "utf8");
        assert.ok(!envContent.includes("JWT_SECRET=your_jwt_secret_here"), "Placeholder was not replaced");
        assert.ok(envContent.includes("JWT_SECRET="), "JWT_SECRET key should exist in .env");
        assert.ok(process.env.JWT_SECRET, "JWT_SECRET was not loaded in process.env");
        assert.notStrictEqual(process.env.JWT_SECRET, "your_jwt_secret_here");
    });

    test("should keep existing valid JWT_SECRET value", async () => {
        const expectedSecret = "pre_existing_custom_secure_key_123456";
        fs.writeFileSync(envPath, `PORT=3001\nJWT_SECRET=${expectedSecret}\n`, "utf8");

        const modulePath = `../src/config/env.js?t=${Date.now()}`;
        await import(modulePath);

        const envContent = fs.readFileSync(envPath, "utf8");
        assert.ok(envContent.includes(`JWT_SECRET=${expectedSecret}`), "Existing valid key was incorrectly replaced");
        assert.strictEqual(process.env.JWT_SECRET, expectedSecret, "Correct key should be loaded in process.env");
    });
});
