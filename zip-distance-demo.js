// This is a demonstration of the Haversine formula for calculating distances between ZIP codes

// Sample ZIP code database with latitude and longitude
const zipCodeDatabase = [
  { zip: "10001", latitude: 40.7501, longitude: -73.9964, city: "New York", state: "NY" },
  { zip: "10002", latitude: 40.7168, longitude: -73.9861, city: "New York", state: "NY" },
  { zip: "10003", latitude: 40.7335, longitude: -73.9905, city: "New York", state: "NY" },
  { zip: "10004", latitude: 40.7037, longitude: -74.012, city: "New York", state: "NY" },
  { zip: "10005", latitude: 40.7047, longitude: -74.008, city: "New York", state: "NY" },
  { zip: "10006", latitude: 40.7092, longitude: -74.0113, city: "New York", state: "NY" },
  { zip: "10007", latitude: 40.7145, longitude: -74.0071, city: "New York", state: "NY" },
  { zip: "90001", latitude: 33.9731, longitude: -118.2479, city: "Los Angeles", state: "CA" },
  { zip: "90002", latitude: 33.9497, longitude: -118.2462, city: "Los Angeles", state: "CA" },
  { zip: "90003", latitude: 33.9653, longitude: -118.2729, city: "Los Angeles", state: "CA" },
  { zip: "60601", latitude: 41.8855, longitude: -87.6221, city: "Chicago", state: "IL" },
  { zip: "60602", latitude: 41.8836, longitude: -87.6302, city: "Chicago", state: "IL" },
  { zip: "60603", latitude: 41.8802, longitude: -87.6267, city: "Chicago", state: "IL" },
  { zip: "60604", latitude: 41.8789, longitude: -87.6291, city: "Chicago", state: "IL" },
  { zip: "60605", latitude: 41.8675, longitude: -87.6224, city: "Chicago", state: "IL" },
  { zip: "60606", latitude: 41.8822, longitude: -87.6344, city: "Chicago", state: "IL" },
  { zip: "60607", latitude: 41.8747, longitude: -87.6503, city: "Chicago", state: "IL" },
  { zip: "77001", latitude: 29.7604, longitude: -95.3698, city: "Houston", state: "TX" },
  { zip: "77002", latitude: 29.7543, longitude: -95.3609, city: "Houston", state: "TX" },
  { zip: "77003", latitude: 29.746, longitude: -95.3433, city: "Houston", state: "TX" },
  { zip: "77004", latitude: 29.7219, longitude: -95.3628, city: "Houston", state: "TX" },
  { zip: "77005", latitude: 29.7174, longitude: -95.4235, city: "Houston", state: "TX" },
  { zip: "33101", latitude: 25.7742, longitude: -80.1936, city: "Miami", state: "FL" },
  { zip: "33102", latitude: 25.7839, longitude: -80.2102, city: "Miami", state: "FL" },
  { zip: "33109", latitude: 25.7616, longitude: -80.1196, city: "Miami Beach", state: "FL" },
  { zip: "33122", latitude: 25.8032, longitude: -80.2906, city: "Miami", state: "FL" },
  { zip: "33124", latitude: 25.7617, longitude: -80.1918, city: "Miami", state: "FL" },
  { zip: "33125", latitude: 25.7742, longitude: -80.2366, city: "Miami", state: "FL" },
  { zip: "33126", latitude: 25.782, longitude: -80.3045, city: "Miami", state: "FL" },
  { zip: "33127", latitude: 25.8099, longitude: -80.1995, city: "Miami", state: "FL" },
  { zip: "33128", latitude: 25.7774, longitude: -80.1968, city: "Miami", state: "FL" },
  { zip: "33129", latitude: 25.7582, longitude: -80.2053, city: "Miami", state: "FL" },
  { zip: "33130", latitude: 25.7664, longitude: -80.1951, city: "Miami", state: "FL" },
  { zip: "33131", latitude: 25.7697, longitude: -80.1892, city: "Miami", state: "FL" },
  { zip: "33132", latitude: 25.7825, longitude: -80.1883, city: "Miami", state: "FL" },
  { zip: "33133", latitude: 25.742, longitude: -80.2381, city: "Miami", state: "FL" },
  { zip: "33134", latitude: 25.7632, longitude: -80.2608, city: "Coral Gables", state: "FL" },
  { zip: "33135", latitude: 25.7684, longitude: -80.2323, city: "Miami", state: "FL" },
  { zip: "33136", latitude: 25.7899, longitude: -80.2085, city: "Miami", state: "FL" },
  { zip: "33137", latitude: 25.8099, longitude: -80.1892, city: "Miami", state: "FL" },
  { zip: "33138", latitude: 25.8471, longitude: -80.1829, city: "Miami", state: "FL" },
  { zip: "33139", latitude: 25.7807, longitude: -80.134, city: "Miami Beach", state: "FL" },
  { zip: "33140", latitude: 25.8236, longitude: -80.1227, city: "Miami Beach", state: "FL" },
  { zip: "33141", latitude: 25.8627, longitude: -80.124, city: "Miami Beach", state: "FL" },
  { zip: "33142", latitude: 25.8099, longitude: -80.2323, city: "Miami", state: "FL" },
  { zip: "33143", latitude: 25.701, longitude: -80.2838, city: "Miami", state: "FL" },
  { zip: "33144", latitude: 25.7632, longitude: -80.316, city: "Miami", state: "FL" },
  { zip: "33145", latitude: 25.751, longitude: -80.2323, city: "Miami", state: "FL" },
  { zip: "33146", latitude: 25.7174, longitude: -80.2838, city: "Coral Gables", state: "FL" },
  { zip: "33147", latitude: 25.8471, longitude: -80.2323, city: "Miami", state: "FL" },
  { zip: "33149", latitude: 25.6941, longitude: -80.1571, city: "Key Biscayne", state: "FL" },
  { zip: "33150", latitude: 25.8471, longitude: -80.2053, city: "Miami", state: "FL" },
]

// Haversine formula to calculate distance between two points on Earth
function haversineDistance(lat1, lon1, lat2, lon2) {
  // Earth's radius in miles
  const R = 3958.8

  // Convert latitude and longitude from degrees to radians
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  // Convert latitudes to radians
  const radLat1 = (lat1 * Math.PI) / 180
  const radLat2 = (lat2 * Math.PI) / 180

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

// Find all ZIP codes within a specified radius of a central ZIP code
function findZipCodesInRadius(centralZip, radius) {
  // Find the central ZIP code data
  const centralZipData = zipCodeDatabase.find((zip) => zip.zip === centralZip)

  if (!centralZipData) {
    console.error(`ZIP code ${centralZip} not found in database`)
    return []
  }

  console.log(
    `\nSearching for ZIP codes within ${radius} miles of ${centralZip} (${centralZipData.city}, ${centralZipData.state}):\n`,
  )

  // Find all ZIP codes within the radius
  const zipCodesInRadius = zipCodeDatabase.filter((zipData) => {
    // Skip the calculation if it's the same ZIP code
    if (zipData.zip === centralZip) return true

    const distance = haversineDistance(
      centralZipData.latitude,
      centralZipData.longitude,
      zipData.latitude,
      zipData.longitude,
    )

    return distance <= radius
  })

  return zipCodesInRadius
    .map((zip) => {
      const distance = haversineDistance(centralZipData.latitude, centralZipData.longitude, zip.latitude, zip.longitude)

      return {
        ...zip,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      }
    })
    .sort((a, b) => a.distance - b.distance)
}

// Demo: Find ZIP codes within 5 miles of 33131 (Miami)
const miamiResults = findZipCodesInRadius("33131", 5)
console.log(`Found ${miamiResults.length} ZIP codes within 5 miles of 33131 (Miami, FL):`)
miamiResults.forEach((zip) => {
  console.log(`${zip.zip} - ${zip.city}, ${zip.state} (${zip.distance} miles)`)
})

// Demo: Find ZIP codes within 2 miles of 10001 (New York)
const nyResults = findZipCodesInRadius("10001", 2)
console.log(`\nFound ${nyResults.length} ZIP codes within 2 miles of 10001 (New York, NY):`)
nyResults.forEach((zip) => {
  console.log(`${zip.zip} - ${zip.city}, ${zip.state} (${zip.distance} miles)`)
})

// Demo: Find ZIP codes within 1 mile of 60601 (Chicago)
const chicagoResults = findZipCodesInRadius("60601", 1)
console.log(`\nFound ${chicagoResults.length} ZIP codes within 1 mile of 60601 (Chicago, IL):`)
chicagoResults.forEach((zip) => {
  console.log(`${zip.zip} - ${zip.city}, ${zip.state} (${zip.distance} miles)`)
})

// Demo: Calculate distance between two specific ZIP codes
const zip1 = "33131" // Miami
const zip2 = "10001" // New York
const zip1Data = zipCodeDatabase.find((zip) => zip.zip === zip1)
const zip2Data = zipCodeDatabase.find((zip) => zip.zip === zip2)

if (zip1Data && zip2Data) {
  const distance = haversineDistance(zip1Data.latitude, zip1Data.longitude, zip2Data.latitude, zip2Data.longitude)

  console.log(
    `\nDistance between ${zip1} (${zip1Data.city}, ${zip1Data.state}) and ${zip2} (${zip2Data.city}, ${zip2Data.state}): ${Math.round(distance)} miles`,
  )
}
