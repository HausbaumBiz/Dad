from flask import Flask, request, jsonify
import csv
import math

app = Flask(__name__)

def haversine(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 3956  # Radius of Earth in miles
    return c * r

def load_zip_data(filename):
    zip_data = {}
    with open(filename, mode='r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            zip_code = row['ZIP']
            latitude = float(row['LAT'])
            longitude = float(row['LNG'])
            zip_data[zip_code] = (latitude, longitude)
    return zip_data

@app.route('/get_zips_within_radius', methods=['POST'])
def get_zips_within_radius():
    """
    data = request.json
    zip_code = data['zipCode']
    radius = data.get('radius', 100)
    """
    zip_code = input("Enter a zipcode: ")
    radius = float(input("Enter a radius: "))

    zip_data = load_zip_data('./USZip2016.cvs')
    
    if zip_code not in zip_data:
        return jsonify({"error": "ZIP code not found"}), 400

    lat1, lon1 = zip_data[zip_code]
    nearby_zips = []

    for zip2, (lat2, lon2) in zip_data.items():
        if zip2 == zip_code:
            continue
        distance = haversine(lat1, lon1, lat2, lon2)
        if distance <= radius:
            nearby_zips.append(zip2)

    print(nearby_zips)
    #return jsonify({"zip_codes": nearby_zips})

if __name__ == "__main__":
    #app.run(debug=True)
    get_zips_within_radius()
