
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load envs manually before importing models
const envPath = path.resolve(process.cwd(), ".env");
const envLocalPath = path.resolve(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });

async function fixBatch() {
    try {
        const { default: dbConnect } = await import("./lib/mongodb");
        const { default: Batch } = await import("./models/Batch");
        const { default: User } = await import("./models/User");

        await dbConnect();
        console.log("Connected to Redis.");

        // Configuration - Change these if needed
        const PHONE_NUMBER = "7678664945"; // From your screenshot
        const BATCH_ID = "678a0324dab28c8848cc026f"; // From your screenshot

        // 1. Find User
        const user = await User.findOne({ phoneNumber: "+91" + PHONE_NUMBER });
        // Note: Assuming normalized format. If not found, try without +91.

        if (!user) {
            // Try without +91 if not found
            const userRaw = await User.findOne({ phoneNumber: PHONE_NUMBER });
            if (!userRaw) {
                console.error(`User with phone ${PHONE_NUMBER} not found! Please log in first.`);
                process.exit(1);
            }
        }

        const targetUser = user || await User.findOne({ phoneNumber: PHONE_NUMBER });
        console.log(`Found user: ${targetUser.phoneNumber}`);

        if (!targetUser.ActualToken) {
            console.error("User checks out but has no ActualToken. Please log in again to refresh your token.");
            process.exit(1);
        }

        // 2. Find Batch
        const batches = await Batch.find({}, { batchId: 1, batchName: 1, name: 1 });
        console.log(`\nFound ${batches.length} batches in DB.`);

        // Interactive selection
        const readline = (await import("readline")).createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("\nAvailable Batches:");
        batches.forEach((b: any, index: number) => {
            console.log(`[${index + 1}] ${b.batchName || b.name} (ID: ${b.batchId})`);
        });

        const answer = await new Promise<string>(resolve => {
            readline.question("\nEnter the NUMBER of the batch to fix (or paste an ID): ", resolve);
        });
        readline.close();

        let batch;
        const selectedIndex = parseInt(answer) - 1;

        if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < batches.length) {
            batch = batches[selectedIndex];
        } else {
            // Try as ID
            const targetId = answer.trim();
            batch = batches.find((b: any) => b.batchId === targetId);
            if (!batch) {
                // Try findOne as last resort if not in list (unlikely)
                batch = await Batch.findOne({ batchId: targetId });
            }
        }

        if (!batch) {
            console.error("Invalid selection or batch not found!");
            process.exit(1);
        }

        // Fetch full batch object to ensure we have methods/fields
        batch = await Batch.findOne({ batchId: batch.batchId });
        console.log(`\nSelected Batch: ${batch.batchName}`);

        // 3. Add Token
        const newToken = {
            ownerId: targetUser._id,
            accessToken: targetUser.ActualToken,
            refreshToken: targetUser.ActualRefresh || "dummy_refresh",
            tokenStatus: true,
            updatedAt: new Date(),
            randomId: "manual_fix_" + Date.now()
        };

        // Remove existing token for this user if exists
        batch.enrolledTokens = batch.enrolledTokens.filter((t: any) => t.ownerId.toString() !== targetUser._id.toString());

        // Add new token
        batch.enrolledTokens.push(newToken);
        await batch.save();

        console.log("\nSUCCESS! Token added to batch.");
        console.log("You should now be able to play the video.");

    } catch (error) {
        console.error("Error fixing batch:", error);
    } finally {
        process.exit();
    }
}

fixBatch();
