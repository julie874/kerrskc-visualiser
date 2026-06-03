"use client";

import { useState } from "react";

const roomTypes = [
  "Kitchen",
  "Laundry",
  "Wardrobe",
  "Living Area",
  "Other Cabinetry Area"
];

const styles = [
  "Modern",
  "Traditional",
  "Hamptons",
  "Coastal",
  "Contemporary",
  "Warm Minimalism",
  "Scandi",
  "Custom Style / Custom Colour"
];

const finishes = [
  "White cabinetry",
  "Shaker doors",
  "V-groove doors",
  "Flat panel doors",
  "Stone benchtop",
  "Laminate benchtop",
  "Hardwood benchtop",
  "Matt black handles",
  "Brushed brass handles",
  "Satin chrome handles",
  "Handleless cabinetry"
];

const layoutOptions = [
  {
    label: "U-shape",
    description: "Cabinetry across three sides where suitable."
  },
  {
    label: "L-shape",
    description: "Two adjoining cabinetry runs."
  },
  {
    label: "Galley",
    description: "Parallel or straight cabinetry runs."
  },
  {
    label: "Island if space allows",
    description: "AI will only suggest an island if the room appears suitable."
  },
  {
    label: "Walk-in pantry if space allows",
    description: "AI will only suggest a pantry if realistic for the space."
  },
  {
    label: "Let AI suggest layout",
    description:
      "The AI will preserve your room while suggesting practical cabinetry ideas."
  }
];

const budgetRanges = [
  "Under $10,000",
  "$10,000 – $20,000",
  "$20,000 – $40,000",
  "$40,000 – $60,000",
  "$60,000+",
  "Not sure yet"
];

const installExpectations = [
  "Within 3 months",
  "3–6 months",
  "6–12 months",
  "12 months+"
];
async function compressImageFile(file: File): Promise<File> {
  const maxOriginalSizeMb = 25;
  const maxOriginalSizeBytes = maxOriginalSizeMb * 1024 * 1024;

  if (file.size > maxOriginalSizeBytes) {
    throw new Error(`Please upload an image smaller than ${maxOriginalSizeMb}MB.`);
  }

  const imageBitmap = await createImageBitmap(file);

  const maxDimension = 1200;
  let width = imageBitmap.width;
  let height = imageBitmap.height;

  if (width > height && width > maxDimension) {
    height = Math.round((height * maxDimension) / width);
    width = maxDimension;
  } else if (height > width && height > maxDimension) {
    width = Math.round((width * maxDimension) / height);
    height = maxDimension;
  } else if (width === height && width > maxDimension) {
    width = maxDimension;
    height = maxDimension;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not process image. Please try another photo.");
  }

  ctx.drawImage(imageBitmap, 0, 0, width, height);

  const qualities = [0.75, 0.6, 0.45, 0.35];
  const maxFinalSizeBytes = 2 * 1024 * 1024;

  let finalBlob: Blob | null = null;

  for (const quality of qualities) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });

    if (!blob) {
      continue;
    }

    finalBlob = blob;

    if (blob.size <= maxFinalSizeBytes) {
      break;
    }
  }

  if (!finalBlob) {
    throw new Error("Could not compress image. Please try another photo.");
  }

  if (finalBlob.size > maxFinalSizeBytes) {
    throw new Error(
      "This image is still too large after compression. Please try a smaller or lower-resolution photo."
    );
  }

  const compressedFileName =
    file.name.replace(/\.(png|jpg|jpeg)$/i, "") + "-compressed.jpg";

  return new File([finalBlob], compressedFileName, {
    type: "image/jpeg"
  });
}
async function compressImageFile(file: File): Promise<File> {
  const maxOriginalSizeMb = 25;
  const maxOriginalSizeBytes = maxOriginalSizeMb * 1024 * 1024;

  if (file.size > maxOriginalSizeBytes) {
    throw new Error(`Please upload an image smaller than ${maxOriginalSizeMb}MB.`);
  }

  const imageBitmap = await createImageBitmap(file);

  const maxDimension = 900;
  let width = imageBitmap.width;
  let height = imageBitmap.height;

  if (width > height && width > maxDimension) {
    height = Math.round((height * maxDimension) / width);
    width = maxDimension;
  } else if (height > width && height > maxDimension) {
    width = Math.round((width * maxDimension) / height);
    height = maxDimension;
  } else if (width === height && width > maxDimension) {
    width = maxDimension;
    height = maxDimension;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not process image. Please try another photo.");
  }

  ctx.drawImage(imageBitmap, 0, 0, width, height);

  const qualities = [0.75, 0.6, 0.45, 0.35];
  const maxFinalSizeBytes = 900 * 1024;

  let finalBlob: Blob | null = null;

  for (const quality of qualities) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });

    if (!blob) {
      continue;
    }

    finalBlob = blob;

    if (blob.size <= maxFinalSizeBytes) {
      break;
    }
  }

  if (!finalBlob) {
    throw new Error("Could not compress image. Please try another photo.");
  }

  if (finalBlob.size > maxFinalSizeBytes) {
    throw new Error(
      "This image is still too large after compression. Please try a smaller or lower-resolution photo."
    );
  }

  const compressedFileName =
    file.name.replace(/\.(png|jpg|jpeg)$/i, "") + "-compressed.jpg";

  return new File([finalBlob], compressedFileName, {
    type: "image/jpeg"
  });
}
type Concept = {
  id: string;
  imageUrl: string;
  caption: string;
  aiNotes: string;
};

export default function Home() {
  const [step, setStep] = useState(1);

  const [photo, setPhoto] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [roomType, setRoomType] = useState("Kitchen");
  const [selectedStyle, setSelectedStyle] = useState("Hamptons");
  const [customStyle, setCustomStyle] = useState("");
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>([]);
  const [optionalDetails, setOptionalDetails] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [uploadedImageId, setUploadedImageId] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [selectedConceptId, setSelectedConceptId] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [budgetRange, setBudgetRange] = useState("Not sure yet");
  const [installExpectation, setInstallExpectation] = useState("3–6 months");
  const [customerNotes, setCustomerNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handlePhotoUpload(file: File | null) {
  if (!file) {
    setPhoto(null);
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png"];

  if (!allowedTypes.includes(file.type)) {
    alert("Please upload a JPEG, JPG or PNG image.");
    setPhoto(null);
    return;
  }

  setIsCompressing(true);

  try {
    const compressedFile = await compressImageFile(file);
    setPhoto(compressedFile);
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Could not process this image. Please try another photo.";

    alert(message);
    setPhoto(null);
  } finally {
    setIsCompressing(false);
  }
}
  function toggleValue(
    value: string,
    list: string[],
    setter: (v: string[]) => void
  ) {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  }


  async function generateConcepts() {
    if (!photo) {
      alert("Please upload a JPEG or PNG photo first.");
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("roomType", roomType);
      formData.append("selectedStyle", selectedStyle);
      formData.append("customStyle", customStyle);
      formData.append("selectedFinishes", JSON.stringify(selectedFinishes));
      formData.append("selectedLayouts", JSON.stringify(selectedLayouts));
      formData.append("optionalDetails", optionalDetails);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setAnalysisText(data.analysisText);
      setConcepts(data.concepts);
      setUploadedImageId(data.uploadedImageId);
      setUploadedImageUrl(data.uploadedImageUrl);

      if (data.concepts?.[0]) {
        setSelectedConceptId(data.concepts[0].imageUrl);
      }

      setStep(5);
    } catch (error) {
      console.error(error);
      alert(
        "Sorry, we could not generate concepts from this image. Please try a clearer, brighter photo or submit an enquiry manually."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function submitEnquiry() {
    if (!customerName || !customerEmail || !postcode) {
      alert("Please enter your name, email and postcode.");
      return;
    }

    if (!selectedConceptId) {
      alert("Please select your favourite concept.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      customer_details: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        postcode,
        notes: customerNotes
      },
      project_details: {
        room_type: roomType,
        selected_style: selectedStyle,
        custom_style: customStyle,
        selected_finishes: selectedFinishes,
        layout_preferences: selectedLayouts,
        optional_measurements_and_notes: optionalDetails,
        installation_expectation: installExpectation,
        budget_range: budgetRange
      },
      uploaded_image_id: uploadedImageId,
      uploaded_image_url: uploadedImageUrl,
      generated_concept_ids: concepts.map((concept) => concept.imageUrl),
      selected_concept_id: selectedConceptId,
      storage_policy: {
        retention_period: "90 days",
        customer_notice_shown: true
      }
    };

    try {
      const res = await fetch("/api/submit-enquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setSubmitted(true);
      setStep(7);
    } catch (error) {
      console.error(error);
      alert("Sorry, we could not submit your enquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="container">
        <section className="card centered">
          <h1>Thank you</h1>
          <p>
            Your cabinetry visualiser enquiry has been submitted to Kerr’s
            Kitchens & Cabinets.
          </p>
          <p>
            We have received your selected concept, uploaded image and project
            details.
          </p>
          <a className="button" href="https://www.kerrskc.com.au">
            Return to Website
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="hero">
  <h1>AI Cabinetry Visualiser</h1>
  <p>
    Upload a photo of your kitchen, laundry, wardrobe or living area and
    receive AI-generated cabinetry concepts.
  </p>
  <p className="muted">
    Version: image compression active v1
  </p>
</header>

      <section className="card">
        <div className="steps">
          <span className={step === 1 ? "active" : ""}>1. Photo</span>
          <span className={step === 2 ? "active" : ""}>2. Style</span>
          <span className={step === 3 ? "active" : ""}>3. Layout</span>
          <span className={step === 4 ? "active" : ""}>4. Details</span>
          <span className={step === 5 ? "active" : ""}>5. Concepts</span>
          <span className={step === 6 ? "active" : ""}>6. Enquiry</span>
        </div>

        {step === 1 && (
          <>
            <h2>Upload your room photo</h2>

            <p className="muted">
              Accepted formats: JPEG, JPG or PNG. For best results, upload a
              clear, well-lit photo taken from far enough back to show the
              cabinetry area, walls, floor and room layout.
            </p>

            <label className="field">
              Room type
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
              >
                {roomTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="field">
              Upload photo
              <input
  type="file"
  accept="image/jpeg,image/png"
  onChange={(e) => {
    void handlePhotoUpload(e.target.files?.[0] || null);
  }}
/>
            </label>

            {isCompressing && (
  <p className="muted">Optimising image for upload...</p>
)}

{isCompressing && (
  <p className="muted">Optimising image for upload...</p>
)}

{photo && !isCompressing && (
  <p className="success">
    Selected: {photo.name} ({(photo.size / 1024 / 1024).toFixed(2)}MB)
  </p>
)}

            <div className="notice">
              Your uploaded photo and generated concept images will be stored
              securely for up to 90 days so Kerr’s Kitchens & Cabinets can
              review your enquiry. Images are not published or used for
              marketing without your permission.
            </div>

            <button
  className="button"
  onClick={() => setStep(2)}
  disabled={!photo || isCompressing}
>
  {isCompressing ? "Preparing image..." : "Continue"}
</button>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Select your style and finishes</h2>

            <h3>Cabinetry style</h3>
            <div className="grid">
              {styles.map((style) => (
                <button
                  type="button"
                  key={style}
                  className={selectedStyle === style ? "option selected" : "option"}
                  onClick={() => setSelectedStyle(style)}
                >
                  {style}
                </button>
              ))}
            </div>

            {selectedStyle === "Custom Style / Custom Colour" && (
              <label className="field">
                Describe your custom style
                <textarea
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  placeholder="Example: sage green lower cabinets, white overheads, oak shelving and brass handles."
                />
              </label>
            )}

            <h3>Finishes</h3>
            <div className="grid">
              {finishes.map((finish) => (
                <button
                  type="button"
                  key={finish}
                  className={
                    selectedFinishes.includes(finish)
                      ? "option selected"
                      : "option"
                  }
                  onClick={() =>
                    toggleValue(finish, selectedFinishes, setSelectedFinishes)
                  }
                >
                  {finish}
                </button>
              ))}
            </div>

            <div className="actions">
              <button className="secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="button" onClick={() => setStep(3)}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Layout preferences</h2>
            <p className="muted">
              Select any layout ideas you would like the AI to consider. The
              concepts will still aim to keep your existing room proportions
              realistic.
            </p>

            <div className="layoutGrid">
              {layoutOptions.map((layout) => (
                <button
                  type="button"
                  key={layout.label}
                  className={
                    selectedLayouts.includes(layout.label)
                      ? "layout selected"
                      : "layout"
                  }
                  onClick={() =>
                    toggleValue(layout.label, selectedLayouts, setSelectedLayouts)
                  }
                >
                  <div className="layoutIcon">{layout.label.charAt(0)}</div>
                  <strong>{layout.label}</strong>
                  <small>{layout.description}</small>
                </button>
              ))}
            </div>

            <div className="actions">
              <button className="secondary" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="button" onClick={() => setStep(4)}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2>Optional project details</h2>
            <p className="muted">
              This step is optional. Add anything useful, such as approximate
              measurements, what you want to keep, or what you want to change.
            </p>

            <label className="field">
              Optional measurements or notes
              <textarea
                value={optionalDetails}
                onChange={(e) => setOptionalDetails(e.target.value)}
                placeholder="Example: Back wall is approx. 4m long. We want more storage and space for a dishwasher."
              />
            </label>

            <div className="actions">
              <button className="secondary" onClick={() => setStep(3)}>
                Back
              </button>
              <button
                className="button"
                onClick={generateConcepts}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating concepts..." : "Generate AI Concepts"}
              </button>
            </div>

            {isGenerating && (
              <div className="notice">
                Please wait while the AI analyses your room and creates your
                cabinetry concepts. This may take up to a minute or two.
              </div>
            )}
          </>
        )}

        {step === 5 && (
          <>
            <h2>Your AI concept images</h2>

            {analysisText && (
              <div className="notice">
                <strong>AI layout notes:</strong>
                <br />
                {analysisText}
              </div>
            )}

            <div className="conceptGrid">
              {concepts.map((concept) => (
                <div
                  key={concept.id}
                  className={
                    selectedConceptId === concept.imageUrl
                      ? "concept selected"
                      : "concept"
                  }
                >
                  <img src={concept.imageUrl} alt={concept.caption} />
                  <h3>{concept.caption}</h3>
                  <p>{concept.aiNotes}</p>

                  <a
                    className="secondary full"
                    href={concept.imageUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download image
                  </a>

                  <button
                    className="button full"
                    onClick={() => setSelectedConceptId(concept.imageUrl)}
                  >
                    {selectedConceptId === concept.imageUrl
                      ? "Selected favourite"
                      : "Select this concept"}
                  </button>
                </div>
              ))}
            </div>

            <div className="actions">
              <button className="secondary" onClick={() => setStep(4)}>
                Back
              </button>
              <button className="button" onClick={() => setStep(6)}>
                Continue to Enquiry
              </button>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <h2>Submit your enquiry</h2>

            <label className="field">
              Name *
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </label>

            <label className="field">
              Email *
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </label>

            <label className="field">
              Phone optional
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </label>

            <label className="field">
              Postcode *
              <input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
              />
            </label>

            <label className="field">
              Budget range
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
              >
                {budgetRanges.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </select>
            </label>

            <label className="field">
              Installation expectation
              <select
                value={installExpectation}
                onChange={(e) => setInstallExpectation(e.target.value)}
              >
                {installExpectations.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="field">
              Extra notes
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Anything else you would like Kerr’s Kitchens & Cabinets to know?"
              />
            </label>

            <div className="notice">
              Your selected concept, uploaded image and enquiry details will be
              sent to Kerr’s Kitchens & Cabinets. Images are kept for up to 90
              days.
            </div>

            <div className="actions">
              <button className="secondary" onClick={() => setStep(5)}>
                Back
              </button>
              <button
                className="button"
                onClick={submitEnquiry}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Enquiry"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
