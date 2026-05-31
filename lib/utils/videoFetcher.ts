export async function fetchVideoDetails(batchId: string, subjectId: string, contentId: string, urlType: string, fallbackUrl?: string) {
  if (urlType === "youtube") {
    return {
      type: "youtube",
      url: fallbackUrl,
      signedQuery: "",
      drmConfig: null
    };
  }

  if (urlType === "penpencilvdo") {
    // 1. Fetch Signed URL
    const penRes = await fetch(
      `/api/get-video-url?batchId=${batchId}&subjectId=${subjectId}&childId=${contentId}`
    );

    if (penRes.status === 403) {
      throw new Error("Batch unavailable or forbidden.");
    }

    const penData = await penRes.json();
    const finalUrl = penData?.data?.url;
    const signedQuery = penData?.data?.signedUrl;

    if (!finalUrl || !signedQuery) {
      throw new Error("Failed to resolve video URL.");
    }

    const fullMPDUrl = `${finalUrl}${signedQuery}`;

    // 2. Fetch MPD and extract default_KID
    const mpdRes = await fetch(fullMPDUrl);
    const mpdText = await mpdRes.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(mpdText, "application/xml");

    const kidNode = xmlDoc.querySelector(
      'ContentProtection[schemeIdUri="urn:mpeg:dash:mp4protection:2011"]'
    );
    let defaultKID = kidNode?.getAttribute("cenc:default_KID");

    if (!defaultKID) {
      throw new Error("DEFAULT_KID not found in MPD. This video might not be DRM encrypted or the format is unknown.");
    }

    // Normalize the KID
    defaultKID = defaultKID.replace(/-/g, "").toLowerCase();

    // 3. Fetch ClearKeys
    const otpRes = await fetch(`/api/get-otp?kid=${defaultKID}`);
    const otpData = await otpRes.json();

    if (!otpData?.clearKeys) {
      throw new Error("Missing clearKeys in DRM response.");
    }

    return {
      type: "penpencilvdo",
      url: finalUrl,
      signedQuery: signedQuery,
      drmConfig: {
        clearKeys: otpData.clearKeys
      }
    };
  }

  throw new Error("Unknown URL Type");
}
