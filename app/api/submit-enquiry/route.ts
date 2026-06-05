import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(req: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.ENQUIRY_TO_EMAIL;
    const fromEmail = process.env.ENQUIRY_FROM_EMAIL;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Resend API key missing." },
        { status: 500 }
      );
    }

    if (!toEmail || !fromEmail) {
      return NextResponse.json(
        { error: "Email configuration missing." },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const payload = await req.json();

    const customer = payload.customer_details || {};
    const project = payload.project_details || {};
    const selectedConceptUrl = payload.selected_concept_id || "";
    const uploadedImageUrl = payload.uploaded_image_url || "";
    const generatedConcepts: string[] = payload.generated_concept_ids || [];

    const subject = `New AI Cabinetry Visualiser Enquiry - ${
      project.room_type || "Cabinetry"
    } - ${project.selected_style || "Style selected"}`;

    const html = `
      <h2>New AI Cabinetry Visualiser Enquiry</h2>

      <h3>Customer Details</h3>
      <p><strong>Name:</strong> ${escapeHtml(customer.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(customer.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(customer.phone || "Not provided")}</p>
      <p><strong>Postcode:</strong> ${escapeHtml(customer.postcode)}</p>

      <h3>Project Details</h3>
      <p><strong>Room Type:</strong> ${escapeHtml(project.room_type)}</p>
      <p><strong>Selected Style:</strong> ${escapeHtml(project.selected_style)}</p>
      <p><strong>Custom Style:</strong> ${escapeHtml(project.custom_style || "None")}</p>
      <p><strong>Selected Finishes:</strong> ${escapeHtml((project.selected_finishes || []).join(", "))}</p>
      <p><strong>Layout Preferences:</strong> ${escapeHtml((project.layout_preferences || []).join(", "))}</p>
      <p><strong>Budget Range:</strong> ${escapeHtml(project.budget_range)}</p>
      <p><strong>Installation Expectation:</strong> ${escapeHtml(project.installation_expectation)}</p>

      <h3>Optional Measurements / Notes</h3>
      <p>${escapeHtml(project.optional_measurements_and_notes || "None provided")}</p>

      <h3>Customer Notes</h3>
      <p>${escapeHtml(customer.notes || "None provided")}</p>

      <h3>Images</h3>

      <p><strong>Original Uploaded Image:</strong><br />
      <a href="${escapeHtml(uploadedImageUrl)}">${escapeHtml(uploadedImageUrl)}</a></p>

      <p><strong>Selected Favourite Concept:</strong><br />
      <a href="${escapeHtml(selectedConceptUrl)}">${escapeHtml(selectedConceptUrl)}</a></p>

      <p><strong>All Generated Concepts:</strong></p>
      <ul>
        ${generatedConcepts
          .map((url) => `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`)
          .join("")}
      </ul>

      <h3>Storage Policy</h3>
      <p>Uploaded and generated images are retained for up to 90 days.</p>

      <h3>Structured JSON</h3>
      <pre style="white-space: pre-wrap; background:#f3f3f3; padding:16px; border-radius:8px;">${escapeHtml(
        JSON.stringify(payload, null, 2)
      )}</pre>
    `;

    console.log("Sending enquiry email to", toEmail, "from", fromEmail);

    // 1. Send enquiry to internal team
    const sendResponse = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject,
      html
    });

    // 2. Forward to ServiceM8
    await resend.emails.send({
      from: fromEmail,
      to: "d7e649@inbox.servicem8.com",
      subject,
      html
    });

    // 3. Send concept confirmation to customer
    await resend.emails.send({
      from: fromEmail,
      to: customer.email,
      subject: "Your Kerr's Kitchens & Cabinets concept is ready",
      html: `
        <h1>Your cabinetry concept</h1>
        <p>Hi ${escapeHtml(customer.name)},</p>
        <p>Thanks for submitting your enquiry. Here's a summary of what you put together, along with your selected concept.</p>

        <h2>Your selected concept</h2>
        <img src="${escapeHtml(selectedConceptUrl)}" alt="Your selected cabinetry concept" style="max-width:100%; border-radius:8px;" />
        <p><a href="${escapeHtml(selectedConceptUrl)}">View or download your concept</a></p>

        <h2>Your project details</h2>
        <p><strong>Room type:</strong> ${escapeHtml(project.room_type)}</p>
        <p><strong>Style:</strong> ${escapeHtml(project.selected_style)}${project.custom_style ? ` — ${escapeHtml(project.custom_style)}` : ""}</p>
        <p><strong>Finishes:</strong> ${escapeHtml((project.selected_finishes || []).join(", ") || "None selected")}</p>
        <p><strong>Layout:</strong> ${escapeHtml((project.layout_preferences || []).join(", ") || "None selected")}</p>
        <p><strong>Budget range:</strong> ${escapeHtml(project.budget_range)}</p>
        <p><strong>Installation timeframe:</strong> ${escapeHtml(project.installation_expectation)}</p>

        <h2>What happens next?</h2>
        <p>Kate or Julie will be in touch soon to talk through your project — no pressure, no obligation.</p>
        <p>If you have any questions in the meantime, reply to this email and we'll get back to you shortly.</p>

        <p>Warm regards,<br />The Kerr's Kitchens & Cabinets team</p>
      `
    });

    console.log("Resend send response:", sendResponse);

    if (process.env.RESEND_DEBUG === "true") {
      return NextResponse.json({ success: true, resendResponse: sendResponse });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit enquiry error:", error);

    return NextResponse.json(
      { error: "Could not submit enquiry." },
      { status: 500 }
    );
  }
}