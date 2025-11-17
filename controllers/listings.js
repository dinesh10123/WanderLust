const Listing = require('../models/listing');
const maptilerClient = require("@maptiler/client");

maptilerClient.config.apiKey = process.env.MAPTILER_KEY;

// GET all listings
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("./listings/index.ejs", { allListings });
};

// Render NEW form
module.exports.renderNewForm = (req, res) => {
    res.render("./listings/new.ejs");
};

// SHOW listing
module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate('owner');

    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

    res.render("./listings/show.ejs", { listing, mapTilerKey: process.env.MAPTILER_KEY });
};

// CREATE listing
module.exports.createListing = async (req, res) => {
    try {
        const geoRes = await maptilerClient.geocoding.forward(req.body.listing.location);

        const newListing = new Listing(req.body.listing);

        newListing.owner = req.user._id;
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
        newListing.geometry = geoRes.features[0].geometry;

        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
    } catch (err) {
        console.error("CREATE LISTING ERROR:", err);
        req.flash("error", "Something went wrong while creating the listing. Please try again.");
        res.redirect("/listings/new");
    }
};

// EDIT form
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url.replace('/upload', '/upload/w_300');

    res.render("./listings/edit.ejs", { listing, originalImageUrl });
};

// UPDATE listing
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
        await listing.save();
    }

    req.flash("success", "Listing Updated Successfully!");
    res.redirect("/listings");
};

// DELETE listing
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
