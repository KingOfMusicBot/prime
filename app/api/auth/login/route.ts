import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getPublicServerConfig } from "@/lib/publicServerConfig";
import { getHeaders } from "@/utils/auth";

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN!;
const TELEGRAM_CHANNEL_ID = process.env.LOG_CHANNEL_ID!;

async function sendTelegramLog(message: string) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (err: any) {
    console.error("Failed to send Telegram log:", err);
  }
}

function normalizePhoneNumber(phone: string): string {
  phone = phone.trim().replace(/[^\d+]/g, ""); // keep digits and plus only
  if (!phone.startsWith("+")) {
    return "+91" + phone;
  }
  return phone;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: "Phone number is required" },
        { status: 400 }
      );
    }

    let normalizedPhone: string;

    try {
      normalizedPhone = normalizePhoneNumber(phoneNumber);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number format" },
        { status: 400 }
      );
    }

    await dbConnect();
    const config = await getPublicServerConfig();

    // ✅ If direct login is NOT enabled, validate user existence
    if (!config.isDirectLoginOpen) {
      const user = await User.findOne({ phoneNumber: normalizedPhone });
      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found!" },
          { status: 401 }
        );
      }
    }

    // Send OTP request to PenPencil
    const response = await fetch(
      "https://api.penpencil.co/v1/users/get-otp?smsType=0&fallback=true",
      {
        method: "POST",
        headers: getHeaders(""),
        body: JSON.stringify({
          username: phoneNumber,
          countryCode: "+91",
          organizationId: "5eb393ee95fab7468a79d189",
        }),
      }
    );

    if (response.status !== 201) {
      const errorData = await response.json().catch(() => null);

      // Check for specific known error
      if (
        errorData?.error?.message === "User does not exist" &&
        errorData?.errorFrom === "User Microservice"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "This number is not registered on the real PW app.",
          },
          { status: 404 }
        );
      }

      await sendTelegramLog(
        `PenPencil OTP API failed:\nStatus: ${
          response.status
        }\nResponse: ${JSON.stringify(errorData, null, 2)}`
      );

      const errorMessage =
        errorData?.error?.message || "Failed to send OTP L_52";
      const statusCode = errorData?.error?.status || response.status || 500;

      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { success: true, message: "OTP sent successfully" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
