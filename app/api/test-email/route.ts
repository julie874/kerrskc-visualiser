import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.ENQUIRY_FROM_EMAIL || "enquiries@kerrskc.com.au";
    const bccEmail = process.env.ENQUIRY_BCC_EMAIL || "enquiries@kerrskc.com.au";
    const defaultTo = process.env.TEST_EMAIL_TO || process.env.ENQUIRY_TO_EMAIL || "";

    if (!resendApiKey) {
      return NextResponse.json({ error: "Resend API key missing." }, { status: 500 });
    }

    const url = new URL(req.url);
    const to = (url.searchParams.get("to") || defaultTo).trim();

    if (!to) {
      return NextResponse.json(
        {
          error:
            "No recipient specified. Provide ?to=you@example.com or set TEST_EMAIL_TO / ENQUIRY_TO_EMAIL in environment."
        },
        { status: 400 }
      );
    }

    const resend = new Resend(resendApiKey);

    const html = `
      <h1>Test email from Kerr's Kitchens & Cabinets</h1>
      <p>This is a test of the welcome email system. If you received this, the Resend integration is working.</p>
    `;

    const text = `This is a test of the welcome email system from Kerr's Kitchens & Cabinets.`;

    const response = await resend.emails.send({
      from: fromEmail,
      to,
      bcc: [bccEmail],
      subject: "Test — Kerr's Kitchens & Cabinets email",
      html,
      text
    });

    return NextResponse.json({ 
      success: true, 
      response,
      keyPreview: resendApiKey?.substring(0, 10)
    });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({ error: "Could not send test email." }, { status: 500 });
  }
}