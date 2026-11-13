import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

const disclaimer =
  "A valid numbering format does not prove that a number is assigned, active, or owned by a particular person.";

export function inspectPhone(phoneNumber: string, country?: string) {
  const region = country ? (country.toUpperCase() as CountryCode) : undefined;
  const phone = parsePhoneNumberFromString(phoneNumber, region);
  if (!phone) {
    return {
      success: true as const,
      parsed: false as const,
      disclaimer,
      message: "The number could not be parsed. Include a country calling code, or choose a country and enter the national number.",
    };
  }
  let numberType: string | null = null;
  try {
    numberType = phone.getType() || null;
  } catch {
    numberType = null;
  }
  return {
    success: true as const,
    parsed: true as const,
    countryIso: phone.country || null,
    countryCallingCode: `+${phone.countryCallingCode}`,
    internationalFormat: phone.formatInternational(),
    nationalFormat: phone.formatNational(),
    e164: phone.number,
    isPossible: phone.isPossible(),
    isValid: phone.isValid(),
    numberType,
    disclaimer,
  };
}
