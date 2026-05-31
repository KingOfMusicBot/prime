import { NextRequest, NextResponse } from "next/server";
import { getHeaders } from "@/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;
    const smsType = request.nextUrl.searchParams.get("smsType") || "0";

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: "Missing phone number" },
        { status: 400 }
      );
    }

    const apiRes = await fetch(
      `https://api.penpencil.co/v1/users/resend-otp?smsType=${smsType}`,
      {
        method: "POST",
        headers: getHeaders(""),
        body: JSON.stringify({
          mobile: phoneNumber,
          organizationId: "5eb393ee95fab7468a79d189",
        }),
      }
    );

    const data = await apiRes.json();

    if (apiRes.status === 400) {
      return NextResponse.json(
        {
          success: false,
          tryAgain: true,
          message: data?.message || "Please Enter Your Number Again!.",
        },
        { status: 400 }
      );
    }

    if (!apiRes.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: "Failed to resend OTP" },
        { status: apiRes.status }
      );
    }

    return NextResponse.json(
      { success: true, dataFrom: data.dataFrom || "XMX_ER _API" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
