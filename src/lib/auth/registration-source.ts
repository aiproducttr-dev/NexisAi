export type RegistrationSource = "nexisai" | "nexisaiform";

export function resolveRegistrationSource(input: {
  redirect?: string | null;
  registrationSource?: string | null;
  host?: string | null;
  referer?: string | null;
}): RegistrationSource {
  if (
    input.registrationSource === "nexisaiform" ||
    input.registrationSource === "nexisai"
  ) {
    return input.registrationSource;
  }

  const redirect = input.redirect?.trim() || "";
  if (redirect.startsWith("/forum")) {
    return "nexisaiform";
  }

  const host = (input.host || "").toLowerCase();
  const referer = (input.referer || "").toLowerCase();

  if (host.includes("nexisaiform.com") || referer.includes("nexisaiform.com")) {
    return "nexisaiform";
  }

  return "nexisai";
}
