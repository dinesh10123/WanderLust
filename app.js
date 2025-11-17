if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const reviewRouter = require('./routes/review');
const listingRouter = require('./routes/listing');
const userRouter = require('./routes/user');
const cloudinary = require('cloudinary').v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// DB URL - support both ATLAS_DB_URL and MONGO_URI and fallback to local
const dbUrl = process.env.ATLAS_DB_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wanderlust';

// connect mongoose
async function main() {
  await mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
main()
  .then(() => {
    console.log('connected to db');
  })
  .catch((err) => {
    console.error('DB connect error:', err);
  });

// express / view engine / static / parsers
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// session store (connect-mongo)
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600, // reduce frequent writes
});

store.on('error', (err) => {
  console.error('Error in MONGO SESSION STORE:', err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET || 'thisshouldbechanged',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 3,
    maxAge: 1000 * 60 * 60 * 24 * 3,
  },
};

app.use(session(sessionOptions));
app.use(flash());

// passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// locals
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currUser = req.user;
  next();
});

//Routes
app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// 404 handler *** Express v5 FIX ***
app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// Global error logger
app.use((err, req, res, next) => {
    if (err.statusCode === 404) return next(err); // Don't spam terminal for 404
    console.log("ERROR CAUGHT BY GLOBAL LOGGER ");
    console.error(err);
    next(err);
});

// Final error handler
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something Went Wrong" } = err;
    res.status(statusCode).render("error.ejs", { err });
});


// start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
