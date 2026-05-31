import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load envs manually before importing dbConnect
const envPath = path.resolve(process.cwd(), ".env");
const envLocalPath = path.resolve(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });

async function checkBatches() {
    try {
        // Dynamic import to ensure envs are loaded first
        const { default: dbConnect } = await import("./lib/mongodb");
        const { default: Batch } = await import("./models/Batch");

        await dbConnect();
        console.log("Connected to Redis via check-tokens.ts");

        const batches = await Batch.find({});
        console.log(`Found ${batches.length} batches.`);

        let validBatches = 0;
        for (const batch of batches) {
            const tokens = batch.enrolledTokens || [];
            console.log(`Batch: ${batch.name} (ID: ${batch.batchId})`);
            console.log(`  - Enrolled Tokens: ${tokens.length}`);
            if (tokens.length > 0) {
                console.log(`  - First Token Owner: ${tokens[0].ownerId}`);
                validBatches++;
            } else {
                console.log(`  - [WARNING] No tokens for this batch! This will cause 'Batch unavailable' error.`);
            }
        }

        if (validBatches === 0 && batches.length > 0) {
            console.log("\nCONCLUSION: No batches have valid tokens. This explains the error.");
        }

    } catch (error) {
        console.error("Error checking batches:", error);
    } finally {
        process.exit();
    }
}

checkBatches();
