import type { LocationDef } from "./types";

export const LOCATIONS: LocationDef[] = [
  { id: "pune-in", group: "India", label: "Pune, India", city: "Pune", country: "India", countryCode: "IN", airportCode: "PNQ", slug: "pune", geo: [18.5204, 73.8567], mapCoords: { leftPct: 64, topPct: 45 } },
  { id: "mumbai-in", group: "India", label: "Mumbai, India", city: "Mumbai", country: "India", countryCode: "IN", airportCode: "BOM", slug: "mumbai", geo: [19.076, 72.8777], mapCoords: { leftPct: 63, topPct: 47 } },
  { id: "delhi-in", group: "India", label: "Delhi, India", city: "Delhi", country: "India", countryCode: "IN", airportCode: "DEL", slug: "delhi", geo: [28.6139, 77.209], mapCoords: { leftPct: 65, topPct: 41 } },
  { id: "bengaluru-in", group: "India", label: "Bengaluru, India", city: "Bengaluru", country: "India", countryCode: "IN", airportCode: "BLR", slug: "bengaluru", geo: [12.9716, 77.5946], mapCoords: { leftPct: 65, topPct: 50 } },
  { id: "hyderabad-in", group: "India", label: "Hyderabad, India", city: "Hyderabad", country: "India", countryCode: "IN", airportCode: "HYD", slug: "hyderabad", geo: [17.385, 78.4867], mapCoords: { leftPct: 65, topPct: 47 } },
  { id: "chennai-in", group: "India", label: "Chennai, India", city: "Chennai", country: "India", countryCode: "IN", airportCode: "MAA", slug: "chennai", geo: [13.0827, 80.2707], mapCoords: { leftPct: 66, topPct: 50 } },
  { id: "goa-in", group: "India", label: "Goa, India", city: "Goa", country: "India", countryCode: "IN", airportCode: "GOI", slug: "goa", geo: [15.2993, 74.124], mapCoords: { leftPct: 63, topPct: 49 } },
  { id: "jaipur-in", group: "India", label: "Jaipur, India", city: "Jaipur", country: "India", countryCode: "IN", airportCode: "JAI", slug: "jaipur", geo: [26.9124, 75.7873], mapCoords: { leftPct: 64, topPct: 42 } },
  { id: "kolkata-in", group: "India", label: "Kolkata, India", city: "Kolkata", country: "India", countryCode: "IN", airportCode: "CCU", slug: "kolkata", geo: [22.5726, 88.3639], mapCoords: { leftPct: 68, topPct: 45 } },
  { id: "ahmedabad-in", group: "India", label: "Ahmedabad, India", city: "Ahmedabad", country: "India", countryCode: "IN", airportCode: "AMD", slug: "ahmedabad", geo: [23.0225, 72.5714], mapCoords: { leftPct: 63, topPct: 44 } },

  { id: "seattle-us", group: "United States", label: "Seattle, United States", city: "Seattle", country: "United States", countryCode: "US", airportCode: "SEA", slug: "seattle", geo: [47.6062, -122.3321], mapCoords: { leftPct: 14, topPct: 33 } },
  { id: "tempe-us", group: "United States", label: "Tempe, United States", city: "Tempe", country: "United States", countryCode: "US", airportCode: "PHX", slug: "tempe", geo: [33.4255, -111.94], mapCoords: { leftPct: 16, topPct: 45 } },
  { id: "san-francisco-us", group: "United States", label: "San Francisco, United States", city: "San Francisco", country: "United States", countryCode: "US", airportCode: "SFO", slug: "san-francisco", geo: [37.7749, -122.4194], mapCoords: { leftPct: 13, topPct: 42 } },
  { id: "new-york-us", group: "United States", label: "New York, United States", city: "New York", country: "United States", countryCode: "US", airportCode: "JFK", slug: "new-york", geo: [40.7128, -74.006], mapCoords: { leftPct: 26, topPct: 39 } },
  { id: "los-angeles-us", group: "United States", label: "Los Angeles, United States", city: "Los Angeles", country: "United States", countryCode: "US", airportCode: "LAX", slug: "los-angeles", geo: [34.0522, -118.2437], mapCoords: { leftPct: 14, topPct: 45 } },
  { id: "chicago-us", group: "United States", label: "Chicago, United States", city: "Chicago", country: "United States", countryCode: "US", airportCode: "ORD", slug: "chicago", geo: [41.8781, -87.6298], mapCoords: { leftPct: 22, topPct: 40 } },
  { id: "austin-us", group: "United States", label: "Austin, United States", city: "Austin", country: "United States", countryCode: "US", airportCode: "AUS", slug: "austin", geo: [30.2672, -97.7431], mapCoords: { leftPct: 21, topPct: 49 } },
  { id: "boston-us", group: "United States", label: "Boston, United States", city: "Boston", country: "United States", countryCode: "US", airportCode: "BOS", slug: "boston", geo: [42.3601, -71.0589], mapCoords: { leftPct: 27, topPct: 38 } },
  { id: "washington-dc-us", group: "United States", label: "Washington, DC, United States", city: "Washington, DC", country: "United States", countryCode: "US", airportCode: "DCA", slug: "washington-dc", geo: [38.9072, -77.0369], mapCoords: { leftPct: 26, topPct: 41 } },
  { id: "miami-us", group: "United States", label: "Miami, United States", city: "Miami", country: "United States", countryCode: "US", airportCode: "MIA", slug: "miami", geo: [25.7617, -80.1918], mapCoords: { leftPct: 26, topPct: 53 } },

  { id: "london-gb", group: "Other", label: "London, United Kingdom", city: "London", country: "United Kingdom", countryCode: "GB", airportCode: "LHR", slug: "london", geo: [51.5072, -0.1276], mapCoords: { leftPct: 47, topPct: 34 } },
  { id: "paris-fr", group: "Other", label: "Paris, France", city: "Paris", country: "France", countryCode: "FR", airportCode: "CDG", slug: "paris", geo: [48.8566, 2.3522], mapCoords: { leftPct: 48, topPct: 36 } },
  { id: "tokyo-jp", group: "Other", label: "Tokyo, Japan", city: "Tokyo", country: "Japan", countryCode: "JP", airportCode: "HND", slug: "tokyo", geo: [35.6762, 139.6503], mapCoords: { leftPct: 82, topPct: 42 } },
  { id: "singapore-sg", group: "Other", label: "Singapore", city: "Singapore", country: "Singapore", countryCode: "SG", airportCode: "SIN", slug: "singapore", geo: [1.3521, 103.8198], mapCoords: { leftPct: 73, topPct: 62 } },
  { id: "dubai-ae", group: "Other", label: "Dubai, United Arab Emirates", city: "Dubai", country: "United Arab Emirates", countryCode: "AE", airportCode: "DXB", slug: "dubai", geo: [25.2048, 55.2708], mapCoords: { leftPct: 59, topPct: 48 } },
  { id: "toronto-ca", group: "Other", label: "Toronto, Canada", city: "Toronto", country: "Canada", countryCode: "CA", airportCode: "YYZ", slug: "toronto", geo: [43.6532, -79.3832], mapCoords: { leftPct: 25, topPct: 38 } },
];

export const LOCATION_BY_ID = new Map(LOCATIONS.map((location) => [location.id, location]));
