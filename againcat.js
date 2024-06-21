// Data structure for categories and subcategories
let categories = [
    {
        name: "Lawn and Garden",
        subcategories: ["Lawn & Landscaping", "Lawn Treatment", "Landscape Lighting", "Lawn Mower and Lawn Equipment Repair ", "Tree Service", "Plant Nurseries", "Mulch Delivery", "Soil Tilling", "Leaf Removal", "Hardscaping"]
    },
    {
        name: "Outside Home Maintenance and Repair",
        subcategories: ["Roofing", "Siding", "Deck Cleaning/Refinishing", "Garage Doors", "House Painting", "Pressure Washing", "Foundation Repair", "Gutter Cleaning/Repair", "Septic Tank Service", "Well & Water Pump Repair"]
    },
    {
        name: "Home Construction and Design",
        subcategories: ["General Contractors", "Architect", "Home Remodeling", "Demolition", "Excavating/Earth Moving", "Land Surveyors",]
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
            checkbox.type = "checkbox";
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
