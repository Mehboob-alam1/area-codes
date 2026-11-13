/**
 * Builds database/seeds/directory-seed.json from the mledoze/countries dataset
 * plus a curated geographic catalog.
 *
 * Country calling codes come from the dataset's IDD fields.
 * Geographic codes are inserted only from the catalog below.
 * Cities may exist without an area code. Those pages must stay blank.
 *
 * Download the dataset once if it is missing:
 * https://raw.githubusercontent.com/mledoze/countries/master/countries.json
 */
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(__dirname, "mledoze-countries.json");
const outPath = path.join(__dirname, "directory-seed.json");

if (!existsSync(sourcePath)) {
  console.error(
    "Missing database/seeds/mledoze-countries.json. Download it from https://github.com/mledoze/countries",
  );
  process.exit(1);
}

const rawCountries = JSON.parse(readFileSync(sourcePath, "utf8"));

function idFor(key) {
  const hex = createHash("sha256").update(key).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function digitCount(code) {
  return String(code).replace(/\D/g, "").length;
}

function callingCodesFor(country) {
  const idd = country.idd;
  if (!idd?.root) return [];
  const suffixes = (idd.suffixes || []).filter((suffix) => suffix.length > 0);
  // NANP and the +7 plan share one country code. Suffixes are area codes, not extra country codes.
  if (idd.root === "+1" || idd.root === "+7") return [idd.root];
  if (suffixes.length === 0) return [idd.root];
  // ITU-T E.164 country calling codes are one to three digits. Longer suffixes are national destination codes.
  const codes = [...new Set(suffixes.map((suffix) => idd.root + suffix).filter((code) => digitCount(code) <= 3))];
  if (codes.length) return codes;
  if (digitCount(idd.root) >= 2 && digitCount(idd.root) <= 3) return [idd.root];
  return [];
}

const continentName = {
  Americas: "Americas",
  Asia: "Asia",
  Africa: "Africa",
  Europe: "Europe",
  Oceania: "Oceania",
  Antarctic: "Antarctica",
};

const callingOverrides = {
  EH: ["+212"],
  VA: ["+379"],
  // The source file stores these as one long suffix. The extra digits are national destination codes.
  AX: ["+358"],
  SJ: ["+47"],
  // The source file lists +268, which is Eswatini. These islands use the North American Numbering Plan.
  UM: ["+1"],
  AQ: [],
  HM: [],
};

const dialing = {
  US: { internationalPrefix: "011", nationalPrefix: "1", notes: "The United States participates in the North American Numbering Plan. Geographic numbering uses three-digit area codes. The trunk prefix 1 is used for calls between numbering plan areas." },
  CA: { internationalPrefix: "011", nationalPrefix: "1", notes: "Canada participates in the North American Numbering Plan and shares country calling code +1." },
  GB: { internationalPrefix: "00", nationalPrefix: "0", notes: "The United Kingdom uses trunk prefix 0. London's geographic code 20 is dialed nationally as 020. The trunk prefix is omitted on international calls." },
  PK: { internationalPrefix: "00", nationalPrefix: "0", notes: "Pakistan uses trunk prefix 0 before geographic area codes. Mobile national destination codes begin with 3 and are not geographic area codes." },
  IN: { internationalPrefix: "00", nationalPrefix: "0", notes: "India uses trunk prefix 0 before geographic STD codes. Mobile numbers belong to a separate series and are not geographic area codes." },
  AU: { internationalPrefix: "0011", nationalPrefix: "0", notes: "Australian geographic codes cover broad regions. Code 2 covers New South Wales and the Australian Capital Territory, 3 covers Victoria and Tasmania, 7 covers Queensland, and 8 covers South Australia, Western Australia and the Northern Territory." },
  DE: { internationalPrefix: "00", nationalPrefix: "0", notes: "German geographic area codes vary in length. The trunk prefix 0 is omitted when calling Germany from abroad." },
  FR: { internationalPrefix: "00", nationalPrefix: "0", notes: "Metropolitan France uses a single-digit geographic zone after the trunk prefix. Zone 1 covers Île-de-France. It is not a code for the city of Paris alone." },
  JP: { internationalPrefix: "010", nationalPrefix: "0", notes: "Japan uses trunk prefix 0. Geographic area-code length varies by city." },
  CN: { internationalPrefix: "00", nationalPrefix: "0", notes: "China uses trunk prefix 0 before geographic area codes. Code length varies." },
  AE: { internationalPrefix: "00", nationalPrefix: "0", notes: "The United Arab Emirates assigns short geographic codes by emirate. Some codes are shared by more than one emirate." },
  SA: { internationalPrefix: "00", nationalPrefix: "0", notes: "Saudi Arabia uses trunk prefix 0. Some geographic codes are shared by more than one city." },
  BR: { internationalPrefix: "00", nationalPrefix: "0", notes: "Brazil uses two-digit geographic codes and trunk prefix 0." },
  MX: { internationalPrefix: "00", nationalPrefix: null, notes: "Mexico uses country calling code +52. Only major-city codes with a recorded source are listed." },
  ZA: { internationalPrefix: "00", nationalPrefix: "0", notes: "South Africa uses trunk prefix 0 before geographic area codes." },
  NG: { internationalPrefix: "009", nationalPrefix: "0", notes: "Nigeria uses country calling code +234. City codes are not listed until each one has its own source record." },
  AX: { internationalPrefix: "00", nationalPrefix: "0", notes: "The Åland Islands use Finland's country calling code +358. They do not have a separate country calling code." },
  SJ: { internationalPrefix: "00", nationalPrefix: "0", notes: "Svalbard and Jan Mayen use Norway's country calling code +47. They do not have a separate country calling code." },
  UM: { internationalPrefix: "011", nationalPrefix: "1", notes: "The United States Minor Outlying Islands are covered by the North American Numbering Plan, country calling code +1. The reference file also contains +268, which belongs to Eswatini and is not used here." },
  EG: { internationalPrefix: "00", nationalPrefix: "0", notes: "Egypt uses trunk prefix 0 before geographic area codes." },
  TR: { internationalPrefix: "00", nationalPrefix: "0", notes: "Istanbul has two geographic codes: 212 on the European side and 216 on the Asian side." },
  ES: { internationalPrefix: "00", nationalPrefix: null, notes: "Spain dials the full national number without a separate trunk prefix." },
  IT: { internationalPrefix: "00", nationalPrefix: "0", notes: "Italian geographic codes are dialed with a leading 0 inside Italy. That 0 is omitted on calls from abroad." },
  SG: { internationalPrefix: "001", nationalPrefix: null, notes: "Singapore does not use geographic area codes. The national number is dialed in full after country code +65." },
  HK: { internationalPrefix: "001", nationalPrefix: null, notes: "Hong Kong does not use geographic area codes. Numbers are dialed in full after country code +852." },
  RU: { internationalPrefix: "810", nationalPrefix: "8", notes: "Russia uses country calling code +7, which is also used by Kazakhstan. A +7 number is not by itself proof of which country is being called." },
  KZ: { internationalPrefix: "810", nationalPrefix: "8", notes: "Kazakhstan shares country calling code +7 with Russia. National numbers are distinguished inside the shared plan." },
  MY: { internationalPrefix: "00", nationalPrefix: "0", notes: "Malaysia uses trunk prefix 0 before geographic area codes." },
  NZ: { internationalPrefix: "00", nationalPrefix: "0", notes: "New Zealand uses trunk prefix 0. Geographic codes identify broad calling areas." },
  ID: { internationalPrefix: "001", nationalPrefix: "0", notes: "Indonesia uses trunk prefix 0 before geographic area codes." },
  PH: { internationalPrefix: "00", nationalPrefix: "0", notes: "The Philippines uses trunk prefix 0 before geographic area codes." },
  KR: { internationalPrefix: null, nationalPrefix: "0", notes: "South Korea's international exit prefix depends on the carrier. Geographic codes use trunk prefix 0." },
  TH: { internationalPrefix: "001", nationalPrefix: "0", notes: "Thailand uses trunk prefix 0. The commonly published international prefix is 001; some carriers use another exit code." },
  VN: { internationalPrefix: "00", nationalPrefix: "0", notes: "Vietnam uses trunk prefix 0. Hanoi uses 24 and Ho Chi Minh City uses 28 in the current geographic plan." },
  AR: { internationalPrefix: "00", nationalPrefix: "0", notes: "Argentina uses trunk prefix 0 before geographic area codes." },
  KE: { internationalPrefix: "000", nationalPrefix: "0", notes: "Kenya uses international prefix 000 and trunk prefix 0." },
  GH: { internationalPrefix: "00", nationalPrefix: "0", notes: "Ghana uses trunk prefix 0 before geographic area codes." },
  BD: { internationalPrefix: "00", nationalPrefix: "0", notes: "Bangladesh uses trunk prefix 0 before geographic area codes." },
  LK: { internationalPrefix: "00", nationalPrefix: "0", notes: "Sri Lanka uses trunk prefix 0 before geographic area codes." },
  NP: { internationalPrefix: "00", nationalPrefix: "0", notes: "Nepal uses trunk prefix 0 before geographic area codes." },
  IE: { internationalPrefix: "00", nationalPrefix: "0", notes: "Ireland uses trunk prefix 0. Dublin's geographic code is 1, dialed nationally as 01." },
  NL: { internationalPrefix: "00", nationalPrefix: "0", notes: "The Netherlands uses trunk prefix 0 before geographic area codes." },
  BE: { internationalPrefix: "00", nationalPrefix: "0", notes: "Belgium uses trunk prefix 0 before geographic area codes." },
  SE: { internationalPrefix: "00", nationalPrefix: "0", notes: "Sweden uses trunk prefix 0 before geographic area codes." },
  CH: { internationalPrefix: "00", nationalPrefix: "0", notes: "Switzerland uses trunk prefix 0 before geographic area codes." },
  PL: { internationalPrefix: "00", nationalPrefix: "0", notes: "Poland uses trunk prefix 0 before geographic area codes." },
  PT: { internationalPrefix: "00", nationalPrefix: "0", notes: "Portugal uses trunk prefix 0 before geographic area codes." },
  GR: { internationalPrefix: "00", nationalPrefix: "0", notes: "Greece uses trunk prefix 0 before geographic area codes." },
  CZ: { internationalPrefix: "00", nationalPrefix: "0", notes: "Czechia uses trunk prefix 0 before geographic area codes." },
  AT: { internationalPrefix: "00", nationalPrefix: "0", notes: "Austria uses trunk prefix 0. Vienna's geographic code is 1." },
  IL: { internationalPrefix: null, nationalPrefix: "0", notes: "Israel's international exit prefix depends on the carrier. Geographic codes use trunk prefix 0." },
  NO: { internationalPrefix: "00", nationalPrefix: null, notes: "Norway uses an eight-digit national number. This directory does not list Norwegian city codes until the current national plan is reviewed record by record." },
  QA: { internationalPrefix: "00", nationalPrefix: null, notes: "Qatar does not use a geographic area-code layer for ordinary national dialing." },
  KW: { internationalPrefix: "00", nationalPrefix: null, notes: "Kuwait does not use a geographic area-code layer for ordinary national dialing." },
  BH: { internationalPrefix: "00", nationalPrefix: null, notes: "Bahrain does not use a geographic area-code layer for ordinary national dialing." },
};

const sourceDefs = [
  {
    key: "mledoze",
    sourceName: "mledoze/countries",
    sourceUrl: "https://github.com/mledoze/countries",
    sourceType: "reference-dataset",
    license: "Open Database License; see the source repository",
    notes: "Country names, ISO 3166 codes, capitals, continents, currencies, languages and IDD calling-code fields.",
  },
  {
    key: "itu-e164",
    sourceName: "ITU-T Recommendation E.164",
    sourceUrl: "https://www.itu.int/rec/T-REC-E.164-202602-I/en",
    sourceType: "standard",
    license: "ITU publications",
    notes: "International public telecommunication numbering plan. Used as the numbering standard. It is not a city-code feed.",
  },
  {
    key: "itu-nnp",
    sourceName: "ITU National Numbering Plans",
    sourceUrl: "https://www.itu.int/ITU-T/inr/nnp/",
    sourceType: "official-index",
    license: "ITU",
    notes: "Index of national numbering plans published by national administrations. Individual plans were not bulk-imported.",
  },
  {
    key: "nanpa",
    sourceName: "North American Numbering Plan Administrator",
    sourceUrl: "https://www.nanpa.com/",
    sourceType: "numbering-administrator",
    license: "Public numbering assignments",
    notes: "Reference for curated United States and Canada geographic codes and for NANP member codes carried in the country dataset.",
  },
  {
    key: "ofcom",
    sourceName: "Ofcom UK Numbering",
    sourceUrl: "https://www.ofcom.org.uk/phones-and-broadband/phone-numbers",
    sourceType: "regulator",
    license: "Public numbering information",
    notes: "Reference for curated United Kingdom geographic codes.",
  },
  {
    key: "curated",
    sourceName: "Curated national numbering references",
    sourceUrl: "https://www.itu.int/ITU-T/inr/nnp/",
    sourceType: "curated-reference",
    license: "Public numbering information",
    notes: "Geographic codes compiled from widely published national plans. Each record stays unverified until a reviewer checks it against the current national source.",
  },
  {
    key: "flagcdn",
    sourceName: "flagcdn",
    sourceUrl: "https://flagcdn.com/",
    sourceType: "flag-cdn",
    license: "See flagcdn.com",
    notes: "Flag images are addressed by ISO 3166-1 alpha-2 code. They are not embedded in this repository.",
  },
];

function loc(region, regionType, city) {
  return { region, regionType, city };
}

function at(region, regionType, city, codes) {
  return codes.map(([code, note]) => ({
    code: String(code),
    note,
    locations: [loc(region, regionType, city)],
  }));
}

function shared(code, note, locations) {
  return { code: String(code), note, locations };
}

const catalog = [
  {
    iso2: "US",
    source: "nanpa",
    codes: [
      ...at("New York", "state", "New York", [
        ["212", "Manhattan."],
        ["332", "Manhattan overlay."],
        ["646", "Manhattan overlay."],
        ["718", "Brooklyn, Queens, Staten Island and the Bronx."],
        ["347", "Overlay for Brooklyn, Queens, Staten Island and the Bronx."],
        ["929", "Overlay for Brooklyn, Queens, Staten Island and the Bronx."],
        ["917", "New York City overlay used across the boroughs."],
      ]),
      ...at("California", "state", "Los Angeles", [
        ["213", "Central Los Angeles."],
        ["323", "Central Los Angeles overlay and surrounding communities."],
      ]),
      ...at("California", "state", "San Diego", [
        ["619", "San Diego."],
        ["858", "Northern San Diego."],
      ]),
      ...at("California", "state", "San Jose", [
        ["408", "San Jose."],
        ["669", "San Jose overlay."],
      ]),
      ...at("California", "state", "San Francisco", [
        ["415", "San Francisco."],
        ["628", "San Francisco overlay."],
      ]),
      ...at("Illinois", "state", "Chicago", [
        ["312", "Downtown Chicago."],
        ["773", "Chicago outside the downtown 312 area."],
        ["872", "Chicago overlay."],
      ]),
      ...at("Texas", "state", "Houston", [
        ["713", "Houston."],
        ["281", "Houston overlay."],
        ["832", "Houston overlay."],
        ["346", "Houston overlay."],
      ]),
      ...at("Texas", "state", "Dallas", [
        ["214", "Dallas."],
        ["469", "Dallas overlay."],
        ["972", "Dallas overlay."],
        ["945", "Dallas overlay."],
      ]),
      ...at("Texas", "state", "San Antonio", [
        ["210", "San Antonio."],
        ["726", "San Antonio overlay."],
      ]),
      ...at("Texas", "state", "Austin", [
        ["512", "Austin."],
        ["737", "Austin overlay."],
      ]),
      ...at("Arizona", "state", "Phoenix", [
        ["602", "Phoenix."],
        ["480", "East Valley."],
        ["623", "West Valley."],
      ]),
      ...at("Pennsylvania", "state", "Philadelphia", [
        ["215", "Philadelphia."],
        ["267", "Philadelphia overlay."],
        ["445", "Philadelphia overlay."],
      ]),
      ...at("Washington", "state", "Seattle", [["206", "Seattle."]]),
      ...at("Colorado", "state", "Denver", [
        ["303", "Denver."],
        ["720", "Denver overlay."],
      ]),
      ...at("Massachusetts", "state", "Boston", [
        ["617", "Boston."],
        ["857", "Boston overlay."],
      ]),
      ...at("Florida", "state", "Miami", [
        ["305", "Miami and the Florida Keys."],
        ["786", "Miami overlay."],
      ]),
      ...at("Georgia", "state", "Atlanta", [
        ["404", "Atlanta."],
        ["470", "Atlanta overlay."],
        ["678", "Atlanta overlay."],
      ]),
      ...at("District of Columbia", "federal_district", "Washington", [["202", "Washington, D.C."]]),
    ],
  },
  {
    iso2: "CA",
    source: "nanpa",
    codes: [
      ...at("Ontario", "province", "Toronto", [
        ["416", "Toronto."],
        ["647", "Toronto overlay."],
        ["437", "Toronto overlay."],
      ]),
      ...at("Ontario", "province", "Ottawa", [
        ["613", "Ottawa."],
        ["343", "Ottawa overlay."],
      ]),
      ...at("British Columbia", "province", "Vancouver", [
        ["604", "Vancouver and southwestern British Columbia."],
        ["778", "British Columbia overlay, including Vancouver."],
        ["236", "British Columbia overlay, including Vancouver."],
      ]),
      ...at("Quebec", "province", "Montreal", [
        ["514", "Montreal."],
        ["438", "Montreal overlay."],
      ]),
      ...at("Alberta", "province", "Calgary", [
        ["403", "Calgary and southern Alberta."],
        ["587", "Alberta overlay, including Calgary."],
        ["825", "Alberta overlay, including Calgary."],
      ]),
    ],
  },
  {
    iso2: "GB",
    source: "ofcom",
    codes: [
      ...at("England", "constituent_country", "London", [["20", "London. Dialed nationally as 020."]]),
      ...at("England", "constituent_country", "Manchester", [["161", "Manchester. Dialed nationally as 0161."]]),
      ...at("England", "constituent_country", "Birmingham", [["121", "Birmingham. Dialed nationally as 0121."]]),
      ...at("England", "constituent_country", "Liverpool", [["151", "Liverpool. Dialed nationally as 0151."]]),
      ...at("England", "constituent_country", "Leeds", [["113", "Leeds. Dialed nationally as 0113."]]),
      ...at("England", "constituent_country", "Bristol", [["117", "Bristol. Dialed nationally as 0117."]]),
      ...at("Scotland", "constituent_country", "Glasgow", [["141", "Glasgow. Dialed nationally as 0141."]]),
      ...at("Scotland", "constituent_country", "Edinburgh", [["131", "Edinburgh. Dialed nationally as 0131."]]),
      ...at("Wales", "constituent_country", "Cardiff", [["29", "Cardiff. Dialed nationally as 029."]]),
      ...at("Northern Ireland", "constituent_country", "Belfast", [["28", "Belfast. Dialed nationally as 028."]]),
    ],
  },
  {
    iso2: "PK",
    source: "curated",
    uncoded: [loc("Gilgit-Baltistan", "region", "Gilgit")],
    codes: [
      ...at("Sindh", "province", "Karachi", [["21", "Karachi."]]),
      ...at("Sindh", "province", "Hyderabad", [["22", "Hyderabad, Sindh."]]),
      ...at("Punjab", "province", "Lahore", [["42", "Lahore."]]),
      ...at("Punjab", "province", "Faisalabad", [["41", "Faisalabad."]]),
      ...at("Punjab", "province", "Multan", [["61", "Multan."]]),
      shared("51", "Shared by Islamabad and Rawalpindi.", [
        loc("Islamabad Capital Territory", "capital_territory", "Islamabad"),
        loc("Punjab", "province", "Rawalpindi"),
      ]),
      ...at("Khyber Pakhtunkhwa", "province", "Peshawar", [["91", "Peshawar."]]),
      ...at("Balochistan", "province", "Quetta", [["81", "Quetta."]]),
    ],
  },
  {
    iso2: "IN",
    source: "curated",
    codes: [
      ...at("Delhi", "union_territory", "New Delhi", [["11", "Delhi."]]),
      ...at("Maharashtra", "state", "Mumbai", [["22", "Mumbai."]]),
      ...at("Maharashtra", "state", "Pune", [["20", "Pune."]]),
      ...at("West Bengal", "state", "Kolkata", [["33", "Kolkata."]]),
      ...at("Tamil Nadu", "state", "Chennai", [["44", "Chennai."]]),
      ...at("Karnataka", "state", "Bengaluru", [["80", "Bengaluru."]]),
      ...at("Telangana", "state", "Hyderabad", [["40", "Hyderabad."]]),
      ...at("Gujarat", "state", "Ahmedabad", [["79", "Ahmedabad."]]),
      ...at("Rajasthan", "state", "Jaipur", [["141", "Jaipur."]]),
      ...at("Uttar Pradesh", "state", "Lucknow", [["522", "Lucknow."]]),
      ...at("Chandigarh", "union_territory", "Chandigarh", [["172", "Chandigarh."]]),
      ...at("Kerala", "state", "Kochi", [["484", "Kochi."]]),
    ],
  },
  {
    iso2: "AU",
    source: "curated",
    codes: [
      shared("2", "Covers New South Wales and the Australian Capital Territory. It is not a single-city code.", [
        loc("New South Wales", "state", "Sydney"),
        loc("Australian Capital Territory", "territory", "Canberra"),
      ]),
      shared("3", "Covers Victoria and Tasmania. It is not a single-city code.", [
        loc("Victoria", "state", "Melbourne"),
        loc("Tasmania", "state", "Hobart"),
      ]),
      shared("7", "Covers Queensland, including Brisbane. It is not a single-city code.", [
        loc("Queensland", "state", "Brisbane"),
      ]),
      shared("8", "Covers South Australia, Western Australia and the Northern Territory. It is not a single-city code.", [
        loc("Western Australia", "state", "Perth"),
        loc("South Australia", "state", "Adelaide"),
        loc("Northern Territory", "territory", "Darwin"),
      ]),
    ],
  },
  {
    iso2: "DE",
    source: "curated",
    codes: [
      ...at("Berlin", "state", "Berlin", [["30", "Berlin."]]),
      ...at("Hamburg", "state", "Hamburg", [["40", "Hamburg."]]),
      ...at("Bavaria", "state", "Munich", [["89", "Munich."]]),
      ...at("North Rhine-Westphalia", "state", "Cologne", [["221", "Cologne."]]),
      ...at("North Rhine-Westphalia", "state", "Düsseldorf", [["211", "Düsseldorf."]]),
      ...at("Hesse", "state", "Frankfurt", [["69", "Frankfurt."]]),
      ...at("Baden-Württemberg", "state", "Stuttgart", [["711", "Stuttgart."]]),
      ...at("Saxony", "state", "Leipzig", [["341", "Leipzig."]]),
    ],
  },
  {
    iso2: "FR",
    source: "curated",
    codes: [
      shared("1", "Geographic zone for Île-de-France, dialed nationally as 01. It is not unique to the municipality of Paris.", [
        loc("Île-de-France", "region", "Paris"),
      ]),
    ],
  },
  {
    iso2: "JP",
    source: "curated",
    codes: [
      ...at("Tokyo", "prefecture", "Tokyo", [["3", "Tokyo."]]),
      ...at("Osaka", "prefecture", "Osaka", [["6", "Osaka."]]),
      ...at("Kanagawa", "prefecture", "Yokohama", [["45", "Yokohama."]]),
      ...at("Aichi", "prefecture", "Nagoya", [["52", "Nagoya."]]),
      ...at("Hokkaido", "prefecture", "Sapporo", [["11", "Sapporo."]]),
      ...at("Kyoto", "prefecture", "Kyoto", [["75", "Kyoto."]]),
      ...at("Hyogo", "prefecture", "Kobe", [["78", "Kobe."]]),
      ...at("Fukuoka", "prefecture", "Fukuoka", [["92", "Fukuoka."]]),
    ],
  },
  {
    iso2: "CN",
    source: "curated",
    codes: [
      ...at("Beijing", "municipality", "Beijing", [["10", "Beijing."]]),
      ...at("Shanghai", "municipality", "Shanghai", [["21", "Shanghai."]]),
      ...at("Tianjin", "municipality", "Tianjin", [["22", "Tianjin."]]),
      ...at("Chongqing", "municipality", "Chongqing", [["23", "Chongqing."]]),
      ...at("Guangdong", "province", "Guangzhou", [["20", "Guangzhou."]]),
      ...at("Guangdong", "province", "Shenzhen", [["755", "Shenzhen."]]),
      ...at("Sichuan", "province", "Chengdu", [["28", "Chengdu."]]),
      ...at("Zhejiang", "province", "Hangzhou", [["571", "Hangzhou."]]),
      ...at("Jiangsu", "province", "Nanjing", [["25", "Nanjing."]]),
      ...at("Hubei", "province", "Wuhan", [["27", "Wuhan."]]),
      ...at("Shaanxi", "province", "Xi'an", [["29", "Xi'an."]]),
    ],
  },
  {
    iso2: "AE",
    source: "curated",
    codes: [
      ...at("Abu Dhabi", "emirate", "Abu Dhabi", [["2", "Abu Dhabi."]]),
      ...at("Abu Dhabi", "emirate", "Al Ain", [["3", "Al Ain."]]),
      ...at("Dubai", "emirate", "Dubai", [["4", "Dubai."]]),
      shared("6", "Shared by Sharjah, Ajman and Umm Al Quwain.", [
        loc("Sharjah", "emirate", "Sharjah"),
        loc("Ajman", "emirate", "Ajman"),
        loc("Umm Al Quwain", "emirate", "Umm Al Quwain"),
      ]),
      ...at("Ras Al Khaimah", "emirate", "Ras Al Khaimah", [["7", "Ras Al Khaimah."]]),
      ...at("Fujairah", "emirate", "Fujairah", [["9", "Fujairah."]]),
    ],
  },
  {
    iso2: "SA",
    source: "curated",
    codes: [
      ...at("Riyadh", "province", "Riyadh", [["11", "Riyadh."]]),
      shared("12", "Shared by Jeddah and Mecca.", [
        loc("Makkah", "province", "Jeddah"),
        loc("Makkah", "province", "Mecca"),
      ]),
      ...at("Eastern Province", "province", "Dammam", [["13", "Dammam."]]),
      ...at("Al Madinah", "province", "Medina", [["14", "Medina."]]),
    ],
  },
  {
    iso2: "BR",
    source: "curated",
    codes: [
      ...at("São Paulo", "state", "São Paulo", [["11", "São Paulo."]]),
      ...at("Rio de Janeiro", "state", "Rio de Janeiro", [["21", "Rio de Janeiro."]]),
      ...at("Federal District", "federal_district", "Brasília", [["61", "Brasília."]]),
      ...at("Minas Gerais", "state", "Belo Horizonte", [["31", "Belo Horizonte."]]),
      ...at("Bahia", "state", "Salvador", [["71", "Salvador."]]),
      ...at("Ceará", "state", "Fortaleza", [["85", "Fortaleza."]]),
      ...at("Paraná", "state", "Curitiba", [["41", "Curitiba."]]),
      ...at("Pernambuco", "state", "Recife", [["81", "Recife."]]),
      ...at("Rio Grande do Sul", "state", "Porto Alegre", [["51", "Porto Alegre."]]),
    ],
  },
  {
    iso2: "MX",
    source: "curated",
    codes: [
      ...at("Mexico City", "federal_entity", "Mexico City", [["55", "Mexico City."]]),
      ...at("Jalisco", "state", "Guadalajara", [["33", "Guadalajara."]]),
      ...at("Nuevo León", "state", "Monterrey", [["81", "Monterrey."]]),
    ],
  },
  {
    iso2: "ZA",
    source: "curated",
    codes: [
      ...at("Gauteng", "province", "Johannesburg", [["11", "Johannesburg."]]),
      ...at("Gauteng", "province", "Pretoria", [["12", "Pretoria."]]),
      ...at("Western Cape", "province", "Cape Town", [["21", "Cape Town."]]),
      ...at("KwaZulu-Natal", "province", "Durban", [["31", "Durban."]]),
    ],
  },
  {
    iso2: "EG",
    source: "curated",
    codes: [
      ...at("Cairo", "governorate", "Cairo", [["2", "Cairo."]]),
      ...at("Alexandria", "governorate", "Alexandria", [["3", "Alexandria."]]),
    ],
  },
  {
    iso2: "TR",
    source: "curated",
    codes: [
      ...at("Istanbul", "province", "Istanbul", [
        ["212", "European side of Istanbul."],
        ["216", "Asian side of Istanbul."],
      ]),
      ...at("Ankara", "province", "Ankara", [["312", "Ankara."]]),
      ...at("İzmir", "province", "İzmir", [["232", "İzmir."]]),
    ],
  },
  {
    iso2: "ES",
    source: "curated",
    codes: [
      ...at("Community of Madrid", "autonomous_community", "Madrid", [["91", "Madrid."]]),
      ...at("Catalonia", "autonomous_community", "Barcelona", [["93", "Barcelona."]]),
      ...at("Valencian Community", "autonomous_community", "Valencia", [["96", "Valencia."]]),
      ...at("Andalusia", "autonomous_community", "Seville", [["95", "Seville."]]),
      ...at("Basque Country", "autonomous_community", "Bilbao", [["94", "Bilbao."]]),
    ],
  },
  {
    iso2: "IT",
    source: "curated",
    codes: [
      ...at("Lazio", "region", "Rome", [["6", "Rome. Dialed nationally as 06."]]),
      ...at("Lombardy", "region", "Milan", [["2", "Milan. Dialed nationally as 02."]]),
      ...at("Campania", "region", "Naples", [["81", "Naples. Dialed nationally as 081."]]),
      ...at("Piedmont", "region", "Turin", [["11", "Turin. Dialed nationally as 011."]]),
      ...at("Tuscany", "region", "Florence", [["55", "Florence. Dialed nationally as 055."]]),
    ],
  },
  {
    iso2: "MY",
    source: "curated",
    codes: [
      ...at("Kuala Lumpur", "federal_territory", "Kuala Lumpur", [["3", "Kuala Lumpur."]]),
      ...at("Penang", "state", "George Town", [["4", "Penang, including George Town."]]),
      ...at("Johor", "state", "Johor Bahru", [["7", "Johor, including Johor Bahru."]]),
    ],
  },
  {
    iso2: "NZ",
    source: "curated",
    codes: [
      ...at("Auckland", "region", "Auckland", [["9", "Auckland."]]),
      ...at("Wellington", "region", "Wellington", [["4", "Wellington."]]),
      ...at("Canterbury", "region", "Christchurch", [["3", "Christchurch and Canterbury."]]),
    ],
  },
  {
    iso2: "ID",
    source: "curated",
    codes: [
      ...at("Jakarta", "capital_district", "Jakarta", [["21", "Jakarta."]]),
      ...at("East Java", "province", "Surabaya", [["31", "Surabaya."]]),
      ...at("West Java", "province", "Bandung", [["22", "Bandung."]]),
      ...at("North Sumatra", "province", "Medan", [["61", "Medan."]]),
    ],
  },
  {
    iso2: "PH",
    source: "curated",
    codes: [
      ...at("Metro Manila", "region", "Manila", [["2", "Metro Manila."]]),
      ...at("Central Visayas", "region", "Cebu City", [["32", "Cebu."]]),
      ...at("Davao Region", "region", "Davao City", [["82", "Davao."]]),
    ],
  },
  {
    iso2: "BD",
    source: "curated",
    codes: [
      ...at("Dhaka Division", "division", "Dhaka", [["2", "Dhaka."]]),
      ...at("Chattogram Division", "division", "Chattogram", [["31", "Chattogram."]]),
    ],
  },
  {
    iso2: "LK",
    source: "curated",
    codes: [
      ...at("Western Province", "province", "Colombo", [["11", "Colombo."]]),
      ...at("Central Province", "province", "Kandy", [["81", "Kandy."]]),
    ],
  },
  {
    iso2: "NP",
    source: "curated",
    codes: [
      ...at("Bagmati", "province", "Kathmandu", [["1", "Kathmandu."]]),
      ...at("Gandaki", "province", "Pokhara", [["61", "Pokhara."]]),
    ],
  },
  {
    iso2: "AR",
    source: "curated",
    codes: [
      ...at("Buenos Aires", "autonomous_city", "Buenos Aires", [["11", "Buenos Aires."]]),
      ...at("Córdoba", "province", "Córdoba", [["351", "Córdoba."]]),
      ...at("Santa Fe", "province", "Rosario", [["341", "Rosario."]]),
    ],
  },
  {
    iso2: "TH",
    source: "curated",
    codes: [
      ...at("Bangkok", "special_administrative_area", "Bangkok", [["2", "Bangkok."]]),
      ...at("Chiang Mai", "province", "Chiang Mai", [["53", "Chiang Mai."]]),
    ],
  },
  {
    iso2: "VN",
    source: "curated",
    codes: [
      ...at("Hanoi", "municipality", "Hanoi", [["24", "Hanoi."]]),
      ...at("Ho Chi Minh City", "municipality", "Ho Chi Minh City", [["28", "Ho Chi Minh City."]]),
      ...at("Da Nang", "municipality", "Da Nang", [["236", "Da Nang."]]),
    ],
  },
  {
    iso2: "KR",
    source: "curated",
    codes: [
      ...at("Seoul", "special_city", "Seoul", [["2", "Seoul."]]),
      ...at("Busan", "metropolitan_city", "Busan", [["51", "Busan."]]),
      ...at("Incheon", "metropolitan_city", "Incheon", [["32", "Incheon."]]),
    ],
  },
  {
    iso2: "KE",
    source: "curated",
    codes: [
      ...at("Nairobi", "county", "Nairobi", [["20", "Nairobi."]]),
      ...at("Mombasa", "county", "Mombasa", [["41", "Mombasa."]]),
    ],
  },
  {
    iso2: "GH",
    source: "curated",
    codes: [
      ...at("Greater Accra", "region", "Accra", [["30", "Accra."]]),
      ...at("Ashanti", "region", "Kumasi", [["32", "Kumasi."]]),
    ],
  },
  {
    iso2: "IE",
    source: "curated",
    codes: [
      ...at("Leinster", "province", "Dublin", [["1", "Dublin. Dialed nationally as 01."]]),
      ...at("Munster", "province", "Cork", [["21", "Cork. Dialed nationally as 021."]]),
    ],
  },
  {
    iso2: "NL",
    source: "curated",
    codes: [
      ...at("North Holland", "province", "Amsterdam", [["20", "Amsterdam."]]),
      ...at("South Holland", "province", "Rotterdam", [["10", "Rotterdam."]]),
      ...at("South Holland", "province", "The Hague", [["70", "The Hague."]]),
    ],
  },
  {
    iso2: "BE",
    source: "curated",
    codes: [
      ...at("Brussels", "region", "Brussels", [["2", "Brussels."]]),
      ...at("Flanders", "region", "Antwerp", [["3", "Antwerp."]]),
    ],
  },
  {
    iso2: "SE",
    source: "curated",
    codes: [
      ...at("Stockholm", "county", "Stockholm", [["8", "Stockholm."]]),
      ...at("Västra Götaland", "county", "Gothenburg", [["31", "Gothenburg."]]),
      ...at("Skåne", "county", "Malmö", [["40", "Malmö."]]),
    ],
  },
  {
    iso2: "CH",
    source: "curated",
    codes: [
      ...at("Zurich", "canton", "Zurich", [["44", "Zurich."]]),
      ...at("Geneva", "canton", "Geneva", [["22", "Geneva."]]),
      ...at("Bern", "canton", "Bern", [["31", "Bern."]]),
      ...at("Basel-Stadt", "canton", "Basel", [["61", "Basel."]]),
    ],
  },
  {
    iso2: "PL",
    source: "curated",
    codes: [
      ...at("Masovian", "voivodeship", "Warsaw", [["22", "Warsaw."]]),
      ...at("Lesser Poland", "voivodeship", "Kraków", [["12", "Kraków."]]),
    ],
  },
  {
    iso2: "PT",
    source: "curated",
    codes: [
      ...at("Lisbon", "district", "Lisbon", [["21", "Lisbon."]]),
      ...at("Porto", "district", "Porto", [["22", "Porto."]]),
    ],
  },
  {
    iso2: "GR",
    source: "curated",
    codes: [
      ...at("Attica", "region", "Athens", [["21", "Athens."]]),
      ...at("Central Macedonia", "region", "Thessaloniki", [["231", "Thessaloniki."]]),
    ],
  },
  {
    iso2: "CZ",
    source: "curated",
    codes: [...at("Prague", "capital", "Prague", [["2", "Prague."]])],
  },
  {
    iso2: "AT",
    source: "curated",
    codes: [
      ...at("Vienna", "state", "Vienna", [["1", "Vienna."]]),
      ...at("Salzburg", "state", "Salzburg", [["662", "Salzburg."]]),
      ...at("Styria", "state", "Graz", [["316", "Graz."]]),
    ],
  },
  {
    iso2: "IL",
    source: "curated",
    codes: [
      ...at("Jerusalem", "district", "Jerusalem", [["2", "Jerusalem."]]),
      ...at("Tel Aviv", "district", "Tel Aviv", [["3", "Tel Aviv."]]),
      ...at("Haifa", "district", "Haifa", [["4", "Haifa."]]),
    ],
  },
];

const now = new Date().toISOString();
const sources = sourceDefs.map((source) => ({
  id: idFor(`source:${source.key}`),
  key: source.key,
  sourceName: source.sourceName,
  sourceUrl: source.sourceUrl,
  sourceType: source.sourceType,
  license: source.license,
  lastCheckedAt: now,
  notes: source.notes,
  createdAt: now,
}));
const sourceId = Object.fromEntries(sources.map((source) => [source.key, source.id]));

const countries = [];
const regions = [];
const cities = [];
const areaCodes = [];
const areaCodeLocations = [];

const regionKey = new Map();
const cityKey = new Map();

function ensureRegion(country, place) {
  const key = `${country.iso2}:${slugify(place.region)}`;
  if (regionKey.has(key)) return regionKey.get(key);
  const region = {
    id: idFor(`region:${key}`),
    countryId: country.id,
    name: place.region,
    slug: slugify(place.region),
    regionType: place.regionType,
    description: "",
    status: "published",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  regions.push(region);
  regionKey.set(key, region);
  return region;
}

function ensureCity(country, region, cityName) {
  const key = `${country.iso2}:${region.slug}:${slugify(cityName)}`;
  if (cityKey.has(key)) return cityKey.get(key);
  const city = {
    id: idFor(`city:${key}`),
    countryId: country.id,
    regionId: region.id,
    name: cityName,
    slug: slugify(cityName),
    latitude: null,
    longitude: null,
    description: "",
    status: "published",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  cities.push(city);
  cityKey.set(key, city);
  return city;
}

for (const country of rawCountries) {
  const iso2 = country.cca2;
  const codes = Object.prototype.hasOwnProperty.call(callingOverrides, iso2)
    ? callingOverrides[iso2]
    : callingCodesFor(country);
  const currencyEntry = country.currencies ? Object.entries(country.currencies)[0] : null;
  const languages = country.languages ? Object.values(country.languages) : [];
  const aliases = [];
  if (iso2 === "US") aliases.push("usa");
  if (iso2 === "GB") aliases.push("uk", "britain");
  const plan = dialing[iso2];
  const name = country.name.common;
  const record = {
    id: idFor(`country:${iso2}`),
    name,
    officialName: country.name.official || name,
    slug: slugify(name),
    aliases,
    iso2,
    iso3: country.cca3,
    callingCode: codes[0] || null,
    callingCodes: codes,
    capital: country.capital?.[0] || null,
    continent: continentName[country.region] || country.region || null,
    subregion: country.subregion || null,
    currencyCode: currencyEntry ? currencyEntry[0] : null,
    currencyName: currencyEntry ? currencyEntry[1].name : null,
    currencySymbol: currencyEntry ? currencyEntry[1].symbol || null : null,
    languages,
    flagEmoji: country.flag || null,
    flagUrl: `https://flagcdn.com/w160/${iso2.toLowerCase()}.png`,
    timezones: [],
    internationalPrefix: plan?.internationalPrefix ?? null,
    nationalPrefix: plan?.nationalPrefix ?? null,
    numberingNotes: plan?.notes || "A verified national numbering-plan summary has not been added for this record yet.",
    description: codes.length
      ? `${name} is listed with international calling code ${codes.join(", ")}.`
      : `${name} has no international calling code in the reference dataset.`,
    sourceId: sourceId.mledoze,
    status: "published",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  countries.push(record);
}

const countryByIso = Object.fromEntries(countries.map((country) => [country.iso2, country]));

function formatTemplate(country, code) {
  const prefix = country.callingCode ? country.callingCode : "+";
  return `${prefix} ${code} [subscriber number]`;
}

function dialingInstructions(country, code) {
  const calling = country.callingCode ? country.callingCode.replace("+", "") : null;
  const trunk = country.nationalPrefix
    ? `Inside the country, dial trunk prefix ${country.nationalPrefix} before ${code} when the national plan uses one.`
    : "A national trunk prefix is not recorded for this country.";
  const abroad = calling
    ? `From abroad, dial the exit prefix used in the country you are calling from, then ${calling}, then ${code}, then the subscriber number. Omit the trunk prefix on an international call.`
    : "An international calling code is not recorded, so an international format cannot be assembled.";
  return `${trunk} ${abroad}`;
}

const areaKey = new Map();

function addAreaCode(country, sourceKey, entry) {
  const key = `${country.iso2}:${entry.code}`;
  let area = areaKey.get(key);
  if (!area) {
    area = {
      id: idFor(`area:${key}`),
      countryId: country.id,
      code: entry.code,
      codeType: entry.codeType || "geographic",
      nationalPrefix: country.nationalPrefix,
      internationalFormat: formatTemplate(country, entry.code),
      dialingInstructions: dialingInstructions(country, entry.code),
      notes: entry.note || "",
      sourceId: sourceId[sourceKey] || sourceId.curated,
      verificationStatus: "pending",
      verifiedAt: null,
      status: "published",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    areaCodes.push(area);
    areaKey.set(key, area);
  }
  for (const place of entry.locations || []) {
    const region = ensureRegion(country, place);
    const city = place.city ? ensureCity(country, region, place.city) : null;
    const locationId = idFor(`loc:${area.id}:${region.id}:${city?.id || "none"}`);
    if (areaCodeLocations.some((location) => location.id === locationId)) continue;
    areaCodeLocations.push({
      id: locationId,
      areaCodeId: area.id,
      countryId: country.id,
      regionId: region.id,
      cityId: city?.id || null,
      createdAt: now,
    });
  }
  if (!entry.locations?.length) {
    const locationId = idFor(`loc:${area.id}:country`);
    areaCodeLocations.push({
      id: locationId,
      areaCodeId: area.id,
      countryId: country.id,
      regionId: null,
      cityId: null,
      createdAt: now,
    });
  }
}

for (const entry of catalog) {
  const country = countryByIso[entry.iso2];
  if (!country) throw new Error(`Unknown catalog country ${entry.iso2}`);
  for (const place of entry.uncoded || []) ensureRegion(country, place), ensureCity(country, ensureRegion(country, place), place.city);
  for (const code of entry.codes || []) addAreaCode(country, entry.source, { ...code, codeType: "geographic" });
}

for (const country of rawCountries) {
  if (country.idd?.root !== "+1") continue;
  if (country.cca2 === "US" || country.cca2 === "CA") continue;
  const record = countryByIso[country.cca2];
  for (const suffix of country.idd.suffixes || []) {
    addAreaCode(record, "nanpa", {
      code: suffix,
      codeType: "nanp",
      note: `NANP area code published for ${record.name} in the country reference dataset. It is not assigned here to a single city.`,
      locations: [],
    });
  }
}

const settings = {
  websiteName: "World Area Code Directory",
  seoTitle: "World Area Code Directory",
  seoDescription: "Find international calling codes, regional dialing information and telephone numbering details worldwide.",
  contactEmail: "hello@worldareacodes.example",
  logoUrl: "/logo.svg",
  faviconUrl: "/favicon.ico",
  socialLinks: { x: "", github: "" },
  maintenanceMode: false,
  updatedAt: now,
};

const seed = {
  seedVersion: 1,
  generatedAt: now,
  countries,
  regions,
  cities,
  areaCodes,
  areaCodeLocations,
  dataSources: sources.map(({ key, ...source }) => source),
  adminUsers: [],
  auditLogs: [],
  searchLogs: [],
  newsletterSubscribers: [],
  contactMessages: [],
  settings,
};

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(seed));

console.log(
  JSON.stringify(
    {
      countries: countries.length,
      regions: regions.length,
      cities: cities.length,
      areaCodes: areaCodes.length,
      locations: areaCodeLocations.length,
      withCallingCode: countries.filter((country) => country.callingCode).length,
      withoutCallingCode: countries.filter((country) => !country.callingCode).map((country) => country.iso2),
    },
    null,
    2,
  ),
);
