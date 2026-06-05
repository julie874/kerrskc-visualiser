import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { put } from "@vercel/blob";
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
    const openAiApiKey = process.env.OPENAI_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY || "";
    const fromEmail = process.env.ENQUIRY_FROM_EMAIL || "enquiries@kerrskc.com.au";
    const bccEmail = process.env.ENQUIRY_BCC_EMAIL || "enquiries@kerrskc.com.au";

    if (!openAiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key missing." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: openAiApiKey
    });
    const formData = await req.formData();

    const photo = formData.get("photo") as File | null;
    const roomType = String(formData.get("roomType") || "");
    const selectedStyle = String(formData.get("selectedStyle") || "");
    const customStyle = String(formData.get("customStyle") || "");

    const selectedFinishes = JSON.parse(
      String(formData.get("selectedFinishes") || "[]")
    );

    const selectedLayouts = JSON.parse(
      String(formData.get("selectedLayouts") || "[]")
    );

    const optionalDetails = String(formData.get("optionalDetails") || "");
    const gateEmail = String(formData.get("gateEmail") || "").trim();
    const gateName = String(formData.get("gateName") || "").trim();

    if (gateEmail) {
      if (!resendApiKey) {
        return NextResponse.json(
          { error: "Resend API key missing. Cannot send welcome email." },
          { status: 500 }
        );
      }

      const resend = new Resend(resendApiKey);
      const welcomePackUrl =
        "https://drive.google.com/file/d/1qnKctaYYlBJa69zLamj7nBrDp6DnbzQC/view?usp=drive_link";
      const welcomeHtml = `
        <h1>Welcome to Kerr's Kitchens & Cabinets</h1>
        <p>Hi ${gateName ? escapeHtml(gateName) : "there"},</p>
        <p>You've made the first step to designing your new space. Click the link below to view information on Getting Started with Kerr's Kitchens and Cabinets.</p>
        <p>Thanks for taking the next step with us. Your personalised cabinetry concept is on its way.</p>
        <p>
          In the meantime, please download our welcome pack here:
          <br />
          <a href="${escapeHtml(welcomePackUrl)}" target="_blank" rel="noreferrer noopener">
            Download the Kerr's Kitchens & Cabinets Welcome Pack
          </a>
        </p>
        <p>If you have any questions, reply to this email and we'll get back to you shortly.</p>
        <p>Warm regards,<br />The Kerr's Kitchens & Cabinets team</p>
      `;
        const welcomeText = `${gateName ? gateName : "there"},\n\nYou've made the first step to designing your new space. View our Getting Started information here:\n\n${welcomePackUrl}\n\nThanks for taking the next step with us. Your personalised cabinetry concept is on its way.\n\nWarm regards,\nKerr's Kitchens & Cabinets`;

      await resend.emails.send({
        from: fromEmail,
        to: gateEmail,
        bcc: [bccEmail],
        subject: "Thank you for starting your design & Welcome Pack",
        html: welcomeHtml,
        text: welcomeText
      });
    }

    if (!photo) {
      return NextResponse.json(
        { error: "No photo uploaded." },
        { status: 400 }
      );
    }

    if (!["image/jpeg", "image/png"].includes(photo.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a JPEG or PNG image." },
        { status: 400 }
      );
    }

    const uploadedImageId = `upload_${crypto.randomUUID()}`;
    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName = photo.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    const uploadedBlob = await put(
      `uploads/${Date.now()}-${uploadedImageId}-${safeName}`,
      buffer,
      {
        access: "public",
        contentType: photo.type
      }
    );

    const imageBase64 = buffer.toString("base64");

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
Analyse this uploaded ${roomType} photo for cabinetry visualisation.

Return a short customer-friendly explanation covering:
- visible room layout
- approximate cabinetry orientation
- what should be preserved
- how the selected style and finishes should be applied

Selected style: ${selectedStyle}
Custom style notes: ${customStyle || "None"}
Selected finishes: ${selectedFinishes.join(", ") || "None"}
Layout preferences: ${selectedLayouts.join(", ") || "None"}
Optional project notes: ${optionalDetails || "None"}

Important:
Do not claim exact measurements.
Do not overpromise structural changes.
Mention that the generated concepts keep the approximate existing room layout recognisable.
              `
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${photo.type};base64,${imageBase64}`
              }
            }
          ]
        }
      ]
    });

    const analysisText =
      analysisResponse.choices[0]?.message?.content ||
      "The AI will keep the approximate room layout recognisable while applying the selected cabinetry style and finishes.";

    const generationPrompt = `
Transform this uploaded ${roomType} photo into a realistic cabinetry concept image.

Core requirements:
- Maintain the approximate existing room layout, perspective, walls, floor area, window/door positions and spatial proportions.
- Keep the layout recognisable from the original photo.
- Apply cabinetry design inspiration only where visually plausible.
- Do not create impossible room extensions.
- Do not remove major structural elements unless replacing cabinetry in the same approximate location.
- If an island or walk-in pantry is requested, only include it if the room appears to have enough practical space.
- Create a polished but realistic residential cabinetry concept.

Selected style:
${selectedStyle}

Custom style notes:
${customStyle || "None"}

Selected finishes:
${selectedFinishes.join(", ") || "None"}

Layout preferences:
${selectedLayouts.join(", ") || "None"}

Optional customer details:
${optionalDetails || "None"}

Generate a high-quality inspirational cabinetry visual suitable for a cabinet maker enquiry.
    `;

    const concepts = [];

    for (let i = 0; i < 2; i++) {
      const imageFile = new File([buffer], safeName, { type: photo.type });

      const imageResult = await openai.images.edit({
        model: "gpt-image-1",
        image: imageFile,
        prompt: `${generationPrompt}

Variation ${i + 1}:
Create a diffCreate a distinct but still realistic cabinetry concept using the same selected style, finishes and room layout. If this is Variation 1, create a balanced and practical interpretation.
If this is Variation 2, create a noticeably different alternative in cabinetry emphasis, finish balance, colour use or styling details while keeping the room recognisable.`,
        size: "1024x1024"
      });

      const b64 = imageResult.data?.[0]?.b64_json;

      if (!b64) {
        throw new Error("No generated image returned from OpenAI.");
      }

      const conceptBuffer = Buffer.from(b64, "base64");

      const conceptId = `concept_${crypto.randomUUID()}`;

      const conceptBlob = await put(
        `concepts/${Date.now()}-${conceptId}.png`,
        conceptBuffer,
        {
          access: "public",
          contentType: "image/png"
        }
      );

      concepts.push({
        id: conceptId,
        imageUrl: conceptBlob.url,
        caption: `${selectedStyle} cabinetry concept ${i + 1}`,
        aiNotes:
          i === 0
            ? "A balanced interpretation of your selected style while keeping the existing room layout recognisable."
            : i === 1
            ? "A slightly different finish and cabinetry emphasis based on your selected preferences."
            : "An alternative inspirational take with the same core layout and selected cabinetry direction."
      });
    }

    return NextResponse.json({
      uploadedImageId,
      uploadedImageUrl: uploadedBlob.url,
      analysisText,
      concepts
    });
  } catch (error) {
    console.error("Generate error:", error);

    return NextResponse.json(
      {
        error:
          "The AI could not generate a credible concept from this image. Please try a clearer, brighter photo."
      },
      { status: 500 }
    );
  }
}