// Data structure for categories and subcategories
let categories = [
    {
        name: "Lawn, Garden and Snow Removal",
        subcategories: ["Lawn & Landscaping", "Lawn Treatment", "Landscape Lighting", "Lawn Mower and Lawn Equipment and Snow Removal Equipment Repair", "Tree Service", "Plant Nurseries", "Mulch Delivery", "Soil Tilling", "Leaf Removal", "Hardscaping","Snow Removal"]
    },
    {
        name: "Outside Home Maintenance and Repair",
        subcategories: ["Roofing","Masonry Stone and Brick", "Glass Block", "Siding", "Deck Cleaning/Refinishing", "Garage Doors", "House Painting", "Pressure Washing", "Foundation Repair", "Gutter Cleaning/Repair", "Septic Tank Service", "Well & Water Pump Repair"]
    },
	{
		name: "Outdoor Structure Assembly/Construction and Fencing",
	subcategories: ["Deck/Patio/Porch Construction","Patio and Patio Enclosures","Exterior Cooking Areas","Awnings/Canopies","Playground Equipment Installation/Basketball Hoops", " Fountains and Waterscaping", "Pond Construction","Solar Panel Installation","Power Generator Instalation","Driveway Gate Installation","Earthquake Retrofitting","Mailbox instalation/Repair","Fences"]
	},
	{
		name: "Pool Services",
		subcategories: ["Swimming Pool Installers/Builders","Swimming Pool Maintenance/Cleaning"]
	},
	{	
		name: "Asphalt, Concrete, Stone and Gravel",
		subcategories: ["Concrete Driveways","Asphalt Driveways","Other Driveways","Stone & Gravel","Stamped Concrete","Concrete Repair"]
	},
    {
        name: "Home Construction and Design",
        subcategories: ["General Contractors", "Architect", "Home Remodeling", "Demolition", "Excavating/Earth Moving", "Land Surveyors",]
    },
	{
		name: "Inside Home Maintenance and Repair",
	    subcategories: ["Electricians","Plumbers", "Heating, Ventilation, and Air Conditioning Services","Appliance Repair and Installation","Indoor Painting","Drywalling and Repair","Marble & Granite","Water Softeners","Water Heaters","Insulation","Air Duct Cleaning","Dryer Duct Cleaning","Central Vacuum Cleaning","Mold Removal","Plaster Work","Water Damage Repair", "Basement Waterproofing","Wallpaper Hanging and Removing","Countertop Installation","Ceiling Fan Installation","Bathtub Refinishing","Cabinet Resurfacing"," Cabinet Makers","Tile Installation"]
	},
	{   
		name: "Windows and Doors",
		subcategories: ["Window Replacement","Door Installation","Window Security Film","Window Tinting","Window Dressing/Curtains","Blind/Drapery Cleaning","Locksmith"]
	},
	{	
		name: "Floor/Carpet Care and Installation",
		subcategories: ["Carpet Installation","Hardwood Floor Installation","Epoxy Flooring","Tile Flooring","Laminate Flooring","Carpet Cleaning","Floor Buffing and Cleaning","Oriental Rug Cleaning"]
	},
	{
		name: "Audio/Visual and Home Security",
	subcategories: ["Smart Home Setup","Home Security Solutions","Cinema Room Setup","Telecommunication","Cable/Satellite/Antenna Television","Computer Repair"]
	},
	{
		name: "Home Hazard Mitigation",
		subcategories: ["Lead-Based Paint Abatement","Radon Mitigation","Mold Removal","Asbestos Removal","Smoke/Carbon Monoxide Detector Instalation","Fire Extinguisher Maintenance"]
	},
	{
		name: "Pest Control/ Wildlife Removal",
		subcategories: ["Rodent/ Small Animal Infestations", "Wildlife Removal", "Insect and Bug Control"]
	},
	{	
		name: "Home Buying and Selling",
		subcategories: ["Real Estate Agent","Real Estate Appraising","Home Staging","Home Inspection","Home Energy Audit"]
	},
	{
		name: "Trash Cleanup and Removal",
		subcategories: ["Biohazard Cleanup", "Dumpster Rental","Hauling/Old Furniture and Appliance Removal","Document Shredding","Trash/Junk Removal"]
	},
	{
		name: "Home and Office Cleaning",
		subcategories: ["House Cleaning","Office Cleaning", "Window Cleaning","Deep Carpet and Floor Cleaning"]
	},
	{
		name: ["Fireplaces and Chimneys"],
		subcategories: ["Chimney Sweep","Chimney and Chimney Cap Repair", "Gas Fireplace Repair","Fireplace Services","Firewood Suppliers","Heating Oil Suppliers"]
	
	},
	{
		name: ["Movers/Moving Trucks"],
		subcategories: ["Moving Truck Rental","Piano Movers","Movers"]
	},
	{
		name: ["Handymen"],
		subcategories: ["Odd Jobs and Repairs","Product Assembly"]
	},
		
	
];

// Function to generate the category and subcategory structure
function generateCategories() {
    const categoriesDiv = document.getElementById("categories");

    categories.forEach((category, categoryIndex) => {
        let categoryDiv = document.createElement("div");
        categoryDiv.className = "category";
        categoryDiv.innerHTML = `<h3>${category.name}</h3>`;

        category.subcategories.forEach((subcategory, subcategoryIndex) => {
            let subcategoryDiv = document.createElement("div");
            subcategoryDiv.className = "subcategory";

            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";name
            checkbox.id = `cat${categoryIndex}_sub${subcategoryIndex}`;
            checkbox.value = subcategory;

            let label = document.createElement("label");
            label.htmlFor = `cat${categoryIndex}_sub${subcategoryIndex}`;
            label.innerText = subcategory;

            subcategoryDiv.appendChild(checkbox);
            subcategoryDiv.appendChild(label);
            categoryDiv.appendChild(subcategoryDiv);
        });

        categoriesDiv.appendChild(categoryDiv);
    });
}

// Function to update the selected subcategories list
function updateSelectedSubcategories() {
    const selectedSubcategories = [];
    categories.forEach((category, categoryIndex) => {
        category.subcategories.forEach((subcategory, subcategoryIndex) => {
            let checkbox = document.getElementById(`cat${categoryIndex}_sub${subcategoryIndex}`);
            if (checkbox.checked) {
                selectedSubcategories.push(checkbox.value);
            }
        });
    });

    const selectedList = document.getElementById("selected-subcategories");
    selectedList.innerHTML = "";
    selectedSubcategories.forEach(subcategory => {
        let listItem = document.createElement("li");
        listItem.innerText = subcategory;
        selectedList.appendChild(listItem);
    });
}

// Initialize the categories and add event listeners
document.addEventListener("DOMContentLoaded", () => {
    generateCategories();

    const checkboxes = document.querySelectorAll("input[type=checkbox]");
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", updateSelectedSubcategories);
    });
});

