import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (!openAiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key missing." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: openAiApiKey
    });

    const payload = await req.json();

    const selectedConceptUrl = String(payload.selectedConceptUrl || "");
    const changeRequest = String(payload.changeRequest || "");
    const roomType = String(payload.roomType || "");
    const selectedStyle = String(payload.selectedStyle || "");
    const customStyle = String(payload.customStyle || "");
    const selectedFinishes: string[] = payload.selectedFinishes || [];
    const selectedLayouts: string[] = payload.selectedLayouts || [];
    const optionalDetails = String(payload.optionalDetails || "");

    if (!selectedConceptUrl) {
      return NextResponse.json(
        { error: "No selected concept image was provided." },
        { status: 400 }
      );
    }

    if (!changeRequest.trim()) {
      return NextResponse.json(
        { error: "Please describe the changes you would like." },
        { status: 400 }
      );
    }

    const imageResponse = await fetch(selectedConceptUrl);

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Could not access the selected concept image." },
        { status: 400 }
      );
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    const imageFile = new File([imageBuffer], "selected-concept.png", {
      type: "image/png"
    });

    const refinementPrompt = `
Update this AI-generated cabinetry concept image based on the customer's requested changes.

Customer requested changes:
${changeRequest}

Important requirements:
- Preserve the same room perspective and overall layout as much as possible.
- Keep the concept realistic and suitable for a residential cabinetry enquiry.
- Apply the requested changes clearly, but do not create impossible structural alterations.
- Keep cabinetry, benchtops, handles, lighting and finishes visually plausible.
- Maintain a polished, high-quality cabinetry visual.

Project context:
Room type: ${roomType}
Selected style: ${selectedStyle}
Custom style notes: ${customStyle || "None"}
Selected finishes: ${selectedFinishes.join(", ") || "None"}
Layout preferences: ${selectedLayouts.join(", ") || "None"}
Optional customer details: ${optionalDetails || "None"}
    `;

    const imageResult = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: refinementPrompt,
      size: "1024x1024"
    });

    const b64 = imageResult.data?.[0]?.b64_json;

    if (!b64) {
      throw new Error("No revised image returned from OpenAI.");
    }

    const revisedBuffer = Buffer.from(b64, "base64");
    const conceptId = `concept_${crypto.randomUUID()}`;

    const conceptBlob = await put(
      `concepts/${Date.now()}-${conceptId}.png`,
      revisedBuffer,
      {
        access: "public",
        contentType: "image/png"
      }
    );

    return NextResponse.json({
      concept: {
        id: conceptId,
        imageUrl: conceptBlob.url,
        caption: "Updated cabinetry concept",
        aiNotes: `Updated based on your request: ${changeRequest}`
      }
    });
  } catch (error) {
    console.error("Refine concept error:", error);

    return NextResponse.json(
      {
        error:
          "The AI could not update this concept. Please try a shorter or clearer change request."
      },
      { status: 500 }
    );
  }
}