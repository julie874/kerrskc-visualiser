"use client";

import { useState } from "react";

const roomTypes = [
  "Kitchen",
  "Laundry",
  "Wardrobe",
  "Living Area",
  "Office",
  "Alfresco",
  "Other Cabinetry Area"
];

const styles = [
  "warm Minimalism",
  "Modern",
  "Traditional",
  "Hamptons",
  "Coastal",
  "Contemporary",
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
    description: "Cabinetry across three sides - great for maximising storage and bench space."
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
    description: "We'll only suggest an island if your room can genuinely fit one."
  },
  {
    label: "Walk-in pantry if space allows",
    description: "We'll only suggest a pantry if it's realistic for your space."
  },
  {
    label: "Let AI suggest layout",
    description: "Not sure? Let us work with what you've got and suggest something practical."
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

const MAX_CONCEPT_CHANGES = 2;

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
    throw new Error(
      `Please upload an image smaller than ${maxOriginalSizeMb}MB.`
    );
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

// Steps:
// 1 = Your Space
// 2 = Your Style
// 3 = Your Layout
// 4 = Your Details
// 4.5 = Email gate (stored as step 45)
// 5 = Your Concepts
// 6 = Get a Quote
// 7 = Submitted

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
  const [changeRequest, setChangeRequest] = useState("");
  const [isUpdatingConcept, setIsUpdatingConcept] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [selectedConceptId, setSelectedConceptId] = useState("");
  const [conceptChangeCount, setConceptChangeCount] = useState(0);

  // Email gate state (collected at step 45, before generation)
  const [gateEmail, setGateEmail] = useState("");
  const [gateName, setGateName] = useState("");

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

  // When the gate form is submitted, pre-fill the full enquiry form
  // name/email so the client doesn't have to type them again at step 6.
  function handleGateContinue() {
    if (!gateName.trim() || !gateEmail.trim()) {
      alert("Please enter your name and email to continue.");
      return;
    }
    // Pre-fill step 6 fields so the client doesn't repeat themselves
    setCustomerName(gateName);
    setCustomerEmail(gateEmail);
    void generateConcepts();
  }

  async function generateConcepts() {
    if (!photo) {
      alert("Please upload a JPEG or PNG photo first.");
      return;
    }

    setIsGenerating(true);
    setStep(5);

    try {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("roomType", roomType);
      formData.append("selectedStyle", selectedStyle);
      formData.append("customStyle", customStyle);
      formData.append("selectedFinishes", JSON.stringify(selectedFinishes));
      formData.append("selectedLayouts", JSON.stringify(selectedLayouts));
      formData.append("optionalDetails", optionalDetails);
      formData.append("gateEmail", gateEmail);
      formData.append("gateName", gateName);

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
      setSelectedConceptId("");
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "Sorry, we could not generate concepts from this image.";

      alert(message);
      setStep(45);
    } finally {
      setIsGenerating(false);
    }
  }

  async function updateSelectedConcept() {
    if (!selectedConceptId) {
      alert("Please select a concept to update.");
      return;
    }

    if (conceptChangeCount >= MAX_CONCEPT_CHANGES) {
      alert(
        `You can only request up to ${MAX_CONCEPT_CHANGES} concept changes.`
      );
      return;
    }

    if (!changeRequest.trim()) {
      alert("Please describe the changes you would like.");
      return;
    }

    setIsUpdatingConcept(true);

    try {
      const res = await fetch("/api/refine-concept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedConceptUrl: selectedConceptId,
          changeRequest,
          roomType,
          selectedStyle,
          customStyle,
          selectedFinishes,
          selectedLayouts,
          optionalDetails
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not update concept.");
      }

      const revisedConcept: Concept = {
        id: data.concept.id,
        imageUrl: data.concept.imageUrl,
        caption: data.concept.caption,
        aiNotes: data.concept.aiNotes
      };

      setConcepts((current) => [...current, revisedConcept]);
      setSelectedConceptId(revisedConcept.imageUrl);
      setConceptChangeCount((count) => count + 1);
      setChangeRequest("");
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "Sorry, we could not update the selected concept.";

      alert(message);
    } finally {
      setIsUpdatingConcept(false);
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

      const message =
        error instanceof Error
          ? error.message
          : "Sorry, we could not submit your enquiry. Please try again.";

      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper: which display step number to highlight in the nav
  function navStep() {
    if (step === 45) return 4;
    if (step >= 5) return step;
    return step;
  }

  if (submitted) {
    return (
      <main className="container">
        <section className="card centered">
          <h1>You're all set.</h1>
          <p>
            Your concepts and project details are on their way to the team at
            Kerr's Kitchens & Cabinets.
          </p>
          <p>
            We'll be in touch soon to talk through what's possible for your
            space.
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
        <img
          src="/logo.svg"
          alt="Kerr's Kitchens and Cabinets logo"
          className="hero-logo"
        />
        <h1>Visualise Your Space Before You Commit</h1>
        <p>
          Not sure what style is right for your space? Upload a photo and we'll
          show you what's possible — before you spend a cent.
        </p>
        <p className="muted">Version: image compression active v1</p>
      </header>

      <section className="card">
        <div className="steps">
          <span className={navStep() === 1 ? "active" : ""}>1. Your Space</span>
          <span className={navStep() === 2 ? "active" : ""}>2. Your Style</span>
          <span className={navStep() === 3 ? "active" : ""}>3. Your Layout</span>
          <span className={navStep() === 4 ? "active" : ""}>4. Your Details</span>
          <span className={navStep() === 5 ? "active" : ""}>5. Your Concepts</span>
          <span className={navStep() === 6 ? "active" : ""}>6. Get a Quote</span>
        </div>

        {/* ── STEP 1: Your Space ── */}
        {step === 1 && (
          <>
            <h2>Start with your space</h2>
            <p className="muted">
              Any clear photo works. The wider the shot, the better your concept
              will turn out - try to include the walls, floor, and the area where
              cabinetry will go. Accepted formats: JPEG, JPG or PNG.
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
              <p className="muted">Optimising your photo for upload...</p>
            )}

            {photo && !isCompressing && (
              <div className="notice">
                <strong>Photo ready:</strong>
                <br />
                {photo.name}
                <br />
                Upload size: {(photo.size / 1024 / 1024).toFixed(2)}MB
              </div>
            )}

            <div className="notice">
              Your photos are stored privately and securely for up to 90 days -
              we'll never publish or use them without your permission.
            </div>

            <button
              className="button"
              onClick={() => setStep(2)}
              disabled={!photo || isCompressing}
            >
              {isCompressing ? "Preparing photo..." : "Continue"}
            </button>
          </>
        )}

        {/* ── STEP 2: Your Style ── */}
        {step === 2 && (
          <>
            <h2>What feel are you going for?</h2>

            <h3>Pick the style that feels most like you - or the one you've always wanted.</h3>
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

            <h3>Select any finishes you'd like to see in your concept.</h3>
            <div className="grid">
              {finishes.map((finish) => (
                <button
                  type="button"
                  key={finish}
                  className={
                    selectedFinishes.includes(finish) ? "option selected" : "option"
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

        {/* ── STEP 3: Your Layout ── */}
        {step === 3 && (
          <>
            <h2>How do you want your space to work?</h2>
            <p className="muted">
              Choose a layout that suits how you use the space. Don't worry -
              your concepts will stay realistic to your room's actual proportions.
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

        {/* ── STEP 4: Your Details ── */}
        {step === 4 && (
          <>
            <h2>Anything else we should know about your space?</h2>
            <p className="muted">
              The more you tell us, the more tailored your concepts will be.
              Measurements, things you love, things you'd like to change — anything
              helps.
            </p>

            <label className="field">
              Tell us about your space <span className="muted">(optional)</span>
              <textarea
                value={optionalDetails}
                onChange={(e) => setOptionalDetails(e.target.value)}
                placeholder="e.g. Back wall is approx. 4m long. We'd love more storage and room for a dishwasher."
              />
            </label>

            <div className="actions">
              <button className="secondary" onClick={() => setStep(3)}>
                Back
              </button>
              <button className="button" onClick={() => setStep(45)}>
                Continue
              </button>
            </div>
          </>
        )}

        {/* ── STEP 4.5: Email gate ── */}
        {step === 45 && (
          <>
            <h2>Almost there — where should we send your concepts?</h2>
            <p className="muted">
              Pop in your name and email and we'll get started on your concepts
              right away. We'll also use these details if you'd like to follow up
              with a quote.
            </p>

            <label className="field">
              Your name *
              <input
                value={gateName}
                onChange={(e) => setGateName(e.target.value)}
                placeholder="First name is fine"
              />
            </label>

            <label className="field">
              Your email *
              <input
                type="email"
                value={gateEmail}
                onChange={(e) => setGateEmail(e.target.value)}
                placeholder="we'll never share your details"
              />
            </label>

            <div className="notice">
              Your details are kept private. We won't pass them on.
              By submitting, you will receive an email from us containing our Welcome Pack.
            </div>

            <div className="actions">
              <button className="secondary" onClick={() => setStep(4)}>
                Back
              </button>
              <button
                className="button"
                onClick={handleGateContinue}
                disabled={!gateName.trim() || !gateEmail.trim()}
              >
                Show Me My Concepts
              </button>
            </div>
          </>
        )}

        {/* ── STEP 5: Your Concepts ── */}
        {step === 5 && (
          <>
            {isGenerating ? (
              <>
                <h2>We're working on your concepts now</h2>
                <p className="muted">
                  This usually takes a minute or two. The more detail you gave
                  us, the more tailored your concepts will be.
                </p>
                <div className="notice">Generating your concepts...</div>
              </>
            ) : (
              <>
                <h2>Here's what your space could look like</h2>
                <p className="muted">
                  Pick the one that feels closest to your vision — you can refine
                  it from there.
                </p>

                {analysisText && (
                  <div className="notice">
                    <strong>How we interpreted your space</strong>
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
                          ? "Selected ✓"
                          : "Select this concept"}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="notice">
                  <strong>Not quite right? Tell us what to change.</strong>
                  <br />
                  What would make this more you? Colours, materials, layout,
                  style - anything goes.
                </div>

                <label className="field">
                  Describe the changes you'd like
                  <textarea
                    value={changeRequest}
                    onChange={(e) => setChangeRequest(e.target.value)}
                    placeholder="Example: Make the cabinetry warmer, change the benchtop to stone, add brass handles and keep the same layout."
                  />
                </label>

                <div className="notice">
                  Concept changes used: {conceptChangeCount} / {MAX_CONCEPT_CHANGES}
                </div>

                {conceptChangeCount >= MAX_CONCEPT_CHANGES ? (
                  <div className="notice">
                    Your concept has reached the maximum number of allocated changes. Need more changes? Let us know in the enquiry form.
                  </div>
                ) : null}

                <button
                  className="button full"
                  onClick={updateSelectedConcept}
                  disabled={
                    isUpdatingConcept ||
                    !selectedConceptId ||
                    conceptChangeCount >= MAX_CONCEPT_CHANGES
                  }
                >
                  {isUpdatingConcept
                    ? "Updating your concept..."
                    : "Update Selected Concept"}
                </button>

                <div className="actions">
                  <button className="secondary" onClick={() => setStep(4)}>
                    Back
                  </button>
                  <button
                    className="button"
                    onClick={() => setStep(6)}
                    disabled={!selectedConceptId}
                  >
                    Get a Quote
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── STEP 6: Get a Quote ── */}
        {step === 6 && (
          <>
            <h2>Like what you see? Let's talk.</h2>
            <p className="muted">
              Send us your details and Kate or Julie will be in touch to talk through
              your project - no pressure, no obligation.
            </p>

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
              Phone <span className="muted">(optional)</span>
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
              Installation timeframe
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
              Have additional changes or anything else to add? List them here and we'll take care of the rest.
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Anything else you'd like us to know before we get in touch?"
              />
            </label>

            <div className="notice">
              Your selected concept, uploaded image and project details will be
              sent to the team at Kerr's Kitchens and Cabinets. Images are kept
              securely for up to 90 days.
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
                {isSubmitting ? "Sending..." : "Send My Enquiry"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}